import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProduit } from '../api/produits'
import { addToRecentlyViewed } from '../api/recentlyViewed'
import { useAuth } from '../context/AuthContext'
import SiteHeader from '../components/SiteHeader'

function IconCart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

function IconHandshake() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 12l-8.5 8.5a2.12 2.12 0 0 1-3-3L12 9" />
      <path d="M17.64 15L22 10.64" />
      <path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91" />
      <path d="M3.09 8.75l1.25 1.25c.6.6.93 1.4.93 2.25v.86l2.72 2.72c1.03 1.03 2.4 1.61 3.84 1.61" />
    </svg>
  )
}

export default function Produit() {
  const { id } = useParams()
  const { user } = useAuth()
  const [produit, setProduit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      const data = await getProduit(id)
      if (cancelled) return
      if (!data) {
        setError('Produit introuvable.')
      } else {
        setProduit(data)
        addToRecentlyViewed(data)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id])

  return (
    <main className="produit-page">
      <SiteHeader user={user} />

      {loading && <p className="produit-state">Chargement…</p>}
      {error && <p className="produit-state produit-state--error">{error}</p>}

      {produit && (
        <div className="produit-layout">
          <div className="produit-top">
            <div className="produit-image-wrapper">
              <button className="produit-arrow" aria-label="Image précédente">&#9664;</button>
              <div className="produit-image">
                {produit.image_url
                  ? <img src={`/uploads/produits/${produit.image_url}`} alt={produit.titre} />
                  : <span className="produit-img-placeholder">photo produit</span>}
              </div>
              <button className="produit-arrow" aria-label="Image suivante">&#9654;</button>
            </div>

            <div className="produit-info">
              <h1 className="produit-titre">{produit.titre}</h1>
              <p className="produit-vendeur">
                {produit.vendeur?.prenom ? `${produit.vendeur.prenom} ` : ''}{produit.vendeur?.nom ?? 'Vendeur'}
              </p>
              <p className="produit-categorie">{produit.categorie}</p>
              <p className="produit-prix">Prix : {Number(produit.prix).toFixed(2)} €</p>
            </div>
          </div>

          <div className="produit-bottom">
            <div className="produit-description">
              <strong>Description :</strong>
              <p>{produit.description ?? '—'}</p>
            </div>

            <div className="produit-actions">
              <button className="produit-action-icon" aria-label="Ajouter au panier">
                <IconCart />
              </button>
              {produit.type_vente === 'negociation' && (
                <button className="produit-action-icon" aria-label="Négocier">
                  <IconHandshake />
                </button>
              )}
              <button className="produit-cta">Achat immédiat</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
