<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';

setCorsHeaders();
session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Méthode non autorisée']);
    exit;
}

$body     = json_decode(file_get_contents('php://input'), true);
$name     = trim($body['name'] ?? '');
$email    = trim($body['email'] ?? '');
$password = $body['password'] ?? '';
$role     = in_array($body['role'] ?? '', ['acheteur', 'vendeur']) ? $body['role'] : 'acheteur';

if (!$name || !$email || !$password) {
    http_response_code(422);
    echo json_encode(['message' => 'Tous les champs sont requis']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['message' => 'Email invalide']);
    exit;
}

if (strlen($password) < 8) {
    http_response_code(422);
    echo json_encode(['message' => 'Mot de passe trop court (8 caractères min)']);
    exit;
}

$pdo  = getDB();
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['message' => 'Email déjà utilisé']);
    exit;
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$stmt = $pdo->prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
$stmt->execute([$name, $email, $hash, $role]);
$id = $pdo->lastInsertId();

session_regenerate_id(true);
$_SESSION['user_id']   = $id;
$_SESSION['user_role'] = $role;

http_response_code(201);
echo json_encode(['id' => $id, 'name' => $name, 'email' => $email, 'role' => $role]);
