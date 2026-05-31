<?php
// Endpoint appele par React pour obtenir un token CSRF avant les requetes sensibles.
require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../middleware/csrf.php';

setCorsHeaders();
configureSession();
header('Content-Type: application/json');

$token = generateCsrfToken();
echo json_encode(['csrf_token' => $token]);
