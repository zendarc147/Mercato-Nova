-- ============================================================
-- seed.sql — Mercato Nova
-- Données de test enrichies — mai 2026
-- Mot de passe : Mercato1! pour tous les comptes
-- 7 catégories, 10 produits minimum chacune (70 produits total)
-- ============================================================

USE mercato_nova;

-- ── 0. Remise à zéro ─────────────────────────────────────────
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
--   1 admin · 7 vendeurs · 8 acheteurs
--   1=Elio(admin) 2=Shinichi 3=Yumi 4=Lena 5=Amara
--   6=Camille 7=Ibrahim 8=Sofia 9=Lucas 10=Emma
--   11=Ryo 12=Fatou 13=Julien 14=Marie 15=Thomas 16=Chiara
INSERT INTO users (name, email, password, role) VALUES
('Nova Elio',         'elio@mercatonova.fr',    '$2y$10$mRXzpQhR7QiMBpQZlu8IyOfNhphIpnkC53MGWz8SvA9OM8fQK8OwG', 'admin'),
('Kudo Shinichi',     'shinichi@mercatonova.fr', '$2y$10$mRXzpQhR7QiMBpQZlu8IyOfNhphIpnkC53MGWz8SvA9OM8fQK8OwG', 'vendeur'),
('Tanaka Yumi',       'yumi@mercatonova.fr',     '$2y$10$mRXzpQhR7QiMBpQZlu8IyOfNhphIpnkC53MGWz8SvA9OM8fQK8OwG', 'acheteur'),
('Penatelo Lena',     'lena@mercatonova.fr',     '$2y$10$mRXzpQhR7QiMBpQZlu8IyOfNhphIpnkC53MGWz8SvA9OM8fQK8OwG', 'acheteur'),
('Amara Diallo',      'amara@mercatonova.fr',    '$2y$10$mRXzpQhR7QiMBpQZlu8IyOfNhphIpnkC53MGWz8SvA9OM8fQK8OwG', 'vendeur'),
('Camille Rousseau',  'camille@mercatonova.fr',  '$2y$10$mRXzpQhR7QiMBpQZlu8IyOfNhphIpnkC53MGWz8SvA9OM8fQK8OwG', 'vendeur'),
('Ibrahim Al-Rashid', 'ibrahim@mercatonova.fr',  '$2y$10$mRXzpQhR7QiMBpQZlu8IyOfNhphIpnkC53MGWz8SvA9OM8fQK8OwG', 'vendeur'),
('Sofia Marchetti',   'sofia@mercatonova.fr',    '$2y$10$mRXzpQhR7QiMBpQZlu8IyOfNhphIpnkC53MGWz8SvA9OM8fQK8OwG', 'vendeur'),
('Lucas Bernard',     'lucas@mercatonova.fr',    '$2y$10$mRXzpQhR7QiMBpQZlu8IyOfNhphIpnkC53MGWz8SvA9OM8fQK8OwG', 'acheteur'),
('Emma Johansson',    'emma@mercatonova.fr',     '$2y$10$mRXzpQhR7QiMBpQZlu8IyOfNhphIpnkC53MGWz8SvA9OM8fQK8OwG', 'acheteur'),
('Ryo Matsuda',       'ryo@mercatonova.fr',      '$2y$10$mRXzpQhR7QiMBpQZlu8IyOfNhphIpnkC53MGWz8SvA9OM8fQK8OwG', 'acheteur'),
('Fatou Ndiaye',      'fatou@mercatonova.fr',    '$2y$10$mRXzpQhR7QiMBpQZlu8IyOfNhphIpnkC53MGWz8SvA9OM8fQK8OwG', 'acheteur'),
('Julien Moreau',     'julien@mercatonova.fr',   '$2y$10$mRXzpQhR7QiMBpQZlu8IyOfNhphIpnkC53MGWz8SvA9OM8fQK8OwG', 'acheteur'),
('Marie Fontaine',    'marie@mercatonova.fr',    '$2y$10$mRXzpQhR7QiMBpQZlu8IyOfNhphIpnkC53MGWz8SvA9OM8fQK8OwG', 'vendeur'),
('Thomas Bergstrom',  'thomas@mercatonova.fr',   '$2y$10$mRXzpQhR7QiMBpQZlu8IyOfNhphIpnkC53MGWz8SvA9OM8fQK8OwG', 'vendeur'),
('Chiara Romano',     'chiara@mercatonova.fr',   '$2y$10$mRXzpQhR7QiMBpQZlu8IyOfNhphIpnkC53MGWz8SvA9OM8fQK8OwG', 'vendeur');

