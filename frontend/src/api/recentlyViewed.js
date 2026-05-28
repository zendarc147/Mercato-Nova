const KEY = 'mercato_recently_viewed'
const MAX = 8

export function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function addToRecentlyViewed(product) {
  try {
    const items = getRecentlyViewed().filter((p) => p.id !== product.id)
    items.unshift(product)
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)))
  } catch {}
}
