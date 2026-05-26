<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/csrf.php';

setCorsHeaders();
session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Méthode non autorisée']);
    exit;
}

verifyCsrfToken();

$body = json_decode(file_get_contents('php://input'), true);
$email    = trim($body['email'] ?? '');
$password = $body['password'] ?? '';

if (!$email || !$password) {
    http_response_code(422);
    echo json_encode(['message' => 'Email et mot de passe requis']);
    exit;
}

$pdo  = getDB();
$stmt = $pdo->prepare('SELECT id, name, email, password, role FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Identifiants incorrects']);
    exit;
}

session_regenerate_id(true);
$_SESSION['user_id']   = $user['id'];
$_SESSION['user_role'] = $user['role'];

echo json_encode([
    'id'    => $user['id'],
    'name'  => $user['name'],
    'email' => $user['email'],
    'role'  => $user['role'],
]);
