# Mercato Nova — Contexte projet

Plateforme e-commerce web dynamique développée dans le cadre du module Web dynamique ING2 à l'ECE Paris.

## Deadlines

- **Livrable 1** (conception) : Jeudi 28 mai 2026 à 23h55
- **Livrable 2** (projet final) : Dimanche 31 mai 2026 à 23h55

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React + Vite + CSS classique |
| Backend | PHP 8 (API REST, pas de framework) |
| Base de données | MySQL |
| Auth | Sessions PHP + PDO prepared statements |
| Temps réel (enchères) | Polling toutes les 3 secondes |

Architecture client-serveur stricte : React appelle l'API PHP via `fetch`, PHP interroge MySQL.

## Equipe

| Personne | Rôle | GitHub |
|----------|------|--------|
| Max | Tech Lead — setup, auth, enchères, négociation, review | zendarc147 |
| Astrid | Frontend React — toutes les pages, wireframes, responsive design | AstrithrDevalai |
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

## Palette graphique Astrid

| Usage | Couleur | Hex |
|-------|---------|-----|
| Navbar / texte principal | Forêt Profonde | `#2D4A3E` |
| Fonds secondaires / barre de recherche / connexion | Sable Chaud | `#F4E9D0` |
| CTA / prix / accents importants | Ocre Brûlé | `#E07B39` |
| Enchères / accents artistiques | Mauve Artiste | `#9B6B9B` |
| Accents premium | Miel | `#D4A853` |
| Fond principal des pages | Fond page | `#FFFCEF` |

Le fond général du site doit utiliser `#FFFCEF`. `#F4E9D0` ne doit pas être utilisé comme fond principal : il sert plutôt aux zones secondaires comme la barre de recherche, les cartes de connexion ou certains blocs doux.

## Structure du projet

```text
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
└── AGENTS.md
```

## Règles de développement

- Frontend en React + Vite.
- Ne pas utiliser Tailwind CSS pour ce projet.
- Utiliser du CSS classique : fichiers `.css`, classes lisibles, responsive avec media queries si nécessaire.
- Respecter l'architecture client-serveur : le frontend appelle uniquement les endpoints PHP documentés dans [API.md](API.md).
- Utiliser des composants réutilisables dans `frontend/src/components/`.
- Créer les pages principales dans `frontend/src/pages/`.
- Centraliser les appels API dans `frontend/src/api/`.
- Gérer les états de chargement, d'erreur et de données vides dans les composants.
- Prévoir un responsive design mobile + desktop avec du CSS classique.
- Garder une interface claire, cohérente et utilisable pour une démo projet.
- Ne jamais committer `.env`, `node_modules/`, fichiers temporaires ou secrets.
- Commits réguliers et significatifs — pas de commit massif à la fin.

## Repo GitHub

https://github.com/zendarc147/Mercato-Nova

Issues et Kanban : onglet Projects du repo GitHub  
Suivi des tâches Notion : https://www.notion.so/36b12f0b77b381f38052c26136170863

---

## Instructions pour le nouveau chat

Dès l'ouverture d'une nouvelle conversation, **attaquer directement la prochaine tâche frontend non cochée dans la liste Astrid ci-dessous**, sans demander confirmation.

Priorité : faire avancer le frontend du projet pour Astrid. Si une tâche backend manque ou bloque, créer temporairement des mocks propres côté frontend, puis noter clairement ce qui devra être branché sur l'API réelle.

### Procédure à suivre pour chaque tâche frontend

1. **Checkout depuis `dev`** : `git checkout dev && git pull`
2. **Créer une branche** : `git checkout -b feature/frontend-<slug>`
3. **Lire le contexte utile** : [Sujet 1 - Mercato Nova.pdf](Sujet%201%20-%20Mercato%20Nova.pdf), [API.md](API.md), puis le code dans `frontend/`
4. **Faire le travail frontend** : pages, composants, appels API, états loading/error, responsive en CSS classique
5. **Tester localement** : `npm install` si nécessaire, puis `npm run dev` ou `npm run build` dans `frontend/`
6. **Commit** avec un message clair : `feat: <description frontend>`
7. **Push** : `git push -u origin feature/frontend-<slug>`
8. **Ouvrir une PR vers `dev`** avec `& "C:\Program Files\GitHub CLI\gh.exe" pr create ...`
9. **Cocher la case** dans cette liste dans le `AGENTS.md` et commiter le changement

> `gh` se trouve à `C:\Program Files\GitHub CLI\gh.exe` — toujours utiliser le chemin complet.
> Référence API : voir [API.md](API.md) pour tous les endpoints REST.

---

## Guide de test frontend

### Environnement requis

- Se placer dans `frontend/`
- Installer les dépendances si besoin : `npm install`
- Lancer le frontend : `npm run dev`
- Vérifier aussi le build avant PR : `npm run build`
- Backend attendu via MAMP :
  - Apache + MySQL lancés
  - Base URL API : `http://localhost/Mercato-Nova/backend/api`

### Points à vérifier à chaque page

- La page charge sans erreur console.
- Les états loading, erreur et données vides sont visibles quand nécessaire.
- Les composants restent lisibles sur mobile et desktop.
- Les boutons d'action sont visibles et compréhensibles.
- Les appels API sont centralisés dans `frontend/src/api/`.
- Les formulaires valident les champs importants avant envoi.
- Les erreurs API sont affichées proprement à l'utilisateur.

### Rappels API utiles

- Auth : register, login, logout, me
- Catalogue / produits : liste, détail produit, recherche, filtres
- Enchères : statut, historique, poster une offre, polling toutes les 3 secondes
- Négociation : historique/thread, état courant, accepter/refuser/contre-offre

Si un endpoint n'est pas encore prêt, utiliser des données mockées dans un fichier isolé et facile à retirer.

---

## TODO — Astrid Frontend (AstrithrDevalai)

### Livrable 2 — deadline dimanche 31 mai 2026 à 23h55

- [x] Page d'accueil : hero, catégories, produits en vedette → PR #91
- [x] Pages auth frontend : inscription, connexion *(profil/session manquant)*
- [ ] Page catalogue avec filtres : catégorie, prix min/max, état
- [ ] Barre de recherche fonctionnelle
- [ ] Fiche produit : description, photos, boutons d'action
- [ ] Interface enchère : timer compte à rebours, liste des offres, formulaire enchérir
- [ ] Interface négociation : thread d'échanges, état courant, boutons accepter/refuser/contre-offre
- [ ] Panier frontend : ajout, résumé, validation de transaction simulée
- [ ] Notifications frontend
- [ ] Responsive design : mobile + desktop en CSS classique
- [ ] Gestion des états de chargement / erreurs dans les composants

### Tâches possibles en plus si le temps le permet

- [ ] Espace vendeur : création/modification de produit
- [ ] Espace admin minimal : visualisation utilisateurs/produits si endpoint disponible
- [ ] Nettoyage UI final : cohérence visuelle, textes, accessibilité, navigation
- [ ] Tests manuels end-to-end avant rendu final
