import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_LABELS = {
  acheteur: 'Acheteur',
  vendeur: 'Vendeur',
  admin: 'Admin',
}

const ROLE_COLORS = {
  acheteur: 'bg-blue-100 text-blue-700',
  vendeur: 'bg-green-100 text-green-700',
  admin: 'bg-red-100 text-red-700',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link to="/" className="text-lg font-semibold text-gray-800 hover:text-indigo-600">
        Mercato Nova
      </Link>

      <div className="flex items-center gap-4">
        {user.role === 'admin' && (
          <Link to="/admin" className="text-sm text-gray-600 hover:text-indigo-600">
            Administration
          </Link>
        )}

        <span className="text-sm text-gray-600">{user.name}</span>

        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role]}`}>
          {ROLE_LABELS[user.role]}
        </span>

        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-600 transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </nav>
  )
}
