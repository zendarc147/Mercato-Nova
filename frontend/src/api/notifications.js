import { api } from './client'

// Appels API pour afficher et marquer les notifications comme lues.
export async function getNotifications() {
  return await api.get('/notifications/index.php')
}

export async function marquerLue(id) {
  return await api.post(`/notifications/index.php?id=${id}`, {})
}

export async function marquerToutesLues() {
  return await api.post('/notifications/index.php?action=tout_lire', {})
}
