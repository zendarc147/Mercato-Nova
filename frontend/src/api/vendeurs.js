import { api } from './client'

export const soumettreDemandeVendeur = (data) => api.post('/vendeurs/demande.php', data)
export const getDemandeVendeur = () => api.get('/vendeurs/demande.php')
