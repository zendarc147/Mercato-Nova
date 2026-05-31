import { api } from './client'

// Appels API pour consulter le panier, le modifier et valider le paiement simule.
export async function getCart() {
  return await api.get('/panier/panier.php')
}

export async function addToCart(produit_id, quantite = 1) {
  return await api.post('/panier/panier.php', { produit_id, quantite })
}

export async function removeFromCart(produit_id) {
  return await api.delete(`/panier/panier.php?produit_id=${produit_id}`)
}

export async function clearCart() {
  return await api.delete('/panier/panier.php')
}

export async function checkout(moyen_paiement) {
  return await api.post('/achats/achats.php', { moyen_paiement })
}
