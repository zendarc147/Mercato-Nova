# Mercato Nova — Schéma d'architecture

## 1. Architecture globale

```mermaid
graph TB
    subgraph CLIENT["🖥️ Client (Navigateur)"]
        REACT["React + Vite\nTailwind CSS"]
        subgraph FRONTEND_LAYERS["Couches frontend"]
            PAGES["Pages\n(Login, Register…)"]
            COMPONENTS["Composants réutilisables"]
            CTX["AuthContext\n(user, login, register, logout)"]
            API_AUTH["api/auth.js\n(getCsrfToken, login, register, logout, getMe)"]
            API_CLIENT["api/client.js\nfetch + CSRF token en mémoire"]
        end
    end

    subgraph SERVER["⚙️ Serveur PHP 8 (sans framework)"]
        subgraph CONFIG["Config (incluse par chaque endpoint)"]
            CORS_FN["cors.php → setCorsHeaders()"]
            SESSION_FN["session.php → configureSession()"]
            DB_FN["database.php → getDB()"]
        end
        subgraph MIDDLEWARE_FN["Middleware (fonctions opt-in par endpoint)"]
            CSRF_FN["csrf.php\ngenerateCsrfToken()\nverifyCsrfToken()"]
            AUTH_FN["auth.php\nrequireAuth()\nrequireRole()"]
        end
        subgraph API["API REST — /api"]
            AUTH_API["auth/\ncsrf.php · register.php · login.php · logout.php · me.php"]
            AUCTIONS_API["auctions/\nindex.php (GET détail · GET statut · POST offre)\npoll.php (GET statut léger)"]
            NEGO_API["negotiations/\nindex.php (GET liste · GET détail · POST créer · POST répondre)"]
            ADMIN_API["admin/\nusers.php"]
        end
    end

    subgraph DB["🗄️ Base de données MySQL"]
        USERS[("users")]
        PRODUITS[("produits")]
        ENCHERES[("encheres\noffres_encheres")]
        NEGOCIATIONS[("negociations\nechanges_negociation")]
        NOTIFICATIONS[("notifications")]
    end

    REACT --> PAGES
    PAGES --> COMPONENTS
    PAGES --> CTX
    CTX --> API_AUTH
    API_AUTH --> API_CLIENT

    API_CLIENT -->|"HTTPS + JSON\ncredentials: include"| CORS_FN
    CORS_FN --> SESSION_FN
    SESSION_FN --> AUTH_API
    SESSION_FN --> AUCTIONS_API
    SESSION_FN --> NEGO_API
    SESSION_FN --> ADMIN_API

    AUTH_API --> DB_FN
    AUCTIONS_API --> DB_FN
    NEGO_API --> DB_FN
    ADMIN_API --> DB_FN

    AUCTIONS_API -.->|"POST offre\n(verifyCsrfToken + requireAuth)"| CSRF_FN
    AUCTIONS_API -.->|"POST offre\n(verifyCsrfToken + requireAuth)"| AUTH_FN
    NEGO_API -.->|"POST créer/répondre\n(verifyCsrfToken + requireAuth)"| CSRF_FN
    NEGO_API -.->|"GET liste/détail\n(requireAuth)"| AUTH_FN
    AUTH_API -.->|"POST logout\n(verifyCsrfToken)"| CSRF_FN
    AUTH_API -.->|"GET me\n(requireAuth)"| AUTH_FN
    ADMIN_API -.->|"requireRole('admin')"| AUTH_FN

    DB_FN -->|"PDO prepared\nstatements"| USERS
    DB_FN --> PRODUITS
    DB_FN --> ENCHERES
    DB_FN --> NEGOCIATIONS
    DB_FN --> NOTIFICATIONS
```

---

## 2. Flux d'initialisation et d'authentification

Le token CSRF est obtenu **avant** toute authentification, dès le démarrage de l'app.

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant F as React (AuthContext)
    participant A as API PHP /auth
    participant DB as MySQL

    Note over F: Montage de l'app (useEffect)

    F->>A: GET /auth/csrf.php
    A->>A: configureSession() → session_start()
    A->>A: generateCsrfToken() → $_SESSION['csrf_token']
    A-->>F: 200 { csrf_token }
    F->>F: setCsrfToken(token) — stocké en mémoire module

    F->>A: GET /auth/me.php
    A->>A: requireAuth() — lit $_SESSION['user_id']
    alt Session active
        A->>DB: SELECT id, name, email, role FROM users WHERE id = ?
        DB-->>A: user
        A-->>F: 200 { id, name, email, role }
        F->>F: setUser(me)
    else Pas de session
        A-->>F: 401 Non authentifié
        F->>F: setUser(null)
    end

    U->>F: Remplit formulaire login
    F->>A: POST /auth/login.php (pas de CSRF requis — endpoint public)
    A->>A: configureSession()
    A->>DB: SELECT * FROM users WHERE email = ?
    DB-->>A: user
    A->>A: password_verify()
    A->>A: session_regenerate_id(true)
    A->>A: $_SESSION['user_id'] = id
    A->>A: generateCsrfToken() → retourne le token de session
    A-->>F: 200 { success: true, user, csrf_token }
    F->>F: setUser(user) + setCsrfToken(csrf_token)
    F->>U: Redirige vers dashboard

    Note over F,A: Toutes les requêtes POST/PUT/DELETE suivantes<br/>incluent X-CSRF-Token: <token> dans le header
