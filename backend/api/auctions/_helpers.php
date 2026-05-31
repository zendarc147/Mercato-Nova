<?php

// Fonctions partagees par les endpoints d'encheres.

/**
 * Fait passer l'enchère dans le bon état selon les dates.
 * Appelée à chaque lecture — pas de cron nécessaire.
 */
function transitionnerEtat(PDO $pdo, array $enchere): array {
    $now        = time();
    $date_fin   = strtotime($enchere['date_fin']);
    $date_debut = $enchere['date_debut'] ? strtotime($enchere['date_debut']) : null;

    $nouvel_etat = $enchere['etat'];

    if ($enchere['etat'] === 'en_attente' && $date_debut !== null && $now >= $date_debut) {
        $nouvel_etat = 'en_cours';
    }
    if (in_array($enchere['etat'], ['en_attente', 'en_cours'], true) && $now >= $date_fin) {
        $nouvel_etat = 'terminee';
    }

    if ($nouvel_etat !== $enchere['etat']) {
        $stmt = $pdo->prepare('UPDATE encheres SET etat = ? WHERE id = ?');
        $stmt->execute([$nouvel_etat, $enchere['id']]);
        $enchere['etat'] = $nouvel_etat;
    }

    return $enchere;
}

// Charge l'enchere d'un produit ; FOR UPDATE verrouille la ligne pendant une transaction.
function fetchEnchereByProduit(PDO $pdo, int $produit_id, bool $forUpdate = false): ?array {
    $lock = $forUpdate ? ' FOR UPDATE' : '';
    $stmt = $pdo->prepare(
        'SELECT e.*, u.name AS meilleur_encherisseur_nom
         FROM encheres e
         LEFT JOIN users u ON u.id = e.meilleur_encherisseur_id
         WHERE e.produit_id = ?' . $lock
    );
    $stmt->execute([$produit_id]);
    return $stmt->fetch() ?: null;
}
