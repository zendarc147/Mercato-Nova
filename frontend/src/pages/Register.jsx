import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'acheteur' })
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
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Creer un compte</h1>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-field">
            <label htmlFor="register-name">Nom complet</label>
            <input
              id="register-name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
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
              name="password"
              value={form.password}
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

          <button type="submit" disabled={loading} className="primary-button">
            {loading ? 'Creation...' : 'Creer mon compte'}
          </button>
        </form>

        <p className="auth-switch">
          Deja un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
