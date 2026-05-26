<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

setCorsHeaders();
session_start();
header('Content-Type: application/json');

$user = requireAuth();

$pdo  = getDB();
$stmt = $pdo->prepare('SELECT id, name, email, role FROM users WHERE id = ?');
$stmt->execute([$user['id']]);
$data = $stmt->fetch();

echo json_encode($data);
