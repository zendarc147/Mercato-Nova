import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoFondVert from '../assets/logo-fond-vert.png'
import pictosHome from '../assets/pictos-home.png'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      navigate(user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page auth-page-with-background">
      <div className="auth-background" aria-hidden="true">
        <div className="guest-home">
          <header className="site-header">
            <div className="brand">
              <img className="brand-logo" src={logoFondVert} alt="" />
              <span className="brand-name">Mercato Nova</span>
            </div>

            <nav className="main-nav" aria-label="Navigation principale">
              <span>Enchères</span>
              <span>Catalogue</span>
              <span>Connexion</span>
            </nav>

            <span className="profile-link">
              <span className="profile-head" />
              <span className="profile-body" />
            </span>
          </header>

          <section className="guest-hero">
            <h1>La place de l'art et des enchères</h1>
            <img className="home-pictos" src={pictosHome} alt="" />

            <div className="search-bar">
              <span className="search-icon" />
              <input type="search" tabIndex="-1" />
            </div>
          </section>

          <section className="about-section">
            <h2>Qui sommes-nous ?</h2>
            <p>
              Mercato Nova est une plateforme d'enchères et de vente dédiée à toutes les formes
              d'art : œuvres classiques, créations contemporaines, artisanat, photographie, objets
              rares et pièces uniques.
            </p>
          </section>
        </div>
      </div>

      <div className="auth-card">
        <h1>Connexion</h1>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="login-password">Mot de passe</label>
            <input
              id="login-password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="primary-button">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="auth-switch">
          Pas encore de compte ? <Link to="/register">S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}
