import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProduits, updateProduit, deleteProduit } from '../api/produits'
import SiteHeader from '../components/SiteHeader'
import EditProduitForm from '../components/EditProduitForm'

const TYPE_LABELS = {
  achat_immediat: 'Achat immediat',
  negociation: 'Negociation',
}

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return 'Date inconnue'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getImageSrc(imageUrl) {
  if (!imageUrl) return null
  if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) return imageUrl
  return `/uploads/produits/${imageUrl}`
}

function sellerOwnsProduct(product, user) {
  const vendorId = product.vendeur_id ?? product.vendeur?.id
  return vendorId && user?.id && Number(vendorId) === Number(user.id)
}

function sortProducts(products, sortBy) {
  return [...products].sort((a, b) => {
    if (sortBy === 'price_asc') return Number(a.prix) - Number(b.prix)
    if (sortBy === 'price_desc') return Number(b.prix) - Number(a.prix)
    if (sortBy === 'stock_asc') return Number(a.stock ?? 0) - Number(b.stock ?? 0)
    const dateA = new Date(a.created_at || 0).getTime()
    const dateB = new Date(b.created_at || 0).getTime()
    return dateB - dateA
  })
}

function MesVenteImage({ product }) {
  const [failed, setFailed] = useState(false)
  const imageSrc = getImageSrc(product.image_url)

  if (!imageSrc || failed) {
    return (
      <div className="mes-ventes-image">
        <span>produit</span>
      </div>
    )
  }

  return (
    <div className="mes-ventes-image">
      <img src={imageSrc} alt={product.titre} onError={() => setFailed(true)} />
    </div>
  )
}

