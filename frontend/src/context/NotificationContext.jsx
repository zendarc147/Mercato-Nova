import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { getNotifications } from '../api/notifications'

const NotificationContext = createContext({ unreadCount: 0, refreshNotifCount: () => {} })

// Provider des notifications : il partage le nombre de notifications non lues.
export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  // Recharge seulement le compteur, pas toute la page notifications.
  const refreshNotifCount = useCallback(async () => {
    if (!user) { setUnreadCount(0); return }
    try {
      const data = await getNotifications()
      setUnreadCount(data.non_lues ?? 0)
    } catch {
      setUnreadCount(0)
    }
  }, [user])

  // Quand l'utilisateur change, on recalcule le compteur affiche dans le header.
  useEffect(() => {
    refreshNotifCount()
  }, [refreshNotifCount])

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshNotifCount }}>
      {children}
    </NotificationContext.Provider>
  )
}

// Hook pratique pour lire le compteur de notifications.
export function useNotifications() {
  return useContext(NotificationContext)
}
