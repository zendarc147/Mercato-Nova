# Mercato Nova — Contrat API REST

Base URL : `http://localhost/mercato-nova/backend/api`

Toutes les réponses sont en **JSON**. Les requêtes avec body envoient du **JSON** (`Content-Type: application/json`).

---

## Conventions

| Élément | Convention |
|---|---|
| Auth requise | `🔒` dans le titre |
| Rôle vendeur requis | `🏪` |
| Rôle admin requis | `🛡️` |
| Corps de requête | `Body` |
| Réponse succès | `200` / `201` |
| Non authentifié | `401` |
| Interdit (mauvais rôle) | `403` |
| Non trouvé | `404` |
| Erreur serveur | `500` |

Les requêtes POST/PUT/DELETE doivent inclure le token CSRF dans le header :
```
X-CSRF-Token: <token>
```
Le token est fourni à la connexion et via `GET /auth/csrf`.

---

## 1. Authentification

### `POST /auth/register`
Inscription d'un nouvel utilisateur.

**Body**
```json
{
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean@example.com",
  "mot_de_passe": "MonMotDePasse1!",
  "role": "acheteur"
}
```
`role` : `"acheteur"` | `"vendeur"`

**Réponse 201**
```json
{
  "success": true,
  "message": "Compte créé avec succès",
  "user": { "id": 1, "nom": "Dupont", "prenom": "Jean", "email": "jean@example.com", "role": "acheteur" }
}
```
**Erreurs** : `400` email déjà utilisé / champs manquants

---

### `POST /auth/login`
Connexion.

**Body**
```json
{
  "email": "jean@example.com",
  "mot_de_passe": "MonMotDePasse1!"
}
```

**Réponse 200**
```json
{
  "success": true,
  "user": { "id": 1, "nom": "Dupont", "prenom": "Jean", "email": "jean@example.com", "role": "acheteur" },
  "csrf_token": "abc123xyz"
}
```
**Erreurs** : `401` identifiants invalides

---

### `POST /auth/logout` 🔒
Déconnexion. Détruit la session.

**Réponse 200**
```json
{ "success": true }
```

---

### `GET /auth/me` 🔒
Retourne l'utilisateur connecté (vérifie la session).

**Réponse 200**
```json
{
  "id": 1,
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean@example.com",
  "role": "acheteur"
}
```
**Erreurs** : `401` si pas de session active

---

### `GET /auth/csrf`
Génère et retourne un nouveau token CSRF.

**Réponse 200**
```json
{ "csrf_token": "abc123xyz" }
```

---

## 2. Catalogue

### `GET /produits`
Liste les produits avec recherche et filtres optionnels.

**Query params**
| Param | Type | Description |
|---|---|---|
| `q` | string | Recherche full-text (nom, description) |
| `categorie` | string | Filtre par catégorie |
| `prix_min` | number | Prix minimum |
| `prix_max` | number | Prix maximum |
| `type_vente` | string | `achat_immediat` \| `enchere` \| `negociation` |
| `etat` | string | `neuf` \| `bon_etat` \| `correct` \| `mauvais_etat` |
| `page` | int | Pagination (défaut : 1) |
| `limit` | int | Résultats par page (défaut : 20, max : 50) |

**Réponse 200**
```json
{
  "produits": [
    {
      "id": 1,
      "titre": "iPhone 13",
      "description": "Très bon état",
      "prix": 450.00,
      "categorie": "Téléphones",
      "etat": "bon_etat",
      "type_vente": "achat_immediat",
      "stock": 2,
      "vendeur": { "id": 5, "nom": "Martin" },
      "image_url": "/uploads/produits/1.jpg",
      "created_at": "2026-05-20T10:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "pages": 3
}
```

---

### `GET /produits/{id}`
Détail d'un produit.

**Réponse 200**
```json
{
  "id": 1,
  "titre": "iPhone 13",
  "description": "Très bon état, vendu avec chargeur",
  "prix": 450.00,
  "categorie": "Téléphones",
  "etat": "bon_etat",
  "type_vente": "achat_immediat",
  "stock": 2,
  "vendeur": { "id": 5, "nom": "Martin", "prenom": "Paul" },
  "image_url": "/uploads/produits/1.jpg",
  "created_at": "2026-05-20T10:00:00Z"
}
```
**Erreurs** : `404` produit inexistant

