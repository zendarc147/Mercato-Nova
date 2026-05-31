import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getProduit, deleteProduit } from '../api/produits'
import { addToRecentlyViewed } from '../api/recentlyViewed'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { addToCart } from '../api/panier'
import SiteHeader from '../components/SiteHeader'

// Icone panier locale pour le bouton d'ajout.
function IconCart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

// Icone negociation locale pour le bouton d'offre.
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

// Construit une galerie de photos meme si le backend n'envoie qu'une image.
function buildPhotos(imageUrl, produitId) {
  const base = imageUrl?.startsWith('http')
    ? imageUrl
    : imageUrl
      ? `/uploads/produits/${imageUrl}`
      : null

  if (!base) {
    return [
      `https://picsum.photos/seed/mn${produitId}/600/400`,
      `https://picsum.photos/seed/mn${produitId}-2/600/400`,
      `https://picsum.photos/seed/mn${produitId}-3/600/400`,
    ]
  }

  if (base.includes('picsum.photos/seed/')) {
    const seed = base.match(/\/seed\/([^/]+)\//)?.[1] ?? `mn${produitId}`
    return [
      base,
      `https://picsum.photos/seed/${seed}-2/600/400`,
      `https://picsum.photos/seed/${seed}-3/600/400`,
    ]
  }

  return [base]
}

// Fiche produit : photos, description, actions panier/achat/negociation et admin.
export default function Produit() {
  const { id } = useParams()
  const { user } = useAuth()
  const { refreshCart } = useCart()
  const navigate = useNavigate()
  const [produit, setProduit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cartState, setCartState] = useState('idle')
  const [photoIndex, setPhotoIndex] = useState(0)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Charge le produit a partir de l'id present dans l'URL.
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
        setPhotoIndex(0)
        addToRecentlyViewed(data)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id])

  // Suppression reservee aux admins, avec confirmation avant l'appel API.
  async function handleDelete() {
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await deleteProduit(id)
      navigate('/catalogue')
    } catch (err) {
      setDeleteError(err.message || 'Impossible de supprimer ce produit.')
      setDeleteLoading(false)
    }
  }

  // Ajoute le produit au panier et met a jour le compteur du header.
  async function handleAddToCart() {
    if (!user) { navigate('/login'); return }
    setCartState('adding')
    try {
      await addToCart(Number(id), 1)
      refreshCart()
      setCartState('done')
      setTimeout(() => setCartState('idle'), 2000)
    } catch {
      setCartState('idle')
    }
  }

  // Lance un achat direct en envoyant le produit a la page paiement.
  function handleBuyNow() {
    if (!user) { navigate('/login'); return }
    navigate('/paiement', {
      state: {
        produit: { id: produit.id, titre: produit.titre },
        prixAccepte: Number(produit.prix),
        fromDirect: true,
      },
    })
  }

  const photos = produit ? buildPhotos(produit.image_url, produit.id) : []
  const currentPhoto = photos[photoIndex] ?? null

  function prevPhoto() {
    setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)
  }

  function nextPhoto() {
    setPhotoIndex((i) => (i + 1) % photos.length)
  }

  return (
    <main className="produit-page">
      <SiteHeader user={user} />

      {loading && <p className="produit-state">Chargement…</p>}
      {error && <p className="produit-state produit-state--error">{error}</p>}

      {produit && (
        <div className="produit-layout">
          <div className="produit-top">
            {/* Colonne gauche : galerie */}
            <div className="produit-galerie">
              <div className="produit-image-wrapper">
                {photos.length > 1 && (
                  <button className="produit-arrow" aria-label="Image précédente" onClick={prevPhoto}>
                    &#9664;
                  </button>
                )}
                <div className="produit-image">
                  {currentPhoto
                    ? <img src={currentPhoto} alt={`${produit.titre} — photo ${photoIndex + 1}`} />
                    : <span className="produit-img-placeholder">photo produit</span>}
                </div>
                {photos.length > 1 && (
                  <button className="produit-arrow" aria-label="Image suivante" onClick={nextPhoto}>
                    &#9654;
                  </button>
                )}
              </div>

              {photos.length > 1 && (
                <div className="produit-dots">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      className={`produit-dot${i === photoIndex ? ' produit-dot--active' : ''}`}
                      aria-label={`Photo ${i + 1}`}
                      onClick={() => setPhotoIndex(i)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Colonne droite : toutes les infos */}
            <div className="produit-info">
              <h1 className="produit-titre">{produit.titre}</h1>
              <p className="produit-vendeur">
                {produit.vendeur?.prenom ? `${produit.vendeur.prenom} ` : ''}{produit.vendeur?.nom ?? 'Vendeur'}
              </p>
              <p className="produit-categorie">{produit.categorie}</p>
              <p className="produit-prix">{Number(produit.prix).toFixed(2)} €</p>

              <div className="produit-description">
                <strong>Description</strong>
                <p>{produit.description ?? '—'}</p>
              </div>

              <div className="produit-actions">
                <button
                  className={`produit-action-icon${cartState === 'done' ? ' produit-action-icon--done' : ''}`}
                  aria-label="Ajouter au panier"
                  onClick={handleAddToCart}
                  disabled={cartState === 'adding' || cartState === 'done'}
                >
                  {cartState === 'done' ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <IconCart />
                  )}
                </button>
                {produit.type_vente === 'negociation' && (
                  <Link to={`/negociation/${produit.id}`} className="produit-action-icon" aria-label="Négocier">
                    <IconHandshake />
                  </Link>
                )}
                {produit.type_vente !== 'enchere' && (
                  <button className="produit-cta" onClick={handleBuyNow}>
                    Achat immédiat
                  </button>
                )}
              </div>

              {user?.role === 'admin' && (
                <div className="admin-delete-zone">
                  <p className="admin-delete-label">Zone admin</p>
                  {!deleteConfirm ? (
                    <button
                      type="button"
                      className="admin-delete-btn"
                      onClick={() => setDeleteConfirm(true)}
                    >
                      Supprimer ce produit
                    </button>
                  ) : (
                    <div className="admin-delete-confirm">
                      <p>Supprimer definitivement ce produit ?</p>
                      <div className="admin-delete-confirm-actions">
                        <button
                          type="button"
                          className="admin-delete-confirm-yes"
                          onClick={handleDelete}
                          disabled={deleteLoading}
                        >
                          {deleteLoading ? 'Suppression...' : 'Oui, supprimer'}
                        </button>
                        <button
                          type="button"
                          className="admin-delete-cancel"
                          onClick={() => { setDeleteConfirm(false); setDeleteError('') }}
                          disabled={deleteLoading}
                        >
                          Annuler
                        </button>
                      </div>
                      {deleteError && <p className="admin-delete-error">{deleteError}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
