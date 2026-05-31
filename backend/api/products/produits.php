<?php
// backend/api/produits.php

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../middleware/csrf.php';
require_once __DIR__ . '/../reponse/reponse.php';

setCorsHeaders(); // Activation sécurité CORS

$pdo = getDB(); // Connexion BDD
$methode = $_SERVER['REQUEST_METHOD'];

// Récupération de l'ID si présent dans l'URL (ex: produits.php?id=12)
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

switch ($methode) {
    case 'GET':
        if ($id) {
            // --- FICHE PRODUIT UNIQUE ---
            $stmt = $pdo->prepare("SELECT * FROM produits WHERE id = ?");
            $stmt->execute([$id]);
            $produit = $stmt->fetch();

            if (!$produit) {
                envoyerJSON(404, "Produit introuvable.");
            }
            envoyerJSON(200, $produit);
        } else {
            //LISTE DES PRODUITS AVEC FILTRES & PAGINATION
            $q = $_GET['q'] ?? '';
            $categorie = $_GET['categorie'] ?? '';
            $prix_min = isset($_GET['prix_min']) ? (float)$_GET['prix_min'] : 0;
            $prix_max = isset($_GET['prix_max']) ? (float)$_GET['prix_max'] : 9999999;
            $type_vente = $_GET['type_vente'] ?? '';
            $etat = $_GET['etat'] ?? '';
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
            if ($limit > 50) $limit = 50; // Contrainte
            $offset = ($page - 1) * $limit;

            $sql = "FROM produits WHERE prix BETWEEN :prix_min AND :prix_max AND stock > 0";
            $params = [':prix_min' => $prix_min, ':prix_max' => $prix_max];

            if ($q !== '') {
                $sql .= " AND (titre LIKE :q1 OR description LIKE :q2)";
                $params[':q1'] = "%$q%";
                $params[':q2'] = "%$q%";
            }
            if ($categorie !== '') {
                $sql .= " AND categorie = :categorie";
                $params[':categorie'] = $categorie;
            }
            if ($type_vente !== '') {
                $sql .= " AND type_vente = :type_vente";
                $params[':type_vente'] = $type_vente;
            }
            if ($etat !== '') {
                $sql .= " AND etat = :etat";
                $params[':etat'] = $etat;
            }

            // Compte du total pour la pagination
            $stmtCount = $pdo->prepare("SELECT COUNT(*) " . $sql);
            $stmtCount->execute($params);
            $totalProduits = (int)$stmtCount->fetchColumn();
            $totalPages = ceil($totalProduits / $limit);

            // Récupération des données limitées
            $stmtData = $pdo->prepare("SELECT * " . $sql . " LIMIT :limit OFFSET :offset");
            $stmtData->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmtData->bindValue(':offset', $offset, PDO::PARAM_INT);
            foreach ($params as $cle => $val) {
                $stmtData->bindValue($cle, $val);
            }
            $stmtData->execute();
            $produits = $stmtData->fetchAll();

            envoyerJSON(200, [
                "produits" => $produits,
                "total" => $totalProduits,
                "page" => $page,
                "pages" => $totalPages
            ]);
        }
        break;

    case 'POST':
        //CRÉATION DE L'ANNONCE
        $user = requireRole('vendeur', 'admin');
        verifyCsrfToken();

        $body = json_decode(file_get_contents('php://input'), true);

        if (empty($body['titre']) || empty($body['prix']) || empty($body['type_vente'])) {
            envoyerJSON(400, "Données obligatoires manquantes.");
        }

        if ($body['type_vente'] === 'enchere' && empty($body['date_fin'])) {
            envoyerJSON(400, "La date de fin est obligatoire pour une enchère.");
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("
                INSERT INTO produits (titre, description, prix, categorie, etat, type_vente, stock, vendeur_id, image_url, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ");
            $stmt->execute([
                $body['titre'],
                $body['description'] ?? '',
                (float)$body['prix'],
                $body['categorie'] ?? 'Autres',
                $body['etat'] ?? 'neuf',
                $body['type_vente'],
                $body['type_vente'] === 'enchere' ? 1 : (int)($body['stock'] ?? 1),
                $user['id'],
                !empty($body['image_url']) ? $body['image_url'] : null,
            ]);

            $produit_id = (int)$pdo->lastInsertId();

            if ($body['type_vente'] === 'enchere') {
                $prix_depart = (float)($body['prix_depart'] ?? $body['prix']);
                $date_debut  = !empty($body['date_debut']) ? $body['date_debut'] : null;
                $date_fin    = $body['date_fin'];
                $etat_enc    = ($date_debut && strtotime($date_debut) > time()) ? 'en_attente' : 'en_cours';

                $stmt = $pdo->prepare("
                    INSERT INTO encheres (produit_id, prix_depart, etat, date_debut, date_fin)
                    VALUES (?, ?, ?, ?, ?)
                ");
                $stmt->execute([$produit_id, $prix_depart, $etat_enc, $date_debut, $date_fin]);
            }

            $pdo->commit();
            envoyerJSON(201, "Annonce créée avec succès", ["id" => $produit_id]);
        } catch (Throwable $e) {
            $pdo->rollBack();
            envoyerJSON(500, "Erreur lors de la création de l'annonce.");
        }
        break;

    case 'PUT':
        //MODIFICATION DE L'ANNONCE
        $user = requireRole('vendeur', 'admin');
        verifyCsrfToken();

        if (!$id) envoyerJSON(400, "Identifiant du produit manquant.");

        // Sécurité : vérification de la propriété de l'œuvre
        $stmtCheck = $pdo->prepare("SELECT vendeur_id FROM produits WHERE id = ?");
        $stmtCheck->execute([$id]);
        $produit = $stmtCheck->fetch();

        if (!$produit) envoyerJSON(404, "Produit introuvable.");
        if ($produit['vendeur_id'] != $user['id'] && $user['role'] !== 'admin') {
            envoyerJSON(403, "Accès refusé : vous n'êtes pas le propriétaire.");
        }

        $body = json_decode(file_get_contents('php://input'), true);

        $stmt = $pdo->prepare("
            UPDATE produits 
            SET titre = COALESCE(?, titre), description = COALESCE(?, description), prix = COALESCE(?, prix), 
                categorie = COALESCE(?, categorie), etat = COALESCE(?, etat), type_vente = COALESCE(?, type_vente), stock = COALESCE(?, stock) 
            WHERE id = ?
        ");
        $stmt->execute([
            $body['titre'] ?? null,
            $body['description'] ?? null,
            isset($body['prix']) ? (float)$body['prix'] : null,
            $body['categorie'] ?? null,
            $body['etat'] ?? null,
            $body['type_vente'] ?? null,
            isset($body['stock']) ? (int)$body['stock'] : null,
            $id
        ]);

        envoyerJSON(200, "Annonce mise à jour avec succès.");
        break;

    case 'DELETE':
        //SUPPRESSION 
        $user = requireRole('vendeur', 'admin');
        verifyCsrfToken();

        if (!$id) envoyerJSON(400, "Identifiant du produit manquant.");

        $stmtCheck = $pdo->prepare("SELECT vendeur_id FROM produits WHERE id = ?");
        $stmtCheck->execute([$id]);
        $produit = $stmtCheck->fetch();

        if (!$produit) envoyerJSON(404, "Produit introuvable.");
        if ($produit['vendeur_id'] != $user['id'] && $user['role'] !== 'admin') {
            envoyerJSON(403, "Accès refusé pour la suppression.");
        }

        $stmt = $pdo->prepare("DELETE FROM produits WHERE id = ?");
        $stmt->execute([$id]);

        envoyerJSON(200, "Annonce supprimée.");
        break;

    default:
        envoyerJSON(405, "Méthode non autorisée.");
        break;
} 