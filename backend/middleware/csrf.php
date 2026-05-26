<?php

function generateCsrfToken(): string {
    if (session_status() === PHP_SESSION_NONE) { require_once __DIR__ . '/../config/session.php'; configureSession(); }
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function verifyCsrfToken(): void {
    if (session_status() === PHP_SESSION_NONE) { require_once __DIR__ . '/../config/session.php'; configureSession(); }
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        http_response_code(403);
        echo json_encode(['message' => 'Token CSRF invalide']);
        exit;
    }
}
