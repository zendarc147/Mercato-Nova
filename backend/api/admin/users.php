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
    requireRole('admin');

    $pdo  = getDB();
    $stmt = $pdo->query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    echo json_encode($stmt->fetchAll());
    exit;
}

if ($method === 'PATCH') {
    verifyCsrfToken();
    requireRole('admin');

    $body = json_decode(file_get_contents('php://input'), true);
    $id   = (int) ($body['id'] ?? 0);
    $role = $body['role'] ?? '';

    if (!$id || !in_array($role, ['acheteur', 'vendeur', 'admin'], true)) {
        http_response_code(422);
        echo json_encode(['message' => 'id et role valide requis']);
        exit;
    }

    $pdo  = getDB();
    $stmt = $pdo->prepare('UPDATE users SET role = ? WHERE id = ?');
    $stmt->execute([$role, $id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['message' => 'Utilisateur introuvable']);
        exit;
    }

    echo json_encode(['message' => 'Rôle mis à jour']);
    exit;
}

http_response_code(405);
echo json_encode(['message' => 'Méthode non autorisée']);
