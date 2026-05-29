<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/csrf.php';
require_once __DIR__ . '/../../middleware/auth.php';

setCorsHeaders();
configureSession();
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    getProfil();
} elseif ($method === 'PUT') {
    updateProfil();
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
}

function getProfil(): void {
    $user = requireAuth();
    $pdo  = getDB();

    $stmt = $pdo->prepare('SELECT id, name, email, role, preferences, created_at FROM users WHERE id = ?');
    $stmt->execute([$user['id']]);
    $data = $stmt->fetch();

    if (!$data) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Utilisateur introuvable']);
        return;
    }

    $data['preferences'] = $data['preferences'] ? json_decode($data['preferences'], true) : [];
    echo json_encode($data);
}

function updateProfil(): void {
    verifyCsrfToken();
    $user = requireAuth();

    $body        = json_decode(file_get_contents('php://input'), true);
    $preferences = isset($body['preferences']) && is_array($body['preferences'])
        ? json_encode($body['preferences'])
        : null;

    if ($preferences === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'preferences doit être un tableau']);
        return;
    }

    $pdo  = getDB();
    $stmt = $pdo->prepare('UPDATE users SET preferences = ? WHERE id = ?');
    $stmt->execute([$preferences, $user['id']]);

    echo json_encode(['success' => true]);
}
