<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/csrf.php';
require_once __DIR__ . '/../../middleware/auth.php';

setCorsHeaders();
configureSession();
header('Content-Type: application/json');

$method     = $_SERVER['REQUEST_METHOD'];
$produit_id = (int) ($_GET['produit_id'] ?? 0);
$action     = $_GET['action'] ?? null;

if (!$produit_id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'produit_id manquant']);
    exit;
}

if ($method === 'GET' && $action === 'statut') {
    getStatut($produit_id);
} elseif ($method === 'POST' && $action === 'offre') {
    placerOffre($produit_id);
} elseif ($method === 'GET' && $action === null) {
    getDetail($produit_id);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
}

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

/**
 * Fait passer l'enchère dans le bon état selon les dates.
 * Appelée à chaque lecture — pas de cron nécessaire.
 */
function transitionnerEtat(PDO $pdo, array $enchere): array {
    $now       = time();
    $date_fin  = strtotime($enchere['date_fin']);
    $date_debut = $enchere['date_debut'] ? strtotime($enchere['date_debut']) : null;

    $nouvel_etat = $enchere['etat'];

    if ($enchere['etat'] === 'en_attente' && $date_debut !== null && $now >= $date_debut) {
        $nouvel_etat = 'en_cours';
    }
    if (in_array($enchere['etat'], ['en_attente', 'en_cours'], true) && $now >= $date_fin) {
        $nouvel_etat = 'terminee';
    }

    if ($nouvel_etat !== $enchere['etat']) {
        $stmt = $pdo->prepare('UPDATE encheres SET etat = ? WHERE id = ?');
        $stmt->execute([$nouvel_etat, $enchere['id']]);
        $enchere['etat'] = $nouvel_etat;
    }

    return $enchere;
}

function fetchEnchereByProduit(PDO $pdo, int $produit_id, bool $forUpdate = false): ?array {
    $lock = $forUpdate ? ' FOR UPDATE' : '';
    $stmt = $pdo->prepare(
        'SELECT e.*, u.name AS meilleur_encherisseur_nom
         FROM encheres e
         LEFT JOIN users u ON u.id = e.meilleur_encherisseur_id
         WHERE e.produit_id = ?' . $lock
    );
    $stmt->execute([$produit_id]);
    return $stmt->fetch() ?: null;
}

// -------------------------------------------------------------------
// GET /encheres/{produit_id}
// -------------------------------------------------------------------
function getDetail(int $produit_id): void {
    $pdo     = getDB();
    $enchere = fetchEnchereByProduit($pdo, $produit_id);

    if (!$enchere) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Enchère introuvable']);
        return;
    }

    $enchere = transitionnerEtat($pdo, $enchere);

    $stmt = $pdo->prepare(
        'SELECT o.utilisateur_id, u.name AS nom, o.montant, o.created_at AS date
         FROM offres_encheres o
         JOIN users u ON u.id = o.utilisateur_id
         WHERE o.enchere_id = ?
         ORDER BY o.montant DESC'
    );
    $stmt->execute([$enchere['id']]);
    $historique = $stmt->fetchAll();

    $meilleur_encherisseur = null;
    if ($enchere['meilleur_encherisseur_id']) {
        $meilleur_encherisseur = [
            'id'  => (int) $enchere['meilleur_encherisseur_id'],
            'nom' => $enchere['meilleur_encherisseur_nom'],
        ];
    }

    echo json_encode([
        'id'                    => (int) $enchere['id'],
        'produit_id'            => $produit_id,
        'prix_depart'           => (float) $enchere['prix_depart'],
        'meilleure_offre'       => $enchere['meilleure_offre'] !== null ? (float) $enchere['meilleure_offre'] : null,
        'meilleur_encherisseur' => $meilleur_encherisseur,
        'etat'                  => $enchere['etat'],
        'date_fin'              => $enchere['date_fin'],
        'historique'            => $historique,
    ]);
}

