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

// ── GET : liste des utilisateurs ─────────────────────────────────────
if ($method === 'GET') {
    requireRole('admin');
    $pdo = getDB();
    try {
        $stmt = $pdo->query(
            'SELECT id, name, email, role, statut, created_at FROM users ORDER BY created_at DESC'
        );
        echo json_encode($stmt->fetchAll());
    } catch (PDOException $e) {
        // Colonne statut absente : retomber sur la requête sans statut
        $stmt = $pdo->query(
            'SELECT id, name, email, role, \'actif\' AS statut, created_at FROM users ORDER BY created_at DESC'
        );
        echo json_encode($stmt->fetchAll());
    }
    exit;
}

// ── POST : envoyer une notification à un utilisateur ─────────────────
if ($method === 'POST') {
    verifyCsrfToken();
    requireRole('admin');

    $body    = json_decode(file_get_contents('php://input'), true);
    $user_id = (int) ($body['user_id'] ?? 0);
    $message = trim($body['message'] ?? '');

    if (!$user_id || $message === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'user_id et message requis']);
        exit;
    }

    $pdo  = getDB();
    $stmt = $pdo->prepare('SELECT id FROM users WHERE id = ?');
    $stmt->execute([$user_id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Utilisateur introuvable']);
        exit;
    }

    $stmt = $pdo->prepare(
        "INSERT INTO notifications (utilisateur_id, type, message) VALUES (?, 'message_admin', ?)"
    );
    $stmt->execute([$user_id, $message]);

    echo json_encode(['success' => true]);
    exit;
}

// ── PATCH : changer le rôle et/ou le statut ──────────────────────────
if ($method === 'PATCH') {
    verifyCsrfToken();
    $admin = requireRole('admin');

    $body = json_decode(file_get_contents('php://input'), true);
    $id   = (int) ($body['id'] ?? 0);

    if (!$id) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'id requis']);
        exit;
    }

    if ($id === (int) $admin['id']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Impossible de modifier votre propre compte']);
        exit;
    }

    $pdo  = getDB();
    $stmt = $pdo->prepare('SELECT id, role FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $cible = $stmt->fetch();

    if (!$cible) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Utilisateur introuvable']);
        exit;
    }

    $sets   = [];
    $params = [];

    if (array_key_exists('role', $body)) {
        $roles_valides = ['acheteur', 'vendeur', 'admin'];
        if (!in_array($body['role'], $roles_valides, true)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Rôle invalide']);
            exit;
        }
        $sets[]   = 'role = ?';
        $params[] = $body['role'];
    }

    if (array_key_exists('statut', $body)) {
        $statuts_valides = ['actif', 'suspendu', 'banni'];
        if (!in_array($body['statut'], $statuts_valides, true)) {
            http_response_code(422);
            echo json_encode(['success' => false, 'error' => 'Statut invalide']);
            exit;
        }
        $sets[]   = 'statut = ?';
        $params[] = $body['statut'];
    }

    if (empty($sets)) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'Aucun champ à modifier (role ou statut attendu)']);
        exit;
    }

    $params[] = $id;
    try {
        $stmt = $pdo->prepare('UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?');
        $stmt->execute($params);
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erreur BDD : colonne manquante — exécutez le ALTER TABLE dans phpMyAdmin.']);
    }
    exit;
}

// ── DELETE : supprimer un compte ──────────────────────────────────────
if ($method === 'DELETE') {
    verifyCsrfToken();
    $admin = requireRole('admin');

    $id = (int) ($_GET['id'] ?? 0);

    if (!$id) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'id requis']);
        exit;
    }

    if ($id === (int) $admin['id']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Impossible de supprimer votre propre compte']);
        exit;
    }

    $pdo  = getDB();
    $stmt = $pdo->prepare('SELECT id, role FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $cible = $stmt->fetch();

    if (!$cible) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Utilisateur introuvable']);
        exit;
    }

    if ($cible['role'] === 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Impossible de supprimer un compte administrateur']);
        exit;
    }

    $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$id]);

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