export default function MesVentes() {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')

  const [editingId,       setEditingId]       = useState(null)
  const [editLoading,     setEditLoading]     = useState(false)
  const [editError,       setEditError]       = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleteLoading,   setDeleteLoading]   = useState(false)
  const [deleteError,     setDeleteError]     = useState(null)

  useEffect(() => {
    if (!user?.id) return undefined
    let cancelled = false

    async function loadSellerSales() {
      setLoading(true)
      setError('')
      try {
        const data = await getProduits({ limit: 50 })
        const saleProducts = (data.produits ?? []).filter((p) => p.type_vente !== 'enchere')
        const sellerProducts = data.mock
          ? saleProducts
          : saleProducts.filter((p) => sellerOwnsProduct(p, user))
        if (!cancelled) setProducts(sellerProducts)
      } catch (err) {
        if (!cancelled) {
          setProducts([])
          setError(err.message || 'Impossible de charger vos ventes.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadSellerSales()
    return () => { cancelled = true }
  }, [user])

  async function handleEditSave(id, data) {
    setEditLoading(true)
    setEditError(null)
    try {
      await updateProduit(id, data)
      setProducts((prev) =>
        prev.map((p) => p.id === id ? { ...p, ...data } : p)
      )
      setEditingId(null)
    } catch (err) {
      setEditError(err.message || 'Erreur lors de la mise à jour.')
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDelete(id) {
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      await deleteProduit(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
      setConfirmDeleteId(null)
    } catch (err) {
      setDeleteError(err.message || 'Erreur lors de la suppression.')
      setDeleteLoading(false)
    }
  }

  const displayedProducts = useMemo(() => {
    const filtered = typeFilter === 'all'
      ? products
      : products.filter((p) => p.type_vente === typeFilter)
    return sortProducts(filtered, sortBy)
  }, [products, sortBy, typeFilter])

  const directCount = products.filter((p) => p.type_vente === 'achat_immediat').length
  const negoCount   = products.filter((p) => p.type_vente === 'negociation').length

  return (
    <main className="mes-ventes-page">
      <SiteHeader user={user} />

      <section className="mes-ventes-content" aria-labelledby="mes-ventes-title">
        <div className="mes-ventes-heading">
          <div>
            <p>Vendeur</p>
            <h1 id="mes-ventes-title">Mes ventes</h1>
          </div>
          <div className="mes-ventes-heading-actions">
            <Link className="mes-ventes-cta-link" to="/nouvelle-annonce?type=vente">
              + Nouvelle vente
            </Link>
            <Link className="mes-ventes-outline-link" to="/catalogue">
              Voir le catalogue
            </Link>
          </div>
        </div>

        <div className="mes-ventes-summary" aria-label="Resume des ventes">
          <span>
            <small>Annonces actives</small>
            <strong>{products.length}</strong>
          </span>
          <span>
            <small>Achat immediat</small>
            <strong>{directCount}</strong>
          </span>
          <span>
            <small>Negociation</small>
            <strong>{negoCount}</strong>
          </span>
        </div>

        <div className="mes-ventes-toolbar">
          <div className="mes-ventes-tabs" aria-label="Filtrer les ventes">
            <button
              className={typeFilter === 'all' ? 'mes-ventes-tab mes-ventes-tab--active' : 'mes-ventes-tab'}
              type="button"
              onClick={() => setTypeFilter('all')}
            >
              Toutes
            </button>
            <button
              className={typeFilter === 'achat_immediat' ? 'mes-ventes-tab mes-ventes-tab--active' : 'mes-ventes-tab'}
              type="button"
              onClick={() => setTypeFilter('achat_immediat')}
            >
              Achat immediat
            </button>
            <button
              className={typeFilter === 'negociation' ? 'mes-ventes-tab mes-ventes-tab--active' : 'mes-ventes-tab'}
              type="button"
              onClick={() => setTypeFilter('negociation')}
            >
              Negociation
            </button>
          </div>

          <label>
            <span>Trier</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="date_desc">Date recente</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix decroissant</option>
              <option value="stock_asc">Stock faible</option>
            </select>
          </label>
        </div>

        {loading && <p className="mes-ventes-state">Chargement de vos ventes...</p>}
        {error   && <p className="mes-ventes-state mes-ventes-state--error">{error}</p>}

        {!loading && !error && displayedProducts.length === 0 && (
          <div className="mes-ventes-empty">
            <h2>Aucune vente a afficher</h2>
            <p>Vos annonces d'achat immediat et de negociation apparaitront ici.</p>
          </div>
        )}

        {!loading && !error && displayedProducts.length > 0 && (
          <div className="mes-ventes-list">
            {displayedProducts.map((product) => {
              const typeLabel = TYPE_LABELS[product.type_vente] ?? 'Vente'
              const stock     = Number(product.stock ?? 0)
              const isEditing = editingId === product.id
              const isConfirmingDelete = confirmDeleteId === product.id

              return (
                <article className="mes-ventes-card" key={product.id}>
                  {isEditing ? (
                    <div className="mes-ventes-edit-wrapper">
                      <p className="mes-ventes-edit-heading">Modifier « {product.titre} »</p>
                      <EditProduitForm
                        product={product}
                        onSave={(data) => handleEditSave(product.id, data)}
                        onCancel={() => { setEditingId(null); setEditError(null) }}
                        loading={editLoading}
                        error={editError}
                      />
                    </div>
                  ) : (
                    <>
                      <Link className="mes-ventes-card-link" to={`/produit/${product.id}`}>
                        <MesVenteImage product={product} />
                        <div className="mes-ventes-info">
                          <div className="mes-ventes-title-row">
                            <h2>{product.titre}</h2>
                            <span className={`mes-ventes-type mes-ventes-type--${product.type_vente}`}>
                              {typeLabel}
                            </span>
                          </div>
                          <p>{product.description || 'Aucune description.'}</p>
                          <div className="mes-ventes-meta">
                            <span>
                              <small>Prix</small>
                              <strong>{formatPrice(product.prix)}</strong>
                            </span>
                            <span>
                              <small>Stock</small>
                              <strong>{stock > 0 ? `${stock} disponible${stock > 1 ? 's' : ''}` : 'Epuise'}</strong>
                            </span>
                            <span>
                              <small>Publication</small>
                              <strong>{formatDate(product.created_at)}</strong>
                            </span>
                          </div>
                        </div>
                      </Link>

                      <div className="mes-ventes-actions">
                        {product.type_vente === 'negociation' && (
                          <Link className="mes-ventes-action-link" to="/mes-negociations">
                            Voir les negociations
                          </Link>
                        )}

                        {isConfirmingDelete ? (
                          <div className="mes-ventes-delete-confirm">
                            <span>Supprimer cette annonce ?</span>
                            {deleteError && <span className="mes-ventes-delete-error">{deleteError}</span>}
                            <button
                              className="mes-ventes-delete-confirm-btn"
                              onClick={() => handleDelete(product.id)}
                              disabled={deleteLoading}
                            >
                              {deleteLoading ? 'Suppression…' : 'Confirmer'}
                            </button>
                            <button
                              className="profil-edit-cancel"
                              onClick={() => { setConfirmDeleteId(null); setDeleteError(null) }}
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <div className="mes-ventes-manage-btns">
                            <button
                              className="mes-ventes-edit-btn"
                              onClick={() => { setEditingId(product.id); setEditError(null); setConfirmDeleteId(null) }}
                            >
                              Modifier
                            </button>
                            <button
                              className="mes-ventes-delete-btn"
                              onClick={() => { setConfirmDeleteId(product.id); setDeleteError(null); setEditingId(null) }}
                            >
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
