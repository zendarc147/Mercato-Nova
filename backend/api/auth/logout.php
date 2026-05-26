<?php
require_once __DIR__ . '/../../config/cors.php';

setCorsHeaders();
session_start();
header('Content-Type: application/json');

session_destroy();
echo json_encode(['message' => 'Déconnecté']);
