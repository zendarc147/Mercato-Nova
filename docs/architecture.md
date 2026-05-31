# Mercato Nova — Architecture complète

## 1. Architecture globale

```mermaid
graph TB
    subgraph CLIENT["🖥️ Client — React + Vite + CSS classique  (Astrid)"]
        subgraph PAGES["Pages (18 routes)"]
            PUB["Accueil · Catalogue · Enchères · Détail produit · Fiche enchère"]
            AUTH_P["Connexion · Inscription · Profil"]
            TXN["Panier · Paiement · Négociation"]
            MKT["Mes négociations · Mes ventes · Mes enchères · Notifications"]
            PRO["Nouvelle annonce · Admin demandes · Admin utilisateurs"]
        end
        subgraph CTX["Contextes React"]
            ACTX["AuthContext\n(user, login, logout, register, refreshUser)"]
            CCTX["CartContext\n(cartCount, refreshCart)"]
            NCTX["NotificationContext\n(unreadCount, refreshNotifCount)"]
        end
        subgraph APICLI["api/ — appels fetch centralisés"]
            CLI["client.js\nfetch · CSRF token en mémoire"]
            MODS_F["auth · produits · encheres · negociations\npanier · profil · vendeurs · notifications · admin"]
        end
        subgraph HOOKS["Polling & timers"]
            POLL["Enchères : statut toutes les 3s"]
            TIMER["Timer compte à rebours : toutes les 1s"]
        end
    end

    subgraph BACKEND["⚙️ API REST — PHP 8 sans framework"]
        subgraph SHARED["Fonctions partagées"]
            CFG["setCorsHeaders() · configureSession() · getDB()"]
            MW["requireAuth() · requireRole()\ngenerateCsrfToken() · verifyCsrfToken()"]
            RESP["envoyerJSON()"]
        end
        subgraph MODS["Modules API  /api/"]
            M_AUTH["auth/\ncsrf · register · login · logout · me"]
            M_PROD["products/produits.php\nliste+filtres · détail · créer · modifier · supprimer"]
            M_PAN["panier/panier.php\nget · ajouter · supprimer item · vider"]
            M_ACH["achats/achats.php\ncommander · historique"]
            M_ENC["auctions/index.php + poll.php\ndétail · statut · offre · relance paiement"]
            M_NEG["negotiations/index.php\nliste · détail · créer · répondre"]
            M_NOT["notifications/index.php\nliste · lire · tout-lire"]
            M_PRF["profil/profil.php\nget · modifier · préférences"]
            M_VEN["vendeurs/demande.php\nsoumettre · consulter demande"]
            M_ADM["admin/users.php · admin/demandes.php\nutilisateurs · modération vendeurs"]
        end
    end

    subgraph DB["🗄️ Base de données MySQL  (Agnes)"]
        T1[("users\n+ statut")]
        T2[("produits")]
        T3[("encheres · offres_encheres")]
        T4[("negociations · echanges_negociation")]
        T5[("panier")]
        T6[("commandes · commande_items")]
        T7[("notifications")]
        T8[("demandes_vendeur")]
    end

    PAGES --> CTX
    PAGES --> APICLI
    PAGES --> HOOKS
    CTX --> CLI
    HOOKS --> CLI

    CLI -->|"HTTP · JSON\nX-CSRF-Token\ncredentials: include"| MODS

    MODS --> SHARED
    SHARED -->|"PDO prepared statements"| DB
```

> **Séparation stricte** : le frontend React ne touche jamais MySQL. Toute donnée transite par l'API PHP. Le CSRF token est transporté en header `X-CSRF-Token` sur chaque requête mutante (POST / PUT / PATCH / DELETE).

---

## 2. Pages frontend et navigation

