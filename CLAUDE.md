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
