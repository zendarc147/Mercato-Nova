<?php
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
$stmt = $pdo->prepare('SELECT id, name, email, role, preferences FROM users WHERE id = ?');
$stmt->execute([$user['id']]);
$data = $stmt->fetch();

if (!$data) {
    session_destroy();
    http_response_code(401);
    echo json_encode(['message' => 'Session invalide']);
    exit;
}

$data['preferences'] = $data['preferences'] ? json_decode($data['preferences'], true) : [];
echo json_encode($data);
