import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { getNotifications } from '../api/notifications'

const NotificationContext = createContext({ unreadCount: 0, refreshNotifCount: () => {} })

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  const refreshNotifCount = useCallback(async () => {
    if (!user) { setUnreadCount(0); return }
    try {
      const data = await getNotifications()
      setUnreadCount(data.non_lues ?? 0)
    } catch {
      setUnreadCount(0)
    }
  }, [user])

  useEffect(() => {
    refreshNotifCount()
  }, [refreshNotifCount])

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshNotifCount }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
