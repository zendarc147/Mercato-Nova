import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [nonLues, setNonLues] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/notifications/index.php', {
          credentials: 'include'
        })
        const data = await res.json()
        setNotifications(data.notifications)
        setNonLues(data.non_lues)
      } catch {
        setNotifications([])
      } finally {
        setLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  async function marquerLue(id) {
    try {
      await fetch(`/api/notifications/index.php?id=${id}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, lu: true } : n)
      )
      setNonLues(prev => Math.max(0, prev - 1))
    } catch {
      // en cas d'echec la notification reste non lue visuellement
    }
  }
  return (
    <main className="notifications-page">
      <div className="notifications-card">
        <h1 className="notifications-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          Notifications
        </h1>

        {loading && <p className="notifications-state">Chargement…</p>}

        {!loading && notifications.length === 0 && (
          <p className="notifications-state">Aucune notification pour le moment.</p>
        )}

        {!loading && notifications.length > 0 && (
          <ul className="notifications-list">
            {notifications.map(n => (
              <li
                key={n.id}
                className={`notification-item${n.lu ? '' : ' notification-item--unread'}`}
                onClick={() => !n.lu && marquerLue(n.id)}
              >
                <span className="notification-dot" />
                <span className="notification-message">{n.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}