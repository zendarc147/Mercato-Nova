# Mercato Nova — Contexte projet

Plateforme e-commerce web dynamique développée dans le cadre du module Web dynamique ING2 à l'ECE Paris.

## Deadlines

- **Livrable 1** (conception) : Jeudi 28 mai 2026 à 23h55
- **Livrable 2** (projet final) : Dimanche 31 mai 2026 à 23h55

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | PHP 8 (API REST, pas de framework) |
| Base de données | MySQL |
| Auth | Sessions PHP + PDO prepared statements |
| Temps réel (enchères) | Polling toutes les 3 secondes |

Architecture client-serveur stricte : React appelle l'API PHP via fetch, PHP interroge MySQL.

## Equipe

| Personne | Role | GitHub |
|----------|------|--------|
| Max | Tech Lead — setup, auth, enchères, négociation, review | zendarc147 |
| Astrid | Frontend React — toutes les pages, wireframes | AstrithrDevalai |
| Lily | Backend PHP — endpoints API, validation, sécurité | lilymad |
| Agnes | BDD + Docs — schéma SQL, PowerPoint, rapport IA | Lijoh07 |

## Fonctionnalités

1. Gestion des utilisateurs (rôles : acheteur / vendeur / admin)
2. Catalogue avec recherche et filtres
3. Achat immédiat
4. Vente par enchère (états : en_attente / en_cours / terminee / annulee)
5. Vente par négociation (états : en_attente / contre_offre / accepte / refuse / expire)
6. Notifications
7. Panier et validation des transactions (paiement simulé)

## Structure du projet

```
Mercato-Nova/
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── api/       # appels fetch vers le backend
├── backend/           # PHP API REST
│   ├── api/
│   ├── controllers/
│   ├── models/
│   └── config/
│       └── database.php
├── database/
│   ├── schema.sql     # CREATE TABLE
│   └── seed.sql       # données de test
└── CLAUDE.md
```

## Règles de développement

- PDO + prepared statements obligatoire sur toutes les requêtes SQL
- Hashage des mots de passe avec password_hash() / password_verify()
- Validation des inputs côté serveur sur tous les endpoints
- Token CSRF sur toutes les requêtes POST/PUT/DELETE
- Toutes les réponses API en JSON avec le bon code HTTP
- Variables sensibles dans un fichier .env (jamais committé)
- Commits réguliers et significatifs — pas de commit massif à la fin

## Repo GitHub

https://github.com/zendarc147/Mercato-Nova

Issues et Kanban : onglet Projects du repo GitHub
Suivi des tâches Notion : https://www.notion.so/36b12f0b77b381f38052c26136170863

---

## Instructions pour le nouveau chat

Dès l'ouverture d'une nouvelle conversation, **attaque directement la prochaine tâche non cochée** dans la liste ci-dessous — sans demander confirmation.

### Procédure à suivre pour chaque issue

1. **Checkout depuis `dev`** : `git checkout dev && git pull && git checkout -b feature/<numéro>-<slug>`
2. **Faire le travail** (code, fichiers, etc.)
3. **Commit** avec un message clair : `feat: <description> (issue #<numéro>)`
4. **Push** : `git push -u origin feature/<numéro>-<slug>`
5. **Ouvrir une PR vers `dev`** avec `& "C:\Program Files\GitHub CLI\gh.exe" pr create ...`
6. **Cocher la case** dans cette liste dans le CLAUDE.md et commiter le changement

> `gh` se trouve à `C:\Program Files\GitHub CLI\gh.exe` — toujours utiliser le chemin complet.
> Référence API : voir [API.md](API.md) pour tous les endpoints REST.

---

## Guide de test des fonctionnalités

### Environnement requis

- **MAMP** lancé (Apache + MySQL), Document Root → `C:\Users\tanur\OneDrive\Documents\GitHub`
- **Postman** ouvert avec un environnement `Mercato Nova` et la variable `csrf_token`
- Base URL : `http://localhost/Mercato-Nova/backend/api`

Sur la requête `POST /auth/login.php`, onglet **Tests** de Postman :
```javascript
var data = pm.response.json();
pm.environment.set("csrf_token", data.csrf_token);
```
Toutes les requêtes POST protégées incluent le header : `X-CSRF-Token: {{csrf_token}}`

