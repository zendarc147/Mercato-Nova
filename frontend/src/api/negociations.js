import { api } from './client'

// Appels API pour lire, creer et faire avancer une negociation.
export async function getNegociations() {
  return await api.get('/negotiations/index.php')
}

export async function getNegociation(id) {
  return await api.get(`/negotiations/index.php?id=${id}`)
}

export async function creerNegociation(produit_id, prix_propose, message) {
  return await api.post('/negotiations/index.php', { produit_id, prix_propose, message })
}

export async function repondreNegociation(id, action, prix_propose, message) {
  return await api.post(`/negotiations/index.php?id=${id}&action=repondre`, { action, prix_propose, message })
}