-- ── 2. Produits ───────────────────────────────────────────────
-- Catégories utilisées (correspond aux filtres du catalogue) :
--   Peinture · Sculpture · Gravure · Joaillerie et accessoires
--   Mobilier d exception · Curiosites et collections · Metiers d art
-- 70 produits — 10 par catégorie minimum
--
-- Peinture       : 1  2  3  9 13 19 24 30 31 32
-- Sculpture      : 33 34 35 36 37 38  1* (id1=marbre → Sculpture)
--   * ids Sculpture originaux : 1 3 6 14 20 + nouveaux 33..37
-- Gravure        : 4  5 15 26 38 39 40 41 42 43
-- Joaillerie     : 11 17 21 27 44 45 46 47 48 49
-- Mobilier       : 50 51 52 53 54 55 56 57 58 59
-- Curiosites     : 7 12 18 22 28 60 61 62 63 64
-- Metiers d art  : 8 10 16 23 25 29 65 66 67 68
--
-- (reclassement : Bijoux→Joaillerie, Céramique→Metiers d art,
--  Photographie→Curiosites et collections, Tapis→Metiers d art)

INSERT INTO produits (vendeur_id, titre, description, prix, categorie, etat, type_vente, stock, image_url) VALUES

-- ── Peinture (ids 1..2, 9, 13, 19, 24, 30) — complété par 31..32 ──
(2, 'Buste en marbre blanc',            'Sculpture néoclassique, marbre de Carrare, 45 cm',                         1200.00, 'Sculpture',                  'bon_etat',    'achat_immediat', 1, NULL),  -- 1
(2, 'Toile abstraite — Série Feu',      'Huile sur toile, 80×60 cm, signée et datée',                                850.00, 'Peinture',                   'neuf',        'enchere',        1, NULL),  -- 2
(2, 'Statue en bronze — Danseur',       'Bronze patiné, hauteur 30 cm, édition limitée 12/50',                      3200.00, 'Sculpture',                  'bon_etat',    'negociation',    1, NULL),  -- 3
(2, 'Gravure sur bois — Forêt',         'Xylographie, tirage unique sur papier washi, encadrée',                     320.00, 'Gravure',                    'bon_etat',    'enchere',        1, NULL),  -- 4
(2, 'Estampe japonaise — Vague',        'Reproduction fidèle ukiyo-e, encre de Chine sur papier de riz',             450.00, 'Gravure',                    'bon_etat',    'enchere',        1, NULL),  -- 5
(2, 'Netsuke en ivoire sculpté',        'Figurine okimono XIXe, lapin portant une citrouille, 4 cm',                 780.00, 'Curiosites et collections',  'correct',     'achat_immediat', 1, NULL),  -- 6
(2, 'Photographie — Mont Fuji',         'Tirage argentique, format 40×50 cm, sous-verre anti-UV',                    290.00, 'Curiosites et collections',  'neuf',        'achat_immediat', 3, NULL),  -- 7
(2, 'Laque japonaise — Boîte',          'Laque urushi noire et or, motif grue, XIXe siècle',                        2200.00, 'Metiers d art',              'bon_etat',    'negociation',    1, NULL),  -- 8
(5, 'Portrait aquarelle — Lumière d\'été','Aquarelle sur papier Arches 300 g, format 30×40 cm',                      480.00, 'Peinture',                   'bon_etat',    'achat_immediat', 2, NULL),  -- 9
(5, 'Vase en céramique raku',           'Céramique raku au four à bois, glaçure mat noire, H.28 cm',                 290.00, 'Metiers d art',              'neuf',        'enchere',        1, NULL),  -- 10
(5, 'Collier en argent ciselé',         'Argent 925, motifs géométriques touareg, pièce unique',                     650.00, 'Joaillerie et accessoires',  'neuf',        'achat_immediat', 1, NULL),  -- 11
(5, 'Photographie argentique — Paris',  'Tirage baryté 24×30 cm, nuit pluvieuse Pont des Arts',                      220.00, 'Curiosites et collections',  'bon_etat',    'achat_immediat', 4, NULL),  -- 12
(5, 'Tapisserie murale — Méditerranée', 'Laine teinte naturelle, 120×80 cm, tissage main Maroc',                    1800.00, 'Peinture',                   'bon_etat',    'negociation',    1, NULL),  -- 13
(6, 'Sculpture sur verre soufflé',      'Verre de Murano bleu cobalt, pièce unique signée, H.35 cm',               1100.00, 'Sculpture',                  'neuf',        'enchere',        1, NULL),  -- 14
(6, 'Gravure sur cuivre — Venise',      'Eau-forte originale, numérotée 3/20, format 30×40 cm',                      540.00, 'Gravure',                    'bon_etat',    'achat_immediat', 2, NULL),  -- 15
(6, 'Céramique émaillée — Série Mer',   'Assiette décorative Ø 32 cm, émail turquoise mat',                          380.00, 'Metiers d art',              'neuf',        'achat_immediat', 3, NULL),  -- 16
(6, 'Bague en or 18k — Feuille de lierre','Or jaune 18 carats, diamant central 0,15 ct, taille 54',                 890.00, 'Joaillerie et accessoires',  'neuf',        'enchere',        1, NULL),  -- 17
(6, 'Photographie — Portrait de rue',   'Argentique N&B, tirage numéroté 1/10, format 50×70 cm',                     760.00, 'Curiosites et collections',  'bon_etat',    'negociation',    1, NULL),  -- 18
(7, 'Calligraphie arabe encadrée',      'Encre dorée sur parchemin, sourate Al-Fatiha, cadre bois noyer',            430.00, 'Peinture',                   'neuf',        'achat_immediat', 2, NULL),  -- 19
(7, 'Bronze — Tête de lion',            'Bronze perdu-ciré, finition patine antique, L.22 cm',                      2100.00, 'Sculpture',                  'bon_etat',    'enchere',        1, NULL),  -- 20
(7, 'Bijou en nacre et argent',         'Pendentif argent 925 serti nacre blanche, chaîne 45 cm incluse',            310.00, 'Joaillerie et accessoires',  'bon_etat',    'achat_immediat', 2, NULL),  -- 21
(7, 'Photographie — Désert au lever',   'Sahara marocain, tirage pigmentaire 60×40 cm, série 5/15',                  580.00, 'Curiosites et collections',  'neuf',        'enchere',        1, NULL),  -- 22
(7, 'Tapis à motifs berbères',          'Laine et coton, 200×140 cm, tissage plat kilim, Sud du Maroc',              950.00, 'Metiers d art',              'correct',     'achat_immediat', 1, NULL),  -- 23
(8, 'Peinture à l\'huile — Lac de Côme','Huile sur toile, 100×70 cm, paysage lacustre, XXe siècle',                2400.00, 'Peinture',                   'neuf',        'enchere',        1, NULL),  -- 24
(8, 'Mosaïque — Jardin toscan',         'Tesselles en verre de Venise, format 40×40 cm, encadrée',                  1650.00, 'Metiers d art',              'bon_etat',    'achat_immediat', 1, NULL),  -- 25
(8, 'Gravure à l\'eau-forte — Portraits','Suite de 6 portraits, tirage 8/25, format 20×28 cm chacun',               700.00, 'Gravure',                    'bon_etat',    'negociation',    1, NULL),  -- 26
(8, 'Collier en corail et perles',      'Corail rouge méditerranéen, perles Majorque, fermoir en or',               1200.00, 'Joaillerie et accessoires',  'bon_etat',    'achat_immediat', 1, NULL),  -- 27
(8, 'Photographie — Florence at Dawn',  'Tirage Fine Art, Piazzale Michelangelo, format 60×40 cm',                   340.00, 'Curiosites et collections',  'neuf',        'achat_immediat', 2, NULL),  -- 28
(8, 'Céramique Bizen — Vase rituel',    'Grès Bizen non émaillé, cuisson anagama, H.32 cm',                          890.00, 'Metiers d art',              'bon_etat',    'achat_immediat', 1, NULL),  -- 29
(8, 'Aquarelle — Vue sur l\'Arno',      'Aquarelle originale, format 50×35 cm, Florence, signée Marchetti',         1100.00, 'Peinture',                   'neuf',        'negociation',    1, NULL),  -- 30

