import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { getNotifications, marquerLue, marquerToutesLues } from '../api/notifications'
import SiteHeader from '../components/SiteHeader'

export default function Notifications() {
  const { user } = useAuth()
  const { refreshNotifCount } = useNotifications()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getNotifications()
        setNotifications(data.notifications ?? [])
      } catch {
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleMarquerLue(id) {
    try {
      await marquerLue(id)
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, lu: true } : n)
      )
      refreshNotifCount()
    } catch {
      // la notif reste non lue visuellement
    }
  }

  async function handleToutLire() {
    try {
      await marquerToutesLues()
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })))
      refreshNotifCount()
    } catch {
      // silencieux
    }
  }

  const nonLues = notifications.filter((n) => !n.lu).length

  return (
    <main className="notifications-page">
      <SiteHeader user={user} />
      <div className="notifications-card">
        <div className="notifications-header">
          <h1 className="notifications-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Notifications
          </h1>
          {nonLues > 0 && (
            <button className="notif-tout-lire-btn" onClick={handleToutLire}>
              Tout marquer comme lu
            </button>
          )}
        </div>

        {loading && <p className="notifications-state">Chargement…</p>}

        {!loading && notifications.length === 0 && (
          <p className="notifications-state">Aucune notification pour le moment.</p>
        )}

        {!loading && notifications.length > 0 && (
          <ul className="notifications-list">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={`notification-item${n.lu ? '' : ' notification-item--unread'}`}
                onClick={() => !n.lu && handleMarquerLue(n.id)}
              >
                <span className="notification-dot" />
                <div className="notification-body">
                  <span className="notification-message">{n.message}</span>
                  <span className="notification-date">
                    {new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(n.created_at))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
