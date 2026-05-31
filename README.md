# Mercato Nova

Plateforme e-commerce web dynamique — ECE Paris, module Web dynamique ING2.  
Vente par achat immédiat, enchère et négociation.

---

## Lancer le projet

### Prérequis

- **MAMP** — Document Root pointant vers le dossier parent de `Mercato-Nova`
- **Node.js** 18+

### 1. Base de données

Dans phpMyAdmin, créer la base puis importer dans l'ordre :

```
database/schema.sql   ← structure des tables
database/seed.sql     ← données de test 
```



**Comptes de test (seed.sql) :**

| Email | Mot de passe | Rôle |
|---|---|---|
| elio@mercatonova.com | Mercato1! | admin |
| shinichi@mercatonova.fr | Mercato1! | vendeur |
| lucas@mercatonova.com | Mercato1! | acheteur |

### 2. Backend (PHP)

Apache doit servir le dossier `Mercato-Nova/`. La base URL de l'API est :

```
http://localhost/Mercato-Nova/backend/api
```



### 3. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

Le frontend démarre sur **http://localhost:5173** 


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

