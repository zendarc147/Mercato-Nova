<?php

// Configure la session PHP utilisee pour retenir l'utilisateur connecte.
function configureSession(): void {
    if (session_status() !== PHP_SESSION_NONE) return;

    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');

    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'domain'   => '',
        'secure'   => $isSecure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    ini_set('session.gc_maxlifetime', 7200);
    ini_set('session.use_strict_mode', '1');
    ini_set('session.cookie_httponly', '1');

    session_start();
}