-- ── Peinture — complément pour atteindre 10 (ids 31..32) ──────
(14,'Pastel — Coucher de soleil sur la Loire',  'Pastel sec sur papier Ingres, 50×35 cm, couleurs chaudes',           280.00, 'Peinture', 'bon_etat', 'achat_immediat', 2, NULL),  -- 31
(15,'Acrylique — Série Bleu nuit',              'Acrylique sur toile 80×60 cm, palette nocturne urbaine, signée',     650.00, 'Peinture', 'neuf',     'achat_immediat', 1, NULL),  -- 32

-- ── Sculpture — 5 existants (1 3 6 14 20) + 5 nouveaux (33..37) ─
(16,'Huile sur toile — Village en Provence',    'Huile sur toile, 100×80 cm, village médiéval, signée',             1500.00, 'Peinture',   'bon_etat', 'enchere',        1, NULL),  -- 33
(5, 'Tempera sur bois — Scène antique',         'Tempera à l\'œuf, fond or, iconographie grecque, 25×35 cm',         420.00, 'Peinture',   'correct',  'negociation',    1, NULL),  -- 34
(14,'Buste en terre cuite — Femme voilée',      'Terre cuite patinée, technique néoclassique, hauteur 38 cm',        890.00, 'Sculpture',  'bon_etat', 'achat_immediat', 1, NULL),  -- 35
(15,'Sculpture en bois flotté — Oiseau',        'Bois flotté de mer travaillé, pièce unique, hauteur 45 cm',         340.00, 'Sculpture',  'neuf',     'achat_immediat', 1, NULL),  -- 36
(16,'Résine coulée — Forme abstraite',          'Résine époxy transparente avec inclusions métalliques, 25 cm',      450.00, 'Sculpture',  'neuf',     'enchere',        1, NULL),  -- 37
(2, 'Pierre de lave sculptée — Masque',         'Basalte noir poli, inspiration masque yoruba, hauteur 22 cm',       720.00, 'Sculpture',  'correct',  'achat_immediat', 1, NULL),  -- 38
(6, 'Acier soudé — Silhouette en mouvement',    'Acier brut soudé et ciré, 40×60 cm, pièce unique',                  580.00, 'Sculpture',  'neuf',     'negociation',    1, NULL),  -- 39

