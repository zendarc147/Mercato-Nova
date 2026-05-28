import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProduits } from '../api/produits'
import SiteHeader from '../components/SiteHeader'
import pictoCatalogueLeft from '../../wireframes/picto-catalogue-gauche.png'
import pictoCatalogueRight from '../../wireframes/picto-catalogue-droite.png'

const CATEGORIES = [
  { value: 'Joaillerie et accessoires', label: 'Joaillerie et accessoires' },
  { value: 'Curiosites et collections', label: 'Curiosit\u00e9s et collections' },
  { value: 'Metiers d art', label: 'M\u00e9tiers d\u2019art' },
  { value: 'Peinture', label: 'Peinture' },
  { value: 'Sculpture', label: 'Sculpture' },
  { value: 'Mobilier d exception', label: 'Mobilier d\u2019exception' },
  { value: 'Gravure', label: 'Gravure' },
]

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Date recente' },
  { value: 'date_asc', label: 'Date ancienne' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix decroissant' },
]

function formatPrice(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(value || 0))
}

function getImageSrc(imageUrl) {
  if (!imageUrl) return null
  if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) return imageUrl
  return `/uploads/produits/${imageUrl}`
}

function normalizeCategory(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['\u2019]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function sortProducts(products, sortBy) {
  const sorted = [...products]

  sorted.sort((a, b) => {
    if (sortBy === 'price_asc') return Number(a.prix) - Number(b.prix)
    if (sortBy === 'price_desc') return Number(b.prix) - Number(a.prix)

    const dateA = new Date(a.created_at || 0).getTime()
    const dateB = new Date(b.created_at || 0).getTime()
    return sortBy === 'date_asc' ? dateA - dateB : dateB - dateA
  })

  return sorted
}

function CatalogueCard({ product }) {
  const seller = product.vendeur?.nom || product.vendeur_nom || (product.vendeur_id ? `Vendeur #${product.vendeur_id}` : 'Vendeur')

  return (
    <article className="catalogue-card">
      <Link className="catalogue-card-link" to={`/produit/${product.id}`}>
        <ProductImage product={product} />
        <div className="catalogue-card-body">
          <h2>{product.titre}</h2>
          <p>{seller}</p>
          <strong>{formatPrice(product.prix)}</strong>
        </div>
      </Link>
      <button className="catalogue-cart-button" type="button" aria-label={`Ajouter ${product.titre} au panier`}>
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.6 13.2a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
        </svg>
      </button>
    </article>
  )
}

function ProductImage({ product }) {
  const [failed, setFailed] = useState(false)
  const imageSrc = getImageSrc(product.image_url)

  if (!imageSrc || failed) {
    return (
      <div className="catalogue-card-image">
        <span>produit</span>
      </div>
    )
  }

  return (
    <div className="catalogue-card-image">
      <img src={imageSrc} alt={product.titre} onError={() => setFailed(true)} />
    </div>
  )
}

export default function Catalogue() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') || ''
  const [searchValue, setSearchValue] = useState(urlQuery)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('date_desc')

  useEffect(() => {
    setSearchValue(urlQuery)
  }, [urlQuery])

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      setLoading(true)
      setError('')
      try {
        const data = await getProduits({ q: urlQuery, limit: 50 })
        if (!cancelled) setProducts(data.produits ?? [])
      } catch (err) {
        if (!cancelled) {
          setProducts([])
          setError(err.message || 'Impossible de charger le catalogue.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProducts()
    return () => { cancelled = true }
  }, [urlQuery])

  const maxSliderValue = useMemo(() => {
    const highestPrice = products.reduce((max, product) => Math.max(max, Number(product.prix) || 0), 0)
    return Math.max(100, Math.ceil(highestPrice / 100) * 100)
  }, [products])

  const displayedProducts = useMemo(() => {
    const query = urlQuery.trim().toLowerCase()
    const selectedMax = maxPrice === '' ? null : Number(maxPrice)

    const filtered = products.filter((product) => {
      const title = String(product.titre || '').toLowerCase()
      const description = String(product.description || '').toLowerCase()
      const price = Number(product.prix) || 0

      return (!query || title.includes(query) || description.includes(query))
        && (selectedCategories.length === 0 || selectedCategories.includes(normalizeCategory(product.categorie)))
        && (selectedMax === null || price <= selectedMax)
    })

    return sortProducts(filtered, sortBy)
  }, [maxPrice, products, selectedCategories, sortBy, urlQuery])

  function handleSearchSubmit(event) {
    event.preventDefault()
    const nextQuery = searchValue.trim()
    setSearchParams(nextQuery ? { q: nextQuery } : {})
  }

  function toggleCategory(category) {
    const categoryKey = normalizeCategory(category)
    setSelectedCategories((current) => (
      current.includes(categoryKey)
        ? current.filter((item) => item !== categoryKey)
        : [...current, categoryKey]
    ))
  }

  function resetFilters() {
    setSelectedCategories([])
    setMaxPrice('')
    setSortBy('date_desc')
  }

  return (
    <main className="catalogue-page">
      <SiteHeader user={user} />

      <section className="catalogue-hero" aria-labelledby="catalogue-title">
        <img className="catalogue-picto catalogue-picto-left" src={pictoCatalogueRight} alt="" aria-hidden="true" />
        <img className="catalogue-picto catalogue-picto-right" src={pictoCatalogueLeft} alt="" aria-hidden="true" />

        <h1 id="catalogue-title">Catalogue</h1>
        <form className="catalogue-search" role="search" onSubmit={handleSearchSubmit}>
          <button className="search-submit" type="submit" aria-label="Lancer la recherche">
            <span className="search-icon" aria-hidden="true" />
          </button>
          <label className="sr-only" htmlFor="catalogue-search">Rechercher un produit</label>
          <input
            id="catalogue-search"
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Rechercher un produit, une categorie..."
          />
        </form>
      </section>

      <div className="catalogue-layout">
        <aside className="catalogue-filters" aria-label="Filtres du catalogue">
          <h2>Filtrer</h2>

          <fieldset className="catalogue-filter-group">
            <legend>Categories</legend>
            {CATEGORIES.map((category) => (
              <label className="catalogue-checkbox" key={category.value}>
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(normalizeCategory(category.value))}
                  onChange={() => toggleCategory(category.value)}
                />
                <span>{category.label}</span>
              </label>
            ))}
          </fieldset>

          <div className="catalogue-price-filter">
            <label htmlFor="max-price">Prix maximum</label>
            <input
              id="max-price"
              type="range"
              min="0"
              max={maxSliderValue}
              step="10"
              value={maxPrice === '' ? maxSliderValue : maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />
            <div className="catalogue-price-row">
              <input
                type="number"
                min="0"
                max={maxSliderValue}
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="Sans limite"
                aria-label="Prix maximum en euros"
              />
              <span>EUR</span>
            </div>
          </div>

          <button className="catalogue-reset" type="button" onClick={resetFilters}>
            Reinitialiser
          </button>
        </aside>

        <section className="catalogue-results" aria-live="polite">
          <div className="catalogue-toolbar">
            <p>
              {displayedProducts.length} produit{displayedProducts.length > 1 ? 's' : ''}
              {urlQuery ? ` pour "${urlQuery}"` : ''}
            </p>
            <label>
              <span>Trier</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          {loading ? (
            <div className="catalogue-state">Chargement du catalogue...</div>
          ) : error ? (
            <div className="catalogue-state catalogue-state-error">{error}</div>
          ) : displayedProducts.length === 0 ? (
            <div className="catalogue-state">
              Aucun produit ne correspond a ces filtres.
              <button type="button" onClick={resetFilters}>Voir tous les produits</button>
            </div>
          ) : (
            <div className="catalogue-grid">
              {displayedProducts.map((product) => (
                <CatalogueCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
