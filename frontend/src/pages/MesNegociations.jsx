import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SiteHeader from '../components/SiteHeader'
import { getNegociations } from '../api/negociations'

function getImageSrc(imageUrl) {
  if (!imageUrl) return null
  if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) return imageUrl
  return `/uploads/produits/${imageUrl}`
}

const ETAT_LABEL = {
  en_attente:   'En attente',
  contre_offre: 'Contre-offre',
  accepte:      'Acceptée',
  refuse:       'Refusée',
  expire:       'Expirée',
}

const ETAT_CLASS = {
  en_attente:   'nego-badge--attente',
  contre_offre: 'nego-badge--encours',
  accepte:      'nego-badge--accepte',
  refuse:       'nego-badge--refuse',
  expire:       'nego-badge--expire',
}

function statutTour(nego, userId) {
  const terminee = ['accepte', 'refuse', 'expire'].includes(nego.etat)
  if (terminee) return null

  const monRole = nego.acheteur_id === userId ? 'acheteur' : 'vendeur'
  const estMonTour = nego.dernier_acteur !== monRole
  return estMonTour ? 'mon-tour' : 'attente'
}

export default function MesNegociations() {
  const { user } = useAuth()
  const [negociations, setNegociations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getNegociations()
        setNegociations(data.negociations ?? [])
      } catch (err) {
        setError(err.message || 'Impossible de charger les négociations.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const actives  = negociations.filter((n) => ['en_attente', 'contre_offre'].includes(n.etat))
  const termines = negociations.filter((n) => ['accepte', 'refuse', 'expire'].includes(n.etat))

  return (
    <main className="mes-negos-page">
      <SiteHeader user={user} />

      <div className="mes-negos-content">
        <h1 className="mes-negos-title">Mes négociations</h1>

        {loading && <p className="mes-negos-state">Chargement…</p>}
        {error   && <p className="mes-negos-state mes-negos-state--error">{error}</p>}

        {!loading && !error && negociations.length === 0 && (
          <p className="mes-negos-state mes-negos-state--empty">
            Aucune négociation pour le moment.{' '}
            <Link to="/catalogue">Explorer le catalogue</Link>
          </p>
        )}

        {!loading && !error && actives.length > 0 && (
          <section className="mes-negos-section">
            <h2 className="mes-negos-section-title">En cours</h2>
            <ul className="mes-negos-list">
              {actives.map((nego) => {
                const tour = statutTour(nego, user?.id)
                const imgSrc = getImageSrc(nego.produit_image)
                return (
                  <li key={nego.id}>
                    <Link to={`/negociation/${nego.produit_id}`} className="mes-negos-item">
                      <div className="mes-negos-item-image">
                        {imgSrc
                          ? <img src={imgSrc} alt={nego.produit_titre} />
                          : <span>produit</span>}
                      </div>
                      <div className="mes-negos-item-info">
                        <p className="mes-negos-item-titre">{nego.produit_titre}</p>
                        <p className="mes-negos-item-offre">
                          Dernière offre : <strong>{Number(nego.derniere_offre).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong>
                        </p>
                        <span className={`nego-badge ${ETAT_CLASS[nego.etat] ?? ''}`}>
                          {ETAT_LABEL[nego.etat] ?? nego.etat}
                        </span>
                      </div>
                      <div className="mes-negos-item-tour">
                        {tour === 'mon-tour' ? (
                          <span className="tour-badge tour-badge--action">À vous de jouer</span>
                        ) : (
                          <span className="tour-badge tour-badge--attente">En attente</span>
                        )}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {!loading && !error && termines.length > 0 && (
          <section className="mes-negos-section">
            <h2 className="mes-negos-section-title">Terminées</h2>
            <ul className="mes-negos-list mes-negos-list--termines">
              {termines.map((nego) => {
                const imgSrc = getImageSrc(nego.produit_image)
                return (
                  <li key={nego.id}>
                    <Link to={`/negociation/${nego.produit_id}`} className="mes-negos-item mes-negos-item--termine">
                      <div className="mes-negos-item-image">
                        {imgSrc
                          ? <img src={imgSrc} alt={nego.produit_titre} />
                          : <span>produit</span>}
                      </div>
                      <div className="mes-negos-item-info">
                        <p className="mes-negos-item-titre">{nego.produit_titre}</p>
                        <p className="mes-negos-item-offre">
                          Prix final : <strong>{Number(nego.derniere_offre).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong>
                        </p>
                        <span className={`nego-badge ${ETAT_CLASS[nego.etat] ?? ''}`}>
                          {ETAT_LABEL[nego.etat] ?? nego.etat}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
