-- Mercato Nova — schéma BDD
-- Géré par Agnes (issue #6). Ce fichier est un point de départ minimal.

CREATE DATABASE IF NOT EXISTS mercato_nova
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE mercato_nova;

CREATE TABLE IF NOT EXISTS users (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)                        NOT NULL,
  email      VARCHAR(255)                        NOT NULL UNIQUE,
  password   VARCHAR(255)                        NOT NULL,
  role       ENUM('acheteur','vendeur','admin')  NOT NULL DEFAULT 'acheteur',
  created_at TIMESTAMP                           NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
