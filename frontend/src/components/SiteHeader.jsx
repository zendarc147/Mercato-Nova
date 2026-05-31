import { Link } from 'react-router-dom'
import ProfileMenu from './ProfileMenu'
import logoFondVert from '../assets/logo-fond-vert.png'
import { useCart } from '../context/CartContext'
import { useNotifications } from '../context/NotificationContext'

// Header commun : logo, navigation principale, panier, notifications et profil.
export default function SiteHeader({ user }) {
  const { cartCount } = useCart()
  const { unreadCount } = useNotifications()

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="Mercato Nova accueil">
        <img className="brand-logo" src={logoFondVert} alt="" />
        <span className="brand-name">Mercato Nova</span>
      </Link>

      <nav className="main-nav" aria-label="Navigation principale">
        <Link to="/encheres">{'Ench\u00e8res'}</Link>
        <Link to="/catalogue">Catalogue</Link>
        {!user && <Link to="/login">Connexion</Link>}
      </nav>

      {user ? (
        <div className="header-icons">
          <Link to="/panier" className="header-icon-link header-icon-cart" aria-label={`Panier${cartCount > 0 ? ` (${cartCount} article${cartCount > 1 ? 's' : ''})` : ''}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span className="cart-badge" aria-hidden="true">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>
          <Link to="/notifications" className="header-icon-link header-icon-notif" aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lue${unreadCount > 1 ? 's' : ''})` : ''}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="notif-badge" aria-hidden="true">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
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
