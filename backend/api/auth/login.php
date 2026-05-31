<?php
// Endpoint de connexion : il verifie les identifiants puis cree la session PHP.
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

// Validation simple avant de chercher l'utilisateur en base.
if (!$email || !$mot_de_passe) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Email et mot de passe requis']);
    exit;
}

$pdo  = getDB();
$stmt = $pdo->prepare('SELECT id, name, email, password, role, statut FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

// password_verify compare le mot de passe tape avec le hash stocke en base.
if (!$user || !password_verify($mot_de_passe, $user['password'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Identifiants incorrects']);
    exit;
}

if ($user['statut'] === 'suspendu') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Votre compte est suspendu. Contactez l\'administration.']);
    exit;
}

if ($user['statut'] === 'banni') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Votre compte a été banni définitivement.']);
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
