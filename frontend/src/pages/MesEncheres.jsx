import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProduits } from '../api/produits'
import { getEnchere, getEnchereStatut, relancerPaiementEnchere } from '../api/encheres'
import SiteHeader from '../components/SiteHeader'

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

function getAuctionStatus(auction, remainingSeconds) {
  if (auction?.etat === 'annulee') return { value: 'annulee', label: 'Annulee' }
  if (auction?.etat === 'terminee' || remainingSeconds === 0) return { value: 'terminee', label: 'Terminee' }
  if (auction?.etat === 'en_attente') return { value: 'en_attente', label: 'A venir' }
  return { value: 'en_cours', label: 'En cours' }
}

function getCurrentBid(product, auction) {
  return Number(auction?.meilleure_offre ?? auction?.prix_depart ?? product.prix ?? 0)
}

function getBestBidder(auction) {
  const id = auction?.meilleur_encherisseur?.id ?? auction?.meilleur_encherisseur_id
  const nom = auction?.meilleur_encherisseur?.nom
  return id ? { id, nom: nom || `Acheteur #${id}` } : null
}

function sellerOwnsProduct(product, user) {
  const vendorId = product.vendeur_id ?? product.vendeur?.id
  return vendorId && user?.id && Number(vendorId) === Number(user.id)
}

function MesEnchereImage({ product }) {
  const [failed, setFailed] = useState(false)
  const imageSrc = getImageSrc(product.image_url)

  if (!imageSrc || failed) {
    return (
      <div className="mes-encheres-image">
        <span>enchere</span>
      </div>
    )
  }

  return (
    <div className="mes-encheres-image">
      <img src={imageSrc} alt={product.titre} onError={() => setFailed(true)} />
    </div>
  )
}

