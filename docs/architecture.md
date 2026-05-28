# Mercato Nova — Architecture complète

## 1. Architecture globale

```mermaid
graph TB
    subgraph CLIENT["🖥️ Client — React + Vite + Tailwind CSS  (Astrid)"]
        subgraph PAGES["Pages"]
            PUB["Accueil · Catalogue · Détail produit"]
            AUTH_P["Connexion · Inscription · Profil"]
            TXN["Panier · Confirmation · Historique achats"]
            MKT["Enchère · Négociation · Notifications"]
            PRO["Dashboard vendeur · Gestion produits · Admin"]
        end
        CTX["AuthContext\n(user, login, logout, register)"]
        HOOKS["Hooks\nusePolling · useCart · useAuth"]
        APICLI["api/client.js\nfetch · CSRF token en mémoire"]
    end

    subgraph BACKEND["⚙️ API REST — PHP 8 sans framework"]
        subgraph SHARED["Fonctions partagées (incluses par chaque endpoint)"]
            CFG["setCorsHeaders()\nconfigureSession()\ngetDB()"]
            MW["requireAuth() · requireRole()\ngenerateCsrfToken() · verifyCsrfToken()"]
        end
        subgraph MODS["Modules API  /api/"]
            M_AUTH["auth/\ncsrf · register · login · logout · me"]
            M_PROD["produits/\nliste+filtres · détail · créer · modifier · supprimer"]
            M_PAN["panier/\nget · ajouter · supprimer item · vider"]
            M_ACH["achats/\ncommander · historique"]
            M_ENC["auctions/  — enchères\ndétail · statut · offre · poll"]
            M_NEG["negotiations/  — négociation\nliste · détail · créer · répondre"]
            M_NOT["notifications/\nliste · lire · tout-lire"]
            M_PRF["profil/\nget · modifier"]
            M_ADM["admin/\nusers"]
        end
    end

    subgraph DB["🗄️ Base de données MySQL  (Agnes)"]
        T1[("users")]
        T2[("produits")]
        T3[("encheres · offres_encheres")]
        T4[("negociations · echanges_negociation")]
        T5[("panier · panier_items")]
        T6[("achats")]
        T7[("notifications")]
    end

    PAGES --> CTX
    PAGES --> HOOKS
    PAGES --> APICLI
    CTX --> APICLI
    HOOKS --> APICLI

    APICLI -->|"HTTPS · JSON\nX-CSRF-Token\ncredentials: include"| MODS

    MODS --> SHARED
    SHARED -->|"PDO prepared statements"| DB
```

> **Séparation stricte** : le frontend React ne touche jamais MySQL. Toute donnée transite par l'API PHP. Le CSRF token est transporté en header `X-CSRF-Token` sur chaque requête mutante (POST / PUT / DELETE).

---

## 2. Pages frontend et navigation (Astrid)

| Route | Page | Accès | Description |
|---|---|---|---|
| `/` | Accueil | Public | Mise en avant des produits, enchères en cours, catégories |
| `/catalogue` | Catalogue | Public | Liste des produits, filtres prix/catégorie/état/type, recherche, tri |
| `/produits/:id` | Détail produit | Public | Fiche produit, boutons Acheter / Panier / Enchérir / Négocier selon `type_vente` |
| `/connexion` | Connexion | Public (non connecté) | Formulaire login |
| `/inscription` | Inscription | Public (non connecté) | Formulaire register |
| `/profil` | Profil | Connecté | Infos utilisateur, stats, modification mot de passe |
| `/panier` | Panier | Connecté | Articles en attente, quantités, sous-total, bouton Commander |
| `/confirmation/:id` | Confirmation | Connecté | Récapitulatif achat validé |
| `/achats` | Historique achats | Connecté | Liste des transactions passées |
| `/encheres/:produitId` | Enchère en cours | Connecté | Timer live, historique offres, formulaire mise |
| `/negociations` | Mes négociations | Connecté | Liste des négociations actives et terminées |
| `/negociations/:id` | Détail négociation | Connecté (participant) | Fil d'échanges, boutons contre-offre / accepter / refuser |
| `/notifications` | Notifications | Connecté | Centre de notifications, marquer comme lu |
| `/vendeur/produits` | Gestion produits | Vendeur | Créer, modifier, supprimer ses annonces |
| `/admin` | Administration | Admin | Liste et gestion des utilisateurs |

