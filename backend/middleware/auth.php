<?php

// Verifie qu'un utilisateur est connecte avant de continuer une action protegee.
function requireAuth(): array {
    if (session_status() === PHP_SESSION_NONE) { require_once __DIR__ . '/../config/session.php'; configureSession(); }

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

// Verifie que l'utilisateur connecte possede au moins un des roles demandes.
function requireRole(string ...$roles): array {
    $user = requireAuth();
    if (!in_array($user['role'], $roles, true)) {
        http_response_code(403);
        echo json_encode(['message' => 'Accès interdit']);
        exit;
    }
    return $user;
}
