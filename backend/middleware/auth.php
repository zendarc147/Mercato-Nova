<?php

function requireAuth(): array {
    if (session_status() === PHP_SESSION_NONE) session_start();

    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['message' => 'Non authentifié']);
        exit;
    }

    return [
        'id'   => $_SESSION['user_id'],
        'role' => $_SESSION['user_role'],
    ];
}

function requireRole(string $role): array {
    $user = requireAuth();
    if ($user['role'] !== $role) {
        http_response_code(403);
        echo json_encode(['message' => 'Accès interdit']);
        exit;
    }
    return $user;
}