```mermaid
flowchart LR
    HOME["Accueil"] --> CAT["Catalogue"]
    CAT --> PROD["Détail produit"]
    PROD -->|"type_vente = achat_immediat"| PAN["Panier"]
    PROD -->|"type_vente = enchere"| ENC["Enchère"]
    PROD -->|"type_vente = negociation"| NEG["Négociation"]
    PAN --> CONF["Confirmation"]
    ENC --> NOT["Notifications"]
    NEG --> NOT
    HOME --> CONN["Connexion / Inscription"]
    CONN --> HOME
    HOME --> PRF["Profil"]
    HOME --> ADM["Admin"]
```

---

## 3. Flux d'initialisation et d'authentification (Max)

Le token CSRF est obtenu **avant** toute authentification, dès le démarrage de l'app.

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant F as React (AuthContext)
    participant A as PHP /auth
    participant DB as MySQL

    Note over F: Montage de l'app (useEffect)

    F->>A: GET /auth/csrf.php
    A->>A: configureSession() → session_start()
    A->>A: generateCsrfToken() → $_SESSION['csrf_token']
    A-->>F: 200 { csrf_token }
    F->>F: setCsrfToken(token) — stocké en variable de module JS

    F->>A: GET /auth/me.php
    A->>A: requireAuth() — lit $_SESSION['user_id']
    alt Session active (cookie valide)
        A->>DB: SELECT id, name, email, role FROM users WHERE id = ?
        DB-->>A: user
        A-->>F: 200 { id, name, email, role }
        F->>F: setUser(user)
    else Pas de session
        A-->>F: 401
        F->>F: setUser(null)
    end

    U->>F: Formulaire connexion
    F->>A: POST /auth/login.php  ← pas de CSRF (endpoint public)
    A->>DB: SELECT * FROM users WHERE email = ?
    A->>A: password_verify()
    A->>A: session_regenerate_id(true)
    A->>A: $_SESSION['user_id'] = id
    A->>A: generateCsrfToken()
    A-->>F: 200 { success, user, csrf_token }
    F->>F: setUser(user) + setCsrfToken(csrf_token)

    U->>F: Bouton déconnexion
    F->>A: POST /auth/logout.php  [X-CSRF-Token: token]
    A->>A: verifyCsrfToken()
    A->>A: session_destroy()
    A-->>F: 200 { message }
    F->>F: setUser(null)
```

> `register.php` et `login.php` ne vérifient **pas** le CSRF — l'utilisateur n'a pas encore de session. `logout.php` le vérifie car la session est active.

---

## 4. Flux catalogue et produits (Lily — backend · Astrid — frontend)

```mermaid
sequenceDiagram
    actor U as Visiteur / Acheteur
    actor V as Vendeur
    participant F as React
    participant API as PHP /produits
    participant DB as MySQL

    U->>F: Accède à /catalogue (ou recherche)
    F->>API: GET /produits?categorie=X&prix_max=500&recherche=montre&tri=prix_asc
    API->>DB: SELECT produits WHERE ... ORDER BY ... LIMIT/OFFSET
    DB-->>API: liste paginée
    API-->>F: 200 { produits: [...], total, page }
    F->>F: Affiche les ProductCards

    U->>F: Clique sur un produit
    F->>API: GET /produits/{id}
    API->>DB: SELECT produit + vendeur + enchere/negociation associée
    DB-->>API: détail complet
    API-->>F: 200 { produit, vendeur, type_vente, ... }
    F->>F: Affiche la fiche produit avec le bon bouton d'action

    V->>F: Crée un produit (Dashboard vendeur)
    F->>API: POST /produits  [CSRF + Auth vendeur]
    API->>API: verifyCsrfToken() + requireRole('vendeur')
    API->>DB: INSERT produits (titre, prix, type_vente, stock, ...)
    DB-->>API: produit_id
    alt type_vente = 'enchere'
        API->>DB: INSERT encheres (produit_id, prix_depart, date_debut, date_fin)
    end
    API-->>F: 201 { produit }
