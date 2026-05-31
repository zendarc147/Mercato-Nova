<?php

// Configure les en-tetes qui autorisent le frontend React a appeler l'API PHP.
function setCorsHeaders(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173';
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
