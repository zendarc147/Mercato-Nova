import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { soumettreDemandeVendeur } from '../api/vendeurs'
import DemandeVendeurForm from '../components/DemandeVendeurForm'
import logoFondVert from '../assets/logo-fond-vert.png'
import pictosHome from '../assets/pictos-home.png'

const preferenceOptions = [
  'Peinture',
  'Sculpture',
  "Mobilier d'exception",
  'Joaillerie et accessoires',
  'Curiosites et collections',
  "Metiers d'art",
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('account')
  const [form, setForm] = useState({
    prenom: '',
    nom: '',
    email: '',
    mot_de_passe: '',
    role: 'acheteur',
    preferences: [],
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handlePreferenceChange(e) {
    const { value, checked } = e.target
    setForm((f) => ({
      ...f,
      preferences: checked
        ? [...f.preferences, value]
        : f.preferences.filter((preference) => preference !== value),
    }))
  }

  function handleNext(e) {
    e.preventDefault()
    setError('')
    if (form.mot_de_passe.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caracteres.')
      return
    }
    setStep('preferences')
  }

  function handlePrefsNext(e) {
    e.preventDefault()
    if (form.role === 'vendeur') {
      setStep('demande_vendeur')
    } else {
      doRegister()
    }
  }

  async function doRegister(demandeData) {
    setError('')
    setLoading(true)
    try {
      await register({ ...form, role: 'acheteur' })
      if (form.role === 'vendeur' && demandeData) {
        await soumettreDemandeVendeur(demandeData)
      }
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const pageClassName =
    step === 'preferences' || step === 'demande_vendeur'
      ? 'auth-page auth-page-survey auth-page-with-background'
      : 'auth-page auth-page-with-background'

  return (
    <div className={pageClassName}>
      <div className="auth-background" aria-hidden="true">
        <div className="guest-home">
          <header className="site-header">
            <div className="brand">
              <img className="brand-logo" src={logoFondVert} alt="" />
              <span className="brand-name">Mercato Nova</span>
            </div>

            <nav className="main-nav" aria-label="Navigation principale">
              <span>Encheres</span>
              <span>Catalogue</span>
              <span>Connexion</span>
            </nav>

            <span className="profile-link">
              <span className="profile-head" />
              <span className="profile-body" />
            </span>
          </header>

          <section className="guest-hero">
            <h1>La place de l'art et des encheres</h1>
            <img className="home-pictos" src={pictosHome} alt="" />

            <div className="search-bar">
              <span className="search-icon" />
              <input type="search" tabIndex="-1" />
            </div>
          </section>

          <section className="about-section">
            <h2>Qui sommes-nous ?</h2>
            <p>
              Mercato Nova est une plateforme d'encheres et de vente dediee a toutes les formes
              d'art : oeuvres classiques, creations contemporaines, artisanat, photographie, objets
              rares et pieces uniques.
            </p>
          </section>
        </div>
      </div>

      <div className={step === 'account' ? 'auth-card' : 'auth-card auth-card-survey'}>
        {step === 'account' ? (
          <>
            <h1>Creer un compte</h1>

            {error && <p className="form-error">{error}</p>}

            <form onSubmit={handleNext} className="auth-form">
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="register-prenom">Prenom</label>
                  <input
                    id="register-prenom"
                    type="text"
                    name="prenom"
                    value={form.prenom}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="register-nom">Nom</label>
                  <input
                    id="register-nom"
                    type="text"
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="register-email">Email</label>
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="register-password">
                  Mot de passe <span>(8 caracteres min)</span>
                </label>
                <input
                  id="register-password"
                  type="password"
                  name="mot_de_passe"
                  value={form.mot_de_passe}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
              </div>

              <div className="form-field">
                <label htmlFor="register-role">Je suis...</label>
                <select id="register-role" name="role" value={form.role} onChange={handleChange}>
                  <option value="acheteur">Acheteur</option>
                  <option value="vendeur">Vendeur</option>
                </select>
              </div>

              <button type="submit" className="primary-button">
                Suite
              </button>
            </form>

            <p className="auth-switch">
              Deja un compte ? <Link to="/login">Se connecter</Link>
            </p>
          </>
        ) : step === 'preferences' ? (
          <>
            <h1>Indiquez vos preferences</h1>

            {error && <p className="form-error">{error}</p>}

            <form onSubmit={handlePrefsNext} className="preference-form">
              <fieldset className="preference-list">
                <legend className="sr-only">Preferences artistiques</legend>
                {preferenceOptions.map((preference) => (
                  <label className="preference-option" key={preference}>
                    <input
                      type="checkbox"
                      value={preference}
                      checked={form.preferences.includes(preference)}
                      onChange={handlePreferenceChange}
                    />
                    <span>{preference}</span>
                  </label>
                ))}
              </fieldset>

              <p className="preference-note">Vous pourrez changer a tout moment</p>

              <div className="auth-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setStep('account')}
                  disabled={loading}
                >
                  Retour
                </button>
                <button type="submit" disabled={loading} className="primary-button">
                  {form.role === 'vendeur' ? 'Suite' : (loading ? 'Inscription...' : 'Inscription')}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h1>Devenir vendeur</h1>
            <p className="preference-note" style={{ marginBottom: '20px' }}>
              Votre dossier sera examiné par un modérateur avant validation.
            </p>
            <DemandeVendeurForm
              onSubmit={(demandeData) => doRegister(demandeData)}
              onCancel={() => setStep('preferences')}
              loading={loading}
              error={error}
            />
          </>
        )}
      </div>
    </div>
  )
}
