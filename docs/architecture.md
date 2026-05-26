# Mercato Nova — Schéma d'architecture

## 1. Architecture globale

```mermaid
graph TB
    subgraph CLIENT["🖥️ Client (Navigateur)"]
        REACT["React + Vite\nTailwind CSS"]
        subgraph FRONTEND_LAYERS["Couches frontend"]
            PAGES["Pages\n(Home, Catalogue, Enchères…)"]
            COMPONENTS["Composants réutilisables"]
            HOOKS["Hooks personnalisés\n(useAuth, usePolling…)"]
            CTX["Context API\n(AuthContext)"]
            API_CLIENT["api/client.js\nfetch + CSRF token"]
        end
    end

    subgraph SERVER["⚙️ Serveur PHP 8"]
        subgraph MIDDLEWARE["Middleware"]
            CORS["cors.php"]
            AUTH_MW["auth.php\n(vérif. session)"]
            CSRF_MW["csrf.php\n(token CSRF)"]
        end
        subgraph API["API REST — /api"]
            AUTH_API["auth/\nregister · login · logout · me"]
            PRODUCTS_API["products/\nGET liste · GET détail · POST · PUT · DELETE"]
            AUCTIONS_API["auctions/\nGET · POST enchère · PUT bid · GET historique"]
            NEGO_API["negotiations/\nPOST · PUT offre · GET historique"]
            CART_API["cart/\nGET · POST · DELETE"]
            NOTIF_API["notifications/\nGET · PUT (lu)"]
        end
        subgraph BACKEND_LAYERS["Couches backend"]
            CONTROLLERS["Controllers\n(logique métier)"]
            MODELS["Models\n(requêtes PDO)"]
        end
    end

    subgraph DB["🗄️ Base de données MySQL"]
        USERS[("users")]
        PRODUCTS[("products")]
        AUCTIONS[("auctions\nauction_bids")]
        NEGOTIATIONS[("negotiations\nnegotiation_messages")]
        CART[("cart\ncart_items")]
        TRANSACTIONS[("transactions")]
        NOTIFICATIONS[("notifications")]
    end

    REACT --> PAGES
    PAGES --> COMPONENTS
    PAGES --> HOOKS
    HOOKS --> CTX
    PAGES --> API_CLIENT
    HOOKS --> API_CLIENT

    API_CLIENT -->|"HTTPS + JSON\n+ CSRF header"| CORS
    CORS --> AUTH_MW
    AUTH_MW --> CSRF_MW
    CSRF_MW --> AUTH_API
    CSRF_MW --> PRODUCTS_API
    CSRF_MW --> AUCTIONS_API
    CSRF_MW --> NEGO_API
    CSRF_MW --> CART_API
    CSRF_MW --> NOTIF_API

    AUTH_API --> CONTROLLERS
    PRODUCTS_API --> CONTROLLERS
    AUCTIONS_API --> CONTROLLERS
    NEGO_API --> CONTROLLERS
    CART_API --> CONTROLLERS
    NOTIF_API --> CONTROLLERS

    CONTROLLERS --> MODELS
    MODELS -->|"PDO prepared\nstatements"| USERS
    MODELS --> PRODUCTS
    MODELS --> AUCTIONS
    MODELS --> NEGOTIATIONS
    MODELS --> CART
    MODELS --> TRANSACTIONS
    MODELS --> NOTIFICATIONS
```

---

## 2. Flux d'authentification

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant F as React (frontend)
    participant A as API PHP /auth
    participant DB as MySQL

    U->>F: Remplit formulaire inscription/connexion
    F->>A: POST /api/auth/register (ou /login)
    A->>A: Valide les inputs (serveur)
    A->>DB: SELECT user WHERE email = ?
    DB-->>A: Résultat

    alt Inscription
        A->>A: password_hash()
        A->>DB: INSERT INTO users
        DB-->>A: OK
        A->>A: session_start() + $_SESSION[user_id]
    else Connexion
        A->>A: password_verify()
        A->>A: session_start() + $_SESSION[user_id]
    end

    A-->>F: 200 JSON { user, csrf_token }
    F->>F: Stocke user dans AuthContext
    F->>U: Redirige vers dashboard

    Note over F,A: Toutes les requêtes suivantes<br/>incluent le CSRF token en header
