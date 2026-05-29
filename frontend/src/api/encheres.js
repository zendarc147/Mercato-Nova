import { api } from './client'

const MOCK_ENCHERES = {
  2: {
    id: 1,
    produit_id: 2,
    prix_depart: 850,
    meilleure_offre: 980,
    meilleur_encherisseur: { id: 4, nom: 'Lena Martin' },
    etat: 'en_cours',
    date_fin: futureDate(2),
    historique: [],
  },
  6: {
    id: 2,
    produit_id: 6,
    prix_depart: 290,
    meilleure_offre: 360,
    meilleur_encherisseur: { id: 9, nom: 'Lucas Bernard' },
    etat: 'en_cours',
    date_fin: futureDate(5),
    historique: [],
  },
}

function futureDate(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

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
