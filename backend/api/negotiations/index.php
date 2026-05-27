<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/csrf.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/_helpers.php';

setCorsHeaders();
configureSession();
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int) $_GET['id'] : null;
$action = $_GET['action'] ?? null;

if ($method === 'GET' && $id === null) {
    listerNegociations();
} elseif ($method === 'POST' && $id === null) {
    creerNegociation();
} elseif ($method === 'GET' && $id !== null) {
    detailNegociation($id);
} elseif ($method === 'POST' && $id !== null && $action === 'repondre') {
    repondreNegociation($id);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
}

// -------------------------------------------------------------------
// GET /negociations
// -------------------------------------------------------------------
function listerNegociations(): void {
    $user = requireAuth();
    $pdo  = getDB();

    $stmt = $pdo->prepare(
        'SELECT n.id,
                pr.titre  AS produit_titre,
                n.etat,
                n.derniere_offre,
                n.updated_at
         FROM negociations n
         JOIN produits pr ON pr.id = n.produit_id
         WHERE n.acheteur_id = ? OR n.vendeur_id = ?
         ORDER BY n.updated_at DESC'
    );
    $stmt->execute([$user['id'], $user['id']]);
    $rows = $stmt->fetchAll();

    $negociations = array_map(fn($r) => [
        'id'            => (int) $r['id'],
        'produit_titre' => $r['produit_titre'],
        'etat'          => $r['etat'],
        'derniere_offre' => (float) $r['derniere_offre'],
        'updated_at'    => $r['updated_at'],
    ], $rows);

    echo json_encode(['negociations' => $negociations]);
}

// -------------------------------------------------------------------
// POST /negociations
// -------------------------------------------------------------------
function creerNegociation(): void {
    verifyCsrfToken();
    $user = requireAuth();

    $body         = json_decode(file_get_contents('php://input'), true);
    $produit_id   = isset($body['produit_id'])   ? (int)   $body['produit_id']   : null;
    $prix_propose = isset($body['prix_propose'])  ? (float) $body['prix_propose'] : null;
    $message      = trim($body['message'] ?? '');

    if (!$produit_id || $prix_propose === null || $prix_propose <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'produit_id et prix_propose requis']);
        return;
    }

    $pdo = getDB();

    $stmt = $pdo->prepare('SELECT id, vendeur_id, type_vente, titre FROM produits WHERE id = ?');
    $stmt->execute([$produit_id]);
    $produit = $stmt->fetch();

    if (!$produit) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Produit introuvable']);
        return;
    }

    if ($produit['type_vente'] !== 'negociation') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Ce produit n\'accepte pas la négociation']);
        return;
    }

    if ((int) $produit['vendeur_id'] === (int) $user['id']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Le vendeur ne peut pas négocier sur son propre produit']);
        return;
    }

    // Une négociation active par (acheteur, produit)
    $stmt = $pdo->prepare(
        'SELECT id FROM negociations
         WHERE produit_id = ? AND acheteur_id = ? AND etat IN (\'en_attente\',\'contre_offre\')'
    );
    $stmt->execute([$produit_id, $user['id']]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Une négociation active existe déjà pour ce produit']);
        return;
    }

    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'INSERT INTO negociations (produit_id, acheteur_id, vendeur_id, etat, derniere_offre, dernier_acteur, expires_at)
             VALUES (?, ?, ?, \'en_attente\', ?, \'acheteur\', ?)'
        );
        $stmt->execute([$produit_id, $user['id'], $produit['vendeur_id'], $prix_propose, expireAt()]);
        $neg_id = (int) $pdo->lastInsertId();

        $stmt = $pdo->prepare(
            'INSERT INTO echanges_negociation (negociation_id, auteur, montant, message) VALUES (?, \'acheteur\', ?, ?)'
        );
        $stmt->execute([$neg_id, $prix_propose, $message ?: null]);

        // Notifie le vendeur
        $stmt = $pdo->prepare(
            'INSERT INTO notifications (utilisateur_id, type, message) VALUES (?, \'negociation_nouvelle\', ?)'
        );
        $stmt->execute([$produit['vendeur_id'], "Nouvelle négociation reçue pour « {$produit['titre']} »"]);

        $pdo->commit();
        http_response_code(201);
        echo json_encode(['success' => true, 'negociation_id' => $neg_id]);

    } catch (Throwable $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erreur serveur']);
    }
}

