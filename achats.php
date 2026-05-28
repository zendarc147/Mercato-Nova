<?php
// backend/api/achats.php

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/csrf.php';
require_once __DIR__ . '/reponse.php';

setCorsHeaders();

$user = requireAuth();
$pdo = getDB();
$methode = $_SERVER['REQUEST_METHOD'];

switch ($methode) {
    case 'GET':
        //HISTORIQUE DES COMMANDES DE L'ACHETEUR
        $stmt = $pdo->prepare("SELECT id, created_at AS date, total, statut FROM commandes WHERE utilisateur_id = ? ORDER BY created_at DESC");
        $stmt->execute([$user['id']]);
        $commandes = $stmt->fetchAll();

        // Récupération des items pour chaque commande
        foreach ($commandes as &$commande) {
            $stmtItems = $pdo->prepare("
                SELECT ci.produit_id, pr.titre, ci.prix_unitaire AS prix, ci.quantite 
                FROM commande_items ci
                JOIN produits pr ON ci.produit_id = pr.id
                WHERE ci.commande_id = ?
            ");
            $stmtItems->execute([$commande['id']]);
            $commande['items'] = $stmtItems->fetchAll();
        }

        envoyerJSON(200, ["commandes" => $commandes]);
        break;

    case 'POST':
        //VALIDER L'ACHAT
        verifyCsrfToken();
        $body = json_decode(file_get_contents('php://input'), true);
        $moyen_paiement = $body['moyen_paiement'] ?? null;

        if (!in_array($moyen_paiement, ['carte', 'paypal', 'virement'])) {
            envoyerJSON(400, "Moyen de paiement invalide.");
        }

        try {
            $pdo->beginTransaction(); // Sécurisation globale

            // Récupérer le panier actuel
            $stmtPanier = $pdo->prepare("
                SELECT p.produit_id, p.quantite, pr.stock, pr.prix 
                FROM panier p 
                JOIN produits pr ON p.produit_id = pr.id 
                WHERE p.utilisateur_id = ?
            ");
            $stmtPanier->execute([$user['id']]);
            $panierItems = $stmtPanier->fetchAll();

            if (empty($panierItems)) {
                $pdo->rollBack();
                envoyerJSON(400, "Le panier est vide.");
            }

            $totalCommande = 0;
            // Double vérification de sécurité des stocks avant paiement
            foreach ($panierItems as $item) {
                if ($item['quantite'] > $item['stock']) {
                    $pdo->rollBack();
                    envoyerJSON(400, "Le stock a changé. Quantité indisponible pour l'élément ID " . $item['produit_id']);
                }
                $totalCommande += ($item['prix'] * $item['quantite']);
            }

            // Insertion de la facture de commande
            $stmtOrder = $pdo->prepare("INSERT INTO commandes (utilisateur_id, total, statut, moyen_paiement, created_at) VALUES (?, ?, 'payee', ?, NOW())");
            $stmtOrder->execute([$user['id'], $totalCommande, $moyen_paiement]);
            $commandeId = $pdo->lastInsertId();

            // Préparation des requêtes de boucle
            $stmtInsertItem = $pdo->prepare("INSERT INTO commande_items (commande_id, produit_id, quantite, prix_unitaire) VALUES (?, ?, ?, ?)");
            $stmtUpdateStock = $pdo->prepare("UPDATE produits SET stock = stock - ? WHERE id = ?");

            foreach ($panierItems as $item) {
                $stmtInsertItem->execute([$commandeId, $item['produit_id'], $item['quantite'], $item['prix']]);
                $stmtUpdateStock->execute([$item['quantite'], $item['produit_id']]);
            }

            // Vider le panier de l'acheteur
            $stmtClearCart = $pdo->prepare("DELETE FROM panier WHERE utilisateur_id = ?");
            $stmtClearCart->execute([$user['id']]);

            $pdo->commit(); // Tout est OK : validation définitive en BDD
            envoyerJSON(201, "Paiement simulé accepté", ["commande_id" => (int)$commandeId]);

        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            envoyerJSON(500, "Erreur interne de transaction : " . $e->getMessage());
        }
        break;

    default:
        envoyerJSON(405, "Méthode non autorisée.");
        break;
}