| Route | Page | Accès | Description |
|---|---|---|---|
| `/` | Accueil | Public | Hero + recommandations personnalisées (préférences) + produits vus récemment |
| `/catalogue` | Catalogue | Public | Liste des produits, filtres prix/catégorie/état/type, tri, barre de recherche |
| `/encheres` | Enchères | Public | Liste des enchères avec filtres, timers live et polling statut (3s) |
| `/produit/:id` | Détail produit | Public | Fiche produit, galerie, boutons Acheter / Panier / Négocier selon `type_vente` |
| `/enchere/:produitId` | Fiche enchère | Public | Timer, historique offres, formulaire mise, relance paiement (vendeur) |
| `/login` | Connexion | Public (non connecté) | Formulaire login |
| `/register` | Inscription | Public (non connecté) | Formulaire multi-étapes : compte → préférences → demande vendeur optionnelle |
| `/profil` | Profil | Connecté | Infos, modification, préférences, demande vendeur, déconnexion |
| `/panier` | Panier | Connecté | Articles, quantités, total, lien vers paiement |
| `/paiement` | Paiement | Connecté | Récapitulatif + choix moyen de paiement (simulé). Accepte 3 chemins : panier / achat direct / enchère / négociation |
| `/negociation/:produitId` | Négociation | Connecté | Thread d'échanges, état courant, contre-offre / accepter / refuser |
| `/mes-negociations` | Mes négociations | Connecté | Liste acheteur + vendeur, indicateur de tour, gestion annonce (vendeur) |
| `/notifications` | Notifications | Connecté | Centre de notifications, marquer lu, tout marquer lu |
| `/mes-ventes` | Mes ventes | Vendeur | Annonces achat immédiat + négociation, CRUD, tri et filtres |
| `/mes-encheres` | Mes enchères | Vendeur | Annonces enchère, polling statut, rappel paiement acheteur |
| `/nouvelle-annonce` | Nouvelle annonce | Vendeur | Créer une annonce (3 types : achat immédiat · enchère · négociation) |
| `/admin/demandes` | Demandes vendeur | Admin | Modération des demandes vendeur (approuver / refuser) |
| `/admin/utilisateurs` | Gestion utilisateurs | Admin | Liste tous les comptes, changer rôle/statut, envoyer message, supprimer |

```mermaid
flowchart LR
    HOME["Accueil"] --> CAT["Catalogue"]
    HOME --> ENC_LIST["Enchères (liste)"]
    CAT --> PROD["Détail produit"]
    ENC_LIST --> ENC["Fiche enchère"]
    PROD -->|"achat_immediat"| PAN["Panier"]
    PROD -->|"achat_immediat"| PAY["Paiement"]
    PROD -->|"negociation"| NEG["Négociation"]
    ENC -->|"gagnant"| PAY
    NEG -->|"accepte"| PAY
    PAN --> PAY
    HOME --> CONN["Connexion / Inscription"]
    CONN --> HOME
    HOME --> PRF["Profil"]
    PRF -->|"admin"| ADM_D["Admin demandes"]
    PRF -->|"admin"| ADM_U["Admin utilisateurs"]
    PRF -->|"vendeur"| MV["Mes ventes"]
    PRF -->|"vendeur"| ME["Mes enchères"]
    PRF --> MN["Mes négociations"]
    PRF --> NOT["Notifications"]
```

---

## 3. Flux d'initialisation et d'authentification

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
        A->>DB: SELECT id, name, email, role, statut FROM users WHERE id = ?
        alt Compte actif
            A-->>F: 200 { id, name, email, role, statut, preferences }
            F->>F: setUser(user)
        else Compte suspendu ou banni
            A->>A: session_destroy()
            A-->>F: 403 { message }
            F->>F: setUser(null)
        end
    else Pas de session
        A-->>F: 401
        F->>F: setUser(null)
    end

    U->>F: Formulaire connexion
    F->>A: POST /auth/login.php  ← pas de CSRF (endpoint public)
    A->>DB: SELECT id, name, email, password, role, statut FROM users WHERE email = ?
    A->>A: password_verify()
    alt Compte suspendu
        A-->>F: 403 "Votre compte est suspendu."
    else Compte banni
        A-->>F: 403 "Votre compte a été banni définitivement."
    else Identifiants valides et compte actif
        A->>A: session_regenerate_id(true)
        A->>A: $_SESSION['user_id'] = id
        A->>A: generateCsrfToken()
        A-->>F: 200 { success, user, csrf_token }
        F->>F: setUser(user) + setCsrfToken(csrf_token)
    end

    U->>F: Bouton déconnexion
    F->>A: POST /auth/logout.php  [X-CSRF-Token]
    A->>A: verifyCsrfToken() + session_destroy()
    A-->>F: 200 { success }
    F->>F: setUser(null)