### Setup BDD (une seule fois)

`http://localhost/phpmyadmin` → Importer → `database/schema.sql` → Exécuter

### Tests #9 #10 — Auth + Sessions

| Requête | Body | Résultat attendu |
|---------|------|-----------------|
| `POST /auth/register.php` | `{ "nom", "prenom", "email", "mot_de_passe", "role": "acheteur" }` | 201 + `{ success: true, message, user }` |
| `POST /auth/register.php` (même email) | idem | 409 "Email déjà utilisé" |
| `POST /auth/login.php` | `{ "email", "mot_de_passe" }` | 200 + `{ success: true, user, csrf_token }` |
| `POST /auth/login.php` | mauvais mot de passe | 401 |
| `GET /auth/me.php` | — | 200 + infos user (session active) |
| `POST /auth/logout.php` | — (CSRF requis) | 200 |
| `GET /auth/me.php` après logout | — | 401 (session détruite) |

> Register et Login ne demandent **pas** de CSRF token — l'utilisateur n'a pas encore de session.
> Après login, le `csrf_token` retourné dans la réponse est à utiliser pour toutes les requêtes suivantes.

### Tests #11 — Rôles

| Requête | Condition | Résultat attendu |
|---------|-----------|-----------------|
| `GET /admin/users.php` | connecté en acheteur | 403 |
| `GET /admin/users.php` | après `UPDATE users SET role='admin' WHERE email='...'` + reconnexion | 200 + liste users |

> Après un changement de rôle en BDD : toujours logout + login pour recharger la session.

### Tests #12 — Enchères

Données à insérer dans phpMyAdmin avant de tester :
```sql
INSERT INTO users (name, email, password, role)
VALUES ('Vendeur Test', 'vendeur@test.com', 'hash', 'vendeur');

INSERT INTO produits (vendeur_id, titre, prix, type_vente)
VALUES (2, 'iPhone 14', 500.00, 'enchere');

INSERT INTO encheres (produit_id, prix_depart, date_debut, date_fin, etat)
VALUES (1, 100.00, NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR), 'en_cours');
```

| Requête | Body | Résultat attendu |
|---------|------|-----------------|
| `GET /auctions/index.php?produit_id=1` | — | 200 + `etat: en_cours`, `historique: []` |
| `GET /auctions/index.php?produit_id=1&action=statut` | — | 200 + `secondes_restantes` ~3600 |
| `POST /auctions/index.php?produit_id=1&action=offre` | `{ "montant": 150 }` (CSRF requis) | 201 + `nouvelle_meilleure_offre: 150` |
| `POST /auctions/index.php?produit_id=1&action=offre` | `{ "montant": 50 }` | 400 "montant trop bas" |
| `GET /auctions/index.php?produit_id=1` | après `UPDATE encheres SET date_fin='2020-01-01' WHERE id=1` | 200 + `etat: terminee` (auto) |

---

## TODO — Issues Max (zendarc147)

### Livrable 1 — deadline jeudi 28 mai 2026 à 23h55

- [x] #7 Définir les endpoints API → `API.md` créé, PR #76
- [x] #8 Produire le schéma d'architecture (frontend <> backend <> BDD) → mergé
- [ ] #6 Schéma entité-association BDD → Agnes s'en occupe, skip si elle le fait

### Livrable 2 — deadline dimanche 31 mai 2026 à 23h55

- [x] #9 Système d'authentification complet (inscription / connexion / logout) → PR #79
- [x] #10 Gestion des sessions PHP → PR #80
- [x] #11 Gestion des rôles (acheteur / vendeur / admin) → PR #81
- [x] #12 Module Enchères — backend (états, historique, règles de concurrence) → PR #82
- [x] #13 Module Enchères — polling toutes les 3s → PR #83
- [x] #14 Module Négociation — machine à états → PR #86
- [x] #15 Module Négociation — historique des échanges en BDD → couvert par #14 (table echanges_negociation + inserts/reads déjà implémentés)
- [ ] #16 Review du code des autres membres + corrections
- [ ] #17 Intégration finale et tests end-to-end
