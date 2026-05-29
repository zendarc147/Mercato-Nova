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
$id = isset($_GET['id']) ? (int) $_GET['id'] : null;
$action = $_GET['action'] ?? null;

if ($method === 'GET') {
    listerNotifications();
} elseif ($method === 'POST' && $id !== null) {
    marquerLue($id);
} elseif ($method === 'POST' && $action === 'tout_lire') {
    marquerToutesLues();
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
}

function listerNotifications(): void{
    $user = requireAuth();
    $pdo = getDB();
    $stmt = $pdo->prepare(
        'SELECT id, type, message, lu, created_at FROM notifications WHERE utilisateur_id = ? ORDER BY created_at DESC LIMIT 30'
    );
    $stmt->execute([$user['id']]);
    $rows = $stmt->fetchAll();
    $notifications = array_map(fn($r) => [
        'id' => (int) $r['id'],
        'type' => $r['type'],
        'message' => $r['message'],
        'lu' => (bool) $r['lu'],
        'created_at' => $r['created_at'],
    ], $rows);
    $non_lues = count(array_filter($notifications, fn($n) => !$n['lu']));
    echo json_encode([
        'notifications' => $notifications,
        'non_lues' => $non_lues,
    ]);
}

function marquerLue(int $id): void {
    verifyCsrfToken();
    $user = requireAuth();
    $pdo  = getDB();
    $stmt = $pdo->prepare('SELECT id, utilisateur_id FROM notifications WHERE id = ?');
    $stmt->execute([$id]);
    $notif = $stmt->fetch();
    if (!$notif) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Notification introuvable']);
        return;
    }
    if ((int) $notif['utilisateur_id'] !== (int) $user['id']) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Accès interdit']);
        return;
    }
    $stmt = $pdo->prepare('UPDATE notifications SET lu = 1 WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode(['success' => true]);
}

function marquerToutesLues(): void {
    verifyCsrfToken();
    $user = requireAuth();
    $pdo  = getDB();
    $stmt = $pdo->prepare('UPDATE notifications SET lu = 1 WHERE utilisateur_id = ?');
    $stmt->execute([$user['id']]);
    echo json_encode(['success' => true]);
}
