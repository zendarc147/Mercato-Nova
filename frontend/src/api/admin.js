import { api } from './client'

// Appels reserves a l'admin : demandes vendeur, utilisateurs, roles et notifications.
export const getDemandesVendeur = () => api.get('/admin/demandes.php')
export const traiterDemandeVendeur = (id, action) =>
  api.patch('/admin/demandes.php', { id, action })

export const getUsers = () => api.get('/admin/users.php')
export const notifierUser = (user_id, message) =>
  api.post('/admin/users.php', { user_id, message })
export const changerRoleUser = (id, role) =>
  api.patch('/admin/users.php', { id, role })
export const changerStatutUser = (id, statut) =>
  api.patch('/admin/users.php', { id, statut })
export const supprimerUser = (id) =>
  api.delete(`/admin/users.php?id=${id}`)
