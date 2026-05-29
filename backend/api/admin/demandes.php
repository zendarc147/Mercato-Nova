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
    $pdo = getDB();

    $stmt = $pdo->query(
        'SELECT dv.id, dv.user_id, u.name AS user_name, u.email AS user_email,
                dv.nom_boutique, dv.description, dv.categories, dv.experience,
                dv.site_web, dv.telephone, dv.motivation, dv.etat, dv.created_at
         FROM demandes_vendeur dv
         JOIN users u ON u.id = dv.user_id
         ORDER BY FIELD(dv.etat, "en_attente", "refuse", "approuve"), dv.created_at DESC'
    );
    $rows = $stmt->fetchAll();

    foreach ($rows as &$row) {
        $row['categories'] = $row['categories'] ? json_decode($row['categories'], true) : [];
    }

    echo json_encode(['demandes' => $rows]);
    exit;
}

if ($method === 'PATCH') {
    verifyCsrfToken();
    requireRole('admin');

    $body   = json_decode(file_get_contents('php://input'), true);
    $id     = (int) ($body['id'] ?? 0);
    $action = $body['action'] ?? '';

    if (!$id || !in_array($action, ['approuver', 'refuser'], true)) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'id et action valides requis.']);
        exit;
    }

    $pdo  = getDB();
    $stmt = $pdo->prepare('SELECT user_id, etat FROM demandes_vendeur WHERE id = ?');
    $stmt->execute([$id]);
    $demande = $stmt->fetch();

    if (!$demande) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Demande introuvable.']);
        exit;
    }

    $nouvelEtat = $action === 'approuver' ? 'approuve' : 'refuse';

    $pdo->beginTransaction();

    $stmt = $pdo->prepare('UPDATE demandes_vendeur SET etat = ? WHERE id = ?');
    $stmt->execute([$nouvelEtat, $id]);

    if ($action === 'approuver') {
        $stmt = $pdo->prepare('UPDATE users SET role = "vendeur" WHERE id = ?');
        $stmt->execute([$demande['user_id']]);
    }

    $pdo->commit();

    echo json_encode(['success' => true, 'etat' => $nouvelEtat]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
