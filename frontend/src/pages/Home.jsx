import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProduits } from '../api/produits'
import { getRecentlyViewed } from '../api/recentlyViewed'
import ProfileMenu from '../components/ProfileMenu'
import logoFondVert from '../assets/logo-fond-vert.png'
import pictosHome from '../assets/pictos-home.png'

const CATEGORIES = ['Peinture', 'Sculpture', 'Photographie', 'Gravure', 'Céramique', 'Bijoux']

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

function HeroSection() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()

  function handleSearch(e) {
    e.preventDefault()
    if (q.trim()) navigate(`/catalogue?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <section className="guest-hero" aria-labelledby="home-title">
      <h1 id="home-title">La place de l'art et des enchères</h1>
      <img className="home-pictos" src={pictosHome} alt="" aria-hidden="true" />
      <form className="search-bar" role="search" onSubmit={handleSearch}>
        <span className="search-icon" aria-hidden="true" />
        <label className="sr-only" htmlFor="home-search">Rechercher une œuvre</label>
        <input
          id="home-search"
          name="q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une œuvre, un artiste…"
        />
      </form>
    </section>
  )
}

function ProductCard({ product }) {
  return (
    <Link to={`/produit/${product.id}`} className="product-card" role="listitem">
      <div className="product-card-img">
        {product.image_url
          ? <img src={`/uploads/produits/${product.image_url}`} alt={product.titre} />
          : <span className="product-img-placeholder">Œuvre</span>}
      </div>
      <div className="product-card-info">
        <span className="product-card-title">{product.titre}</span>
        <span className="product-card-seller">{product.vendeur?.nom}</span>
        <span className="product-card-price">{Number(product.prix).toFixed(2)} €</span>
      </div>
    </Link>
  )
}

function ProductSection({ title, produits, loading, emptyMessage }) {
  return (
    <section className="product-section">
      <h2 className="product-section-title">{title}</h2>
      {loading ? (
        <p className="product-section-state">Chargement…</p>
      ) : produits.length === 0 ? (
        <p className="product-section-state">{emptyMessage ?? 'Aucun produit disponible pour le moment.'}</p>
      ) : (
        <div className="product-grid" role="list">
          {produits.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  )
}

function ConnectedHome() {
  const [activeCat, setActiveCat] = useState(null)
  const [produits, setProduits] = useState([])
  const [encheres, setEncheres] = useState([])
  const [recentProduits, setRecentProduits] = useState([])
  const [recentEncheres, setRecentEncheres] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const recent = getRecentlyViewed()
    setRecentProduits(recent.filter((p) => p.type_vente !== 'enchere'))
    setRecentEncheres(recent.filter((p) => p.type_vente === 'enchere'))
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const params = activeCat ? { categorie: activeCat } : {}
        const [resProduits, resEncheres] = await Promise.all([
          getProduits(params),
          getProduits({ ...params, type_vente: 'enchere' }),
        ])
        if (cancelled) return
        setProduits((resProduits.produits ?? []).slice(0, 8))
        setEncheres((resEncheres.produits ?? []).slice(0, 8))
      } catch {
        if (!cancelled) { setProduits([]); setEncheres([]) }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [activeCat])

  return (
    <>
      <HeroSection />

      <section className="categories-row" aria-label="Filtrer par catégorie">
        <button
          className={`category-chip${activeCat === null ? ' category-chip--active' : ''}`}
          onClick={() => setActiveCat(null)}
        >
          Tout
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`category-chip${activeCat === cat ? ' category-chip--active' : ''}`}
            onClick={() => setActiveCat(activeCat === cat ? null : cat)}
          >
            {cat}
          </button>
        ))}
      </section>

      <div className="home-sections">
        <ProductSection title="Produits recommandés" produits={produits} loading={loading} />
        <ProductSection title="Produits vus récemment" produits={recentProduits} loading={false} emptyMessage="Aucun produit consulté récemment." />
        <ProductSection title="Enchères recommandées" produits={encheres} loading={loading} />
        <ProductSection title="Enchères vues récemment" produits={recentEncheres} loading={false} emptyMessage="Aucune enchère consultée récemment." />
      </div>
    </>
  )
}

function GuestHome() {
  return (
    <>
      <HeroSection />
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
    </>
  )
}

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) return <div className="page-placeholder">Chargement…</div>

  return (
    <main className="guest-home">
      <SiteHeader user={user} />
      {user ? <ConnectedHome /> : <GuestHome />}
    </main>
  )
}
