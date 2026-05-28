-- ============================================================
-- seed.sql — Mercato Nova
-- Données de test enrichies — mai 2026
-- Mot de passe de test pour tous les nouveaux comptes : Mercato1!
-- (Yumi et Lena conservent leur hash d'origine)
-- ============================================================

USE mercato_nova;

-- ── 0. Remise à zéro ─────────────────────────────────────────
-- DELETE dans l'ordre enfants → parents, puis reset des AUTO_INCREMENT
SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM commande_items;
DELETE FROM panier;
DELETE FROM offres_encheres;
DELETE FROM echanges_negociation;
DELETE FROM notifications;
DELETE FROM commandes;
DELETE FROM encheres;
DELETE FROM negociations;
DELETE FROM produits;
DELETE FROM users;
ALTER TABLE commande_items       AUTO_INCREMENT = 1;
ALTER TABLE panier               AUTO_INCREMENT = 1;
ALTER TABLE offres_encheres      AUTO_INCREMENT = 1;
ALTER TABLE echanges_negociation AUTO_INCREMENT = 1;
ALTER TABLE notifications        AUTO_INCREMENT = 1;
ALTER TABLE commandes            AUTO_INCREMENT = 1;
ALTER TABLE encheres             AUTO_INCREMENT = 1;
ALTER TABLE negociations         AUTO_INCREMENT = 1;
ALTER TABLE produits             AUTO_INCREMENT = 1;
ALTER TABLE users                AUTO_INCREMENT = 1;
SET FOREIGN_KEY_CHECKS = 1;

-- ── 1. Utilisateurs ──────────────────────────────────────────
--   1 admin · 4 vendeurs · 8 acheteurs
--   IDs fixes : 1=Elio 2=Shinichi 3=Yumi 4=Lena 5=Amara
--               6=Camille 7=Ibrahim 8=Sofia
--               9=Lucas 10=Emma 11=Ryo 12=Fatou 13=Julien
INSERT INTO users (name, email, password, role) VALUES
('Nova Elio',         'elio@mercatonova.fr',    '$2y$10$1RwZvWDV2REAWiqNW6ty3ebqxgwcU3kmMgQWU6kbQmhoM/BK5YaU6', 'admin'),
('Kudo Shinichi',     'shinichi@mercatonova.fr', '$2y$10$avxEpAgTIf07A2XqLT7QxOCHIsvPSfFC1PxvoWxkprQzmGMt/SwMu', 'vendeur'),
('Tanaka Yumi',       'yumi@mercatonova.fr',     '$2y$10$A44SMkpq5opwFq8FG3MjjO.Yat1sfbz.YFbXeH1/IxMPL7VVeV08i', 'acheteur'),
('Penatelo Lena',     'lena@mercatonova.fr',     '$2y$10$nPdfaoFPH/RGLpWKD1r5IObW/wvwentB11fbdVjpk/EoBIfGz2l0q', 'acheteur'),
('Amara Diallo',      'amara@mercatonova.fr',    '$2y$10$avxEpAgTIf07A2XqLT7QxOCHIsvPSfFC1PxvoWxkprQzmGMt/SwMu', 'vendeur'),
('Camille Rousseau',  'camille@mercatonova.fr',  '$2y$10$avxEpAgTIf07A2XqLT7QxOCHIsvPSfFC1PxvoWxkprQzmGMt/SwMu', 'vendeur'),
('Ibrahim Al-Rashid', 'ibrahim@mercatonova.fr',  '$2y$10$avxEpAgTIf07A2XqLT7QxOCHIsvPSfFC1PxvoWxkprQzmGMt/SwMu', 'vendeur'),
('Sofia Marchetti',   'sofia@mercatonova.fr',    '$2y$10$avxEpAgTIf07A2XqLT7QxOCHIsvPSfFC1PxvoWxkprQzmGMt/SwMu', 'vendeur'),
('Lucas Bernard',     'lucas@mercatonova.fr',    '$2y$10$avxEpAgTIf07A2XqLT7QxOCHIsvPSfFC1PxvoWxkprQzmGMt/SwMu', 'acheteur'),
('Emma Johansson',    'emma@mercatonova.fr',     '$2y$10$avxEpAgTIf07A2XqLT7QxOCHIsvPSfFC1PxvoWxkprQzmGMt/SwMu', 'acheteur'),
('Ryo Matsuda',       'ryo@mercatonova.fr',      '$2y$10$avxEpAgTIf07A2XqLT7QxOCHIsvPSfFC1PxvoWxkprQzmGMt/SwMu', 'acheteur'),
('Fatou Ndiaye',      'fatou@mercatonova.fr',    '$2y$10$avxEpAgTIf07A2XqLT7QxOCHIsvPSfFC1PxvoWxkprQzmGMt/SwMu', 'acheteur'),
('Julien Moreau',     'julien@mercatonova.fr',   '$2y$10$avxEpAgTIf07A2XqLT7QxOCHIsvPSfFC1PxvoWxkprQzmGMt/SwMu', 'acheteur');

-- ── 2. Produits ───────────────────────────────────────────────
--   30 produits · vendeurs 2, 5, 6, 7, 8
--   Type enchere  : id 2 4 5 10 14 17 20 22 24 29
--   Type negociation : id 3 8 13 18 26 30
--   Type achat_immediat : reste

INSERT INTO produits (vendeur_id, titre, description, prix, categorie, etat, type_vente, stock, image_url) VALUES
-- Kudo Shinichi (vendeur 2) — art japonais & sculpture
(2, 'Buste en marbre blanc',            'Sculpture néoclassique, marbre de Carrare, 45 cm',                          1200.00, 'Sculpture',    'bon_etat',    'achat_immediat', 1, 'buste.jpg'),
(2, 'Toile abstraite — Série Feu',      'Huile sur toile, 80×60 cm, signée et datée',                                 850.00, 'Peinture',     'neuf',        'enchere',        1, 'toile_feu.jpg'),
(2, 'Statue en bronze — Danseur',       'Bronze patiné, hauteur 30 cm, édition limitée 12/50',                       3200.00, 'Sculpture',    'bon_etat',    'negociation',    1, 'danseur.jpg'),
(2, 'Gravure sur bois — Forêt',         'Xylographie, tirage unique sur papier washi, encadrée',                      320.00, 'Gravure',      'bon_etat',    'enchere',        1, 'gravure.jpg'),
(2, 'Estampe japonaise — Vague',        'Reproduction fidèle ukiyo-e, encre de Chine sur papier de riz',              450.00, 'Gravure',      'bon_etat',    'enchere',        1, NULL),
(2, 'Netsuke en ivoire sculpté',        'Figurine okimono XIXe, lapin portant une citrouille, 4 cm',                  780.00, 'Sculpture',    'correct',     'achat_immediat', 1, NULL),
(2, 'Photographie — Mont Fuji',         'Tirage argentique, format 40×50 cm, sous-verre anti-UV',                     290.00, 'Photographie', 'neuf',        'achat_immediat', 3, NULL),
(2, 'Laque japonaise — Boîte',          'Laque urushi noire et or, motif grue, XIXe siècle',                         2200.00, 'Céramique',    'bon_etat',    'negociation',    1, NULL),

-- Amara Diallo (vendeur 5) — art africain & photographie
(5, 'Portrait aquarelle — Lumière d\'été', 'Aquarelle sur papier Arches 300 g, format 30×40 cm',                      480.00, 'Peinture',     'bon_etat',    'achat_immediat', 2, NULL),
(5, 'Vase en céramique raku',            'Céramique raku au four à bois, glaçure mat noire, H.28 cm',                  290.00, 'Céramique',    'neuf',        'enchere',        1, NULL),
(5, 'Collier en argent ciselé',          'Argent 925, motifs géométriques touareg, pièce unique',                      650.00, 'Bijoux',       'neuf',        'achat_immediat', 1, NULL),
(5, 'Photographie argentique — Paris la nuit', 'Tirage baryté 24×30 cm, nuit pluvieuse Pont des Arts',               220.00, 'Photographie', 'bon_etat',    'achat_immediat', 4, NULL),
(5, 'Tapisserie murale — Méditerranée',  'Laine teinte naturelle, 120×80 cm, tissage main Maroc',                     1800.00, 'Peinture',     'bon_etat',    'negociation',    1, NULL),

-- Camille Rousseau (vendeur 6) — verre, bijoux, gravure
(6, 'Sculpture sur verre soufflé',       'Verre de Murano bleu cobalt, pièce unique signée, H.35 cm',                1100.00, 'Sculpture',    'neuf',        'enchere',        1, NULL),
(6, 'Gravure sur cuivre — Venise',       'Eau-forte originale, numérotée 3/20, format 30×40 cm',                      540.00, 'Gravure',      'bon_etat',    'achat_immediat', 2, NULL),
(6, 'Céramique émaillée — Série Mer',    'Assiette décorative Ø 32 cm, émail turquoise mat',                          380.00, 'Céramique',    'neuf',        'achat_immediat', 3, NULL),
(6, 'Bague en or 18k — Feuille de lierre', 'Or jaune 18 carats, diamant central 0,15 ct, taille 54',                 890.00, 'Bijoux',       'neuf',        'enchere',        1, NULL),
(6, 'Photographie — Portrait de rue',    'Argentique N&B, tirage numéroté 1/10, format 50×70 cm',                     760.00, 'Photographie', 'bon_etat',    'negociation',    1, NULL),

-- Ibrahim Al-Rashid (vendeur 7) — art islamique & bronze
(7, 'Calligraphie arabe encadrée',       'Encre dorée sur parchemin, sourate Al-Fatiha, cadre bois noyer',            430.00, 'Peinture',     'neuf',        'achat_immediat', 2, NULL),
(7, 'Bronze — Tête de lion',             'Bronze perdu-ciré, finition patine antique, L.22 cm',                      2100.00, 'Sculpture',    'bon_etat',    'enchere',        1, NULL),
(7, 'Bijou en nacre et argent',          'Pendentif argent 925 serti nacre blanche, chaîne 45 cm incluse',            310.00, 'Bijoux',       'bon_etat',    'achat_immediat', 2, NULL),
(7, 'Photographie — Désert au lever',    'Sahara marocain, tirage pigmentaire 60×40 cm, série limitée 5/15',          580.00, 'Photographie', 'neuf',        'enchere',        1, NULL),
(7, 'Tapis à motifs berbères',           'Laine et coton, 200×140 cm, tissage plat kilim, Sud du Maroc',              950.00, 'Gravure',      'correct',     'achat_immediat', 1, NULL),

-- Sofia Marchetti (vendeur 8) — art italien & céramique
(8, 'Peinture à l\'huile — Lac de Côme', 'Huile sur toile, 100×70 cm, paysage lacustre, XXe siècle',                2400.00, 'Peinture',     'neuf',        'enchere',        1, NULL),
(8, 'Mosaïque — Jardin toscan',          'Tesselles en verre de Venise, format 40×40 cm, encadrée',                  1650.00, 'Céramique',    'bon_etat',    'achat_immediat', 1, NULL),
(8, 'Gravure à l\'eau-forte — Portraits', 'Suite de 6 portraits, tirage 8/25, format 20×28 cm chacun',                700.00, 'Gravure',      'bon_etat',    'negociation',    1, NULL),
(8, 'Collier en corail et perles',       'Corail rouge méditerranéen, perles Majorque, fermoir en or',               1200.00, 'Bijoux',       'bon_etat',    'achat_immediat', 1, NULL),
(8, 'Photographie — Florence at Dawn',   'Tirage Fine Art, Piazzale Michelangelo, format 60×40 cm',                   340.00, 'Photographie', 'neuf',        'achat_immediat', 2, NULL),
(8, 'Céramique Bizen — Vase rituel',     'Grès Bizen non émaillé, cuisson anagama, H.32 cm',                          890.00, 'Céramique',    'bon_etat',    'achat_immediat', 1, NULL),
(8, 'Aquarelle — Vue sur l\'Arno',       'Aquarelle originale, format 50×35 cm, Florence, signée Marchetti',         1100.00, 'Peinture',     'neuf',        'negociation',    1, NULL);

-- ── 3. Enchères ───────────────────────────────────────────────
--   10 enchères — états variés : 2 terminées · 6 en cours · 2 en attente
INSERT INTO encheres (produit_id, prix_depart, meilleure_offre, meilleur_encherisseur_id, etat, date_debut, date_fin) VALUES
-- en_cours
(2,  850.00,  980.00, 4,  'en_cours',   DATE_SUB(NOW(), INTERVAL 3 DAY),  DATE_ADD(NOW(), INTERVAL 2 DAY)),
(5,  350.00,  520.00, 9,  'en_cours',   DATE_SUB(NOW(), INTERVAL 1 DAY),  DATE_ADD(NOW(), INTERVAL 5 DAY)),
(14, 900.00, 1250.00, 11, 'en_cours',   DATE_SUB(NOW(), INTERVAL 2 DAY),  DATE_ADD(NOW(), INTERVAL 3 DAY)),
(17, 890.00, 1100.00, 12, 'en_cours',   DATE_SUB(NOW(), INTERVAL 4 DAY),  DATE_ADD(NOW(), INTERVAL 4 DAY)),
(22, 500.00,  780.00, 13, 'en_cours',   DATE_SUB(NOW(), INTERVAL 2 DAY),  DATE_ADD(NOW(), INTERVAL 6 DAY)),
(24, 2000.00, 2600.00, 10,'en_cours',   DATE_SUB(NOW(), INTERVAL 1 DAY),  DATE_ADD(NOW(), INTERVAL 1 DAY)),
-- terminées
(4,  200.00,  320.00, 3,  'terminee',   DATE_SUB(NOW(), INTERVAL 5 DAY),  DATE_SUB(NOW(), INTERVAL 1 DAY)),
(20, 1500.00, 2200.00, 3, 'terminee',   DATE_SUB(NOW(), INTERVAL 7 DAY),  DATE_SUB(NOW(), INTERVAL 2 DAY)),
-- en attente (pas encore ouvertes)
(10, 250.00,  NULL,   NULL,'en_attente', DATE_ADD(NOW(), INTERVAL 1 DAY),  DATE_ADD(NOW(), INTERVAL 8 DAY)),
(29, 750.00,  NULL,   NULL,'en_attente', DATE_ADD(NOW(), INTERVAL 2 DAY),  DATE_ADD(NOW(), INTERVAL 10 DAY));

-- ── 4. Offres enchères ────────────────────────────────────────
INSERT INTO offres_encheres (enchere_id, utilisateur_id, montant) VALUES
-- enchere 1 — Toile abstraite Série Feu (en_cours, menée par Lena id=4)
(1, 3, 900.00),
(1, 4, 980.00),
-- enchere 2 — Estampe japonaise Vague (en_cours, mené par Lucas id=9)
(2, 11, 400.00),
(2, 9,  450.00),
(2, 11, 490.00),
(2, 9,  520.00),
-- enchere 3 — Sculpture sur verre soufflé (en_cours, mené par Ryo id=11)
(3, 9,  950.00),
(3, 11, 1050.00),
(3, 9,  1150.00),
(3, 11, 1250.00),
-- enchere 4 — Bague en or 18k (en_cours, menée par Fatou id=12)
(4, 3,  950.00),
(4, 12, 1100.00),
-- enchere 5 — Photographie Désert au lever (en_cours, mené par Julien id=13)
(5, 9,  550.00),
(5, 13, 650.00),
(5, 9,  720.00),
(5, 13, 780.00),
-- enchere 6 — Peinture Lac de Côme (en_cours, menée par Emma id=10)
(6, 11, 2100.00),
(6, 10, 2300.00),
(6, 11, 2450.00),
(6, 10, 2600.00),
-- enchere 7 — Gravure sur bois Forêt (terminée, gagnée par Yumi id=3)
(7, 3,  320.00),
-- enchere 8 — Bronze Tête de lion (terminée, gagnée par Yumi id=3)
(8, 4,  1600.00),
(8, 9,  1800.00),
(8, 3,  2000.00),
(8, 4,  2100.00),
(8, 3,  2200.00);
-- enchere 9 et 10 : en_attente, aucune offre

-- ── 5. Négociations ──────────────────────────────────────────
INSERT INTO negociations (produit_id, acheteur_id, vendeur_id, etat, derniere_offre, dernier_acteur) VALUES
-- neg 1 : Statue en bronze — Danseur (Yumi ↔ Kudo, contre_offre)
(3,  3, 2, 'contre_offre', 3000.00, 'vendeur'),
-- neg 2 : Tapisserie murale — Méditerranée (Lucas ↔ Amara, en_attente)
(13, 9, 5, 'en_attente',   1600.00, 'acheteur'),
-- neg 3 : Photographie Portrait de rue (Emma ↔ Camille, contre_offre)
(18, 10, 6, 'contre_offre', 700.00, 'vendeur'),
-- neg 4 : Gravure à l'eau-forte (Fatou ↔ Sofia, acceptée)
(26, 12, 8, 'accepte',      640.00, 'vendeur'),
-- neg 5 : Laque japonaise — Boîte (Ryo ↔ Kudo, refusée)
(8,  11, 2, 'refuse',      1900.00, 'vendeur'),
-- neg 6 : Aquarelle Vue sur l'Arno (Julien ↔ Sofia, en_attente)
(30, 13, 8, 'en_attente',   900.00, 'acheteur');

-- ── 6. Échanges négociation ──────────────────────────────────
INSERT INTO echanges_negociation (negociation_id, auteur, montant, message) VALUES
-- neg 1 : contre_offre vendeur à 3000
(1, 'acheteur', 2800.00, 'Je vous propose 2800€ pour le bronze, belle pièce'),
(1, 'vendeur',  3000.00, 'Prix minimum 3000€, édition limitée 12/50, très rare'),
-- neg 2 : en_attente, une seule offre acheteur
(2, 'acheteur', 1600.00, 'Bonjour, je propose 1600€ pour la tapisserie — livraison possible ?'),
-- neg 3 : contre_offre vendeur à 700
(3, 'acheteur',  630.00, 'Je propose 630€ pour la photographie, tirage N&B magnifique'),
(3, 'vendeur',   700.00, 'Je peux descendre à 700€, c\'est mon dernier prix sur ce tirage'),
-- neg 4 : acceptée à 640
(4, 'acheteur',  580.00, '580€, est-ce possible pour la suite de gravures ?'),
(4, 'vendeur',   680.00, 'Minimum 680€ pour les 6 gravures, travail de plusieurs semaines'),
(4, 'acheteur',  640.00, '640€, on fait affaire ?'),
(4, 'vendeur',   640.00, 'D\'accord pour 640€ — marché conclu, je vous envoie les détails'),
-- neg 5 : refusée
(5, 'acheteur', 1700.00, '1700€ pour la laque urushi, c\'est un beau geste'),
(5, 'vendeur',  2200.00, 'La laque est cataloguée à 2200€, prix ferme pour une pièce XIXe'),
(5, 'acheteur', 1900.00, 'Dernier geste de ma part, 1900€'),
(5, 'vendeur',  1900.00, 'Offre refusée — nous ne descendrons pas en dessous de 2000€'),
-- neg 6 : en_attente acheteur
(6, 'acheteur',  900.00, '900€ pour l\'aquarelle, qu\'en pensez-vous ?');

-- ── 7. Notifications ─────────────────────────────────────────
INSERT INTO notifications (utilisateur_id, type, message, lu) VALUES
-- Kudo (vendeur, id=2)
(2, 'negociation_nouvelle',  'Nouvelle négociation reçue pour « Statue en bronze — Danseur »', 0),
(2, 'enchere_offre_recue',   'Nouvelle offre de 980€ sur « Toile abstraite — Série Feu »', 1),
(2, 'negociation_nouvelle',  'Nouvelle négociation reçue pour « Laque japonaise — Boîte »', 1),
-- Yumi (acheteur, id=3)
(3, 'negociation_reponse',   'Contre-offre reçue pour « Statue en bronze — Danseur » : 3 000€', 0),
(3, 'enchere_surencheris',   'Vous avez été surenchéri sur « Toile abstraite — Série Feu » (980€)', 1),
(3, 'commande',              'Félicitations, vous avez remporté « Gravure sur bois — Forêt »', 1),
(3, 'enchere_gagnee',        'Vous avez remporté l enchère « Bronze — Tête de lion » avec 2 200€', 0),
-- Lena (acheteur, id=4)
(4, 'enchere_gagnee',        'Vous menez l enchère sur « Toile abstraite — Série Feu » avec 980€', 0),
(4, 'enchere_surencheris',   'Vous avez été surenchéri sur « Bronze — Tête de lion » (2 200€)', 1),
(4, 'commande',              'Commande passée pour « Buste en marbre blanc » — merci !', 1),
-- Lucas (acheteur, id=9)
(9, 'enchere_gagnee',        'Vous menez l enchère sur « Estampe japonaise — Vague » avec 520€', 0),
(9, 'enchere_surencheris',   'Vous avez été surenchéri sur « Sculpture sur verre soufflé » (1 250€)', 0),
(9, 'negociation_nouvelle',  'Négociation initiée pour « Tapisserie murale — Méditerranée »', 1),
-- Emma (acheteur, id=10)
(10, 'negociation_reponse',  'Contre-offre reçue pour « Photographie — Portrait de rue » : 700€', 0),
(10, 'enchere_gagnee',       'Vous menez l enchère sur « Peinture à l huile — Lac de Côme » avec 2 600€', 0),
-- Ryo (acheteur, id=11)
(11, 'enchere_gagnee',       'Vous menez l enchère sur « Sculpture sur verre soufflé » avec 1 250€', 0),
(11, 'negociation_reponse',  'Offre refusée pour « Laque japonaise — Boîte »', 1),
(11, 'enchere_surencheris',  'Vous avez été surenchéri sur « Peinture à l huile — Lac de Côme » (2 600€)', 1),
-- Fatou (acheteur, id=12)
(12, 'negociation_acceptee', 'Offre acceptée pour « Gravure à l eau-forte — Portraits » à 640€', 0),
(12, 'enchere_surencheris',  'Vous avez été surenchéri sur « Bague en or 18k » (1 100€)', 1),
(12, 'enchere_gagnee',       'Vous menez l enchère sur « Bague en or 18k » avec 1 100€', 0),
-- Julien (acheteur, id=13)
(13, 'enchere_gagnee',       'Vous menez l enchère sur « Photographie — Désert au lever » avec 780€', 0),
(13, 'negociation_nouvelle', 'Négociation initiée pour « Aquarelle — Vue sur l Arno »', 1);

-- ── 8. Panier ────────────────────────────────────────────────
INSERT INTO panier (utilisateur_id, produit_id, quantite) VALUES
(4,  1, 1),   -- Lena veut le buste en marbre
(9,  15, 1),  -- Lucas : gravure Venise
(10, 11, 1),  -- Emma : collier argent
(12, 16, 2);  -- Fatou : 2 céramiques Série Mer

-- ── 9. Commandes ─────────────────────────────────────────────
INSERT INTO commandes (utilisateur_id, total, statut, moyen_paiement) VALUES
(3,  320.00,  'payee', 'carte'),     -- id 1 : Yumi remporte la gravure Forêt (enchère 7)
(4,  1200.00, 'payee', 'carte'),     -- id 2 : Lena achète le buste en marbre
(9,  540.00,  'payee', 'paypal'),    -- id 3 : Lucas achète la gravure Venise
(11, 430.00,  'payee', 'carte'),     -- id 4 : Ryo achète la calligraphie arabe
(3,  220.00,  'payee', 'virement');  -- id 5 : Yumi achète la photo Paris

INSERT INTO commande_items (commande_id, produit_id, quantite, prix_unitaire) VALUES
(1, 4,  1, 320.00),
(2, 1,  1, 1200.00),
(3, 15, 1, 540.00),
(4, 19, 1, 430.00),
(5, 12, 1, 220.00);