```

---

## 5. Flux panier et achat immédiat (Lily — backend · Astrid — frontend)

```mermaid
sequenceDiagram
    actor U as Acheteur
    participant F as React
    participant API_PAN as PHP /panier
    participant API_ACH as PHP /achats
    participant DB as MySQL

    U->>F: "Ajouter au panier" sur fiche produit
    F->>API_PAN: POST /panier  [CSRF + Auth]
    API_PAN->>API_PAN: requireAuth()
    API_PAN->>DB: SELECT panier WHERE utilisateur_id = ? (ou INSERT si absent)
    API_PAN->>DB: INSERT panier_items (panier_id, produit_id, quantite, prix_unitaire)
    API_PAN-->>F: 201 { success, nb_articles }
    F->>F: Met à jour le badge panier (useCart)

    U->>F: Visite /panier
    F->>API_PAN: GET /panier  [Auth]
    API_PAN->>DB: SELECT panier_items JOIN produits WHERE panier.utilisateur_id = ?
    DB-->>API_PAN: items avec stock disponible
    API_PAN-->>F: 200 { items: [...], total }
    F->>F: Affiche le récapitulatif

    U->>F: "Commander"
    F->>API_ACH: POST /achats  [CSRF + Auth]
    API_ACH->>API_ACH: verifyCsrfToken() + requireAuth()
    API_ACH->>DB: BEGIN TRANSACTION
    loop Pour chaque item du panier
        API_ACH->>DB: SELECT produit FOR UPDATE (verrou concurrence)
        API_ACH->>API_ACH: Vérifie stock >= quantite
        API_ACH->>DB: UPDATE produits SET stock = stock - quantite
        API_ACH->>DB: INSERT achats (acheteur_id, vendeur_id, produit_id, montant, type='achat_immediat')
        API_ACH->>DB: INSERT notifications (vendeur — nouvel achat)
    end
    API_ACH->>DB: DELETE panier_items (vider le panier)
    API_ACH->>DB: COMMIT
    API_ACH-->>F: 201 { achats: [...] }
    F->>F: Redirige vers /confirmation/:id

    Note over API_ACH,DB: Achat direct sans panier (bouton "Acheter maintenant") :<br/>même flux POST /achats mais avec produit_id + quantite directs
```

---

## 6. Flux enchères — polling toutes les 3s (Max — backend · Astrid — frontend)

Les transitions d'état sont calculées **à chaque lecture** via `transitionnerEtat()` — pas de cron.

```mermaid
sequenceDiagram
    actor V as Vendeur
    actor A as Acheteur
    participant F as React
    participant API as PHP /auctions
    participant DB as MySQL

    V->>F: Crée un produit type_vente='enchere'
    Note over DB: INSERT produits + INSERT encheres\n(etat='en_attente', date_debut, date_fin)

    Note over F: Polling toutes les 3s via poll.php

    loop Toutes les 3 secondes
        F->>API: GET /auctions/index.php?produit_id=X&action=statut
        API->>DB: SELECT encheres WHERE produit_id = ?
        API->>API: transitionnerEtat()\nen_attente→en_cours→terminee selon NOW()
        alt Transition détectée
            API->>DB: UPDATE encheres SET etat = ?
        end
        API-->>F: 200 { etat, meilleure_offre, meilleur_encherisseur_id, secondes_restantes }
        F->>F: Met à jour le timer et la mise actuelle
    end

    A->>F: Saisit un montant et clique "Enchérir"
    F->>API: POST /auctions/index.php?produit_id=X&action=offre\n[X-CSRF-Token]
    API->>API: verifyCsrfToken() + requireAuth()
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT encheres FOR UPDATE
    API->>API: Vérifie etat='en_cours' et montant > plancher
    API->>DB: INSERT offres_encheres
    API->>DB: UPDATE encheres SET meilleure_offre, meilleur_encherisseur_id
    alt Ancien leader existait
        API->>DB: INSERT notifications (type='enchere_surenchere')
    end
    API->>DB: COMMIT
    API-->>F: 201 { success, nouvelle_meilleure_offre }