// -------------------------------------------------------------------
// GET /encheres/{produit_id}/statut  (polling léger, appelé toutes les 3s)
// -------------------------------------------------------------------
function getStatut(int $produit_id): void {
    $pdo     = getDB();
    $enchere = fetchEnchereByProduit($pdo, $produit_id);

    if (!$enchere) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Enchère introuvable']);
        return;
    }

    $enchere           = transitionnerEtat($pdo, $enchere);
    $secondes_restantes = max(0, strtotime($enchere['date_fin']) - time());

    echo json_encode([
        'etat'                     => $enchere['etat'],
        'meilleure_offre'          => $enchere['meilleure_offre'] !== null ? (float) $enchere['meilleure_offre'] : null,
        'meilleur_encherisseur_id' => $enchere['meilleur_encherisseur_id'] ? (int) $enchere['meilleur_encherisseur_id'] : null,
        'secondes_restantes'       => $secondes_restantes,
    ]);
}

// -------------------------------------------------------------------
// POST /encheres/{produit_id}/offre
// -------------------------------------------------------------------
function placerOffre(int $produit_id): void {
    verifyCsrfToken();
    $user = requireAuth();

    $body    = json_decode(file_get_contents('php://input'), true);
    $montant = isset($body['montant']) ? (float) $body['montant'] : null;

    if ($montant === null || $montant <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Montant invalide']);
        return;
    }

    $pdo = getDB();
    $pdo->beginTransaction();

    try {
        // Verrou exclusif pour éviter les race conditions
        $enchere = fetchEnchereByProduit($pdo, $produit_id, true);

        if (!$enchere) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Enchère introuvable']);
            return;
        }

        $enchere = transitionnerEtat($pdo, $enchere);

        if ($enchere['etat'] !== 'en_cours') {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "L'enchère n'est pas en cours (état : {$enchere['etat']})"]);
            return;
        }

        // Le vendeur ne peut pas enchérir sur son propre produit
        $stmt = $pdo->prepare('SELECT vendeur_id, titre FROM produits WHERE id = ?');
        $stmt->execute([$produit_id]);
        $produit = $stmt->fetch();

        if ($produit && (int) $produit['vendeur_id'] === (int) $user['id']) {
            $pdo->rollBack();
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Le vendeur ne peut pas enchérir sur son propre produit']);
            return;
        }

        // Le montant doit dépasser le plancher courant
        $plancher = $enchere['meilleure_offre'] ?? $enchere['prix_depart'];
        if ($montant <= (float) $plancher) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Le montant doit être supérieur à {$plancher} €"]);
            return;
        }

        // Enregistre l'offre
        $stmt = $pdo->prepare('INSERT INTO offres_encheres (enchere_id, utilisateur_id, montant) VALUES (?, ?, ?)');
        $stmt->execute([$enchere['id'], $user['id'], $montant]);

        // Met à jour la meilleure offre sur l'enchère
        $stmt = $pdo->prepare('UPDATE encheres SET meilleure_offre = ?, meilleur_encherisseur_id = ? WHERE id = ?');
        $stmt->execute([$montant, $user['id'], $enchere['id']]);

        // Notifie l'ancien meilleur enchérisseur qu'il a été surenchéri
        $ancien_id = $enchere['meilleur_encherisseur_id'];
        if ($ancien_id && (int) $ancien_id !== (int) $user['id']) {
            $titre = $produit['titre'] ?? 'un produit';
            $stmt  = $pdo->prepare(
                'INSERT INTO notifications (utilisateur_id, type, message) VALUES (?, ?, ?)'
            );
            $stmt->execute([$ancien_id, 'enchere_surenchere', "Vous avez été surenchéri sur « $titre »"]);
        }

        $pdo->commit();

        http_response_code(201);
        echo json_encode([
            'success'                  => true,
            'nouvelle_meilleure_offre' => $montant,
        ]);

    } catch (Throwable $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erreur serveur']);
    }
}
