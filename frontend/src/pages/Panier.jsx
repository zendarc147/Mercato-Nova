import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import SiteHeader from '../components/SiteHeader'
import { getCart, removeFromCart } from '../api/panier'

function IconCart({ filled = false }) {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function getImageSrc(url) {
  if (!url) return null
  if (url.startsWith('http') || url.startsWith('/')) return url
  return `/uploads/produits/${url}`
}

export default function Panier() {
  const { user } = useAuth()
  const { refreshCart } = useCart()
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [removingIds, setRemovingIds] = useState(new Set())

  useEffect(() => {
    loadCart()
  }, [])

  async function loadCart() {
    setLoading(true)
    setError(null)
    try {
      const data = await getCart()
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      setError(err.message || 'Impossible de charger le panier.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(produit_id) {
    setRemovingIds((prev) => new Set(prev).add(produit_id))
    try {
      await removeFromCart(produit_id)
      const updated = items.filter((item) => item.produit_id !== produit_id)
      setItems(updated)
      setTotal(updated.reduce((sum, item) => sum + Number(item.prix) * item.quantite, 0))
      refreshCart()
    } catch {
      // silently ignore
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev)
        next.delete(produit_id)
        return next
      })
    }
  }

  function handlePayer() {
    navigate('/paiement', {
      state: { fromPanier: true, items, total },
    })
  }

  return (
    <main className="panier-page">
      <SiteHeader user={user} />

      <div className="panier-content">
        <div className="panier-title-row">
          <span className="panier-title-icon">
            <IconCart />
          </span>
          <h1>Mon panier</h1>
        </div>

        {loading && <p className="panier-state">Chargement…</p>}
        {error && <p className="panier-state panier-state--error">{error}</p>}

        {!loading && !error && (
          <>
            {items.length === 0 ? (
              <p className="panier-state panier-state--empty">Votre panier est vide.</p>
            ) : (
              <ul className="panier-list">
                {items.map((item) => {
                  const imgSrc = getImageSrc(item.image_url)
                  const isRemoving = removingIds.has(item.produit_id)
                  return (
                    <li key={item.id ?? item.produit_id} className="panier-item">
                      <div className="panier-item-image">
                        {imgSrc
                          ? <img src={imgSrc} alt={item.titre} />
                          : <span>produit</span>}
                      </div>
                      <div className="panier-item-info">
                        <p className="panier-item-titre">{item.titre}</p>
                        {item.vendeur_nom && (
                          <p className="panier-item-vendeur">{item.vendeur_nom}</p>
                        )}
                        <p className="panier-item-prix">
                          {Number(item.prix).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€
                        </p>
                      </div>
                      <button
                        className="panier-item-remove"
                        aria-label={`Retirer ${item.titre} du panier`}
                        onClick={() => handleRemove(item.produit_id)}
                        disabled={isRemoving}
                      >
                        <IconTrash />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="panier-footer">
              <button
                className="panier-btn-payer"
                onClick={handlePayer}
                disabled={items.length === 0}
              >
                Payer
              </button>
              <span className="panier-nb-articles">
                Nombre articles : {items.length}
              </span>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
