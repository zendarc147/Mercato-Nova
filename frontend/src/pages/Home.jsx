import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import logoFondVert from '../assets/logo-fond-vert.png'
import pictosHome from '../assets/pictos-home.png'
import pictoCatalogueGauche from '../../wireframes/picto-catalogue-gauche.png'
import pictoCatalogueDroite from '../../wireframes/picto-catalogue-droite.png'

const productSections = [
  {
    title: 'Recommandé',
    items: [
      { name: 'Vase céladon', seller: 'Atelier Lune', price: '120,00 EUR' },
      { name: 'Lithographie', seller: 'Galerie Nova', price: '85,00 EUR' },
      { name: 'Table basse', seller: 'Maison Arp', price: '340,00 EUR' },
      { name: 'Portrait ancien', seller: 'Lucien Morel', price: '210,00 EUR' },
    ],
  },
  {
    title: 'Articles vus récemment',
    items: [
      { name: 'Lampe opaline', seller: 'Studio Verre', price: '64,00 EUR' },
      { name: 'Bracelet émail', seller: 'Mina Or', price: '92,00 EUR' },
      { name: 'Affiche 70s', seller: 'Rétro Paris', price: '48,00 EUR' },
      { name: 'Coupe signée', seller: 'C. Valin', price: '150,00 EUR' },
    ],
  },
  {
    title: 'Enchères recommandées',
    items: [
      { name: 'Huile marine', seller: 'Rive Gauche', price: '320,00 EUR' },
      { name: 'Fauteuil club', seller: 'Brocantique', price: '410,00 EUR' },
      { name: 'Montre gousset', seller: 'Temps Rare', price: '190,00 EUR' },
      { name: 'Sculpture bois', seller: 'Atelier Sato', price: '260,00 EUR' },
    ],
  },
  {
    title: 'Enchères bientôt fermées',
    items: [
      { name: 'Service porcelaine', seller: 'Maison Ivoire', price: '180,00 EUR' },
      { name: 'Tapis noué main', seller: 'Nadir', price: '520,00 EUR' },
      { name: 'Bague ancienne', seller: 'Orphée', price: '240,00 EUR' },
      { name: 'Dessin signé', seller: 'Carnet Bleu', price: '76,00 EUR' },
    ],
  },
]

export default function Home() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const isConnected = Boolean(user)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  function handleSearch(e) {
    e.preventDefault()
    const query = new FormData(e.currentTarget).get('q')?.trim()
    navigate(query ? `/catalogue?q=${encodeURIComponent(query)}` : '/catalogue')
  }

  if (loading) {
    return <div className="page-placeholder">Chargement...</div>
  }

  return (
    <main className={isConnected ? 'connected-home' : 'guest-home'}>
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Mercato Nova accueil">
          <img className="brand-logo" src={logoFondVert} alt="" />
          <span className="brand-name">Mercato Nova</span>
        </Link>

        <nav className="main-nav" aria-label="Navigation principale">
          <Link to="/encheres">Enchères</Link>
          <Link to="/catalogue">Catalogue</Link>
          {!isConnected && <Link to="/login">Connexion</Link>}
        </nav>

        {isConnected ? (
          <div className="header-actions">
            <Link className="icon-link cart-link" to="/panier" aria-label="Ouvrir le panier">
              <span className="cart-basket" />
              <span className="cart-wheel cart-wheel-left" />
              <span className="cart-wheel cart-wheel-right" />
            </Link>

            <Link
              className="icon-link notification-link"
              to="/notifications"
              aria-label="Ouvrir les notifications"
            >
              <span className="bell-body" />
              <span className="bell-clapper" />
            </Link>

            <div className="profile-menu-wrap">
              <button
                className="profile-link profile-button"
                type="button"
                aria-label="Ouvrir le menu profil"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((open) => !open)}
              >
                <span className="profile-head" />
                <span className="profile-body" />
              </button>

              {profileOpen && (
                <aside className="profile-drawer" aria-label="Menu profil">
                  <Link to="/profil">Profil</Link>
                  <Link to="/panier">Mon panier</Link>
                  <Link to="/mes-ventes">Mes Ventes</Link>
                  <Link to="/mes-negociations">Mes Négociations</Link>
                  <Link to="/mes-encheres">Mes Enchères</Link>
                  <button type="button" onClick={handleLogout}>
                    Déconnexion
                  </button>
                </aside>
              )}
            </div>
          </div>
        ) : (
          <Link className="profile-link" to="/login" aria-label="Se connecter">
            <span className="profile-head" />
            <span className="profile-body" />
          </Link>
        )}
      </header>

      <section className="guest-hero" aria-labelledby="home-title">
        <h1 id="home-title">La place de l'art et des enchères</h1>

        {isConnected ? (
          <>
            <img
              className="connected-hero-picto connected-hero-picto-left"
              src={pictoCatalogueGauche}
              alt=""
              aria-hidden="true"
            />
            <img
              className="connected-hero-picto connected-hero-picto-right"
              src={pictoCatalogueDroite}
              alt=""
              aria-hidden="true"
            />
          </>
        ) : (
          <img className="home-pictos" src={pictosHome} alt="" aria-hidden="true" />
        )}

        <form className="search-bar" role="search" onSubmit={handleSearch}>
          <span className="search-icon" aria-hidden="true" />
          <label className="sr-only" htmlFor="home-search">
            Rechercher une œuvre
          </label>
          <input id="home-search" name="q" type="search" placeholder="Rechercher une œuvre" />
        </form>
      </section>

      {isConnected ? (
        <section className="home-product-sections" aria-label="Sélections Mercato Nova">
          {productSections.map((section) => (
            <section className="product-section" key={section.title}>
              <h2>{section.title} :</h2>
              <div className="product-strip">
                {section.items.map((item) => (
                  <Link className="mini-product" to="/catalogue" key={`${section.title}-${item.name}`}>
                    <span className="mini-product-image">produit</span>
                    <span className="mini-product-info">
                      <strong>{item.name}</strong>
                      <span>{item.seller}</span>
                      <b>{item.price}</b>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </section>
      ) : (
        <section className="about-section" aria-labelledby="about-title">
          <h2 id="about-title">Qui sommes-nous ?</h2>
          <p>
            Mercato Nova est une plateforme d'enchères et de vente dédiée à toutes les formes
            d'art : œuvres classiques, créations contemporaines, artisanat, photographie, objets
            rares et pièces uniques.
            <br />
            Pensée autant pour les professionnels que pour les nouveaux passionnés, notre plateforme
            réunit élégance, accessibilité et découverte à travers une expérience moderne inspirée
            des grandes maisons d'art et des marchés historiques.
          </p>
        </section>
      )}
    </main>
  )
}