```

> `register.php` et `login.php` ne vérifient **pas** le CSRF — l'utilisateur n'a pas encore de session.

---

## 4. Flux catalogue et produits

```mermaid
sequenceDiagram
    actor U as Visiteur / Acheteur
    actor V as Vendeur
    participant F as React
    participant API as PHP /products/produits.php
    participant DB as MySQL

    U->>F: Accède à /catalogue (filtres, recherche, tri)
    F->>API: GET /products/produits.php?q=X&categorie=Y&prix_max=500&page=1&limit=20
    API->>DB: SELECT produits WHERE stock>0 AND ... ORDER BY created_at DESC LIMIT/OFFSET
    DB-->>API: liste paginée
    API-->>F: 200 { produits, total, page, pages }
    F->>F: Affiche les cartes produits

    U->>F: Clique sur un produit
    F->>API: GET /products/produits.php?id=42
    DB-->>API: produit complet
    API-->>F: 200 { produit }
    F->>F: Affiche la fiche avec le bon bouton (achat / négociation / enchère)

    V->>F: Crée une annonce (/nouvelle-annonce)
    F->>API: POST /products/produits.php  [CSRF + Auth vendeur]
    API->>API: verifyCsrfToken() + requireRole('vendeur','admin')
    API->>DB: BEGIN TRANSACTION
    API->>DB: INSERT produits (titre, prix, type_vente, stock, vendeur_id, ...)
    DB-->>API: produit_id
    alt type_vente = 'enchere'
        API->>DB: INSERT encheres (produit_id, prix_depart, etat, date_debut, date_fin)
    end
    API->>DB: COMMIT
    API-->>F: 201 { success, id }
```

**Filtres disponibles :** `q`, `categorie`, `prix_min`, `prix_max`, `type_vente`, `etat`, `page`, `limit` (max 50).

**Accès CRUD :** GET public · POST/PUT/DELETE réservés au vendeur propriétaire ou admin.

---

## 5. Flux panier et achat immédiat

```mermaid
sequenceDiagram
    actor U as Acheteur
    participant F as React
    participant API_PAN as PHP /panier/panier.php
    participant API_ACH as PHP /achats/achats.php
    participant DB as MySQL

    U->>F: "Ajouter au panier"
    F->>API_PAN: POST /panier/panier.php  [CSRF + Auth]
    API_PAN->>DB: INSERT/UPDATE panier (utilisateur_id, produit_id, quantite)
    API_PAN-->>F: 201 { success }
    F->>F: refreshCart() → badge mis à jour

    U->>F: Visite /panier
    F->>API_PAN: GET /panier/panier.php  [Auth]
    API_PAN->>DB: SELECT panier JOIN produits WHERE utilisateur_id = ?
    API_PAN-->>F: 200 { items, total }

    U->>F: "Commander" → /paiement → choisit moyen paiement
    F->>API_ACH: POST /achats/achats.php  [CSRF + Auth]
    API_ACH->>DB: BEGIN TRANSACTION
    API_ACH->>DB: SELECT panier JOIN produits (stock actuel)
    API_ACH->>API_ACH: Vérifie stock >= quantite pour chaque item
    API_ACH->>DB: INSERT commandes (utilisateur_id, total, statut='payee', moyen_paiement)
    loop Pour chaque item
        API_ACH->>DB: INSERT commande_items (commande_id, produit_id, quantite, prix_unitaire)
        API_ACH->>DB: UPDATE produits SET stock = stock - quantite
        API_ACH->>DB: INSERT notifications → vendeur (type='achat_vendeur')
    end
    API_ACH->>DB: DELETE panier WHERE utilisateur_id = ?
    API_ACH->>DB: INSERT notifications → acheteur (type='achat_confirme')
    API_ACH->>DB: COMMIT
    API_ACH-->>F: 201 { success, commande_id }
    F->>F: Affiche confirmation
