import { api } from './client'

const MOCK_PRODUITS = [
  { id: 1, titre: 'Buste en marbre blanc', description: 'Sculpture neoclassique en marbre de Carrare.', prix: '1200.00', categorie: 'Sculpture', etat: 'bon_etat', type_vente: 'achat_immediat', stock: 1, vendeur: { nom: 'Kudo Shinichi' }, created_at: '2026-05-24T10:00:00Z' },
  { id: 2, titre: 'Toile abstraite - Serie Feu', description: 'Huile sur toile signee aux tons ocre et mauve.', prix: '850.00', categorie: 'Peinture', etat: 'neuf', type_vente: 'enchere', stock: 1, vendeur: { nom: 'Kudo Shinichi' }, created_at: '2026-05-27T09:30:00Z' },
  { id: 3, titre: 'Statue en bronze - Danseur', description: 'Bronze patine, edition limitee.', prix: '3200.00', categorie: 'Sculpture', etat: 'bon_etat', type_vente: 'negociation', stock: 1, vendeur: { nom: 'Kudo Shinichi' }, created_at: '2026-05-22T16:45:00Z' },
  { id: 4, titre: 'Gravure sur bois - Foret', description: 'Tirage unique encadre.', prix: '320.00', categorie: 'Gravure', etat: 'correct', type_vente: 'achat_immediat', stock: 2, vendeur: { nom: 'Kudo Shinichi' }, created_at: '2026-05-20T12:00:00Z' },
  { id: 5, titre: 'Collier emaille miel', description: 'Bijou artisanal inspire des brocantes italiennes.', prix: '180.00', categorie: 'Joaillerie et accessoires', etat: 'neuf', type_vente: 'achat_immediat', stock: 1, vendeur: { nom: 'Atelier Nova' }, created_at: '2026-05-28T08:15:00Z' },
  { id: 6, titre: 'Fauteuil de salon 1930', description: 'Mobilier restaure avec tissu vert profond.', prix: '1450.00', categorie: 'Mobilier d exception', etat: 'bon_etat', type_vente: 'negociation', stock: 1, vendeur: { nom: 'Maison Verde' }, created_at: '2026-05-25T14:20:00Z' },
]

function filterMockProduits(params) {
  const query = String(params.q ?? '').trim().toLowerCase()
  const prixMin = params.prix_min === undefined || params.prix_min === '' ? null : Number(params.prix_min)
  const prixMax = params.prix_max === undefined || params.prix_max === '' ? null : Number(params.prix_max)

  return MOCK_PRODUITS.filter((produit) => {
    const prix = Number(produit.prix)
    const matchesQuery = !query
      || produit.titre.toLowerCase().includes(query)
      || produit.description.toLowerCase().includes(query)

    return matchesQuery
      && (!params.categorie || produit.categorie === params.categorie)
      && (!params.type_vente || produit.type_vente === params.type_vente)
      && (!params.etat || produit.etat === params.etat)
      && (prixMin === null || prix >= prixMin)
      && (prixMax === null || prix <= prixMax)
  })
}

export async function getProduits(params = {}) {
  const qs = new URLSearchParams(params).toString()
  const endpoint = qs ? `/produits?${qs}` : '/produits'
  const fallbackEndpoint = qs ? `/products/produits.php?${qs}` : '/products/produits.php'

  try {
    return await api.get(endpoint)
  } catch {
    try {
      return await api.get(fallbackEndpoint)
    } catch {
      const produits = filterMockProduits(params)
      return { produits, total: produits.length, page: 1, pages: 1, mock: true }
    }
  }
}