-- ── Gravure — 4 existants (4 5 15 26) + 6 nouveaux (40..45) ─────
(14,'Lithographie originale — Jazz à New York', 'Lithographie sur pierre, numérotée 7/30, 50×70 cm',                 380.00, 'Gravure',    'bon_etat', 'achat_immediat', 1, NULL),  -- 40
(15,'Sérigraphie — Composition florale',        'Sérigraphie 4 couleurs, numérotée 12/25, 60×80 cm',                 250.00, 'Gravure',    'neuf',     'enchere',        1, NULL),  -- 41
(16,'Pointe sèche — Paysage breton',            'Pointe sèche sur zinc, numérotée 2/15, 25×35 cm',                   310.00, 'Gravure',    'bon_etat', 'achat_immediat', 1, NULL),  -- 42
(7, 'Aquatinte — Vue de Barcelone',             'Aquatinte rehaussée aquarelle, numérotée 5/20, 30×40 cm',           420.00, 'Gravure',    'bon_etat', 'achat_immediat', 1, NULL),  -- 43
(8, 'Monotype — Forêt en automne',              'Monotype huile sur verre, tirage unique, 40×50 cm',                 290.00, 'Gravure',    'neuf',     'achat_immediat', 1, NULL),  -- 44
(14,'Linogravure — Portrait d\'artiste',        'Linogravure en noir sur papier Japon, numérotée 1/10',              180.00, 'Gravure',    'neuf',     'negociation',    1, NULL),  -- 45

-- ── Joaillerie et accessoires — 4 existants + 6 nouveaux (46..51) ─
(5, 'Bracelet jonc en or 18k',                  'Or jaune 18 carats, section ronde, diamètre intérieur 60 mm',       800.00, 'Joaillerie et accessoires', 'neuf',     'enchere',        1, NULL),  -- 46
(6, 'Boucles d\'oreilles améthyste',            'Argent 925, améthyste naturelle 8×6 mm, finition rhodiée',          220.00, 'Joaillerie et accessoires', 'neuf',     'achat_immediat', 3, NULL),  -- 47
(15,'Montre de gousset XIXe',                   'Boîtier argent ciselé, mouvement mécanique révisé, chaîne incluse', 480.00, 'Joaillerie et accessoires', 'correct',  'achat_immediat', 1, NULL),  -- 48
(16,'Broche Art Déco en émail cloisonné',       'Chrysocole et lapis-lazuli, motif paon, or doublé',                 340.00, 'Joaillerie et accessoires', 'bon_etat', 'achat_immediat', 1, NULL),  -- 49
(7, 'Parure collier et bracelet — perles',      'Perles de culture baroques, fermoir or blanc, longueur 45 cm',      560.00, 'Joaillerie et accessoires', 'bon_etat', 'achat_immediat', 1, NULL),  -- 50
(8, 'Chevalière en argent massif gravée',       'Argent 925, gravure initiales incluse, taille à commander',         190.00, 'Joaillerie et accessoires', 'neuf',     'negociation',    5, NULL),  -- 51