```

> **Achat direct sans panier** (bouton "Acheter maintenant" sur la fiche produit) : le frontend ajoute d'abord le produit au panier via `POST /panier`, puis enchaîne avec `POST /achats`.

---

## 6. Flux enchères — polling toutes les 3s

Les transitions d'état sont calculées **à chaque lecture** via `transitionnerEtat()` — pas de cron.

```mermaid
sequenceDiagram
    actor V as Vendeur
    actor A as Acheteur
    participant F as React
    participant API as PHP /auctions/index.php
    participant DB as MySQL

    V->>F: Crée produit type_vente='enchere' (/nouvelle-annonce)
    Note over DB: INSERT produits + INSERT encheres\n(etat='en_attente'|'en_cours', date_debut, date_fin)

    loop Toutes les 3 secondes (polling)
        F->>API: GET /auctions/index.php?produit_id=X&action=statut
        API->>DB: SELECT encheres WHERE produit_id = ?
        API->>API: transitionnerEtat()\nen_attente→en_cours si date_debut passée\nen_cours→terminee si date_fin passée
        alt Transition détectée
            API->>DB: UPDATE encheres SET etat = ?
        end
        API-->>F: 200 { etat, meilleure_offre, meilleur_encherisseur_id, secondes_restantes }
        F->>F: Met à jour timer et mise actuelle
    end

    A->>F: Clique "Faire une offre" et valide
    F->>API: POST /auctions/index.php?produit_id=X&action=offre  [X-CSRF-Token]
    API->>API: verifyCsrfToken() + requireAuth()
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT encheres FOR UPDATE
    API->>API: Vérifie etat='en_cours' + montant > meilleure_offre + pas vendeur
    API->>DB: INSERT offres_encheres (enchere_id, utilisateur_id, montant)
    API->>DB: UPDATE encheres SET meilleure_offre, meilleur_encherisseur_id
    alt Ancien leader existait
        API->>DB: INSERT notifications (type='enchere_surenchere') → ancien leader
    end
    API->>DB: COMMIT
    API-->>F: 201 { success, nouvelle_meilleure_offre }

    Note over A,V: Enchère terminée — etat='terminee'

    V->>F: Clique "Notifier l'acheteur de payer"
    F->>API: POST /auctions/index.php?produit_id=X&action=relance_paiement  [CSRF]
    API->>DB: INSERT notifications (type='enchere_paiement') → gagnant
    API-->>F: 200 { success }

    A->>F: Reçoit notification → clique "Payer l'enchère" → /paiement
```

**États de l'enchère :** `en_attente` → `en_cours` → `terminee` | `annulee`

---

## 7. Flux négociation — machine à états

```mermaid
stateDiagram-v2
    [*] --> en_attente : Acheteur POST /negotiations\n(produit type_vente='negociation')
    en_attente --> contre_offre : Vendeur — contre_offre
    en_attente --> accepte : Vendeur — accepter
    en_attente --> refuse : Vendeur — refuser
    contre_offre --> contre_offre : L'autre partie — contre_offre
    contre_offre --> accepte : L'une des parties — accepter
    contre_offre --> refuse : L'une des parties — refuser
    en_attente --> expire : 48h sans réponse — détecté à la lecture\nnotification envoyée aux deux parties
    contre_offre --> expire : 48h sans réponse — détecté à la lecture\nnotification envoyée aux deux parties
    accepte --> [*] : Acheteur procède au paiement
    refuse --> [*]
    expire --> [*]
