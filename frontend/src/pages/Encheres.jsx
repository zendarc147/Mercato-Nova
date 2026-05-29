import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProduits } from '../api/produits'
import { getEnchere, getEnchereStatut } from '../api/encheres'
import SiteHeader from '../components/SiteHeader'
import pictoCatalogueLeft from '../../wireframes/picto-catalogue-gauche.png'
import pictoCatalogueRight from '../../wireframes/picto-catalogue-droite.png'

const CATEGORIES = [
  { value: 'Joaillerie et accessoires', label: 'Joaillerie et accessoires' },
  { value: 'Curiosites et collections', label: 'Curiosités et collections' },
  { value: 'Metiers d art', label: 'Métiers d’art' },
  { value: 'Peinture', label: 'Peinture' },
  { value: 'Sculpture', label: 'Sculpture' },
  { value: 'Mobilier d exception', label: 'Mobilier d’exception' },
  { value: 'Gravure', label: 'Gravure' },
  { value: 'Ceramique', label: 'Céramique' },
  { value: 'Bijoux', label: 'Bijoux' },
  { value: 'Photographie', label: 'Photographie' },
]

const SORT_OPTIONS = [
  { value: 'time_asc', label: 'Fin proche' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix decroissant' },
  { value: 'date_desc', label: 'Date recente' },
]

const STATUS_OPTIONS = [
  { value: 'en_cours', label: 'En cours' },
  { value: 'en_attente', label: 'À venir' },
  { value: 'terminee', label: 'Terminée' },
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

function getAuctionPrice(product, auction) {
  return Number(auction?.meilleure_offre ?? auction?.prix_depart ?? product.prix ?? 0)
}

function getRemainingSeconds(auction, now) {
  if (!auction) return null
  if (auction.date_fin) {
    return Math.max(0, Math.floor((new Date(auction.date_fin).getTime() - now) / 1000))
  }
  if (auction.secondes_restantes !== undefined && auction.fetchedAt) {
    const elapsed = Math.floor((now - auction.fetchedAt) / 1000)
    return Math.max(0, Number(auction.secondes_restantes) - elapsed)
  }
  return null
}

function formatRemainingTime(seconds) {
  if (seconds === null) return 'Calcul...'
  if (seconds <= 0) return 'Terminee'

  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (days > 0) return `${days}j ${String(hours).padStart(2, '0')}h`
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`
  return `${minutes}m ${String(secs).padStart(2, '0')}s`
}

function getAuctionStateLabel(auction, remainingSeconds) {
  if (auction?.etat === 'en_attente') return 'À venir'
  if (auction?.etat === 'terminee' || remainingSeconds === 0) return 'Terminée'
  if (auction?.etat === 'annulee') return 'Annulée'
  return 'En cours'
}

function isFinishedAuction(auction, remainingSeconds) {
  return auction?.etat === 'terminee' || auction?.etat === 'annulee' || remainingSeconds === 0
}

function getAuctionFilterStatus(auction, remainingSeconds) {
  if (isFinishedAuction(auction, remainingSeconds)) return 'terminee'
  if (auction?.etat === 'en_attente') return 'en_attente'
  return 'en_cours'
}

function sortAuctions(products, auctionsByProduct, sortBy, now) {
  const sorted = [...products]

  sorted.sort((a, b) => {
    const auctionA = auctionsByProduct[a.id]
    const auctionB = auctionsByProduct[b.id]

    if (sortBy === 'price_asc') return getAuctionPrice(a, auctionA) - getAuctionPrice(b, auctionB)
    if (sortBy === 'price_desc') return getAuctionPrice(b, auctionB) - getAuctionPrice(a, auctionA)
    if (sortBy === 'time_asc') {
      const rawRemainingA = getRemainingSeconds(auctionA, now)
      const rawRemainingB = getRemainingSeconds(auctionB, now)
      const remainingA = isFinishedAuction(auctionA, rawRemainingA) ? Number.MAX_SAFE_INTEGER : rawRemainingA ?? Number.MAX_SAFE_INTEGER
      const remainingB = isFinishedAuction(auctionB, rawRemainingB) ? Number.MAX_SAFE_INTEGER : rawRemainingB ?? Number.MAX_SAFE_INTEGER
      return remainingA - remainingB
    }

    const dateA = new Date(a.created_at || 0).getTime()
    const dateB = new Date(b.created_at || 0).getTime()
    return dateB - dateA
  })

  return sorted
}

function AuctionImage({ product }) {
  const [failed, setFailed] = useState(false)
  const imageSrc = getImageSrc(product.image_url)

  if (!imageSrc || failed) {
    return (
      <div className="catalogue-card-image">
        <span>enchère</span>
      </div>
    )
  }

  return (
    <div className="catalogue-card-image">
      <img src={imageSrc} alt={product.titre} onError={() => setFailed(true)} />
    </div>
  )
}

function AuctionCard({ product, auction, now }) {
  const seller = product.vendeur?.nom || product.vendeur_nom || (product.vendeur_id ? `Vendeur #${product.vendeur_id}` : 'Vendeur')
  const remainingSeconds = getRemainingSeconds(auction, now)
  const stateLabel = getAuctionStateLabel(auction, remainingSeconds)
  const price = getAuctionPrice(product, auction)

  return (
    <article className="catalogue-card enchere-card">
      <Link className="catalogue-card-link enchere-card-link" to={`/produit/${product.id}`}>
        <AuctionImage product={product} />
        <div className="catalogue-card-body enchere-card-body">
          <div className="enchere-card-heading">
            <h2>{product.titre}</h2>
            <span className={`enchere-status enchere-status--${auction?.etat ?? 'loading'}`}>{stateLabel}</span>
          </div>
          <p>{seller}</p>
          <div className="enchere-card-meta">
            <span>
              <small>Offre actuelle</small>
              <strong>{formatPrice(price)}</strong>
            </span>
            <span className="enchere-timer" aria-label={`Temps restant ${formatRemainingTime(remainingSeconds)}`}>
              <small>Temps restant</small>
              <strong>{formatRemainingTime(remainingSeconds)}</strong>
            </span>
          </div>
        </div>
      </Link>
    </article>
  )
}

export default function Encheres() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = searchParams.get('q') || ''
  const [searchValue, setSearchValue] = useState(urlQuery)
  const [products, setProducts] = useState([])
  const [auctionsByProduct, setAuctionsByProduct] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedStatuses, setSelectedStatuses] = useState([])
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('time_asc')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    setSearchValue(urlQuery)
  }, [urlQuery])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadAuctions() {
      setLoading(true)
      setError('')
      try {
        const data = await getProduits({ q: urlQuery, type_vente: 'enchere', limit: 50 })
        const auctionProducts = (data.produits ?? []).filter((product) => product.type_vente === 'enchere')
        if (cancelled) return

        setProducts(auctionProducts)
        const details = await Promise.all(
          auctionProducts.map(async (product) => {
            const enchere = await getEnchere(product.id)
            return [product.id, { ...enchere, fetchedAt: Date.now() }]
          })
        )

        if (!cancelled) setAuctionsByProduct(Object.fromEntries(details))
      } catch (err) {
        if (!cancelled) {
          setProducts([])
          setAuctionsByProduct({})
          setError(err.message || 'Impossible de charger le catalogue des encheres.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadAuctions()
    return () => { cancelled = true }
  }, [urlQuery])

  useEffect(() => {
    if (products.length === 0) return undefined

    let cancelled = false

    async function refreshStatuses() {
      const statuses = await Promise.all(
        products.map(async (product) => {
          const statut = await getEnchereStatut(product.id)
          return [product.id, { ...statut, fetchedAt: Date.now() }]
        })
      )

      if (!cancelled) {
        setAuctionsByProduct((current) => {
          const next = { ...current }
          statuses.forEach(([productId, statut]) => {
            next[productId] = { ...next[productId], ...statut }
          })
          return next
        })
      }
    }

    const interval = setInterval(refreshStatuses, 3000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [products])

  const maxSliderValue = useMemo(() => {
    const highestPrice = products.reduce((max, product) => {
      const auction = auctionsByProduct[product.id]
      return Math.max(max, getAuctionPrice(product, auction))
    }, 0)

    return Math.max(100, Math.ceil(highestPrice / 100) * 100)
  }, [auctionsByProduct, products])

  const displayedProducts = useMemo(() => {
    const query = urlQuery.trim().toLowerCase()
    const selectedMax = maxPrice === '' ? null : Number(maxPrice)

    const filtered = products.filter((product) => {
      const auction = auctionsByProduct[product.id]
      const remainingSeconds = getRemainingSeconds(auction, now)
      const auctionStatus = getAuctionFilterStatus(auction, remainingSeconds)
      const title = String(product.titre || '').toLowerCase()
      const description = String(product.description || '').toLowerCase()
      const price = getAuctionPrice(product, auction)

      return (!query || title.includes(query) || description.includes(query))
        && (selectedCategories.length === 0 || selectedCategories.includes(normalizeCategory(product.categorie)))
        && (selectedStatuses.length === 0 || selectedStatuses.includes(auctionStatus))
        && (selectedMax === null || price <= selectedMax)
    })

    return sortAuctions(filtered, auctionsByProduct, sortBy, now)
  }, [auctionsByProduct, maxPrice, now, products, selectedCategories, selectedStatuses, sortBy, urlQuery])

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

  function toggleStatus(status) {
    setSelectedStatuses((current) => (
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status]
    ))
  }

  function resetFilters() {
    setSelectedCategories([])
    setSelectedStatuses([])
    setMaxPrice('')
    setSortBy('time_asc')
  }

  return (
    <main className="catalogue-page encheres-page">
      <SiteHeader user={user} />

      <section className="catalogue-hero" aria-labelledby="encheres-title">
        <img className="catalogue-picto catalogue-picto-left" src={pictoCatalogueRight} alt="" aria-hidden="true" />
        <img className="catalogue-picto catalogue-picto-right" src={pictoCatalogueLeft} alt="" aria-hidden="true" />

        <h1 id="encheres-title">Enchères</h1>
        <form className="catalogue-search" role="search" onSubmit={handleSearchSubmit}>
          <button className="search-submit" type="submit" aria-label="Lancer la recherche">
            <span className="search-icon" aria-hidden="true" />
          </button>
          <label className="sr-only" htmlFor="encheres-search">Rechercher une enchere</label>
          <input
            id="encheres-search"
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Rechercher une enchère, une catégorie..."
          />
        </form>
      </section>

      <div className="catalogue-layout">
        <aside className="catalogue-filters" aria-label="Filtres du catalogue des encheres">
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

          <fieldset className="catalogue-filter-group enchere-status-filter">
            <legend>Statut</legend>
            {STATUS_OPTIONS.map((status) => (
              <label className="catalogue-checkbox" key={status.value}>
                <input
                  type="checkbox"
                  checked={selectedStatuses.includes(status.value)}
                  onChange={() => toggleStatus(status.value)}
                />
                <span>{status.label}</span>
              </label>
            ))}
          </fieldset>

          <div className="catalogue-price-filter">
            <label htmlFor="max-bid">Offre maximum</label>
            <input
              id="max-bid"
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
                aria-label="Offre maximum en euros"
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
              {displayedProducts.length} enchère{displayedProducts.length > 1 ? 's' : ''}
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
            <div className="catalogue-state">Chargement des enchères...</div>
          ) : error ? (
            <div className="catalogue-state catalogue-state-error">{error}</div>
          ) : displayedProducts.length === 0 ? (
            <div className="catalogue-state">
              Aucune enchère ne correspond à ces filtres.
              <button type="button" onClick={resetFilters}>Voir toutes les enchères</button>
            </div>
          ) : (
            <div className="catalogue-grid">
              {displayedProducts.map((product) => (
                <AuctionCard
                  key={product.id}
                  product={product}
                  auction={auctionsByProduct[product.id]}
                  now={now}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