-- ── Mobilier d exception — 10 nouveaux (52..61) ───────────────────
(14,'Table basse en chêne massif sculpté',      'Chêne massif, piètement sculpté style Renaissance, 120×60 cm',    1200.00, 'Mobilier d exception', 'bon_etat', 'enchere',        1, NULL),  -- 52
(15,'Fauteuil Louis XVI bois doré',             'Bois hêtre doré, garniture soie ivoire, style XVIIIe',            2800.00, 'Mobilier d exception', 'correct',  'achat_immediat', 2, NULL),  -- 53
(16,'Armoire alsacienne peinte XIXe',           'Pin massif, décor peint floral, quincaillerie d\'époque, H.180 cm',3500.00, 'Mobilier d exception', 'correct',  'achat_immediat', 1, NULL),  -- 54
(14,'Secrétaire en marqueterie Louis XV',       'Bois de rose et citronnier, dessus cuir, quatre tiroirs',         4200.00, 'Mobilier d exception', 'bon_etat', 'negociation',    1, NULL),  -- 55
(15,'Commode Empire en acajou',                 'Acajou massif, bronzes dorés, marbre blanc, trois tiroirs',       1800.00, 'Mobilier d exception', 'bon_etat', 'enchere',        1, NULL),  -- 56
(16,'Bureau ministre cuir bordeaux',            'Acajou, cuir bordeaux estampé, neuf tiroirs, XIXe siècle',       2200.00, 'Mobilier d exception', 'bon_etat', 'achat_immediat', 1, NULL),  -- 57
(14,'Miroir doré baroque — H.120 cm',           'Bois sculpté et doré à la feuille d\'or, H.120 × L.80 cm',        950.00, 'Mobilier d exception', 'bon_etat', 'achat_immediat', 1, NULL),  -- 58
(15,'Lustre en cristal de Bohême',              'Cristal taillé, monture bronze doré, 12 bras de lumière',        1650.00, 'Mobilier d exception', 'bon_etat', 'achat_immediat', 1, NULL),  -- 59
(16,'Chaise longue Art Nouveau',                'Hêtre courbé, cannage paille, style Thonet viennois',              880.00, 'Mobilier d exception', 'correct',  'achat_immediat', 1, NULL),  -- 60
(7, 'Console en marbre et bronze doré',         'Marbre blanc veiné, supports bronze patiné, époque Empire',      2600.00, 'Mobilier d exception', 'bon_etat', 'enchere',        1, NULL),  -- 61

-- ── Curiosites et collections — 5 existants + 5 nouveaux (62..66) ─
(15,'Appareil photo Leica M3 vintage',          'Leica M3 chromé, objectif Summicron 50mm f/2, révisé',           1800.00, 'Curiosites et collections', 'bon_etat', 'enchere',        1, NULL),  -- 62
(2, 'Collection cartes postales — Paris 1900',  '50 cartes originales Belle Époque, sous pochettes de protection',  280.00, 'Curiosites et collections', 'correct',  'negociation',    1, NULL),  -- 63
(16,'Globe terrestre XIXe en laiton',           'Globe XIXe, méridien laiton, socle bois tourné, D.30 cm',         740.00, 'Curiosites et collections', 'correct',  'achat_immediat', 1, NULL),  -- 64
(14,'Boîte à musique mécanique XIXe',           'Cartel en loupe de noyer, 4 airs, cylindre acier gravé',          520.00, 'Curiosites et collections', 'bon_etat', 'achat_immediat', 1, NULL),  -- 65
(5, 'Astrolabe en bronze — reproduction XIVe',  'Laiton coulé et gravé, graduation 360°, D.24 cm',                 390.00, 'Curiosites et collections', 'neuf',     'achat_immediat', 2, NULL),  -- 66

-- ── Metiers d art — 6 existants + 4 nouveaux (67..70) ─────────────
(6, 'Vitrail artisanal — Iris et genêts',       'Verre soufflé coloré, soudure plomb, format 40×60 cm',            680.00, 'Metiers d art', 'neuf',     'enchere',        1, NULL),  -- 67
(8, 'Dentelle au fuseau — Napperon XIXe',       'Lin blanc, point de Bruges, D.35 cm, état exceptionnel',          210.00, 'Metiers d art', 'correct',  'achat_immediat', 1, NULL),  -- 68
(14,'Broderie sur soie — Jardin impérial',      'Soie naturelle, fils d\'or, cadre bois laqué, 30×40 cm',          450.00, 'Metiers d art', 'bon_etat', 'achat_immediat', 1, NULL),  -- 69
(15,'Faïence peinte main — Service 6 pièces',   'Argile locale, décor floral peint main, six assiettes',           380.00, 'Metiers d art', 'neuf',     'negociation',    6, NULL);  -- 70

