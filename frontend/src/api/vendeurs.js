import { api } from './client'

// Appels API pour demander le role vendeur et connaitre l'etat de la demande.
export const soumettreDemandeVendeur = (data) => api.post('/vendeurs/demande.php', data)
export const getDemandeVendeur = () => api.get('/vendeurs/demande.php')
