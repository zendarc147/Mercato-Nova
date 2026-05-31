-- Mercato Nova — schéma BDD
-- Géré par Agnes (issue #6). Ce fichier est un point de départ minimal.

CREATE DATABASE IF NOT EXISTS mercato_nova
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mercato_nova;

CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100)                        NOT NULL,
  email       VARCHAR(255)                        NOT NULL UNIQUE,
  password    VARCHAR(255)                        NOT NULL,
  role        ENUM('acheteur','vendeur','admin')  NOT NULL DEFAULT 'acheteur',
  statut      ENUM('actif','suspendu','banni')    NOT NULL DEFAULT 'actif',
  preferences VARCHAR(500)                        DEFAULT NULL,
  created_at  TIMESTAMP                           NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
-- Si la table existe déjà :
-- ALTER TABLE users ADD COLUMN preferences VARCHAR(500) DEFAULT NULL;
-- ALTER TABLE users ADD COLUMN statut ENUM('actif','suspendu','banni') NOT NULL DEFAULT 'actif';

CREATE TABLE IF NOT EXISTS produits (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  vendeur_id  INT UNSIGNED                                                    NOT NULL,
  titre       VARCHAR(255)                                                    NOT NULL,
  description TEXT,
  prix        DECIMAL(10,2)                                                   NOT NULL,
  categorie   VARCHAR(100),
  etat        ENUM('neuf','bon_etat','correct','mauvais_etat')               NOT NULL DEFAULT 'bon_etat',
  type_vente  ENUM('achat_immediat','enchere','negociation')                 NOT NULL DEFAULT 'achat_immediat',
  stock       INT UNSIGNED                                                    NOT NULL DEFAULT 1,
  image_url   VARCHAR(500),
  created_at  TIMESTAMP                                                       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vendeur_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS encheres (
  id                       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  produit_id               INT UNSIGNED                                              NOT NULL UNIQUE,
  prix_depart              DECIMAL(10,2)                                             NOT NULL,
  meilleure_offre          DECIMAL(10,2)                                             DEFAULT NULL,
  meilleur_encherisseur_id INT UNSIGNED                                              DEFAULT NULL,
  etat                     ENUM('en_attente','en_cours','terminee','annulee')        NOT NULL DEFAULT 'en_attente',
  date_debut               TIMESTAMP                                                 NULL DEFAULT NULL,
  date_fin                 TIMESTAMP                                                 NOT NULL,
  created_at               TIMESTAMP                                                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produit_id)               REFERENCES produits(id) ON DELETE CASCADE,
  FOREIGN KEY (meilleur_encherisseur_id) REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS offres_encheres (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  enchere_id     INT UNSIGNED  NOT NULL,
  utilisateur_id INT UNSIGNED  NOT NULL,
  montant        DECIMAL(10,2) NOT NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (enchere_id)     REFERENCES encheres(id) ON DELETE CASCADE,
  FOREIGN KEY (utilisateur_id) REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT UNSIGNED  NOT NULL,
  type           VARCHAR(100)  NOT NULL,
  message        TEXT          NOT NULL,
  lu             TINYINT(1)    NOT NULL DEFAULT 0,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS negociations (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  produit_id      INT UNSIGNED                                                    NOT NULL,
  acheteur_id     INT UNSIGNED                                                    NOT NULL,
  vendeur_id      INT UNSIGNED                                                    NOT NULL,
  etat            ENUM('en_attente','contre_offre','accepte','refuse','expire')   NOT NULL DEFAULT 'en_attente',
  derniere_offre  DECIMAL(10,2)                                                   NOT NULL,
  dernier_acteur  ENUM('acheteur','vendeur')                                      NOT NULL DEFAULT 'acheteur',
  expires_at      TIMESTAMP                                                        NULL DEFAULT NULL,
  created_at      TIMESTAMP                                                        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP                                                        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (produit_id)  REFERENCES produits(id) ON DELETE CASCADE,
  FOREIGN KEY (acheteur_id) REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (vendeur_id)  REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS echanges_negociation (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  negociation_id  INT UNSIGNED              NOT NULL,
  auteur          ENUM('acheteur','vendeur') NOT NULL,
  montant         DECIMAL(10,2)             NOT NULL,
  message         TEXT,
  created_at      TIMESTAMP                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (negociation_id) REFERENCES negociations(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS panier (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT UNSIGNED  NOT NULL,
  produit_id     INT UNSIGNED  NOT NULL,
  quantite       INT UNSIGNED  NOT NULL DEFAULT 1,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_panier (utilisateur_id, produit_id),
  FOREIGN KEY (utilisateur_id) REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (produit_id)     REFERENCES produits(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS commandes (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT UNSIGNED                          NOT NULL,
  total          DECIMAL(10,2)                         NOT NULL,
  statut         ENUM('payee','annulee','remboursee')  NOT NULL DEFAULT 'payee',
  moyen_paiement ENUM('carte','paypal','virement')     NOT NULL,
  created_at     TIMESTAMP                             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS commande_items (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  commande_id    INT UNSIGNED  NOT NULL,
  produit_id     INT UNSIGNED  NOT NULL,
  quantite       INT UNSIGNED  NOT NULL,
  prix_unitaire  DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (commande_id) REFERENCES commandes(id) ON DELETE CASCADE,
  FOREIGN KEY (produit_id)  REFERENCES produits(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS demandes_vendeur (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED  NOT NULL UNIQUE,
  nom_boutique   VARCHAR(255)  NOT NULL,
  description    TEXT          NOT NULL,
  categories     VARCHAR(500)  DEFAULT NULL,
  experience     VARCHAR(50)   NOT NULL,
  site_web       VARCHAR(500)  DEFAULT NULL,
  telephone      VARCHAR(30)   DEFAULT NULL,
  motivation     TEXT          NOT NULL,
  etat           ENUM('en_attente','approuve','refuse') NOT NULL DEFAULT 'en_attente',
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
