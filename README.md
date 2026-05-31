# Mercato Nova

Plateforme e-commerce web dynamique — ECE Paris, module Web dynamique ING2.  
Vente par achat immédiat, enchère et négociation.

---

## Lancer le projet

### Prérequis

- **MAMP** (Apache + MySQL) — Document Root pointant vers le dossier parent de `Mercato-Nova`
- **Node.js** 18+

### 1. Base de données

Dans phpMyAdmin, créer la base puis importer dans l'ordre :

```
database/schema.sql   ← structure des tables
database/seed.sql     ← données de test (comptes, produits, enchères)
```

> Si la base existe déjà et que vous voulez ajouter la colonne de statut utilisateur :
> ```sql
> ALTER TABLE users ADD COLUMN statut ENUM('actif','suspendu','banni') NOT NULL DEFAULT 'actif';
> ```

**Comptes de test (seed.sql) :**

| Email | Mot de passe | Rôle |
|---|---|---|
| admin@mercatonova.com | Admin1234! | admin |
| vendeur@mercatonova.com | Vendeur1234! | vendeur |
| acheteur@mercatonova.com | Acheteur1234! | acheteur |

### 2. Backend (PHP)

Apache doit servir le dossier `Mercato-Nova/`. La base URL de l'API est :

```
http://localhost/Mercato-Nova/backend/api
```

Aucune installation supplémentaire — PHP pur, pas de Composer.

### 3. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Le frontend démarre sur **http://localhost:5173** et proxifie automatiquement les appels `/api/*` vers MAMP.

> Pour changer la cible du proxy (ex : port différent), créer `frontend/.env` :
> ```
> VITE_BACKEND_TARGET=http://localhost:8888
> VITE_BACKEND_PREFIX=/Mercato-Nova/backend/api
> ```

---

## Structure du projet

```
Mercato-Nova/
├── frontend/               # React + Vite + CSS classique
│   ├── src/
│   │   ├── pages/          # 18 pages (Catalogue, Enchere, Negociation, Admin…)
│   │   ├── components/     # SiteHeader, ProfileMenu, EditProduitForm…
│   │   ├── api/            # Appels fetch centralisés (auth, produits, encheres…)
│   │   └── context/        # AuthContext, CartContext, NotificationContext
│   └── vite.config.js      # Proxy /api → backend MAMP
│
├── backend/                # API REST PHP 8 — pas de framework
│   ├── api/
│   │   ├── auth/           # register · login · logout · me · csrf
│   │   ├── products/       # CRUD produits + filtres + pagination
│   │   ├── auctions/       # Enchères + polling statut (3s) + offres
│   │   ├── negotiations/   # Négociations + machine à états + expiration 48h
│   │   ├── panier/         # Panier utilisateur
│   │   ├── achats/         # Validation commande (paiement simulé)
│   │   ├── notifications/  # Centre de notifications
│   │   ├── profil/         # Profil + préférences
│   │   ├── vendeurs/       # Demande de passage vendeur
│   │   └── admin/          # Gestion utilisateurs + modération demandes
│   ├── config/             # BDD, CORS, sessions
│   └── middleware/         # requireAuth(), requireRole(), CSRF
│
├── database/
│   ├── schema.sql          # CREATE TABLE (à importer en premier)
│   └── seed.sql            # Données de test
│
└── docs/
    └── architecture.md     # Architecture complète (diagrammes Mermaid)
```

---

## Points clés pour le correcteur

- **Auth** : sessions PHP + token CSRF sur toutes les requêtes mutantes (`X-CSRF-Token`)
- **Enchères** : polling toutes les 3s, transitions d'état automatiques à la lecture (pas de cron)
- **Négociations** : machine à états stricte, expiration automatique si pas de réponse en 48h
- **Rôles** : `acheteur` / `vendeur` / `admin` — le passage vendeur passe par une demande modérée par l'admin
- **Sécurité** : PDO prepared statements, `password_hash()`, comptes suspendables/bannissables par l'admin
- **Paiement** : simulé (pas de passerelle réelle) — choix carte / PayPal / virement
