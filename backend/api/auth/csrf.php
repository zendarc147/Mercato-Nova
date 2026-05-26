<?php
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../middleware/csrf.php';

setCorsHeaders();
header('Content-Type: application/json');

$token = generateCsrfToken();
echo json_encode(['csrf_token' => $token]);
