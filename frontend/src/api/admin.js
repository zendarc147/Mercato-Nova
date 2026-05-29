import { api } from './client'

export const getDemandesVendeur = () => api.get('/admin/demandes.php')
export const traiterDemandeVendeur = (id, action) =>
  api.patch('/admin/demandes.php', { id, action })
