const KEY = 'mercato_recently_viewed'
const MAX = 8

// Stockage local navigateur : aucune requete backend n'est necessaire pour l'historique recent.
export function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

// Ajoute le produit en tete de liste et retire les doublons.
export function addToRecentlyViewed(product) {
  try {
    const items = getRecentlyViewed().filter((p) => p.id !== product.id)
    items.unshift(product)
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)))
  } catch {}
}
