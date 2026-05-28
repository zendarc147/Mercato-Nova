-- ============================================================
-- seed.sql — Mercato Nova
-- Données de test cohérentes avec le schéma
-- ============================================================

 
USE mercato_nova;
 
INSERT INTO users (name, email, password, role, statut_vendeur) VALUES
('Nova Elio', 'elio@mercatonova.fr', 'nomorelove', 'admin', NULL),
('Kudo Shinichi', 'shinichi@mercatonova.fr', 'pasmoidutout', 'vendeur', 'valide'),
('Tanaka Yumi', 'yumi@mercatonova.fr', 'nonmerci', 'acheteur', NULL),
('Penatelo Lena', 'lena@mercatonova.fr', 'jenesaispas', 'acheteur', NULL);
 
INSERT INTO produits (vendeur_id, titre, description, prix, categorie, etat, type_vente, stock, image_url) VALUES
(2, 'Buste en marbre blanc', 'Sculpture néoclassique, marbre de Carrare, 45cm', 1200.00, 'Sculpture', 'bon_etat', 'achat_immediat', 1, 'buste.jpg'),
(2, 'Toile abstraite — Série Feu', 'Huile sur toile, 80x60cm, signée', 850.00, 'Peinture', 'neuf', 'enchere', 1, 'toile_feu.jpg'),
(2, 'Statue en bronze — Danseur', 'Bronze patiné, hauteur 30cm, édition limitée 12/50', 3200.00, 'Sculpture', 'bon_etat', 'negociation', 1, 'danseur.jpg'),
(2, 'Gravure sur bois — Forêt', 'Technique xylographie, tirage unique, encadrée', 320.00, 'Gravure', 'bon_etat', 'achat_immediat', 2, 'gravure.jpg');
 
INSERT INTO encheres (produit_id, prix_depart, meilleure_offre, meilleur_encherisseur_id, etat, date_fin) VALUES
(2, 850.00, 980.00, 4, 'en_cours', DATE_ADD(NOW(), INTERVAL 2 DAY)),
(4, 200.00, 320.00, 3, 'terminee', DATE_SUB(NOW(), INTERVAL 1 DAY));
 
INSERT INTO offres_encheres (enchere_id, utilisateur_id, montant) VALUES
(1, 3, 900.00),
(1, 4, 980.00),
(2, 3, 320.00);
 
INSERT INTO negociations (produit_id, acheteur_id, vendeur_id, etat, derniere_offre, dernier_acteur) VALUES
(3, 3, 2, 'contre_offre', 3000.00, 'vendeur');
 
INSERT INTO echanges_negociation (negociation_id, auteur, montant, message) VALUES
(1, 'acheteur', 2800.00, 'Je vous propose 2800€ pour le bronze'),
(1, 'vendeur', 3000.00, 'Prix minimum 3000€, pièce rare');
 
INSERT INTO notifications (utilisateur_id, type, message, lu) VALUES
(2, 'negociation_nouvelle', 'Nouvelle négociation reçue pour « Statue en bronze — Danseur »', 0),
(3, 'negociation_reponse', 'Contre-offre reçue pour « Statue en bronze — Danseur » : 3000€', 0),
(3, 'enchere_surencheris', 'Vous avez été surenchéri sur « Toile abstraite — Série Feu » (980€)', 0),
(4, 'enchere_gagnee', 'Vous menez l enchère sur « Toile abstraite — Série Feu » avec 980€', 0),
(3, 'commande', 'Félicitations, vous avez remporté « Gravure sur bois — Forêt »', 1);
 
INSERT INTO panier (utilisateur_id, produit_id, quantite) VALUES
(4, 1, 1);
 
INSERT INTO commandes (utilisateur_id, total, statut, moyen_paiement) VALUES
(3, 320.00, 'payee', 'carte'),
(4, 1200.00, 'payee', 'carte');

INSERT INTO commande_items (commande_id, produit_id, quantite, prix_unitaire) VALUES
(1, 4, 1, 320.00),
(2, 1, 1, 1200.00);
