<?php
// Endpoint qui renvoie l'utilisateur actuellement connecte grace a la session PHP.
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

setCorsHeaders();
configureSession();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Méthode non autorisée']);
    exit;
}

$user = requireAuth();

$pdo  = getDB();
$stmt = $pdo->prepare('SELECT id, name, email, role, statut, preferences FROM users WHERE id = ?');
$stmt->execute([$user['id']]);
$data = $stmt->fetch();

// Si le compte n'existe plus, on nettoie la session pour eviter une fausse connexion.
if (!$data) {
    session_destroy();
    http_response_code(401);
    echo json_encode(['message' => 'Session invalide']);
    exit;
}

// Un compte suspendu ou banni ne doit plus rester connecte.
if (in_array($data['statut'], ['suspendu', 'banni'], true)) {
    session_destroy();
    http_response_code(403);
    $msg = $data['statut'] === 'banni'
        ? 'Votre compte a été banni définitivement.'
        : 'Votre compte est suspendu. Contactez l\'administration.';
    echo json_encode(['message' => $msg]);
    exit;
}

$data['preferences'] = $data['preferences'] ? json_decode($data['preferences'], true) : [];
echo json_encode($data);
