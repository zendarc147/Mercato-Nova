import { createContext, useContext, useEffect, useState } from 'react'
import { getCsrfToken, getMe, login as apiLogin, logout as apiLogout, register as apiRegister } from '../api/auth'
import { setCsrfToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

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

  async function login(email, password) {
    const me = await apiLogin(email, password)
    setUser(me)
    return me
  }

  async function register(data) {
    const me = await apiRegister(data)
    setUser(me)
    return me
  }

  async function logout() {
    await apiLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
