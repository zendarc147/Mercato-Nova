import { createContext, useContext, useEffect, useState } from 'react'
import { getCsrfToken, getMe, login as apiLogin, logout as apiLogout, register as apiRegister } from '../api/auth'
import { setCsrfToken } from '../api/client'

const AuthContext = createContext(null)

// Provider d'authentification : il rend l'utilisateur disponible dans toute l'application.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Au chargement de l'app, on recupere le token CSRF puis la session PHP existante.
  useEffect(() => {
    async function init() {
      try {
        const { csrf_token } = await getCsrfToken()
        setCsrfToken(csrf_token)
        const me = await getMe()
        setUser(me)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // Connexion : le backend cree la session, puis React garde l'utilisateur en memoire.
  async function login(email, password) {
    const response = await apiLogin(email, password)
    if (response.csrf_token) setCsrfToken(response.csrf_token)
    const me = response.user ?? response
    setUser(me)
    return me
  }

  // Apres l'inscription, on recharge la session pour connecter directement l'utilisateur.
  async function register(data) {
    await apiRegister(data)
    const { csrf_token } = await getCsrfToken()
    setCsrfToken(csrf_token)
    const me = await getMe()
    setUser(me)
    return me
  }

  // Deconnexion : le backend detruit la session PHP et React oublie l'utilisateur.
  async function logout() {
    await apiLogout()
    setUser(null)
  }

  // Recharge l'utilisateur courant apres une modification de profil.
  async function refreshUser() {
    const me = await getMe()
    setUser(me)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook pratique pour lire l'authentification sans importer directement le Context.
export function useAuth() {
  return useContext(AuthContext)
}
