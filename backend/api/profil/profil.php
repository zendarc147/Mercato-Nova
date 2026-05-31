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

    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Corps de requête invalide']);
        return;
    }

    $pdo    = getDB();
    $sets   = [];
    $params = [];

    if (array_key_exists('preferences', $body)) {
        if (!is_array($body['preferences'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'preferences doit être un tableau']);
            return;
        }
        $sets[]   = 'preferences = ?';
        $params[] = json_encode($body['preferences']);
    }

    if (!empty($body['name'])) {
        $sets[]   = 'name = ?';
        $params[] = trim($body['name']);
    }

    if (!empty($body['email'])) {
        $email = trim($body['email']);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Email invalide']);
            return;
        }
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
        $stmt->execute([$email, $user['id']]);
        if ($stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => 'Email déjà utilisé']);
            return;
        }
        $sets[]   = 'email = ?';
        $params[] = $email;
    }

    if (!empty($body['mot_de_passe'])) {
        if (strlen($body['mot_de_passe']) < 8) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Mot de passe trop court (8 caractères minimum)']);
            return;
        }
        $sets[]   = 'password = ?';
        $params[] = password_hash($body['mot_de_passe'], PASSWORD_DEFAULT);
    }

    if (empty($sets)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Aucun champ à mettre à jour']);
        return;
    }

    $params[] = $user['id'];
    $stmt = $pdo->prepare('UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?');
    $stmt->execute($params);

    echo json_encode(['success' => true]);
}
