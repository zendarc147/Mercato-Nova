import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProfileMenu from '../components/ProfileMenu'
import logoFondVert from '../assets/logo-fond-vert.png'

const PREFERENCES = [
  'Peinture',
  'Sculpture',
  "Mobilier d'exception",
  'Joaillerie et accessoires',
  'Curiosités et collections',
  "Métiers d'art",
]

const ROLE_LABEL = {
  acheteur: 'Acheteur',
  vendeur: 'Vendeur',
  admin: 'Administrateur',
}

export default function Profil() {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState([])
  const [prefsSaved, setPrefsSaved] = useState(false)

  const displayName = user?.prenom
    ? `${user.prenom} ${user.nom}`
    : (user?.name ?? '')

  function togglePref(pref) {
    setPrefsSaved(false)
    setPrefs((p) => p.includes(pref) ? p.filter((x) => x !== pref) : [...p, pref])
  }

  function handleSavePrefs(e) {
    e.preventDefault()
    setPrefsSaved(true)
  }

  return (
    <main className="profil-page">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Mercato Nova accueil">
          <img className="brand-logo" src={logoFondVert} alt="" />
          <span className="brand-name">Mercato Nova</span>
        </Link>
        <nav className="main-nav" aria-label="Navigation principale">
          <Link to="/encheres">Enchères</Link>
          <Link to="/catalogue">Catalogue</Link>
        </nav>
        <ProfileMenu />
      </header>

      <div className="profil-content">
        <div className="profil-identity">
          <div className="profil-avatar" aria-hidden="true">
            <span className="profil-avatar-head" />
            <span className="profil-avatar-body" />
          </div>
          <div className="profil-info">
            <h1 className="profil-name">{displayName}</h1>
            <p className="profil-meta">Mail associé au compte : <strong>{user?.email}</strong></p>
            <p className="profil-meta">
              Type utilisateur : <span className="profil-role-badge">{ROLE_LABEL[user?.role] ?? user?.role}</span>
            </p>
          </div>
        </div>

        {user?.role === 'acheteur' && (
          <button
            className="primary-button profil-vendeur-btn"
            onClick={() => alert('Fonctionnalité à venir — contacter un administrateur.')}
          >
            Être Vendeur
          </button>
        )}

        <section className="profil-prefs">
          <h2>Mes préférences :</h2>
          <form onSubmit={handleSavePrefs}>
            <div className="prefs-grid">
              {PREFERENCES.map((pref) => (
                <label key={pref} className="pref-option">
                  <input
                    type="checkbox"
                    checked={prefs.includes(pref)}
                    onChange={() => togglePref(pref)}
                  />
                  {pref}
                </label>
              ))}
            </div>
            {prefsSaved && (
              <p className="profil-saved-msg">Préférences enregistrées *(synchro serveur à venir)*</p>
            )}
            <button type="submit" className="secondary-button profil-save-btn">
              Sauvegarder
            </button>
          </form>
        </section>

      </div>
    </main>
  )
}
