<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/csrf.php';

setCorsHeaders();
configureSession();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    exit;
}

$body         = json_decode(file_get_contents('php://input'), true);
$email        = trim($body['email'] ?? '');
$mot_de_passe = $body['mot_de_passe'] ?? '';

if (!$email || !$mot_de_passe) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Email et mot de passe requis']);
    exit;
}

$pdo  = getDB();
$stmt = $pdo->prepare('SELECT id, name, email, password, role FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($mot_de_passe, $user['password'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Identifiants incorrects']);
    exit;
}

session_regenerate_id(true);
$_SESSION['user_id']   = $user['id'];
$_SESSION['user_role'] = $user['role'];
$csrf_token = generateCsrfToken();

echo json_encode([
    'success'    => true,
    'user'       => [
        'id'    => (int) $user['id'],
        'nom'   => $user['name'],
        'email' => $user['email'],
        'role'  => $user['role'],
    ],
    'csrf_token' => $csrf_token,
]);
