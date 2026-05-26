import { useEffect, useState } from 'react'
import { getUsers, updateUserRole } from '../api/admin'
import { useAuth } from '../context/AuthContext'

const ROLES = ['acheteur', 'vendeur', 'admin']

const ROLE_COLORS = {
  acheteur: 'bg-blue-100 text-blue-700',
  vendeur: 'bg-green-100 text-green-700',
  admin: 'bg-red-100 text-red-700',
}

export default function AdminDashboard() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(null)

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => setError('Impossible de charger les utilisateurs'))
      .finally(() => setLoading(false))
  }, [])

  async function handleRoleChange(id, role) {
    setSaving(id)
    try {
      await updateUserRole(id, role)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
    } catch {
      setError('Erreur lors de la mise à jour du rôle')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Chargement…
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Administration — Gestion des utilisateurs</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nom</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Rôle actuel</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Changer le rôle</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Inscrit le</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-800 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.id === currentUser.id ? (
                    <span className="text-xs text-gray-400 italic">Vous-même</span>
                  ) : (
                    <select
                      value={u.role}
                      disabled={saving === u.id}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
                    >
                      {ROLES.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(u.created_at).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <p className="text-center text-gray-400 py-8">Aucun utilisateur trouvé</p>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400">
        {users.length} utilisateur{users.length > 1 ? 's' : ''} au total
      </p>
    </div>
  )
}
