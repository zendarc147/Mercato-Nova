import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import SiteHeader from '../components/SiteHeader'
import { addToCart, checkout } from '../api/panier'

const MOYENS = [
  { value: 'carte', label: 'Carte bancaire' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'virement', label: 'Virement bancaire' },
]

export default function Paiement() {
  const { user } = useAuth()
  const { refreshCart } = useCart()
  const { state } = useLocation()

  const [moyenPaiement, setMoyenPaiement] = useState('carte')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [commandeId, setCommandeId] = useState(null)

  const fromPanier = state?.fromPanier === true
  const items = state?.items ?? []
  const total = state?.total ?? 0
  const produit = state?.produit ?? null
  const prixAccepte = state?.prixAccepte ?? 0

  const isValid = fromPanier ? items.length > 0 : produit !== null

  if (!isValid) {
    return (
      <main className="paiement-page">
        <SiteHeader user={user} />
        <div className="paiement-state paiement-state--error">
          Aucune commande à payer.{' '}
          <Link to="/catalogue">Retour au catalogue</Link>
        </div>
      </main>
    )
  }

  const totalAffiche = fromPanier ? total : prixAccepte

  async function handlePayer(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (!fromPanier) {
        await addToCart(produit.id, 1)
      }
      const res = await checkout(moyenPaiement)
      refreshCart()
      setCommandeId(res.commande_id)
    } catch (err) {
      setError(err.message || 'Erreur lors du paiement.')
    } finally {
      setLoading(false)
    }
  }

  if (commandeId) {
    return (
      <main className="paiement-page">
        <SiteHeader user={user} />
        <div className="paiement-success">
          <div className="paiement-success-icon">✓</div>
          <h1>Paiement confirmé</h1>
          <p>Commande n°{commandeId} enregistrée avec succès.</p>
          {fromPanier ? (
            <p className="paiement-success-detail">
              {items.length} article{items.length > 1 ? 's' : ''} — {Number(totalAffiche).toFixed(2)} €
            </p>
          ) : (
            <p className="paiement-success-detail">
              {produit.titre} — {Number(prixAccepte).toFixed(2)} €
            </p>
          )}
          <Link className="paiement-btn" to="/catalogue">
            Retour au catalogue
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="paiement-page">
      <SiteHeader user={user} />

      <div className="paiement-layout">
        <div className="paiement-recap">
          <h2>Récapitulatif</h2>
          {fromPanier ? (
            items.map((item) => (
              <div key={item.id ?? item.produit_id} className="paiement-recap-row">
                <span>{item.titre}{item.quantite > 1 ? ` ×${item.quantite}` : ''}</span>
                <strong>{Number(item.prix * item.quantite).toFixed(2)} €</strong>
              </div>
            ))
          ) : (
            <div className="paiement-recap-row">
              <span>{produit.titre}</span>
              <strong>{Number(prixAccepte).toFixed(2)} €</strong>
            </div>
          )}
          <div className="paiement-recap-row paiement-recap-total">
            <span>Total</span>
            <strong>{Number(totalAffiche).toFixed(2)} €</strong>
          </div>
          {!fromPanier && (
            <p className="paiement-recap-note">Prix négocié et accepté par les deux parties.</p>
          )}
        </div>

        <form className="paiement-form" onSubmit={handlePayer}>
          <h1>Paiement</h1>

          <fieldset className="paiement-moyens">
            <legend>Moyen de paiement</legend>
            {MOYENS.map((m) => (
              <label key={m.value} className="paiement-moyen-option">
                <input
                  type="radio"
                  name="moyen"
                  value={m.value}
                  checked={moyenPaiement === m.value}
                  onChange={() => setMoyenPaiement(m.value)}
                />
                <span>{m.label}</span>
              </label>
            ))}
          </fieldset>

          {error && <p className="paiement-error">{error}</p>}

          <button className="paiement-btn" type="submit" disabled={loading}>
            {loading ? 'Traitement…' : `Payer ${Number(totalAffiche).toFixed(2)} €`}
          </button>

          <Link className="paiement-link-back" to={fromPanier ? '/panier' : `/negociation/${produit.id}`}>
            ← Retour {fromPanier ? 'au panier' : 'à la négociation'}
          </Link>
        </form>
      </div>
    </main>
  )
}