export default function MesEncheres() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const [reminders, setReminders] = useState({})
  const productIdsKey = useMemo(() => items.map(({ product }) => product.id).join(','), [items])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!user?.id) return undefined
    let cancelled = false

    async function loadSellerAuctions() {
      setLoading(true)
      setError('')

      try {
        const data = await getProduits({ type_vente: 'enchere', limit: 50 })
        const auctionProducts = (data.produits ?? []).filter((product) => product.type_vente === 'enchere')
        const sellerProducts = data.mock
          ? auctionProducts
          : auctionProducts.filter((product) => sellerOwnsProduct(product, user))

        const withDetails = await Promise.all(
          sellerProducts.map(async (product) => {
            const auction = await getEnchere(product.id)
            return { product, auction: { ...auction, fetchedAt: Date.now() } }
          })
        )

        if (!cancelled) setItems(withDetails)
      } catch (err) {
        if (!cancelled) {
          setItems([])
          setError(err.message || 'Impossible de charger vos encheres.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadSellerAuctions()
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    const productIds = productIdsKey.split(',').filter(Boolean)
    if (productIds.length === 0) return undefined

    let cancelled = false

    async function refreshStatuses() {
      const statuses = await Promise.all(
        productIds.map(async (productId) => {
          try {
            const statut = await getEnchereStatut(productId)
            return [productId, { ...statut, fetchedAt: Date.now() }]
          } catch {
            return [productId, null]
          }
        })
      )

      if (!cancelled) {
        setItems((current) => current.map((item) => {
          const nextStatus = statuses.find(([productId]) => String(productId) === String(item.product.id))?.[1]
          return nextStatus
            ? { ...item, auction: { ...item.auction, ...nextStatus } }
            : item
        }))
      }
    }

    const interval = setInterval(refreshStatuses, 3000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [productIdsKey])

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const remainingA = getRemainingSeconds(a.auction, now)
      const remainingB = getRemainingSeconds(b.auction, now)
      const statusA = getAuctionStatus(a.auction, remainingA).value
      const statusB = getAuctionStatus(b.auction, remainingB).value

      if (statusA === 'terminee' && statusB !== 'terminee') return -1
      if (statusA !== 'terminee' && statusB === 'terminee') return 1

      return new Date(b.product.created_at || 0).getTime() - new Date(a.product.created_at || 0).getTime()
    })
  }, [items, now])

  async function handleReminder(productId) {
    setReminders((current) => ({
      ...current,
      [productId]: { loading: true, message: '', error: '' },
    }))

    try {
      await relancerPaiementEnchere(productId)
      setReminders((current) => ({
        ...current,
        [productId]: { loading: false, message: 'Rappel envoye a l acheteur.', error: '' },
      }))
    } catch (err) {
      setReminders((current) => ({
        ...current,
        [productId]: {
          loading: false,
          message: '',
          error: err.message || "Impossible d'envoyer le rappel.",
        },
      }))
    }
  }

  return (
    <main className="mes-encheres-page">
      <SiteHeader user={user} />

      <section className="mes-encheres-content" aria-labelledby="mes-encheres-title">
        <div className="mes-encheres-heading">
          <div>
            <p>Vendeur</p>
            <h1 id="mes-encheres-title">Mes encheres</h1>
          </div>
          <div className="mes-encheres-heading-actions">
            <Link className="mes-encheres-cta-link" to="/nouvelle-annonce?type=enchere">
              + Nouvelle enchere
            </Link>
            <Link className="mes-encheres-new-link" to="/catalogue">
              Voir le catalogue
            </Link>
          </div>
        </div>

        <div className="mes-encheres-summary" aria-label="Resume des encheres">
          <span>
            <small>Total</small>
            <strong>{items.length}</strong>
          </span>
          <span>
            <small>En cours</small>
            <strong>
              {sortedItems.filter(({ auction }) =>
                getAuctionStatus(auction, getRemainingSeconds(auction, now)).value === 'en_cours'
              ).length}
            </strong>
          </span>
          <span>
            <small>Terminees</small>
            <strong>
              {sortedItems.filter(({ auction }) =>
                getAuctionStatus(auction, getRemainingSeconds(auction, now)).value === 'terminee'
              ).length}
            </strong>
          </span>
        </div>

        {loading && <p className="mes-encheres-state">Chargement de vos encheres...</p>}
        {error && <p className="mes-encheres-state mes-encheres-state--error">{error}</p>}

        {!loading && !error && sortedItems.length === 0 && (
          <div className="mes-encheres-empty">
            <h2>Aucune enchere publiee</h2>
            <p>Vos annonces de type enchere apparaitront ici des qu elles seront disponibles.</p>
          </div>
        )}

        {!loading && !error && sortedItems.length > 0 && (
          <div className="mes-encheres-list">
            {sortedItems.map(({ product, auction }) => {
              const remainingSeconds = getRemainingSeconds(auction, now)
              const status = getAuctionStatus(auction, remainingSeconds)
              const bestBidder = getBestBidder(auction)
              const currentBid = getCurrentBid(product, auction)
              const reminder = reminders[product.id] ?? {}
              const canRemindBuyer = status.value === 'terminee' && bestBidder

              return (
                <article className="mes-encheres-card" key={product.id}>
                  <Link className="mes-encheres-card-link" to={`/enchere/${product.id}`}>
                    <MesEnchereImage product={product} />
                    <div className="mes-encheres-info">
                      <div className="mes-encheres-title-row">
                        <h2>{product.titre}</h2>
                        <span className={`mes-encheres-status mes-encheres-status--${status.value}`}>
                          {status.label}
                        </span>
                      </div>
                      <p>{product.description || 'Aucune description.'}</p>
                      <div className="mes-encheres-meta">
                        <span>
                          <small>Offre actuelle</small>
                          <strong>{formatPrice(currentBid)}</strong>
                        </span>
                        <span>
                          <small>Temps restant</small>
                          <strong>{formatRemainingTime(remainingSeconds)}</strong>
                        </span>
                        <span>
                          <small>Meilleur acheteur</small>
                          <strong>{bestBidder?.nom || 'Aucune offre'}</strong>
                        </span>
                      </div>
                    </div>
                  </Link>

                  {canRemindBuyer && (
                    <div className="mes-encheres-actions">
                      <button
                        className="mes-encheres-remind"
                        type="button"
                        onClick={() => handleReminder(product.id)}
                        disabled={reminder.loading}
                      >
                        {reminder.loading ? 'Envoi...' : "Rappeler a l'acheteur"}
                      </button>
                      {reminder.message && <p className="mes-encheres-action-note">{reminder.message}</p>}
                      {reminder.error && <p className="mes-encheres-action-error">{reminder.error}</p>}
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
