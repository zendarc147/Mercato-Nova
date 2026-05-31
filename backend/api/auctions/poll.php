<?php
/**
 * GET /auctions/poll.php?produit_id=X
 *
 * Endpoint léger appelé toutes les 3 s par le frontend React.
 * Supporte les requêtes conditionnelles (ETag / 304 Not Modified) :
 * si l'état et la meilleure offre n'ont pas changé, répond 304 sans
 * body, évitant ainsi les re-renders inutiles côté client.
 *
 * Pas d'authentification requise — le statut d'une enchère est public.
 * Pas de vérification CSRF — endpoint GET en lecture seule.
 */
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/_helpers.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    exit;
}

$produit_id = (int) ($_GET['produit_id'] ?? 0);

if (!$produit_id) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'produit_id manquant']);
    exit;
}

$pdo     = getDB();
$enchere = fetchEnchereByProduit($pdo, $produit_id);

if (!$enchere) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Enchère introuvable']);
    exit;
}

// A chaque lecture, on corrige l'etat si la date de fin est depassee.
$enchere            = transitionnerEtat($pdo, $enchere);
$secondes_restantes = max(0, strtotime($enchere['date_fin']) - time());

// ETag basé sur les deux champs qui déclenchent un re-render côté client.
// secondes_restantes est délibérément exclu — le frontend le calcule
// lui-même à partir du dernier payload reçu.
$etag = '"' . md5($enchere['etat'] . ':' . ($enchere['meilleure_offre'] ?? '')) . '"';

header('Content-Type: application/json');
header('Cache-Control: no-store, must-revalidate');
header('X-Poll-Interval: 3');
header('ETag: ' . $etag);

$inm = trim($_SERVER['HTTP_IF_NONE_MATCH'] ?? '', '"');
if ($inm && $inm === trim($etag, '"')) {
    http_response_code(304);
    exit;
}

echo json_encode([
    'etat'                     => $enchere['etat'],
    'meilleure_offre'          => $enchere['meilleure_offre'] !== null ? (float) $enchere['meilleure_offre'] : null,
    'meilleur_encherisseur_id' => $enchere['meilleur_encherisseur_id'] ? (int) $enchere['meilleur_encherisseur_id'] : null,
    'secondes_restantes'       => $secondes_restantes,
]);