```

**Règle d'alternance** : `dernier_acteur` (`acheteur` | `vendeur`) empêche la même partie de répondre deux fois de suite.

**Expiration** : `expires_at = NOW() + 48h` — recalculé à chaque réponse. `transitionnerNegociation()` est appelée lors de chaque lecture (liste ET détail) et envoie une notification `negociation_expiree` aux deux parties si l'heure est dépassée.

**Transitions légales** vérifiées côté serveur (`transitionsLegales()`) :

| État courant | `contre_offre` | `accepter` | `refuser` |
|---|---|---|---|
| `en_attente` | → `contre_offre` | → `accepte` | → `refuse` |
| `contre_offre` | → `contre_offre` | → `accepte` | → `refuse` |

```mermaid
sequenceDiagram
    actor A as Acheteur
    actor V as Vendeur
    participant F as React
    participant API as PHP /negotiations/index.php
    participant DB as MySQL

    A->>F: /negociation/5 → propose 380€
    F->>API: POST /negotiations/index.php  [CSRF + Auth]
    API->>DB: INSERT negociations (etat='en_attente', derniere_offre=380, expires_at=NOW()+48h)
    API->>DB: INSERT echanges_negociation (auteur='acheteur', montant=380)
    API->>DB: INSERT notifications (type='negociation_nouvelle') → vendeur
    API-->>F: 201 { negociation_id }

    V->>F: Lit la négociation → contre-offre à 420€
    F->>API: POST /negotiations/index.php?id=9&action=repondre
    API->>API: transitionnerNegociation() — vérifie expires_at
    API->>API: Vérifie tour (dernier_acteur='acheteur' → vendeur peut répondre)
    API->>DB: INSERT echanges_negociation (auteur='vendeur', montant=420)
    API->>DB: UPDATE negociations SET etat='contre_offre', expires_at=NOW()+48h
    API->>DB: INSERT notifications (type='negociation_reponse') → acheteur
    API-->>F: 200 { success, etat: 'contre_offre' }

    A->>F: Accepte l'offre
    F->>API: POST /negotiations/index.php?id=9&action=repondre  { action: 'accepter' }
    API->>DB: UPDATE negociations SET etat='accepte'
    API->>DB: INSERT notifications (type='negociation_reponse') → vendeur
    API-->>F: 200 { success, etat: 'accepte' }
    F->>F: Affiche lien "Passer au paiement →"
```

---

## 8. Notifications

Les notifications sont **insérées par le backend** lors d'événements métier. Le frontend les consomme au chargement et après chaque action.

| Type | Déclencheur | Destinataire |
|---|---|---|
| `enchere_surenchere` | Quelqu'un surenchérit | Ancien meilleur enchérisseur |
| `enchere_paiement` | Vendeur relance le gagnant | Gagnant de l'enchère |
| `negociation_nouvelle` | Acheteur initie une négociation | Vendeur |
| `negociation_reponse` | Contre-offre / acceptation / refus | L'autre partie |
| `negociation_expiree` | 48h sans réponse | Acheteur ET vendeur |
| `achat_confirme` | Commande validée | Acheteur |
| `achat_vendeur` | Commande validée (groupé par vendeur) | Chaque vendeur concerné |
| `message_admin` | Admin envoie un message depuis /admin/utilisateurs | Utilisateur ciblé |

```mermaid
sequenceDiagram
    participant F as React (Navbar / NotificationContext)
    participant API as PHP /notifications/index.php
    participant DB as MySQL

    Note over F: Montage → init unreadCount
    F->>API: GET /notifications/index.php  [Auth]
    API->>DB: SELECT notifications WHERE utilisateur_id = ? ORDER BY created_at DESC LIMIT 30
    DB-->>API: liste
    API-->>F: 200 { notifications: [...], non_lues: 3 }
    F->>F: Affiche badge et liste

    F->>API: POST /notifications/index.php?id=7  [CSRF + Auth]
    API->>DB: UPDATE notifications SET lu = 1 WHERE id = 7 AND utilisateur_id = ?
    API-->>F: 200 { success }
    F->>F: refreshNotifCount()

    F->>API: POST /notifications/index.php?action=tout_lire  [CSRF + Auth]
    API->>DB: UPDATE notifications SET lu = 1 WHERE utilisateur_id = ?
    API-->>F: 200 { success }