```

**États de l'enchère :** `en_attente` → `en_cours` → `terminee` | `annulee`

---

## 7. Flux négociation — machine à états (Max — backend · Astrid — frontend)

```mermaid
stateDiagram-v2
    [*] --> en_attente : Acheteur POST /negociations\n(produit type_vente='negociation')
    en_attente --> contre_offre : Vendeur — action=contre_offre
    en_attente --> accepte : Vendeur — action=accepter
    en_attente --> refuse : Vendeur — action=refuser
    contre_offre --> contre_offre : Autre partie — action=contre_offre
    contre_offre --> accepte : L'une des parties — action=accepter
    contre_offre --> refuse : L'une des parties — action=refuser
    en_attente --> expire : expires_at dépassé (7 jours) — détecté à la lecture
    contre_offre --> expire : expires_at dépassé (7 jours) — détecté à la lecture
    accepte --> [*] : Achat créé automatiquement
    refuse --> [*]
    expire --> [*]
```

**Règle d'alternance** : le champ `dernier_acteur` (`acheteur` | `vendeur`) empêche la même partie de répondre deux fois de suite.

**Transitions légales** vérifiées côté serveur (`transitionsLegales()`) :

| État courant | `contre_offre` | `accepter` | `refuser` |
|---|---|---|---|
| `en_attente` | → `contre_offre` | → `accepte` | → `refuse` |
| `contre_offre` | → `contre_offre` | → `accepte` | → `refuse` |

---

## 8. Notifications (Lily — backend · Astrid — frontend)

Les notifications sont **insérées par le backend** lors d'événements métier. Le frontend les consomme en polling léger ou au chargement.

| Type | Déclencheur | Destinataire |
|---|---|---|
| `enchere_surenchere` | Quelqu'un surenchérit | Ancien meilleur enchérisseur |
| `negociation_nouvelle` | Acheteur crée une négociation | Vendeur |
| `negociation_reponse` | Contre-offre / acceptation / refus | L'autre partie |
| `achat_confirme` | Commande passée | Vendeur |

```mermaid
sequenceDiagram
    participant F as React (Navbar)
    participant API as PHP /notifications
    participant DB as MySQL

    loop Au chargement + rafraîchissement
        F->>API: GET /notifications  [Auth]
        API->>DB: SELECT notifications WHERE utilisateur_id = ? ORDER BY created_at DESC
        DB-->>API: liste
        API-->>F: 200 { notifications: [...], nb_non_lues }
        F->>F: Affiche le badge et la liste
    end

    F->>API: PUT /notifications/{id}/lire  [CSRF + Auth]
    API->>DB: UPDATE notifications SET lu = 1 WHERE id = ?
    API-->>F: 200 { success }

    F->>API: PUT /notifications/lire-tout  [CSRF + Auth]
    API->>DB: UPDATE notifications SET lu = 1 WHERE utilisateur_id = ?
    API-->>F: 200 { success }
```

---

## 9. Schéma de base de données complet (Agnes)

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
    panier {
        int id PK
        int utilisateur_id FK "UNIQUE"
        timestamp created_at
        timestamp updated_at
    }
    panier_items {
        int id PK
        int panier_id FK
        int produit_id FK
        int quantite
        decimal prix_unitaire
    }
    achats {
        int id PK
        int acheteur_id FK
        int vendeur_id FK
        int produit_id FK
        int quantite
        decimal montant
        enum type "achat_immediat|enchere|negociation"
        enum statut "confirme|annule"
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
    users ||--o| panier : "possède"
    users ||--o{ achats : "acheteur"
    users ||--o{ achats : "vendeur"
    users ||--o{ notifications : "reçoit"
    produits ||--o| encheres : "a une enchère"
    produits ||--o{ negociations : "négocié"
    produits ||--o{ panier_items : "dans panier"
    produits ||--o{ achats : "acheté"
    encheres ||--o{ offres_encheres : "reçoit"
    encheres }o--o| users : "meilleur enchérisseur"
    negociations ||--o{ echanges_negociation : "contient"
    panier ||--o{ panier_items : "contient"
```
