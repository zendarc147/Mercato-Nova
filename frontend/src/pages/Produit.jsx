import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getProduit } from '../api/produits'
import { addToRecentlyViewed } from '../api/recentlyViewed'
import { useAuth } from '../context/AuthContext'
import ProfileMenu from '../components/ProfileMenu'
import logoFondVert from '../assets/logo-fond-vert.png'

function SiteHeader({ user }) {
  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="Mercato Nova accueil">
        <img className="brand-logo" src={logoFondVert} alt="" />
        <span className="brand-name">Mercato Nova</span>
      </Link>
      <nav className="main-nav" aria-label="Navigation principale">
        <Link to="/encheres">Enchères</Link>
        <Link to="/catalogue">Catalogue</Link>
        {!user && <Link to="/login">Connexion</Link>}
      </nav>
      {user ? (
        <div className="header-icons">
          <Link to="/panier" className="header-icon-link" aria-label="Panier">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </Link>
          <Link to="/notifications" className="header-icon-link" aria-label="Notifications">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </Link>
          <ProfileMenu />
        </div>
      ) : (
        <Link className="profile-link" to="/login" aria-label="Se connecter">
          <span className="profile-head" />
          <span className="profile-body" />
        </Link>
      )}
    </header>
  )
}

const TYPE_LABELS = {
  achat_immediat: 'Achat immédiat',
  enchere: 'Enchère',
  negociation: 'Négociation',
}

const ETAT_LABELS = {
  neuf: 'Neuf',
  bon_etat: 'Bon état',
  correct: 'Correct',
  mauvais_etat: 'Mauvais état',
}

export default function Produit() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [produit, setProduit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
        addToRecentlyViewed(data)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id])

  return (
    <main className="produit-page">
      <SiteHeader user={user} />

      <div className="produit-container">
        <button className="produit-back" onClick={() => navigate(-1)}>
          ← Retour
        </button>

        {loading && <p className="produit-state">Chargement…</p>}
        {error && <p className="produit-state produit-state--error">{error}</p>}

        {produit && (
          <div className="produit-detail">
            <div className="produit-image">
              {produit.image_url
                ? <img src={`/uploads/produits/${produit.image_url}`} alt={produit.titre} />
                : <span className="produit-img-placeholder">Œuvre</span>}
            </div>

            <div className="produit-info">
              <h1 className="produit-titre">{produit.titre}</h1>

              {produit.vendeur && (
                <p className="produit-vendeur">
                  Par <strong>{produit.vendeur.prenom ?? ''} {produit.vendeur.nom}</strong>
                </p>
              )}

              <div className="produit-badges">
                {produit.categorie && (
                  <span className="produit-badge">{produit.categorie}</span>
                )}
                {produit.etat && (
                  <span className="produit-badge">{ETAT_LABELS[produit.etat] ?? produit.etat}</span>
                )}
                {produit.type_vente && (
                  <span className="produit-badge produit-badge--type">
                    {TYPE_LABELS[produit.type_vente] ?? produit.type_vente}
                  </span>
                )}
              </div>

              <p className="produit-prix">{Number(produit.prix).toFixed(2)} €</p>

              {produit.description && (
                <p className="produit-description">{produit.description}</p>
              )}

              {user ? (
                <div className="produit-actions">
                  {produit.type_vente === 'achat_immediat' && (
                    <Link to="/panier" className="btn-primary">Ajouter au panier</Link>
                  )}
                  {produit.type_vente === 'enchere' && (
                    <Link to={`/enchere/${produit.id}`} className="btn-primary btn-enchere">
                      Voir l'enchère
                    </Link>
                  )}
                  {produit.type_vente === 'negociation' && (
                    <Link to={`/negociation/${produit.id}`} className="btn-primary btn-negociation">
                      Négocier
                    </Link>
                  )}
                </div>
              ) : (
                <Link to="/login" className="btn-primary">Se connecter pour acheter</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
