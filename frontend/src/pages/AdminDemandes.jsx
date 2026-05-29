import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDemandesVendeur, traiterDemandeVendeur } from '../api/admin'
import ProfileMenu from '../components/ProfileMenu'
import logoFondVert from '../assets/logo-fond-vert.png'

const EXPERIENCE_LABEL = {
  debutant: 'Débutant — je me lance',
  '1_3_ans': '1 à 3 ans',
  '3_5_ans': '3 à 5 ans',
  '5_plus':  'Plus de 5 ans',
}

const FILTRES = [
  { key: 'tous',       label: 'Toutes' },
  { key: 'en_attente', label: 'En attente' },
  { key: 'approuve',   label: 'Approuvées' },
  { key: 'refuse',     label: 'Refusées' },
]

function EtatBadge({ etat }) {
  const map = {
    en_attente: { label: 'En attente', cls: 'admin-badge--attente' },
    approuve:   { label: 'Approuvée',  cls: 'admin-badge--approuve' },
    refuse:     { label: 'Refusée',    cls: 'admin-badge--refuse' },
  }
  const { label, cls } = map[etat] ?? { label: etat, cls: '' }
  return <span className={`admin-badge ${cls}`}>{label}</span>
}

function DemandeCard({ demande, onTraiter }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localEtat, setLocalEtat] = useState(demande.etat)

  async function handle(action) {
    setLoading(true)
    try {
      await onTraiter(demande.id, action)
      setLocalEtat(action === 'approuver' ? 'approuve' : 'refuse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <article className="admin-demande-card">
      <div className="admin-demande-header" onClick={() => setOpen((o) => !o)}>
        <div className="admin-demande-meta">
          <span className="admin-demande-boutique">{demande.nom_boutique}</span>
          <span className="admin-demande-user">{demande.user_name} — {demande.user_email}</span>
        </div>
        <div className="admin-demande-right">
          <EtatBadge etat={localEtat} />
          <span className="admin-demande-toggle">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className="admin-demande-body">
          <div className="admin-demande-grid">
            <div className="admin-demande-field">
              <span className="admin-demande-label">Activité artistique</span>
              <p>{demande.description}</p>
            </div>

            <div className="admin-demande-field">
              <span className="admin-demande-label">Motivation</span>
              <p>{demande.motivation}</p>
            </div>

            <div className="admin-demande-field">
              <span className="admin-demande-label">Expérience</span>
              <p>{EXPERIENCE_LABEL[demande.experience] ?? demande.experience}</p>
            </div>

            {demande.categories?.length > 0 && (
              <div className="admin-demande-field">
                <span className="admin-demande-label">Catégories</span>
                <p>{demande.categories.join(', ')}</p>
              </div>
            )}

            {demande.site_web && (
              <div className="admin-demande-field">
                <span className="admin-demande-label">Site web</span>
                <a href={demande.site_web} target="_blank" rel="noreferrer" className="admin-demande-link">
                  {demande.site_web}
                </a>
              </div>
            )}

            {demande.telephone && (
              <div className="admin-demande-field">
                <span className="admin-demande-label">Téléphone</span>
                <p>{demande.telephone}</p>
              </div>
            )}

            <div className="admin-demande-field">
              <span className="admin-demande-label">Soumise le</span>
              <p>{new Date(demande.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          {localEtat === 'en_attente' && (
            <div className="admin-demande-actions">
              <button
                className="admin-btn admin-btn--refuse"
                onClick={() => handle('refuser')}
                disabled={loading}
              >
                {loading ? '…' : 'Refuser'}
              </button>
              <button
                className="admin-btn admin-btn--approuve"
                onClick={() => handle('approuver')}
                disabled={loading}
              >
                {loading ? '…' : 'Approuver'}
              </button>
            </div>
          )}

          {localEtat !== 'en_attente' && (
            <p className="admin-demande-done">
              {localEtat === 'approuve'
                ? "Demande approuvée — l'utilisateur est maintenant vendeur."
                : 'Demande refusée.'}
            </p>
          )}
        </div>
      )}
    </article>
  )
}

export default function AdminDemandes() {
  const { user } = useAuth()
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtre, setFiltre] = useState('tous')

  useEffect(() => {
    getDemandesVendeur()
      .then(({ demandes: data }) => setDemandes(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleTraiter(id, action) {
    await traiterDemandeVendeur(id, action)
    setDemandes((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, etat: action === 'approuver' ? 'approuve' : 'refuse' } : d
      )
    )
  }

  const visibles = filtre === 'tous' ? demandes : demandes.filter((d) => d.etat === filtre)
  const countAttente = demandes.filter((d) => d.etat === 'en_attente').length

  return (
    <main className="admin-page">
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

      <div className="admin-content">
        <div className="admin-title-row">
          <h1 className="admin-title">Demandes vendeur</h1>
          {countAttente > 0 && (
            <span className="admin-count-badge">{countAttente} en attente</span>
          )}
        </div>

        <div className="admin-filtres">
          {FILTRES.map((f) => (
            <button
              key={f.key}
              className={`admin-filtre-btn${filtre === f.key ? ' admin-filtre-btn--active' : ''}`}
              onClick={() => setFiltre(f.key)}
            >
              {f.label}
              {f.key !== 'tous' && (
                <span className="admin-filtre-count">
                  {demandes.filter((d) => d.etat === f.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading && <p className="admin-state">Chargement…</p>}
        {error && <p className="admin-state admin-state--error">{error}</p>}

        {!loading && !error && visibles.length === 0 && (
          <p className="admin-state">Aucune demande{filtre !== 'tous' ? ' dans cette catégorie' : ''}.</p>
        )}

        <div className="admin-demande-list">
          {visibles.map((d) => (
            <DemandeCard key={d.id} demande={d} onTraiter={handleTraiter} />
          ))}
        </div>
      </div>
    </main>
  )
}
