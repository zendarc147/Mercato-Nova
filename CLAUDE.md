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

## TODO — Issues Max (zendarc147)

### Livrable 1 — deadline jeudi 28 mai 2026 à 23h55

- [x] #7 Définir les endpoints API → `API.md` créé, PR #76
- [x] #8 Produire le schéma d'architecture (frontend <> backend <> BDD) → mergé
- [ ] #6 Schéma entité-association BDD → Agnes s'en occupe, skip si elle le fait

### Livrable 2 — deadline dimanche 31 mai 2026 à 23h55

- [ ] #9 Système d'authentification complet (inscription / connexion / logout) → branche `feature/9-auth`
- [ ] #10 Gestion des sessions PHP → branche `feature/10-sessions`
- [ ] #11 Gestion des rôles (acheteur / vendeur / admin) → branche `feature/11-roles`
- [ ] #12 Module Enchères — backend (états, historique, règles de concurrence) → branche `feature/12-encheres-backend`
- [ ] #13 Module Enchères — polling toutes les 3s → branche `feature/13-encheres-polling`
- [ ] #14 Module Négociation — machine à états → branche `feature/14-negociation-etats`
- [ ] #15 Module Négociation — historique des échanges en BDD → branche `feature/15-negociation-historique`
- [ ] #16 Review du code des autres membres + corrections
- [ ] #17 Intégration finale et tests end-to-end
