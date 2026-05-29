import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProfileMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [logoutError, setLogoutError] = useState(null)
  const ref = useRef(null)
  const canAccessSellerPages = user?.role === 'vendeur' || user?.role === 'admin'
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    setLogoutLoading(true)
    setLogoutError(null)
    try {
      await logout()
      navigate('/')
    } catch (err) {
      setLogoutError(err.message || 'Erreur lors de la déconnexion')
      setLogoutLoading(false)
    }
  }

  return (
    <div className="profile-menu-wrapper" ref={ref}>
      <button
        className="profile-link profile-menu-btn"
        aria-label="Menu profil"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="profile-head" />
        <span className="profile-body" />
      </button>

      {open && (
        <nav className="profile-dropdown" aria-label="Menu utilisateur">
          <Link to="/profil" className="profile-dropdown-item" onClick={() => setOpen(false)}>
            Profil
          </Link>
          <Link to="/panier" className="profile-dropdown-item" onClick={() => setOpen(false)}>
            Mon panier
          </Link>
          <Link to="/mes-negociations" className="profile-dropdown-item" onClick={() => setOpen(false)}>
            Mes Négociations
          </Link>
          {canAccessSellerPages && (
            <>
              <Link to="/mes-ventes" className="profile-dropdown-item" onClick={() => setOpen(false)}>
                Mes Ventes
              </Link>
              <Link to="/mes-encheres" className="profile-dropdown-item" onClick={() => setOpen(false)}>
                Mes Enchères
              </Link>
            </>
          )}
          {isAdmin && (
            <>
              <hr className="profile-dropdown-separator" />
              <Link to="/admin/demandes" className="profile-dropdown-item profile-dropdown-item--admin" onClick={() => setOpen(false)}>
                Demandes vendeur
              </Link>
            </>
          )}
          <button
            className="profile-dropdown-item profile-dropdown-logout"
            onClick={handleLogout}
            disabled={logoutLoading}
          >
            {logoutLoading ? 'Déconnexion…' : 'Déconnexion'}
          </button>
          {logoutError && <p className="profile-dropdown-error">{logoutError}</p>}
        </nav>
      )}
    </div>
  )
}