```

> **Points clés :**
> - `register.php` et `login.php` ne vérifient **pas** le CSRF (l'utilisateur n'a pas encore de session initiale fiable)
> - `logout.php` vérifie le CSRF (la session est active, on peut valider)
> - Le token CSRF est stocké côté serveur dans `$_SESSION['csrf_token']` et côté client en variable de module JS (pas de localStorage)

---

## 3. Flux enchères (avec polling)

Les transitions d'état sont calculées **à la lecture** (pas de cron) via `transitionnerEtat()`.

```mermaid
sequenceDiagram
    actor V as Vendeur
    actor A as Acheteur
    participant F as React
    participant API as API PHP /auctions/index.php
    participant DB as MySQL

    V->>F: Crée un produit type "enchere" + enchère associée
    Note over DB: INSERT produits (type_vente='enchere')<br/>INSERT encheres (etat='en_attente', date_debut, date_fin)

    Note over F: Polling toutes les 3s via poll.php (GET léger)

    loop Toutes les 3 secondes
        F->>API: GET /auctions/index.php?produit_id=X&action=statut
        API->>DB: SELECT encheres WHERE produit_id = ?
        DB-->>API: enchere
        API->>API: transitionnerEtat() — calcule en_attente→en_cours→terminee selon NOW()
        alt Transition détectée
            API->>DB: UPDATE encheres SET etat = ?
        end
        API-->>F: 200 { etat, meilleure_offre, meilleur_encherisseur_id, secondes_restantes }
        F->>F: Met à jour l'UI
    end

    A->>F: Place une enchère (montant)
    F->>API: POST /auctions/index.php?produit_id=X&action=offre\n[X-CSRF-Token: token]
    API->>API: verifyCsrfToken() + requireAuth()
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT encheres WHERE produit_id = ? FOR UPDATE
    API->>API: transitionnerEtat() — vérifie que etat = 'en_cours'
    API->>API: vérifie montant > plancher (meilleure_offre ?? prix_depart)
    API->>DB: INSERT offres_encheres (enchere_id, utilisateur_id, montant)
    API->>DB: UPDATE encheres SET meilleure_offre = ?, meilleur_encherisseur_id = ?
    alt Ancien meilleur enchérisseur existe
        API->>DB: INSERT notifications (type='enchere_surenchere')
    end
    API->>DB: COMMIT
    API-->>F: 201 { success: true, nouvelle_meilleure_offre }
```

> **États enchère :** `en_attente` → `en_cours` → `terminee` | `annulee`
> Transitions calculées lazily à chaque appel GET — aucun cron ou worker externe.

---

## 4. Flux négociation (machine à états)

```mermaid
stateDiagram-v2
    [*] --> en_attente : Acheteur POST /negociations\n(produit type_vente='negociation')
    en_attente --> contre_offre : Vendeur répond action=contre_offre
    en_attente --> accepte : Vendeur répond action=accepter
    en_attente --> refuse : Vendeur répond action=refuser
    contre_offre --> contre_offre : L'autre partie répond action=contre_offre
    contre_offre --> accepte : L'une des parties répond action=accepter
    contre_offre --> refuse : L'une des parties répond action=refuser
    en_attente --> expire : expires_at dépassé (7 jours) — détecté à la lecture
    contre_offre --> expire : expires_at dépassé (7 jours) — détecté à la lecture
    accepte --> [*]
    refuse --> [*]
    expire --> [*]
```

**Règle d'alternance** : le champ `dernier_acteur` (`acheteur` | `vendeur`) empêche la même partie de répondre deux fois de suite. Après l'offre initiale de l'acheteur, c'est au vendeur de répondre, puis alternance.

**Transitions légales** (vérifiées côté serveur) :

| État courant | action=`contre_offre` | action=`accepter` | action=`refuser` |
|---|---|---|---|
| `en_attente` | → `contre_offre` | → `accepte` | → `refuse` |
| `contre_offre` | → `contre_offre` | → `accepte` | → `refuse` |

---

## 5. Schéma de base de données (tables réelles)

```mermaid
erDiagram
    users {
        int id PK
        string name
        string email
        string password
        enum role "acheteur|vendeur|admin"
        timestamp created_at
    }
    produits {
        int id PK
        int vendeur_id FK
        string titre
        text description
        decimal prix
        string categorie
        enum etat "neuf|bon_etat|correct|mauvais_etat"
        enum type_vente "achat_immediat|enchere|negociation"
        int stock
        string image_url
        timestamp created_at
    }
    encheres {
        int id PK
        int produit_id FK "UNIQUE"
        decimal prix_depart
        decimal meilleure_offre
        int meilleur_encherisseur_id FK
        enum etat "en_attente|en_cours|terminee|annulee"
        timestamp date_debut
        timestamp date_fin
        timestamp created_at
    }
    offres_encheres {
        int id PK
        int enchere_id FK
        int utilisateur_id FK
        decimal montant
        timestamp created_at
    }
    negociations {
        int id PK
        int produit_id FK
        int acheteur_id FK
        int vendeur_id FK
        enum etat "en_attente|contre_offre|accepte|refuse|expire"
        decimal derniere_offre
        enum dernier_acteur "acheteur|vendeur"
        timestamp expires_at
        timestamp created_at
        timestamp updated_at
    }
    echanges_negociation {
        int id PK
        int negociation_id FK
        enum auteur "acheteur|vendeur"
        decimal montant
        text message
        timestamp created_at
    }
    notifications {
        int id PK
        int utilisateur_id FK
        string type
        text message
        tinyint lu
        timestamp created_at
    }

    users ||--o{ produits : "vend"
    users ||--o{ offres_encheres : "enchérit"
    users ||--o{ negociations : "acheteur"
    users ||--o{ negociations : "vendeur"
    users ||--o{ notifications : "reçoit"
    produits ||--o| encheres : "a une enchère"
    produits ||--o{ negociations : "négocié"
    encheres ||--o{ offres_encheres : "reçoit"
    encheres }o--o| users : "meilleur enchérisseur"
    negociations ||--o{ echanges_negociation : "contient"
```
