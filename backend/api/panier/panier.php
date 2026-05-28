<?php
// backend/api/panier.php

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/csrf.php';
require_once __DIR__ . '/reponse.php';

setCorsHeaders();

$user = requireAuth(); // tout le panier doit être connecté
$pdo = getDB();
$methode = $_SERVER['REQUEST_METHOD'];

switch ($methode) {
    case 'GET':
        //RÉCUPÉRER LE PANIER
        $stmt = $pdo->prepare("
            SELECT p.id, p.produit_id, pr.titre, pr.prix, p.quantite 
            FROM panier p 
            JOIN produits pr ON p.produit_id = pr.id 
            WHERE p.utilisateur_id = ?
        ");
        $stmt->execute([$user['id']]);
        $items = $stmt->fetchAll();

        $total = 0;
        foreach ($items as $item) {
            $total += ($item['prix'] * $item['quantite']);
        }

        envoyerJSON(200, ["items" => $items, "total" => (float)$total]);
        break;

    case 'POST':
        //AJOUTER UN PRODUIT
        verifyCsrfToken();
        $body = json_decode(file_get_contents('php://input'), true);
        $produit_id = isset($body['produit_id']) ? (int)$body['produit_id'] : null;
        $quantite = isset($body['quantite']) ? (int)$body['quantite'] : 1;

        if (!$produit_id) envoyerJSON(400, "ID produit manquant.");

        // Vérification des stocks réels en BDD
        $stmtStock = $pdo->prepare("SELECT stock FROM produits WHERE id = ?");
        $stmtStock->execute([$produit_id]);
        $produit = $stmtStock->fetch();

        if (!$produit) envoyerJSON(404, "Le produit n'existe pas.");
        if ($produit['stock'] < $quantite) {
            envoyerJSON(400, "Stock insuffisant pour cette œuvre d'art.");
        }

        // Si le produit est déjà dans le panier, on met à jour la quantité, sinon on l'insère
        $stmtCheckCart = $pdo->prepare("SELECT id, quantite FROM panier WHERE utilisateur_id = ? AND produit_id = ?");
        $stmtCheckCart->execute([$user['id'], $produit_id]);
        $cartItem = $stmtCheckCart->fetch();

        if ($cartItem) {
            if (($cartItem['quantite'] + $quantite) > $produit['stock']) {
                envoyerJSON(400, "Stock total insuffisant.");
            }
            $stmtUpdate = $pdo->prepare("UPDATE panier SET quantite = quantite + ? WHERE id = ?");
            $stmtUpdate->execute([$quantite, $cartItem['id']]);
        } else {
            $stmtInsert = $pdo->prepare("INSERT INTO panier (utilisateur_id, produit_id, quantite) VALUES (?, ?, ?)");
            $stmtInsert->execute([$user['id'], $produit_id, $quantite]);
        }

        envoyerJSON(201, "Produit ajouté au panier.");
        break;

    case 'DELETE':
        verifyCsrfToken();
        $produit_id = isset($_GET['produit_id']) ? (int)$_GET['produit_id'] : null;

        if ($produit_id) {
            //RETIRER UN PRODUIT UNIQUE
            $stmt = $pdo->prepare("DELETE FROM panier WHERE utilisateur_id = ? AND produit_id = ?");
            $stmt->execute([$user['id'], $produit_id]);
            envoyerJSON(200, "Article retiré du panier.");
        } else {
            //VIDER TOUT LE PANIER
            $stmt = $pdo->prepare("DELETE FROM panier WHERE utilisateur_id = ?");
            $stmt->execute([$user['id']]);
            envoyerJSON(200, "Panier entièrement vidé.");
        }
        break;

    default:
        envoyerJSON(405, "Méthode non autorisée.");
        break;
}