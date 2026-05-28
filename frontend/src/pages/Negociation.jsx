import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SiteHeader from '../components/SiteHeader'
import { getProduit } from '../api/produits'
import { getNegociations, getNegociation, creerNegociation, repondreNegociation } from '../api/negociations'

export default function Negociation() {
  const { produitId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [produit, setProduit] = useState(null)
  const [negociation, setNegociation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // formulaire initiation
  const [initPrix, setInitPrix] = useState('')
  const [initMessage, setInitMessage] = useState('')
  const [initError, setInitError] = useState(null)
  const [initLoading, setInitLoading] = useState(false)

  // formulaire contre-offre
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [offrePrix, setOffrePrix] = useState('')
  const [offreMessage, setOffreMessage] = useState('')
  const [offreError, setOffreError] = useState(null)
  const [offreLoading, setOffreLoading] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    load()
  }, [produitId, user])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [p, liste] = await Promise.all([
        getProduit(produitId),
        getNegociations().catch(() => ({ negociations: [] })),
      ])
      if (!p) { setError('Produit introuvable.'); setLoading(false); return }
      setProduit(p)

      const match = (liste.negociations ?? []).find(
        (n) => n.produit_titre === p.titre && ['en_attente', 'contre_offre'].includes(n.etat)
      )
      if (match) {
        const detail = await getNegociation(match.id)
        setNegociation(detail)
      }
    } catch {
      setError('Impossible de charger la négociation.')
    } finally {
      setLoading(false)
    }
  }

  async function handleInitier(e) {
    e.preventDefault()
    if (!initPrix || Number(initPrix) <= 0) { setInitError('Entrez un prix valide.'); return }
    setInitLoading(true)
    setInitError(null)
    try {
      const res = await creerNegociation(Number(produitId), Number(initPrix), initMessage)
      const detail = await getNegociation(res.negociation_id)
      setNegociation(detail)
    } catch (err) {
      setInitError(err.message || 'Erreur lors de la création.')
    } finally {
      setInitLoading(false)
    }
  }

  async function handleRepondre(action) {
    if (action === 'contre_offre' && (!offrePrix || Number(offrePrix) <= 0)) {
      setOffreError('Entrez un prix valide.'); return
    }
    setOffreLoading(true)
    setOffreError(null)
    try {
      await repondreNegociation(
        negociation.id,
        action,
        action === 'contre_offre' ? Number(offrePrix) : undefined,
        offreMessage || undefined
      )
      const detail = await getNegociation(negociation.id)
      setNegociation(detail)
      setShowOfferForm(false)
      setOffrePrix('')
      setOffreMessage('')
    } catch (err) {
      setOffreError(err.message || 'Erreur.')
    } finally {
      setOffreLoading(false)
    }
  }

  const monRole = negociation && user
    ? negociation.acheteur?.id === user.id ? 'acheteur' : 'vendeur'
    : null

  const estMonTour = negociation
    ? negociation.etat === 'en_attente'
      ? monRole === 'vendeur'
      : negociation.echanges?.length > 0
        ? negociation.echanges[negociation.echanges.length - 1].auteur !== monRole
        : false
    : false

  const negoTerminee = negociation && ['accepte', 'refuse', 'expire'].includes(negociation.etat)

  return (
    <main className="nego-page">
      <SiteHeader user={user} />

      {loading && <p className="nego-state">Chargement…</p>}
      {error && <p className="nego-state nego-state--error">{error}</p>}

      {!loading && !error && produit && (
        <>
          <h1 className="nego-title">Négociation — {produit.titre}</h1>

          <div className="nego-layout">
            {/* Panneau gauche : produit */}
            <div className="nego-produit">
              <div className="nego-produit-image">
                {produit.image_url
                  ? <img src={`/uploads/produits/${produit.image_url}`} alt={produit.titre} />
                  : <span>photo produit</span>}
              </div>
              <p className="nego-produit-titre">{produit.titre}</p>
              <p className="nego-produit-vendeur">{produit.vendeur?.nom}</p>
              {produit.description && (
                <p className="nego-produit-desc">
                  <strong>Description :</strong><br />{produit.description}
                </p>
              )}
            </div>

            {/* Panneau droit : thread ou formulaire d'initiation */}
            <div className="nego-thread-panel">
              {!negociation ? (
                /* Pas encore de négociation : formulaire d'initiation */
                <form className="nego-init-form" onSubmit={handleInitier}>
                  <p className="nego-init-label">Proposez un prix pour ce produit</p>
                  <div className="nego-form-field">
                    <label htmlFor="init-prix">Votre offre (€)</label>
                    <input
                      id="init-prix"
                      type="number"
                      min="1"
                      step="0.01"
                      value={initPrix}
                      onChange={(e) => setInitPrix(e.target.value)}
                      placeholder={`Prix actuel : ${Number(produit.prix).toFixed(2)} €`}
                      required
                    />
                  </div>
                  <div className="nego-form-field">
                    <label htmlFor="init-message">Message (optionnel)</label>
                    <textarea
                      id="init-message"
                      value={initMessage}
                      onChange={(e) => setInitMessage(e.target.value)}
                      rows={3}
                      placeholder="Présentez votre offre…"
                    />
                  </div>
                  {initError && <p className="nego-error">{initError}</p>}
                  <button className="nego-btn" type="submit" disabled={initLoading}>
                    {initLoading ? 'Envoi…' : 'Faire une offre'}
                  </button>
                </form>
              ) : (
                /* Négociation existante : thread */
                <>
                  <div className="nego-thread">
                    {negociation.echanges?.map((e, i) => {
                      const isVendeur = e.auteur === 'vendeur'
                      return (
                        <div key={i} className={`nego-message-row nego-message-row--${e.auteur}`}>
                          <span className="nego-message-author">
                            {isVendeur ? negociation.vendeur?.nom : negociation.acheteur?.nom}
                          </span>
                          <div className={`nego-bubble nego-bubble--${e.auteur}`}>
                            {e.message && <p>{e.message}</p>}
                          </div>
                          <span className="nego-message-price">
                            {Number(e.montant).toFixed(2)} €
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {negoTerminee ? (
                    <p className="nego-etat-final">
                      Négociation {negociation.etat === 'accepte' ? 'acceptée ✓' : negociation.etat === 'refuse' ? 'refusée' : 'expirée'}.
                    </p>
                  ) : estMonTour && (
                    <div className="nego-actions">
                      {showOfferForm ? (
                        <div className="nego-offre-form">
                          <div className="nego-form-field">
                            <label htmlFor="offre-prix">Contre-offre (€)</label>
                            <input
                              id="offre-prix"
                              type="number"
                              min="1"
                              step="0.01"
                              value={offrePrix}
                              onChange={(e) => setOffrePrix(e.target.value)}
                            />
                          </div>
                          <div className="nego-form-field">
                            <label htmlFor="offre-message">Message (optionnel)</label>
                            <textarea
                              id="offre-message"
                              value={offreMessage}
                              onChange={(e) => setOffreMessage(e.target.value)}
                              rows={2}
                            />
                          </div>
                          {offreError && <p className="nego-error">{offreError}</p>}
                          <div className="nego-actions-row">
                            <button className="nego-btn" onClick={() => handleRepondre('contre_offre')} disabled={offreLoading}>
                              {offreLoading ? 'Envoi…' : 'Envoyer'}
                            </button>
                            <button className="nego-btn nego-btn--outline" onClick={() => setShowOfferForm(false)}>
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="nego-actions-row">
                          <button className="nego-btn" onClick={() => setShowOfferForm(true)}>
                            Faire une offre
                          </button>
                          <button className="nego-btn" onClick={() => handleRepondre('accepter')} disabled={offreLoading}>
                            Accepter l'offre
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  )
}