```

---

## 9. Administration

### 9.1 Modération des demandes vendeur

```mermaid
sequenceDiagram
    actor U as Acheteur
    actor ADM as Admin
    participant F as React
    participant API_V as PHP /vendeurs/demande.php
    participant API_ADM as PHP /admin/demandes.php
    participant DB as MySQL

    U->>F: Profil → "Être Vendeur" → remplit formulaire
    F->>API_V: POST /vendeurs/demande.php  [CSRF + Auth]
    API_V->>DB: INSERT demandes_vendeur (etat='en_attente', ...)
    API_V-->>F: 201 { success }

    ADM->>F: /admin/demandes → voit les demandes en attente
    F->>API_ADM: GET /admin/demandes.php  [Auth admin]
    API_ADM->>DB: SELECT demandes_vendeur JOIN users ORDER BY etat, created_at
    API_ADM-->>F: 200 { demandes: [...] }

    ADM->>F: Clique "Approuver"
    F->>API_ADM: PATCH /admin/demandes.php  { id, action: 'approuver' }  [CSRF + Auth admin]
    API_ADM->>DB: BEGIN TRANSACTION
    API_ADM->>DB: UPDATE demandes_vendeur SET etat='approuve'
    API_ADM->>DB: UPDATE users SET role='vendeur' WHERE id = user_id
    API_ADM->>DB: COMMIT
    API_ADM-->>F: 200 { success, etat: 'approuve' }
```

### 9.2 Gestion des utilisateurs

```mermaid
sequenceDiagram
    actor ADM as Admin
    participant F as React (/admin/utilisateurs)
    participant API as PHP /admin/users.php
    participant DB as MySQL

    ADM->>F: Charge la liste
    F->>API: GET /admin/users.php  [Auth admin]
    API->>DB: SELECT id, name, email, role, statut, created_at FROM users
    API-->>F: 200 [{ id, name, email, role, statut, created_at }, ...]

    ADM->>F: Sélectionne un utilisateur → change son rôle
    F->>API: PATCH /admin/users.php  { id, role: 'vendeur' }  [CSRF + Auth admin]
    API->>API: Vérifie pas soi-même + id valide + role valide
    API->>DB: UPDATE users SET role = 'vendeur' WHERE id = ?
    API-->>F: 200 { success }

    ADM->>F: Suspend le compte
    F->>API: PATCH /admin/users.php  { id, statut: 'suspendu' }  [CSRF + Auth admin]
    API->>DB: UPDATE users SET statut = 'suspendu' WHERE id = ?
    API-->>F: 200 { success }

    ADM->>F: Envoie un message
    F->>API: POST /admin/users.php  { user_id, message }  [CSRF + Auth admin]
    API->>DB: INSERT notifications (type='message_admin', message)
    API-->>F: 200 { success }

    ADM->>F: Supprime le compte (hors admins)
    F->>API: DELETE /admin/users.php?id=X  [CSRF + Auth admin]
    API->>API: Vérifie pas soi-même + pas admin cible
    API->>DB: DELETE FROM users WHERE id = ?  ← CASCADE sur les relations
    API-->>F: 200 { success }
```

---

## 10. Cycle de vie d'un compte utilisateur

```mermaid
stateDiagram-v2
    [*] --> actif : Inscription (register)
    actif --> suspendu : Admin — PATCH statut=suspendu
    suspendu --> actif : Admin — PATCH statut=actif
    actif --> banni : Admin — PATCH statut=banni
    banni --> actif : Admin — PATCH statut=actif
    suspendu --> banni : Admin — PATCH statut=banni
    actif --> [*] : Admin — DELETE (hors admins)
    suspendu --> [*] : Admin — DELETE
