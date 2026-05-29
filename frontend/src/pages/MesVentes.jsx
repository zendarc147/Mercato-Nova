import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProduits } from '../api/produits'
import SiteHeader from '../components/SiteHeader'

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

  useEffect(() => {
    if (!user?.id) return undefined
    let cancelled = false

    async function loadSellerSales() {
      setLoading(true)
      setError('')

      try {
        const data = await getProduits({ limit: 50 })
        const saleProducts = (data.produits ?? []).filter((product) => product.type_vente !== 'enchere')
        const sellerProducts = data.mock
          ? saleProducts
          : saleProducts.filter((product) => sellerOwnsProduct(product, user))

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

  const displayedProducts = useMemo(() => {
    const filtered = typeFilter === 'all'
      ? products
      : products.filter((product) => product.type_vente === typeFilter)

    return sortProducts(filtered, sortBy)
  }, [products, sortBy, typeFilter])

  const directCount = products.filter((product) => product.type_vente === 'achat_immediat').length
  const negoCount = products.filter((product) => product.type_vente === 'negociation').length

  return (
    <main className="mes-ventes-page">
      <SiteHeader user={user} />

      <section className="mes-ventes-content" aria-labelledby="mes-ventes-title">
        <div className="mes-ventes-heading">
          <div>
            <p>Vendeur</p>
            <h1 id="mes-ventes-title">Mes ventes</h1>
          </div>
          <Link className="mes-ventes-outline-link" to="/catalogue">
            Voir le catalogue
          </Link>
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
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="date_desc">Date recente</option>
              <option value="price_asc">Prix croissant</option>
              <option value="price_desc">Prix decroissant</option>
              <option value="stock_asc">Stock faible</option>
            </select>
          </label>
        </div>

        {loading && <p className="mes-ventes-state">Chargement de vos ventes...</p>}
        {error && <p className="mes-ventes-state mes-ventes-state--error">{error}</p>}

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
              const stock = Number(product.stock ?? 0)

              return (
                <article className="mes-ventes-card" key={product.id}>
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

                  {product.type_vente === 'negociation' && (
                    <div className="mes-ventes-actions">
                      <Link className="mes-ventes-action-link" to="/mes-negociations">
                        Voir les negociations
                      </Link>
                    </div>
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
