import { api } from './client'

const MOCK_PRODUITS = [
  { id: 1, titre: 'Buste en marbre blanc', description: 'Sculpture néoclassique en marbre de Carrare, 45 cm.', prix: '1200.00', categorie: 'Sculpture', etat: 'bon_etat', type_vente: 'achat_immediat', stock: 1, vendeur: { nom: 'Kudo Shinichi' }, created_at: '2026-05-24T10:00:00Z', image_url: 'https://picsum.photos/seed/mn1/600/400' },
  { id: 2, titre: 'Toile abstraite — Série Feu', description: 'Huile sur toile, 80×60 cm, signée et datée, tons ocre et mauve.', prix: '850.00', categorie: 'Peinture', etat: 'neuf', type_vente: 'enchere', stock: 1, vendeur: { nom: 'Kudo Shinichi' }, created_at: '2026-05-27T09:30:00Z', image_url: 'https://picsum.photos/seed/mn2/600/400' },
  { id: 3, titre: 'Statue en bronze — Danseur', description: 'Bronze patiné, hauteur 30 cm, édition limitée 12/50.', prix: '3200.00', categorie: 'Sculpture', etat: 'bon_etat', type_vente: 'negociation', stock: 1, vendeur: { nom: 'Kudo Shinichi' }, created_at: '2026-05-22T16:45:00Z', image_url: 'https://picsum.photos/seed/mn3/600/400' },
  { id: 4, titre: 'Gravure sur bois — Forêt', description: 'Xylographie, tirage unique sur papier washi, encadrée.', prix: '320.00', categorie: 'Gravure', etat: 'correct', type_vente: 'achat_immediat', stock: 2, vendeur: { nom: 'Kudo Shinichi' }, created_at: '2026-05-20T12:00:00Z', image_url: 'https://picsum.photos/seed/mn4/600/400' },
  { id: 5, titre: 'Collier en argent ciselé', description: 'Argent 925, motifs géométriques, pièce unique.', prix: '650.00', categorie: 'Bijoux', etat: 'neuf', type_vente: 'achat_immediat', stock: 1, vendeur: { nom: 'Amara Diallo' }, created_at: '2026-05-28T08:15:00Z', image_url: 'https://picsum.photos/seed/mn11/600/400' },
  { id: 6, titre: 'Vase en céramique raku', description: 'Céramique raku au four à bois, glaçure mat noire, H.28 cm.', prix: '290.00', categorie: 'Céramique', etat: 'neuf', type_vente: 'enchere', stock: 1, vendeur: { nom: 'Amara Diallo' }, created_at: '2026-05-25T14:20:00Z', image_url: 'https://picsum.photos/seed/mn10/600/400' },
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

export async function getProduit(id) {
  try {
    return await api.get(`/products/produits.php?id=${id}`)
  } catch {
    return MOCK_PRODUITS.find((p) => p.id === Number(id)) ?? null
  }
}

export async function createProduit(data) {
  try {
    return await api.post('/produits', data)
  } catch {
    return api.post('/products/produits.php', data)
  }
}

export async function updateProduit(id, data) {
  try {
    return await api.put(`/produits?id=${id}`, data)
  } catch {
    return api.put(`/products/produits.php?id=${id}`, data)
  }
}

export async function deleteProduit(id) {
  try {
    return await api.delete(`/produits?id=${id}`)
  } catch {
    return api.delete(`/products/produits.php?id=${id}`)
  }
}
