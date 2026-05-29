import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProduit } from '../api/produits'
import { getEnchere, getEnchereStatut, placerOffre, relancerPaiementEnchere } from '../api/encheres'
import { addToRecentlyViewed } from '../api/recentlyViewed'
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

function buildAuctionPhotos(product) {
  const rawPhotos = [
    ...(Array.isArray(product?.images) ? product.images : []),
    ...(Array.isArray(product?.photos) ? product.photos : []),
    ...(Array.isArray(product?.image_urls) ? product.image_urls : []),
    product?.image_url,
  ].filter(Boolean)

  const photos = rawPhotos
    .map((photo) => typeof photo === 'string' ? getImageSrc(photo) : getImageSrc(photo.url || photo.image_url))
    .filter(Boolean)

  if (photos.length > 1) return [...new Set(photos)]
  if (photos.length === 1 && photos[0].includes('picsum.photos/seed/')) {
    const seed = photos[0].match(/\/seed\/([^/]+)\//)?.[1] ?? `mn${product.id}`
    return [
      photos[0],
      `https://picsum.photos/seed/${seed}-2/900/760`,
      `https://picsum.photos/seed/${seed}-3/900/760`,
    ]
  }
  if (photos.length === 1) return photos

  return [
    `https://picsum.photos/seed/mn${product?.id ?? 'auction'}/900/760`,
    `https://picsum.photos/seed/mn${product?.id ?? 'auction'}-2/900/760`,
    `https://picsum.photos/seed/mn${product?.id ?? 'auction'}-3/900/760`,
  ]
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

function formatTimer(seconds) {
  if (seconds === null) return '--:--:--'
  if (seconds <= 0) return '00:00:00'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return [hours, minutes, secs].map((part) => String(part).padStart(2, '0')).join(':')
}

function isAuctionFinished(auction, remainingSeconds) {
  return auction?.etat === 'terminee' || auction?.etat === 'annulee' || remainingSeconds === 0
}

function getSellerName(product) {
  return product?.vendeur?.nom || product?.vendeur_nom || (product?.vendeur_id ? `Vendeur #${product.vendeur_id}` : 'Vendeur')
}

function getCurrentBid(auction, product) {
  return Number(auction?.meilleure_offre ?? auction?.prix_depart ?? product?.prix ?? 0)
}

export default function Enchere() {
  const { produitId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [auction, setAuction] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [offerOpen, setOfferOpen] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerError, setOfferError] = useState('')
  const [offerLoading, setOfferLoading] = useState(false)
  const [notifyLoading, setNotifyLoading] = useState(false)
  const [notifyMessage, setNotifyMessage] = useState('')
  const [photoIndex, setPhotoIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [productData, auctionData] = await Promise.all([
          getProduit(produitId),
          getEnchere(produitId),
        ])

        if (cancelled) return
        if (!productData) {
          setError('Produit introuvable.')
          return
        }

        setProduct(productData)
        addToRecentlyViewed({ ...productData, type_vente: 'enchere' })
        setPhotoIndex(0)
        setAuction({ ...auctionData, fetchedAt: Date.now() })
        setOfferAmount(String(Math.ceil(getCurrentBid(auctionData, productData) + 10)))
      } catch (err) {
        if (!cancelled) setError(err.message || "Impossible de charger l'enchere.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [produitId])

  useEffect(() => {
    if (!auction) return undefined

    let cancelled = false
    async function refreshStatus() {
      try {
        const statut = await getEnchereStatut(produitId)
        if (!cancelled) {
          setAuction((current) => ({ ...current, ...statut, fetchedAt: Date.now() }))
        }
      } catch {
        // La fiche garde le dernier etat connu si le polling echoue.
      }
    }

    const interval = setInterval(refreshStatus, 3000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [auction, produitId])

  const remainingSeconds = getRemainingSeconds(auction, now)
  const finished = isAuctionFinished(auction, remainingSeconds)
  const currentBid = getCurrentBid(auction, product)
  const photos = product ? buildAuctionPhotos(product) : []
  const currentPhoto = photos[photoIndex] ?? null
  const bestBidderId = auction?.meilleur_encherisseur?.id ?? auction?.meilleur_encherisseur_id
  const isWinner = Boolean(user?.id && bestBidderId && Number(user.id) === Number(bestBidderId))
  const isSeller = Boolean(
    user?.role === 'admin'
    || (user?.id && product?.vendeur_id && Number(user.id) === Number(product.vendeur_id))
  )
  const canBid = !finished && auction?.etat === 'en_cours' && !isSeller
  const canPay = finished && isWinner
  const canNotifyWinner = finished && isSeller && bestBidderId

  const history = useMemo(() => {
    return [...(auction?.historique ?? [])]
      .sort((a, b) => Number(b.montant) - Number(a.montant))
      .slice(0, 4)
  }, [auction])

  function prevPhoto() {
    setPhotoIndex((index) => (index - 1 + photos.length) % photos.length)
  }

  function nextPhoto() {
    setPhotoIndex((index) => (index + 1) % photos.length)
  }

  async function reloadAuction() {
    const nextAuction = await getEnchere(produitId)
    setAuction({ ...nextAuction, fetchedAt: Date.now() })
    setOfferAmount(String(Math.ceil(getCurrentBid(nextAuction, product) + 10)))
  }

  async function handleOfferSubmit(event) {
    event.preventDefault()
    setOfferError('')

    if (!user) {
      navigate('/login')
      return
    }

    const amount = Number(offerAmount)
    if (!amount || amount <= currentBid) {
      setOfferError(`Votre offre doit etre superieure a ${formatPrice(currentBid)}.`)
      return
    }

    setOfferLoading(true)
    try {
      await placerOffre(produitId, amount)
      setOfferOpen(false)
      await reloadAuction()
    } catch (err) {
      setOfferError(err.message || "Impossible d'enregistrer l'offre.")
    } finally {
      setOfferLoading(false)
    }
  }

  function handlePayAuction() {
    navigate('/paiement', {
      state: {
        produit: product,
        prixAccepte: currentBid,
        fromAuction: true,
      },
    })
  }

  async function handleNotifyWinner() {
    setNotifyMessage('')
    setNotifyLoading(true)
    try {
      await relancerPaiementEnchere(produitId)
      setNotifyMessage("Notification envoyee a l'acheteur.")
    } catch (err) {
      setNotifyMessage(err.message || "Impossible d'envoyer la notification.")
    } finally {
      setNotifyLoading(false)
    }
  }

  return (
    <main className="fiche-enchere-page">
      <SiteHeader user={user} />

      {loading && <p className="fiche-enchere-state">Chargement de l'enchere...</p>}
      {error && <p className="fiche-enchere-state fiche-enchere-state--error">{error}</p>}

      {!loading && !error && product && auction && (
        <section className="fiche-enchere-layout" aria-labelledby="fiche-enchere-title">
          <aside className="fiche-enchere-product">
            <div className="fiche-enchere-gallery">
              <div className="fiche-enchere-photo">
                {currentPhoto
                ? <img src={currentPhoto} alt={`${product.titre} - photo ${photoIndex + 1}`} />
                : <span>photo produit</span>}
              </div>

              {photos.length > 1 && (
                <>
                  <button className="fiche-enchere-photo-arrow fiche-enchere-photo-arrow--prev" type="button" aria-label="Image precedente" onClick={prevPhoto}>
                    &#8249;
                  </button>
                  <button className="fiche-enchere-photo-arrow fiche-enchere-photo-arrow--next" type="button" aria-label="Image suivante" onClick={nextPhoto}>
                    &#8250;
                  </button>
                </>
              )}
            </div>
            {photos.length > 1 && (
              <div className="fiche-enchere-photo-dots" aria-label="Choix de l'image">
                {photos.map((photo, index) => (
                  <button
                    key={photo}
                    className={`fiche-enchere-photo-dot${index === photoIndex ? ' fiche-enchere-photo-dot--active' : ''}`}
                    type="button"
                    aria-label={`Afficher la photo ${index + 1}`}
                    onClick={() => setPhotoIndex(index)}
                  />
                ))}
              </div>
            )}
            <h2>{product.titre}</h2>
            <p>{getSellerName(product)}</p>
            <div className="fiche-enchere-description">
              <strong>Description :</strong>
              <p>{product.description ?? '-'}</p>
            </div>
          </aside>

          <div className="fiche-enchere-main">
            <div className="fiche-enchere-topline">
              <h1 id="fiche-enchere-title">Enchere - {product.titre}</h1>
              {finished && <span className="fiche-enchere-check" aria-label="Enchere terminee">✓</span>}
            </div>

            <div className="fiche-enchere-timer-row">
              <span>Temps restant :</span>
              <strong>{formatTimer(remainingSeconds)}</strong>
            </div>

            <section className="fiche-enchere-history" aria-labelledby="offres-title">
              <h2 id="offres-title">Historique des offres :</h2>

              {history.length === 0 ? (
                <p className="fiche-enchere-empty">Aucune offre pour le moment.</p>
              ) : (
                <ul>
                  {history.map((offer, index) => (
                    <li key={`${offer.utilisateur_id}-${offer.montant}-${index}`}>
                      <span>{offer.nom || `Acheteur #${offer.utilisateur_id}`}</span>
                      <strong>{formatPrice(offer.montant)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="fiche-enchere-actions">
              {canBid && (
                <>
                  {!offerOpen ? (
                    <button className="fiche-enchere-primary" type="button" onClick={() => setOfferOpen(true)}>
                      Faire une offre
                    </button>
                  ) : (
                    <form className="fiche-enchere-offer-form" onSubmit={handleOfferSubmit}>
                      <label htmlFor="auction-offer">Votre offre</label>
                      <div>
                        <input
                          id="auction-offer"
                          type="number"
                          min={Math.ceil(currentBid + 1)}
                          step="1"
                          value={offerAmount}
                          onChange={(event) => setOfferAmount(event.target.value)}
                        />
                        <button className="fiche-enchere-primary" type="submit" disabled={offerLoading}>
                          {offerLoading ? 'Envoi...' : 'Valider'}
                        </button>
                      </div>
                      {offerError && <p className="fiche-enchere-action-error">{offerError}</p>}
                    </form>
                  )}
                </>
              )}

              {canPay && (
                <button className="fiche-enchere-primary" type="button" onClick={handlePayAuction}>
                  Payer l'enchere
                </button>
              )}

              {canNotifyWinner && (
                <button className="fiche-enchere-secondary" type="button" onClick={handleNotifyWinner} disabled={notifyLoading}>
                  {notifyLoading ? 'Envoi...' : "Notifier l'acheteur de payer"}
                </button>
              )}

              {!canBid && !canPay && !canNotifyWinner && (
                <p className="fiche-enchere-action-note">
                  {finished ? 'Cette enchere est terminee.' : 'Connectez-vous en acheteur pour faire une offre.'}
                </p>
              )}

              {notifyMessage && <p className="fiche-enchere-action-note">{notifyMessage}</p>}
            </div>

            <Link className="fiche-enchere-back" to="/encheres">Retour aux encheres</Link>
          </div>
        </section>
      )}
    </main>
  )
}
