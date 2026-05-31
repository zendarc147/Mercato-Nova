<?php

// Fonctions partagees par les endpoints de negociation.

/**
 * Transitions d'état automatiques basées sur expires_at.
 * Appelée à chaque lecture — pas de cron nécessaire.
 */
function transitionnerNegociation(PDO $pdo, array $neg): array {
    $etats_actifs = ['en_attente', 'contre_offre'];

    if (in_array($neg['etat'], $etats_actifs, true) && $neg['expires_at'] !== null) {
        if (time() >= strtotime($neg['expires_at'])) {
            $stmt = $pdo->prepare('UPDATE negociations SET etat = ? WHERE id = ?');
            $stmt->execute(['expire', $neg['id']]);
            $neg['etat'] = 'expire';

            // Notifie les deux parties
            $titre = $neg['produit_titre'] ?? 'produit';
            $msg   = "La négociation pour « {$titre} » a expiré faute de réponse dans les 48 h.";
            $stmtN = $pdo->prepare('INSERT INTO notifications (utilisateur_id, type, message) VALUES (?, \'negociation_expiree\', ?)');
            $stmtN->execute([(int) $neg['acheteur_id'], $msg]);
            $stmtN->execute([(int) $neg['vendeur_id'],  $msg]);
        }
    }

    return $neg;
}

// Charge une negociation ; FOR UPDATE verrouille la ligne pendant une reponse.
function fetchNegociation(PDO $pdo, int $id, bool $forUpdate = false): ?array {
    $lock = $forUpdate ? ' FOR UPDATE' : '';
    $stmt = $pdo->prepare(
        'SELECT n.*,
                pa.name AS acheteur_nom,
                pv.name AS vendeur_nom,
                pr.titre AS produit_titre,
                pr.prix  AS produit_prix_initial
         FROM negociations n
         JOIN users   pa ON pa.id = n.acheteur_id
         JOIN users   pv ON pv.id = n.vendeur_id
         JOIN produits pr ON pr.id = n.produit_id
         WHERE n.id = ?' . $lock
    );
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

/**
 * Retourne le rôle de l'utilisateur dans cette négociation ('acheteur', 'vendeur', ou null).
 */
function roleInNeg(array $neg, int $user_id): ?string {
    if ((int) $neg['acheteur_id'] === $user_id) return 'acheteur';
    if ((int) $neg['vendeur_id']  === $user_id) return 'vendeur';
    return null;
}

/**
 * Transitions légales de la machine à états.
 *
 * État courant + action → nouvel état
 * Seule la partie dont ce n'est PAS le tour peut répondre
 * (après que l'acheteur initie, c'est au vendeur ; ensuite alternance).
 */
function transitionsLegales(): array {
    return [
        'en_attente'  => ['contre_offre' => 'contre_offre', 'accepter' => 'accepte', 'refuser' => 'refuse'],
        'contre_offre' => ['contre_offre' => 'contre_offre', 'accepter' => 'accepte', 'refuser' => 'refuse'],
    ];
}

// Une negociation expire 48 heures apres la derniere action.
function expireAt(): string {
    return date('Y-m-d H:i:s', strtotime('+48 hours'));
}
