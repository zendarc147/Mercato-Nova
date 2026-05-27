import { Link } from 'react-router-dom'

const featureIcons = [
  { label: 'Oeuvres', type: 'painting' },
  { label: 'Encheres', type: 'gavel' },
  { label: 'Colonnes', type: 'column' },
  { label: 'Objets', type: 'vase' },
]

export default function Home() {
  return (
    <main className="guest-home">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Mercato Nova accueil">
          <span className="brand-mark">
            <span>M</span>
            <span>N</span>
          </span>
          <span className="brand-name">Mercato Nova</span>
        </Link>

        <nav className="main-nav" aria-label="Navigation principale">
          <Link to="/encheres">Encheres</Link>
          <Link to="/catalogue">Catalogue</Link>
          <Link to="/login">Connexion</Link>
        </nav>

        <Link className="profile-link" to="/login" aria-label="Se connecter">
          <span className="profile-head" />
          <span className="profile-body" />
        </Link>
      </header>

      <section className="guest-hero" aria-labelledby="home-title">
        <h1 id="home-title">La place de l'art et des encheres</h1>

        <div className="art-icons" aria-hidden="true">
          {featureIcons.map((icon) => (
            <span className={`art-icon art-icon-${icon.type}`} key={icon.label}>
              <span className="art-shape" />
            </span>
          ))}
        </div>

        <form className="search-bar" role="search">
          <span className="search-icon" aria-hidden="true" />
          <label className="sr-only" htmlFor="home-search">
            Rechercher une oeuvre
          </label>
          <input id="home-search" name="q" type="search" />
        </form>
      </section>

      <section className="about-section" aria-labelledby="about-title">
        <h2 id="about-title">Qui sommes-nous ?</h2>
        <p>
          Mercato Nova est une plateforme d'encheres et de vente dediee a toutes les formes
          d'art : oeuvres classiques, creations contemporaines, artisanat, photographie, objets
          rares et pieces uniques.
          <br />
          Pensee autant pour les professionnels que pour les nouveaux passionnes, notre plateforme
          reunit elegance, accessibilite et decouverte a travers une experience moderne inspiree
          des grandes maisons d'art et des marches historiques.
        </p>
      </section>
    </main>
  )
}