---

### `POST /produits` 🔒 🏪
Créer une annonce.

**Body**
```json
{
  "titre": "iPhone 13",
  "description": "Très bon état",
  "prix": 450.00,
  "categorie": "Téléphones",
  "etat": "bon_etat",
  "type_vente": "achat_immediat",
  "stock": 1
}
```

**Réponse 201**
```json
{ "success": true, "id": 42 }
```

---

### `PUT /produits/{id}` 🔒 🏪
Modifier une annonce (vendeur propriétaire uniquement).

**Body** : mêmes champs que POST, tous optionnels.

**Réponse 200**
```json
{ "success": true }
```
**Erreurs** : `403` si pas propriétaire

---

### `DELETE /produits/{id}` 🔒 🏪
Supprimer une annonce.

**Réponse 200**
```json
{ "success": true }
```

---

## 3. Panier

### `GET /panier` 🔒
Récupère le panier de l'utilisateur connecté.

**Réponse 200**
```json
{
  "items": [
    { "id": 1, "produit_id": 3, "titre": "iPhone 13", "prix": 450.00, "quantite": 1, "image_url": "..." }
  ],
  "total": 450.00
}
```

---

### `POST /panier` 🔒
Ajouter un produit au panier.

**Body**
```json
{ "produit_id": 3, "quantite": 1 }
```

**Réponse 201**
```json
{ "success": true }
```
**Erreurs** : `400` stock insuffisant

---

### `DELETE /panier/{produit_id}` 🔒
Retirer un produit du panier.

**Réponse 200**
```json
{ "success": true }
```

---

### `DELETE /panier` 🔒
Vider tout le panier.

**Réponse 200**
```json
{ "success": true }
```

---

## 4. Achat immédiat

### `POST /achats` 🔒
Valider l'achat du panier (paiement simulé).

**Body**
```json
{
  "moyen_paiement": "carte"
}
```
`moyen_paiement` : `"carte"` | `"paypal"` | `"virement"`

**Réponse 201**
```json
{
  "success": true,
  "commande_id": 12,
  "message": "Paiement simulé accepté"
}
```
**Erreurs** : `400` panier vide / stock insuffisant

---

### `GET /achats` 🔒
Historique des commandes de l'acheteur connecté.

**Réponse 200**
```json
{
  "commandes": [
    {
      "id": 12,
      "date": "2026-05-26T14:00:00Z",
      "total": 450.00,
      "statut": "payee",
      "items": [
        { "produit_id": 3, "titre": "iPhone 13", "prix": 450.00, "quantite": 1 }
      ]
    }
  ]
}
```

---

## 5. Enchères

### `GET /encheres/{produit_id}`
Détail d'une enchère (état, offres, temps restant).

**Réponse 200**
```json
{
  "id": 7,
  "produit_id": 5,
  "prix_depart": 100.00,
  "meilleure_offre": 145.00,
  "meilleur_encherisseur": { "id": 3, "nom": "Durand" },
  "etat": "en_cours",
  "date_fin": "2026-05-28T18:00:00Z",
  "historique": [
    { "utilisateur_id": 3, "nom": "Durand", "montant": 145.00, "date": "2026-05-26T12:00:00Z" },
    { "utilisateur_id": 8, "nom": "Bernard", "montant": 120.00, "date": "2026-05-26T11:00:00Z" }
  ]
}
```
`etat` : `"en_attente"` | `"en_cours"` | `"terminee"` | `"annulee"`

---

### `POST /encheres/{produit_id}/offre` 🔒
Placer une offre sur une enchère.

**Body**
```json
{ "montant": 150.00 }
```

**Réponse 201**
```json
{ "success": true, "nouvelle_meilleure_offre": 150.00 }
```
**Erreurs** : `400` montant trop bas / enchère terminée

---

### `GET /encheres/{produit_id}/statut`
Polling léger — retourne uniquement l'état courant (appelé toutes les 3s par le frontend).