-- ── 3. Enchères ───────────────────────────────────────────────
-- Existantes (prods 2 4 5 10 14 17 20 22 24 29) + nouvelles (33 37 41 46 52 56 61 62 67)
INSERT INTO encheres (produit_id, prix_depart, meilleure_offre, meilleur_encherisseur_id, etat, date_debut, date_fin) VALUES
-- existantes
(2,  850.00,  980.00, 4,  'en_cours',   DATE_SUB(NOW(), INTERVAL 3 DAY),  DATE_ADD(NOW(), INTERVAL 2 DAY)),   -- enc 1
(5,  350.00,  520.00, 9,  'en_cours',   DATE_SUB(NOW(), INTERVAL 1 DAY),  DATE_ADD(NOW(), INTERVAL 5 DAY)),   -- enc 2
(14, 900.00, 1250.00, 11, 'en_cours',   DATE_SUB(NOW(), INTERVAL 2 DAY),  DATE_ADD(NOW(), INTERVAL 3 DAY)),   -- enc 3
(17, 890.00, 1100.00, 12, 'en_cours',   DATE_SUB(NOW(), INTERVAL 4 DAY),  DATE_ADD(NOW(), INTERVAL 4 DAY)),   -- enc 4
(22, 500.00,  780.00, 13, 'en_cours',   DATE_SUB(NOW(), INTERVAL 2 DAY),  DATE_ADD(NOW(), INTERVAL 6 DAY)),   -- enc 5
(24,2000.00, 2600.00, 10, 'en_cours',   DATE_SUB(NOW(), INTERVAL 1 DAY),  DATE_ADD(NOW(), INTERVAL 1 DAY)),   -- enc 6
(4,  200.00,  320.00, 3,  'terminee',   DATE_SUB(NOW(), INTERVAL 5 DAY),  DATE_SUB(NOW(), INTERVAL 1 DAY)),   -- enc 7
(20,1500.00, 2200.00, 3,  'terminee',   DATE_SUB(NOW(), INTERVAL 7 DAY),  DATE_SUB(NOW(), INTERVAL 2 DAY)),   -- enc 8
(10, 250.00,  NULL,   NULL,'en_attente',DATE_ADD(NOW(), INTERVAL 1 DAY),  DATE_ADD(NOW(), INTERVAL 8 DAY)),   -- enc 9
(29, 750.00,  NULL,   NULL,'en_attente',DATE_ADD(NOW(), INTERVAL 2 DAY),  DATE_ADD(NOW(), INTERVAL 10 DAY)),  -- enc 10
-- nouvelles
(33,1200.00, 1450.00, 9,  'en_cours',   DATE_SUB(NOW(), INTERVAL 1 DAY),  DATE_ADD(NOW(), INTERVAL 3 DAY)),   -- enc 11 Huile Provence
(37, 380.00,  520.00, 10, 'en_cours',   DATE_SUB(NOW(), INTERVAL 2 DAY),  DATE_ADD(NOW(), INTERVAL 4 DAY)),   -- enc 12 Résine abstraite
(41, 200.00,  310.00, 11, 'en_cours',   DATE_SUB(NOW(), INTERVAL 1 DAY),  DATE_ADD(NOW(), INTERVAL 5 DAY)),   -- enc 13 Sérigraphie
(46, 700.00,  920.00, 3,  'en_cours',   DATE_SUB(NOW(), INTERVAL 3 DAY),  DATE_ADD(NOW(), INTERVAL 2 DAY)),   -- enc 14 Bracelet jonc
(52, 900.00, 1100.00, 12, 'en_cours',   DATE_SUB(NOW(), INTERVAL 2 DAY),  DATE_ADD(NOW(), INTERVAL 3 DAY)),   -- enc 15 Table basse
(56,1500.00, 1900.00, 13, 'terminee',   DATE_SUB(NOW(), INTERVAL 6 DAY),  DATE_SUB(NOW(), INTERVAL 1 DAY)),   -- enc 16 Commode Empire
(61,2200.00,  NULL,   NULL,'en_attente',DATE_ADD(NOW(), INTERVAL 1 DAY),  DATE_ADD(NOW(), INTERVAL 7 DAY)),   -- enc 17 Console marbre
(62,1400.00, 1750.00, 4,  'en_cours',   DATE_SUB(NOW(), INTERVAL 2 DAY),  DATE_ADD(NOW(), INTERVAL 2 DAY)),   -- enc 18 Leica M3
(67, 550.00,  720.00, 9,  'en_cours',   DATE_SUB(NOW(), INTERVAL 1 DAY),  DATE_ADD(NOW(), INTERVAL 4 DAY));   -- enc 19 Vitrail

