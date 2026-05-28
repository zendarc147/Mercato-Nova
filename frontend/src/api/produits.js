import { api } from './client'

const MOCK_PRODUITS = [
  { id: 1, titre: 'Buste en marbre blanc', prix: '1200.00', categorie: 'Sculpture', type_vente: 'achat_immediat', vendeur: { nom: 'Kudo Shinichi' } },
  { id: 2, titre: 'Toile abstraite — Série Feu', prix: '850.00', categorie: 'Peinture', type_vente: 'enchere', vendeur: { nom: 'Kudo Shinichi' } },
  { id: 3, titre: 'Statue en bronze — Danseur', prix: '3200.00', categorie: 'Sculpture', type_vente: 'negociation', vendeur: { nom: 'Kudo Shinichi' } },
  { id: 4, titre: 'Gravure sur bois — Forêt', prix: '320.00', categorie: 'Gravure', type_vente: 'achat_immediat', vendeur: { nom: 'Kudo Shinichi' } },
]

export async function getProduits(params = {}) {
  try {
    const qs = new URLSearchParams(params).toString()
    return await api.get(qs ? `/produits?${qs}` : '/produits')
  } catch {
    return { produits: MOCK_PRODUITS }
  }
}

export async function getProduit(id) {
  try {
    return await api.get(`/produits/${id}`)
  } catch {
    return MOCK_PRODUITS.find((p) => p.id === Number(id)) ?? null
  }
}