// -------------------------------------------------------------------
// GET /negociations/{id}
// -------------------------------------------------------------------
function detailNegociation(int $id): void {
    $user = requireAuth();
    $pdo  = getDB();

    $neg = fetchNegociation($pdo, $id);

    if (!$neg) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Négociation introuvable']);
        return;
    }

    if (roleInNeg($neg, $user['id']) === null) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Accès interdit']);
        return;
    }

    $neg = transitionnerNegociation($pdo, $neg);

    $stmt = $pdo->prepare(
        'SELECT auteur, montant, message, created_at AS date
         FROM echanges_negociation
         WHERE negociation_id = ?
         ORDER BY created_at ASC'
    );
    $stmt->execute([$id]);
    $echanges = $stmt->fetchAll();

    echo json_encode([
        'id'      => (int) $neg['id'],
        'produit' => [
            'id'            => (int) $neg['produit_id'],
            'titre'         => $neg['produit_titre'],
            'prix_initial'  => (float) $neg['produit_prix_initial'],
        ],
        'acheteur' => ['id' => (int) $neg['acheteur_id'], 'nom' => $neg['acheteur_nom']],
        'vendeur'  => ['id' => (int) $neg['vendeur_id'],  'nom' => $neg['vendeur_nom']],
        'etat'     => $neg['etat'],
        'echanges' => array_map(fn($e) => [
            'auteur'  => $e['auteur'],
            'montant' => (float) $e['montant'],
            'message' => $e['message'],
            'date'    => $e['date'],
        ], $echanges),
    ]);
}

// -------------------------------------------------------------------
// POST /negociations/{id}/repondre
// -------------------------------------------------------------------
function repondreNegociation(int $id): void {
    verifyCsrfToken();
    $user = requireAuth();

    $body         = json_decode(file_get_contents('php://input'), true);
    $action       = $body['action']       ?? null;
    $prix_propose = isset($body['prix_propose']) ? (float) $body['prix_propose'] : null;
    $message      = trim($body['message'] ?? '');

    $actions_valides = ['contre_offre', 'accepter', 'refuser'];
    if (!in_array($action, $actions_valides, true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => "action invalide. Valeurs: " . implode(', ', $actions_valides)]);
        return;
    }

    if ($action === 'contre_offre' && ($prix_propose === null || $prix_propose <= 0)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'prix_propose requis pour une contre-offre']);
        return;
    }

    $pdo = getDB();
    $pdo->beginTransaction();

    try {
        $neg = fetchNegociation($pdo, $id, true);

        if (!$neg) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Négociation introuvable']);
            return;
        }

        $neg = transitionnerNegociation($pdo, $neg);

        $role = roleInNeg($neg, $user['id']);
        if ($role === null) {
            $pdo->rollBack();
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Accès interdit']);
            return;
        }

        // Vérification des transitions légales
        $transitions = transitionsLegales();
        if (!isset($transitions[$neg['etat']][$action])) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Action « $action » impossible depuis l'état « {$neg['etat']} »"]);
            return;
        }

        // C'est le tour de l'autre partie
        if ($neg['dernier_acteur'] === $role) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Ce n'est pas votre tour de répondre"]);
            return;
        }

        $nouvel_etat   = $transitions[$neg['etat']][$action];
        $montant_offre = ($action === 'contre_offre') ? $prix_propose : (float) $neg['derniere_offre'];

        // Enregistre l'échange
        $stmt = $pdo->prepare(
            'INSERT INTO echanges_negociation (negociation_id, auteur, montant, message) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([$id, $role, $montant_offre, $message ?: null]);

        // Met à jour la négociation
        $stmt = $pdo->prepare(
            'UPDATE negociations SET etat = ?, derniere_offre = ?, dernier_acteur = ?, expires_at = ?, updated_at = NOW() WHERE id = ?'
        );
        $stmt->execute([$nouvel_etat, $montant_offre, $role, expireAt(), $id]);

        // Notifie l'autre partie
        $autre_id = ($role === 'acheteur') ? (int) $neg['vendeur_id'] : (int) $neg['acheteur_id'];
        $type_notif = 'negociation_reponse';
        $msg_notif  = match ($action) {
            'contre_offre' => "Contre-offre reçue pour « {$neg['produit_titre']} » : {$montant_offre} €",
            'accepter'     => "Votre négociation pour « {$neg['produit_titre']} » a été acceptée",
            'refuser'      => "Votre négociation pour « {$neg['produit_titre']} » a été refusée",
        };
        $stmt = $pdo->prepare(
            'INSERT INTO notifications (utilisateur_id, type, message) VALUES (?, ?, ?)'
        );
        $stmt->execute([$autre_id, $type_notif, $msg_notif]);

        $pdo->commit();
        echo json_encode(['success' => true, 'etat' => $nouvel_etat]);

    } catch (Throwable $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erreur serveur']);
    }
}