```

**Effets immédiats d'une suspension ou d'un ban :**
- `POST /auth/login.php` → 403 avec message explicite (connexion impossible)
- `GET /auth/me.php` → si session active, la session est détruite + 403 (déconnexion forcée au prochain rafraîchissement)
- Toutes les routes protégées deviennent inaccessibles

---

## 11. Schéma de base de données complet

```mermaid
erDiagram
    users {
        int id PK
        string name
        string email
        string password
        enum role "acheteur|vendeur|admin"
        enum statut "actif|suspendu|banni"
        string preferences "JSON"
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
        timestamp expires_at "NOW() + 48h"
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
        int utilisateur_id FK
        int produit_id FK
        int quantite
        timestamp created_at
        UNIQUE "utilisateur_id, produit_id"
    }
    commandes {
        int id PK
        int utilisateur_id FK
        decimal total
        enum statut "payee|annulee|remboursee"
        enum moyen_paiement "carte|paypal|virement"
        timestamp created_at
    }
    commande_items {
        int id PK
        int commande_id FK
        int produit_id FK
        int quantite
        decimal prix_unitaire
    }
    notifications {
        int id PK
        int utilisateur_id FK
        string type
        text message
        tinyint lu
        timestamp created_at
    }
    demandes_vendeur {
        int id PK
        int user_id FK "UNIQUE"
        string nom_boutique
        text description
        string categories "JSON"
        string experience
        string site_web
        string telephone
        text motivation
        enum etat "en_attente|approuve|refuse"
        timestamp created_at
        timestamp updated_at
    }

    users ||--o{ produits : "vend"
    users ||--o{ offres_encheres : "enchérit"
    users ||--o{ negociations : "acheteur"
    users ||--o{ negociations : "vendeur"
    users ||--o{ panier : "possède"
    users ||--o{ commandes : "passe"
    users ||--o{ notifications : "reçoit"
    users ||--o| demandes_vendeur : "soumet"
    produits ||--o| encheres : "a une enchère"
    produits ||--o{ negociations : "négocié"
    produits ||--o{ panier : "dans panier"
    produits ||--o{ commande_items : "acheté"
    encheres ||--o{ offres_encheres : "reçoit"
    encheres }o--o| users : "meilleur enchérisseur"
    negociations ||--o{ echanges_negociation : "contient"
    commandes ||--o{ commande_items : "contient"
```

---

## 12. Sécurité — récapitulatif

| Endpoint | Auth | CSRF | Rôle requis |
|---|---|---|---|
| `GET /auth/csrf` | Non | Non | — |
| `POST /auth/register` | Non | Non | — |
| `POST /auth/login` | Non | Non | — |
| `POST /auth/logout` | Oui | Oui | — |
| `GET /auth/me` | Oui | Non | — |
| `GET /products/produits.php` | Non | Non | — |
| `POST/PUT/DELETE /products/produits.php` | Oui | Oui | vendeur, admin |
| `GET /auctions/index.php` (détail/statut) | Non | Non | — |
| `POST /auctions/index.php` (offre/relance) | Oui | Oui | — |
| `GET /negotiations/index.php` | Oui | Non | — |
| `POST /negotiations/index.php` | Oui | Oui | — |
| `GET/POST /panier/panier.php` | Oui | POST : Oui | — |
| `DELETE /panier/panier.php` | Oui | Oui | — |
| `GET/POST /achats/achats.php` | Oui | POST : Oui | — |
| `GET/PUT /profil/profil.php` | Oui | PUT : Oui | — |
| `GET/POST /notifications/index.php` | Oui | POST : Oui | — |
| `GET/POST /vendeurs/demande.php` | Oui | POST : Oui | — |
| `GET /admin/users.php` | Oui | Non | admin |
| `POST/PATCH/DELETE /admin/users.php` | Oui | Oui | admin |
| `GET /admin/demandes.php` | Oui | Non | admin |
| `PATCH /admin/demandes.php` | Oui | Oui | admin |

**Protections spécifiques admin :**
- `PATCH /admin/users.php` : impossible de modifier son propre compte
- `DELETE /admin/users.php` : impossible de supprimer un admin ou son propre compte
- Mots de passe : `password_hash()` / `password_verify()` (bcrypt)
- CSRF : `hash_equals()` (comparaison timing-safe)
- SQL : PDO prepared statements sur toutes les requêtes
- Sessions : `session_regenerate_id()` à chaque login
