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
$nom          = trim($body['nom'] ?? '');
$prenom       = trim($body['prenom'] ?? '');
$email        = trim($body['email'] ?? '');
$mot_de_passe = $body['mot_de_passe'] ?? '';
$role         = in_array($body['role'] ?? '', ['acheteur', 'vendeur']) ? $body['role'] : 'acheteur';
$preferences  = isset($body['preferences']) && is_array($body['preferences']) ? json_encode($body['preferences']) : null;

if (!$nom || !$prenom || !$email || !$mot_de_passe) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Tous les champs sont requis']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Email invalide']);
    exit;
}

if (strlen($mot_de_passe) < 8) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Mot de passe trop court (8 caractères min)']);
    exit;
}

$pdo  = getDB();
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['success' => false, 'error' => 'Email déjà utilisé']);
    exit;
}

$name = $prenom . ' ' . $nom;
$hash = password_hash($mot_de_passe, PASSWORD_BCRYPT);
$stmt = $pdo->prepare('INSERT INTO users (name, email, password, role, preferences) VALUES (?, ?, ?, ?, ?)');
$stmt->execute([$name, $email, $hash, $role, $preferences]);
$id = (int) $pdo->lastInsertId();

session_regenerate_id(true);
$_SESSION['user_id']   = $id;
$_SESSION['user_role'] = $role;

http_response_code(201);
echo json_encode([
    'success' => true,
    'message' => 'Compte créé avec succès',
    'user'    => [
        'id'     => $id,
        'nom'    => $nom,
        'prenom' => $prenom,
        'email'  => $email,
        'role'   => $role,
    ],
]);