**Réponse 200**
```json
{
  "etat": "en_cours",
  "meilleure_offre": 150.00,
  "meilleur_encherisseur_id": 3,
  "secondes_restantes": 3420
}
```

---

## 6. Négociation

### `POST /negociations` 🔒
Initier une négociation sur un produit.

**Body**
```json
{ "produit_id": 5, "prix_propose": 380.00, "message": "Je vous propose 380€" }
```

**Réponse 201**
```json
{ "success": true, "negociation_id": 9 }
```

---

### `GET /negociations/{id}` 🔒
Détail d'une négociation (thread complet).

**Réponse 200**
```json
{
  "id": 9,
  "produit": { "id": 5, "titre": "iPhone 13", "prix_initial": 450.00 },
  "acheteur": { "id": 1, "nom": "Dupont" },
  "vendeur": { "id": 5, "nom": "Martin" },
  "etat": "contre_offre",
  "echanges": [
    { "auteur": "acheteur", "montant": 380.00, "message": "Je vous propose 380€", "date": "2026-05-26T10:00:00Z" },
    { "auteur": "vendeur", "montant": 420.00, "message": "Je peux faire 420€", "date": "2026-05-26T11:00:00Z" }
  ]
}
```
`etat` : `"en_attente"` | `"contre_offre"` | `"accepte"` | `"refuse"` | `"expire"`

---

### `POST /negociations/{id}/repondre` 🔒
Répondre à une négociation (contre-offre, acceptation ou refus).

**Body**
```json
{
  "action": "contre_offre",
  "prix_propose": 420.00,
  "message": "Je peux faire 420€"
}
```
`action` : `"contre_offre"` | `"accepter"` | `"refuser"`

**Réponse 200**
```json
{ "success": true, "etat": "contre_offre" }
```
**Erreurs** : `403` si pas partie prenante / `400` si état ne permet pas cette action

---

### `GET /negociations` 🔒
Liste des négociations de l'utilisateur connecté (acheteur ou vendeur).

**Réponse 200**
```json
{
  "negociations": [
    { "id": 9, "produit_titre": "iPhone 13", "etat": "contre_offre", "derniere_offre": 420.00, "updated_at": "2026-05-26T11:00:00Z" }
  ]
}
```

---

## 7. Notifications

### `GET /notifications` 🔒
Liste des notifications de l'utilisateur.

**Réponse 200**
```json
{
  "notifications": [
    { "id": 1, "type": "enchere_surenchere", "message": "Vous avez été surenchéri sur iPhone 13", "lu": false, "created_at": "2026-05-26T12:00:00Z" },
    { "id": 2, "type": "negociation_reponse", "message": "Réponse reçue pour votre négociation", "lu": true, "created_at": "2026-05-26T11:00:00Z" }
  ],
  "non_lues": 1
}
```

---

### `PUT /notifications/{id}/lire` 🔒
Marquer une notification comme lue.

**Réponse 200**
```json
{ "success": true }
```

---

### `PUT /notifications/lire-tout` 🔒
Marquer toutes les notifications comme lues.

**Réponse 200**
```json
{ "success": true }
```

---

## 8. Profil utilisateur

### `GET /profil` 🔒
Récupère le profil complet de l'utilisateur connecté.

**Réponse 200**
```json
{
  "id": 1,
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean@example.com",
  "role": "acheteur",
  "created_at": "2026-05-01T00:00:00Z"
}
```

---

### `PUT /profil` 🔒
Modifier le profil.

**Body**
```json
{
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean@example.com",
  "mot_de_passe": "NouveauMotDePasse1!"
}
```
Tous les champs sont optionnels.

**Réponse 200**
```json
{ "success": true }
```

---

## Codes d'erreur standard

Toutes les erreurs suivent ce format :
```json
{
  "success": false,
  "error": "Message d'erreur lisible"
}
```

| Code | Signification |
|---|---|
| `400` | Données invalides / règle métier violée |
| `401` | Non authentifié |
| `403` | Accès interdit (mauvais rôle ou pas propriétaire) |
| `404` | Ressource introuvable |
| `409` | Conflit (ex: email déjà pris) |
| `500` | Erreur serveur interne |
