<?php
require_once __DIR__ . '/../../config/cors.php';
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

session_destroy();
echo json_encode(['message' => 'Déconnecté']);
