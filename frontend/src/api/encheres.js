import { api } from './client'

// Donnees de secours utilisees si le backend enchere n'est pas encore disponible.
const MOCK_ENCHERES = {
  2: {
    id: 1,
    produit_id: 2,
    prix_depart: 850,
    meilleure_offre: 980,
    meilleur_encherisseur: { id: 4, nom: 'Lena Martin' },
    etat: 'en_cours',
    date_fin: futureDate(2),
    historique: [
      { utilisateur_id: 4, nom: 'Lena Martin', montant: 980, date: new Date().toISOString() },
      { utilisateur_id: 3, nom: 'Camille Durand', montant: 900, date: new Date().toISOString() },
    ],
  },
  6: {
    id: 2,
    produit_id: 6,
    prix_depart: 290,
    meilleure_offre: 360,
    meilleur_encherisseur: { id: 9, nom: 'Lucas Bernard' },
    etat: 'en_cours',
    date_fin: futureDate(5),
    historique: [
      { utilisateur_id: 9, nom: 'Lucas Bernard', montant: 360, date: new Date().toISOString() },
      { utilisateur_id: 11, nom: 'Ryo Tanaka', montant: 330, date: new Date().toISOString() },
    ],
  },
}

// Genere une date future pour que les encheres mockees aient un compte a rebours visible.
function futureDate(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

// Recupere une enchere mockee stable a partir de l'id du produit.
function getMockEnchere(produitId) {
  const id = Number(produitId)
  return MOCK_ENCHERES[id] ?? {
    id,
    produit_id: id,
    prix_depart: 0,
    meilleure_offre: null,
    meilleur_encherisseur: null,
    etat: 'en_cours',
    date_fin: futureDate(3),
    historique: [],
  }
}

// Transforme le detail d'une enchere en resume leger pour l'affichage rapide.
function statusFromDetail(enchere) {
  const dateFin = enchere?.date_fin ? new Date(enchere.date_fin).getTime() : Date.now()
  return {
    etat: enchere?.etat ?? 'en_cours',
    meilleure_offre: enchere?.meilleure_offre ?? null,
    meilleur_encherisseur_id: enchere?.meilleur_encherisseur?.id ?? null,
    secondes_restantes: Math.max(0, Math.floor((dateFin - Date.now()) / 1000)),
    date_fin: enchere?.date_fin ?? null,
  }
}

// Charge le detail complet d'une enchere, puis tombe sur le mock si l'API echoue.
export async function getEnchere(produitId) {
  try {
    return await api.get(`/encheres/${produitId}`)
  } catch {
    try {
      return await api.get(`/auctions/index.php?produit_id=${produitId}`)
    } catch {
      return getMockEnchere(produitId)
    }
  }
}

// Appel plus leger utilise pour le polling toutes les 3 secondes.
export async function getEnchereStatut(produitId) {
  try {
    return await api.get(`/encheres/${produitId}/statut`)
  } catch {
    try {
      return await api.get(`/auctions/index.php?produit_id=${produitId}&action=statut`)
    } catch {
      try {
        return await api.get(`/auctions/poll.php?produit_id=${produitId}`)
      } catch {
        return statusFromDetail(getMockEnchere(produitId))
      }
    }
  }
}

// Envoie une nouvelle offre au backend.
export async function placerOffre(produitId, montant) {
  try {
    return await api.post(`/encheres/${produitId}/offre`, { montant })
  } catch {
    return await api.post(`/auctions/index.php?produit_id=${produitId}&action=offre`, { montant })
  }
}

// Demande au backend de notifier le gagnant qu'il doit payer son enchere.
export async function relancerPaiementEnchere(produitId) {
  try {
    return await api.post(`/encheres/${produitId}/relance-paiement`, {})
  } catch {
    return await api.post(`/auctions/index.php?produit_id=${produitId}&action=relance_paiement`, {})
  }
}