-- ── 4. Offres enchères ────────────────────────────────────────
INSERT INTO offres_encheres (enchere_id, utilisateur_id, montant) VALUES
-- enc 1 — Toile Série Feu
(1, 3, 900.00), (1, 4, 980.00),
-- enc 2 — Estampe Vague
(2, 11, 400.00), (2, 9, 450.00), (2, 11, 490.00), (2, 9, 520.00),
-- enc 3 — Sculpture verre soufflé
(3, 9, 950.00), (3, 11, 1050.00), (3, 9, 1150.00), (3, 11, 1250.00),
-- enc 4 — Bague or 18k
(4, 3, 950.00), (4, 12, 1100.00),
-- enc 5 — Photo Désert
(5, 9, 550.00), (5, 13, 650.00), (5, 9, 720.00), (5, 13, 780.00),
-- enc 6 — Peinture Lac de Côme
(6, 11, 2100.00), (6, 10, 2300.00), (6, 11, 2450.00), (6, 10, 2600.00),
-- enc 7 — Gravure bois Forêt (terminée)
(7, 3, 320.00),
-- enc 8 — Bronze Tête de lion (terminée)
(8, 4, 1600.00), (8, 9, 1800.00), (8, 3, 2000.00), (8, 4, 2100.00), (8, 3, 2200.00),
-- enc 11 — Huile Provence
(11, 4, 1250.00), (11, 9, 1350.00), (11, 4, 1400.00), (11, 9, 1450.00),
-- enc 12 — Résine abstraite
(12, 13, 400.00), (12, 10, 480.00), (12, 13, 510.00), (12, 10, 520.00),
-- enc 13 — Sérigraphie
(13, 3, 230.00), (13, 11, 270.00), (13, 3, 295.00), (13, 11, 310.00),
-- enc 14 — Bracelet jonc
(14, 4, 750.00), (14, 3, 840.00), (14, 4, 880.00), (14, 3, 920.00),
-- enc 15 — Table basse
(15, 9, 950.00), (15, 12, 1020.00), (15, 9, 1070.00), (15, 12, 1100.00),
-- enc 16 — Commode Empire (terminée)
(16, 11, 1550.00), (16, 13, 1700.00), (16, 11, 1820.00), (16, 13, 1900.00),
-- enc 18 — Leica M3
(18, 3, 1450.00), (18, 4, 1600.00), (18, 3, 1680.00), (18, 4, 1750.00),
-- enc 19 — Vitrail
(19, 4, 580.00), (19, 9, 650.00), (19, 4, 690.00), (19, 9, 720.00);

-- ── 5. Négociations ──────────────────────────────────────────
INSERT INTO negociations (produit_id, acheteur_id, vendeur_id, etat, derniere_offre, dernier_acteur) VALUES
(3,  3,  2, 'contre_offre', 3000.00, 'vendeur'),   -- neg 1 : Danseur (Yumi ↔ Kudo)
(13, 9,  5, 'en_attente',   1600.00, 'acheteur'),  -- neg 2 : Tapisserie (Lucas ↔ Amara)
(18, 10, 6, 'contre_offre',  700.00, 'vendeur'),   -- neg 3 : Photo rue (Emma ↔ Camille)
(26, 12, 8, 'accepte',       640.00, 'vendeur'),   -- neg 4 : Gravure eau-forte (Fatou ↔ Sofia)
(8,  11, 2, 'refuse',       1900.00, 'vendeur'),   -- neg 5 : Laque (Ryo ↔ Kudo)
(30, 13, 8, 'en_attente',    900.00, 'acheteur');  -- neg 6 : Aquarelle Arno (Julien ↔ Sofia)

-- ── 6. Échanges négociation ──────────────────────────────────
INSERT INTO echanges_negociation (negociation_id, auteur, montant, message) VALUES
(1, 'acheteur', 2800.00, 'Je vous propose 2800€ pour le bronze, belle pièce'),
(1, 'vendeur',  3000.00, 'Prix minimum 3000€, édition limitée 12/50, très rare'),
(2, 'acheteur', 1600.00, 'Bonjour, je propose 1600€ pour la tapisserie — livraison possible ?'),
(3, 'acheteur',  630.00, 'Je propose 630€ pour la photographie, tirage N&B magnifique'),
(3, 'vendeur',   700.00, 'Je peux descendre à 700€, c\'est mon dernier prix sur ce tirage'),
(4, 'acheteur',  580.00, '580€, est-ce possible pour la suite de gravures ?'),
(4, 'vendeur',   680.00, 'Minimum 680€ pour les 6 gravures, travail de plusieurs semaines'),
(4, 'acheteur',  640.00, '640€, on fait affaire ?'),
(4, 'vendeur',   640.00, 'D\'accord pour 640€ — marché conclu, je vous envoie les détails'),
(5, 'acheteur', 1700.00, '1700€ pour la laque urushi, c\'est un beau geste'),
(5, 'vendeur',  2200.00, 'La laque est cataloguée à 2200€, prix ferme pour une pièce XIXe'),
(5, 'acheteur', 1900.00, 'Dernier geste de ma part, 1900€'),
(5, 'vendeur',  1900.00, 'Offre refusée — nous ne descendrons pas en dessous de 2000€'),
(6, 'acheteur',  900.00, '900€ pour l\'aquarelle, qu\'en pensez-vous ?');