```

---

## 3. Flux enchères (avec polling)

```mermaid
sequenceDiagram
    actor V as Vendeur
    actor A as Acheteur
    participant F as React
    participant API as API PHP /auctions
    participant DB as MySQL

    V->>F: Crée une enchère
    F->>API: POST /api/auctions
    API->>DB: INSERT auction (état: en_attente)
    DB-->>API: auction_id
    API-->>F: 201 { auction }

    Note over F: Polling toutes les 3s (usePolling hook)

    loop Toutes les 3 secondes
        F->>API: GET /api/auctions/{id}
        API->>DB: SELECT auction + highest_bid
        DB-->>API: données
        API-->>F: 200 { auction, current_bid, time_left }
        F->>F: Met à jour l'UI
    end

    A->>F: Place une enchère
    F->>API: POST /api/auctions/{id}/bids
    API->>DB: INSERT auction_bid
    API->>DB: UPDATE auction (current_price)
    API->>DB: INSERT notification (ancien meilleur enchérisseur)
    DB-->>API: OK
    API-->>F: 201 { bid }

    Note over API,DB: À expiration : état → terminee<br/>Transaction créée automatiquement
```

---

## 4. Flux négociation (machine à états)

```mermaid
stateDiagram-v2
    [*] --> en_attente : Acheteur soumet une offre
    en_attente --> contre_offre : Vendeur contre-propose
    en_attente --> accepte : Vendeur accepte
    en_attente --> refuse : Vendeur refuse
    contre_offre --> contre_offre : Acheteur contre-propose
    contre_offre --> accepte : L'une des parties accepte
    contre_offre --> refuse : L'une des parties refuse
    contre_offre --> expire : Délai dépassé (48h)
    en_attente --> expire : Délai dépassé (48h)
    accepte --> [*] : Transaction créée
    refuse --> [*]
    expire --> [*]
```

---

## 5. Schéma de base de données (résumé)

```mermaid
erDiagram
    users {
        int id PK
        string name
        string email
        string password_hash
        enum role
        timestamp created_at
    }
    products {
        int id PK
        int seller_id FK
        string title
        text description
        decimal price
        int stock
        enum category
        timestamp created_at
    }
    auctions {
        int id PK
        int product_id FK
        int seller_id FK
        decimal starting_price
        decimal current_price
        int current_winner_id FK
        enum status
        timestamp ends_at
    }
    auction_bids {
        int id PK
        int auction_id FK
        int bidder_id FK
        decimal amount
        timestamp created_at
    }
    negotiations {
        int id PK
        int product_id FK
        int buyer_id FK
        int seller_id FK
        decimal current_offer
        enum status
        timestamp expires_at
    }
    negotiations_messages {
        int id PK
        int negotiation_id FK
        int sender_id FK
        decimal offer_amount
        text message
        timestamp created_at
    }
    cart {
        int id PK
        int user_id FK
        timestamp created_at
    }
    cart_items {
        int id PK
        int cart_id FK
        int product_id FK
        int quantity
    }
    transactions {
        int id PK
        int buyer_id FK
        int seller_id FK
        int product_id FK
        decimal amount
        enum type
        timestamp created_at
    }
    notifications {
        int id PK
        int user_id FK
        string type
        text message
        boolean is_read
        timestamp created_at
    }

    users ||--o{ products : "vend"
    users ||--o{ auctions : "crée"
    users ||--o{ auction_bids : "enchérit"
    users ||--o{ negotiations : "acheteur"
    users ||--o{ negotiations : "vendeur"
    users ||--o{ cart : "possède"
    users ||--o{ transactions : "réalise"
    users ||--o{ notifications : "reçoit"
    products ||--o{ auctions : "mis en enchère"
    products ||--o{ negotiations : "négocié"
    products ||--o{ cart_items : "dans panier"
    auctions ||--o{ auction_bids : "reçoit"
    negotiations ||--o{ negotiations_messages : "contient"
    cart ||--o{ cart_items : "contient"
```
