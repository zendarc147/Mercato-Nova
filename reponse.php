<?php
// backend/api/reponse.php

function envoyerJSON(int $codeStatut, $messageOuDonnees, array $donneesSup = []): void {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($codeStatut);
    
    $estSucces = ($codeStatut >= 200 && $codeStatut < 300);
    $reponse = ['success' => $estSucces];

    if (is_string($messageOuDonnees)) {
        if ($estSucces) {
            $reponse['message'] = $messageOuDonnees;
        } else {
            $reponse['error'] = $messageOuDonnees;
        }
        if (!empty($donneesSup)) {
            $reponse = array_merge($reponse, $donneesSup);
        }
    } else if (is_array($messageOuDonnees)) {
        $reponse = array_merge($reponse, $messageOuDonnees);
    }

    echo json_encode($reponse);
    exit;
} 