-- ── 7. Notifications ─────────────────────────────────────────
INSERT INTO notifications (utilisateur_id, type, message, lu) VALUES
(2,  'negociation_nouvelle',  'Nouvelle négociation reçue pour « Statue en bronze — Danseur »', 0),
(2,  'enchere_offre_recue',   'Nouvelle offre de 980€ sur « Toile abstraite — Série Feu »', 1),
(3,  'negociation_reponse',   'Contre-offre reçue pour « Statue en bronze — Danseur » : 3 000€', 0),
(3,  'enchere_surencheris',   'Vous avez été surenchéri sur « Toile abstraite — Série Feu »', 1),
(3,  'enchere_gagnee',        'Vous avez remporté « Bronze — Tête de lion » avec 2 200€', 0),
(4,  'enchere_gagnee',        'Vous menez l enchère sur « Toile abstraite — Série Feu » avec 980€', 0),
(9,  'enchere_gagnee',        'Vous menez l enchère sur « Estampe japonaise — Vague » avec 520€', 0),
(9,  'enchere_surencheris',   'Vous avez été surenchéri sur « Sculpture sur verre soufflé »', 0),
(10, 'negociation_reponse',   'Contre-offre reçue pour « Photographie — Portrait de rue » : 700€', 0),
(10, 'enchere_gagnee',        'Vous menez l enchère sur « Peinture — Lac de Côme » avec 2 600€', 0),
(11, 'enchere_gagnee',        'Vous menez l enchère sur « Sculpture sur verre soufflé » avec 1 250€', 0),
(11, 'negociation_reponse',   'Offre refusée pour « Laque japonaise — Boîte »', 1),
(12, 'negociation_acceptee',  'Offre acceptée pour « Gravure à l eau-forte » à 640€', 0),
(12, 'enchere_gagnee',        'Vous menez l enchère sur « Table basse en chêne » avec 1 100€', 0),
(13, 'enchere_gagnee',        'Vous menez l enchère sur « Commode Empire » avec 1 900€', 0),
(13, 'negociation_nouvelle',  'Négociation initiée pour « Aquarelle — Vue sur l Arno »', 1),
(4,  'enchere_gagnee',        'Vous menez l enchère sur « Leica M3 vintage » avec 1 750€', 0),
(9,  'enchere_gagnee',        'Vous menez l enchère sur « Vitrail artisanal » avec 720€', 0);

-- ── 8. Images produits (Picsum Photos, stables par seed) ─────
UPDATE produits SET image_url = CONCAT('https://picsum.photos/seed/mn', id, '/600/400');

-- ── 9. Panier ────────────────────────────────────────────────
INSERT INTO panier (utilisateur_id, produit_id, quantite) VALUES
(4,  1,  1),   -- Lena : buste en marbre
(9,  15, 1),   -- Lucas : gravure Venise
(10, 11, 1),   -- Emma : collier argent
(12, 16, 2),   -- Fatou : 2 céramiques Série Mer
(3,  53, 1),   -- Yumi : fauteuil Louis XVI
(11, 58, 1);   -- Ryo : miroir doré

-- ── 10. Commandes ────────────────────────────────────────────
INSERT INTO commandes (utilisateur_id, total, statut, moyen_paiement) VALUES
(3,  320.00,  'payee', 'carte'),
(4,  1200.00, 'payee', 'carte'),
(9,  540.00,  'payee', 'paypal'),
(11, 430.00,  'payee', 'carte'),
(3,  220.00,  'payee', 'virement');

INSERT INTO commande_items (commande_id, produit_id, quantite, prix_unitaire) VALUES
(1, 4,  1, 320.00),
(2, 1,  1, 1200.00),
(3, 15, 1, 540.00),
(4, 19, 1, 430.00),
(5, 12, 1, 220.00);
