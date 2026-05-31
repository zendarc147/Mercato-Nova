import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import SiteHeader from '../components/SiteHeader'
import { getUsers, notifierUser, changerRoleUser, changerStatutUser, supprimerUser } from '../api/admin'

const ROLE_LABEL  = { acheteur: 'Acheteur', vendeur: 'Vendeur', admin: 'Admin' }
const ROLE_CLASS  = { acheteur: 'au-badge--acheteur', vendeur: 'au-badge--vendeur', admin: 'au-badge--admin' }
const STATUT_LABEL = { actif: 'Actif', suspendu: 'Suspendu', banni: 'Banni' }
const STATUT_CLASS = { actif: 'au-statut--actif', suspendu: 'au-statut--suspendu', banni: 'au-statut--banni' }

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function initials(name) {
  return (name ?? '?').split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

export default function AdminUtilisateurs() {
  const { user } = useAuth()
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filtre, setFiltre]   = useState('all')
  const [search, setSearch]   = useState('')
  const [selected, setSelected] = useState(null)

  // message
  const [message, setMessage]       = useState('')
  const [msgLoading, setMsgLoading] = useState(false)
  const [msgError, setMsgError]     = useState(null)
  const [msgSuccess, setMsgSuccess] = useState(false)

  // changement de rôle
  const [newRole, setNewRole]         = useState('')
  const [roleLoading, setRoleLoading] = useState(false)
  const [roleError, setRoleError]     = useState(null)
  const [roleSuccess, setRoleSuccess] = useState(false)

  // statut
  const [statutLoading, setStatutLoading] = useState(false)
  const [statutError, setStatutError]     = useState(null)

  // suppression
  const [deleteConfirm, setDeleteConfirm]   = useState(false)
  const [deleteLoading, setDeleteLoading]   = useState(false)
  const [deleteError, setDeleteError]       = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await getUsers()
        setUsers(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err.message || 'Impossible de charger les utilisateurs.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function selectUser(u) {
    setSelected(u)
    setNewRole(u.role)
    setMessage('')
    setMsgError(null); setMsgSuccess(false)
    setRoleError(null); setRoleSuccess(false)
    setStatutError(null)
    setDeleteConfirm(false); setDeleteError(null)
  }

  function updateSelectedInList(patch) {
    const updated = { ...selected, ...patch }
    setSelected(updated)
    setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u))
  }

  // ── Message ──────────────────────────────────────────────────────────
  async function handleSendMessage(e) {
    e.preventDefault()
    if (!message.trim()) return
    setMsgLoading(true); setMsgError(null); setMsgSuccess(false)
    try {
      await notifierUser(selected.id, message.trim())
      setMsgSuccess(true)
      setMessage('')
    } catch (err) {
      setMsgError(err.message || "Impossible d'envoyer le message.")
    } finally {
      setMsgLoading(false)
    }
  }

  // ── Changement de rôle ───────────────────────────────────────────────
  async function handleRoleChange(e) {
    e.preventDefault()
    if (newRole === selected.role) return
    setRoleLoading(true); setRoleError(null); setRoleSuccess(false)
    try {
      await changerRoleUser(selected.id, newRole)
      updateSelectedInList({ role: newRole })
      setRoleSuccess(true)
    } catch (err) {
      setRoleError(err.message || 'Impossible de changer le rôle.')
    } finally {
      setRoleLoading(false)
    }
  }

  // ── Changement de statut ─────────────────────────────────────────────
  async function handleStatut(statut) {
    setStatutLoading(true); setStatutError(null)
    try {
      await changerStatutUser(selected.id, statut)
      updateSelectedInList({ statut })
    } catch (err) {
      setStatutError(err.message || 'Impossible de modifier le statut.')
    } finally {
      setStatutLoading(false)
    }
  }

  // ── Suppression ──────────────────────────────────────────────────────
  async function handleDelete() {
    setDeleteLoading(true); setDeleteError(null)
    try {
      await supprimerUser(selected.id)
      setUsers((prev) => prev.filter((u) => u.id !== selected.id))
      setSelected(null)
    } catch (err) {
      setDeleteError(err.message || 'Impossible de supprimer ce compte.')
      setDeleteLoading(false)
    }
  }

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (filtre !== 'all' && u.role !== filtre) return false
      if (q && !u.name?.toLowerCase().includes(q) && !u.email?.toLowerCase().includes(q)) return false
      return true
    })
  }, [users, filtre, search])

  const counts = useMemo(() => ({
    all:      users.length,
    acheteur: users.filter((u) => u.role === 'acheteur').length,
    vendeur:  users.filter((u) => u.role === 'vendeur').length,
  }), [users])

  const isOwnAccount = selected?.id === user?.id

  return (
    <main className="au-page">
      <SiteHeader user={user} />

      <div className="au-layout">
        {/* ── Colonne gauche — liste ─────────────────────────────── */}
        <section className="au-list-col">
          <div className="au-heading">
            <div>
              <p className="au-label">Administration</p>
              <h1 className="au-title">Gestion des utilisateurs</h1>
            </div>
            <span className="au-total">{displayed.length} / {users.length}</span>
          </div>

          <input
            className="au-search"
            type="search"
            placeholder="Nom ou e-mail…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="au-tabs">
            {[['all', 'Tous'], ['acheteur', 'Acheteurs'], ['vendeur', 'Vendeurs']].map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`au-tab${filtre === val ? ' au-tab--active' : ''}`}
                onClick={() => setFiltre(val)}
              >
                {label} <span className="au-tab-count">{counts[val] ?? 0}</span>
              </button>
            ))}
          </div>

          {loading && <p className="au-state">Chargement…</p>}
          {error   && <p className="au-state au-state--error">{error}</p>}
          {!loading && !error && displayed.length === 0 && (
            <p className="au-state">Aucun utilisateur trouvé.</p>
          )}

          {!loading && !error && displayed.length > 0 && (
            <ul className="au-list">
              {displayed.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className={`au-card${selected?.id === u.id ? ' au-card--active' : ''}`}
                    onClick={() => selectUser(u)}
                  >
                    <div className={`au-avatar au-avatar--${u.statut ?? 'actif'}`}>
                      {initials(u.name)}
                    </div>
                    <div className="au-card-info">
                      <p className="au-card-name">{u.name}</p>
                      <p className="au-card-email">{u.email}</p>
                    </div>
                    <div className="au-card-badges">
                      <span className={`au-badge ${ROLE_CLASS[u.role] ?? ''}`}>
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                      {u.statut && u.statut !== 'actif' && (
                        <span className={`au-statut-dot ${STATUT_CLASS[u.statut]}`} title={STATUT_LABEL[u.statut]} />
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Colonne droite — panneau détail ────────────────────── */}
        <section className="au-detail-col">
          {!selected ? (
            <div className="au-detail-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              <p>Sélectionnez un utilisateur pour voir ses informations et gérer son compte.</p>
            </div>
          ) : (
            <div className="au-detail">

              {/* En-tête */}
              <div className="au-detail-header">
                <div className={`au-detail-avatar au-avatar--${selected.statut ?? 'actif'}`}>
                  {initials(selected.name)}
                </div>
                <div>
                  <h2 className="au-detail-name">{selected.name}</h2>
                  <div className="au-detail-badges">
                    <span className={`au-badge ${ROLE_CLASS[selected.role] ?? ''}`}>
                      {ROLE_LABEL[selected.role] ?? selected.role}
                    </span>
                    <span className={`au-badge ${STATUT_CLASS[selected.statut ?? 'actif']}`}>
                      {STATUT_LABEL[selected.statut ?? 'actif']}
                    </span>
                  </div>
                </div>
              </div>

              {/* Infos */}
              <dl className="au-detail-fields">
                <div className="au-detail-field">
                  <dt>ID</dt>
                  <dd>#{selected.id}</dd>
                </div>
                <div className="au-detail-field">
                  <dt>Adresse e-mail</dt>
                  <dd>{selected.email}</dd>
                </div>
                <div className="au-detail-field">
                  <dt>Membre depuis</dt>
                  <dd>{formatDate(selected.created_at)}</dd>
                </div>
              </dl>

              {isOwnAccount && (
                <p className="au-own-notice">Il s'agit de votre propre compte — les actions d'administration sont désactivées.</p>
              )}

              {!isOwnAccount && (
                <>
                  {/* Changer le rôle */}
                  <div className="au-action-card">
                    <h3 className="au-action-title">Rôle</h3>
                    <form className="au-role-form" onSubmit={handleRoleChange}>
                      <select
                        className="au-role-select"
                        value={newRole}
                        onChange={(e) => { setNewRole(e.target.value); setRoleSuccess(false) }}
                      >
                        <option value="acheteur">Acheteur</option>
                        <option value="vendeur">Vendeur</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        type="submit"
                        className="au-action-btn au-action-btn--primary"
                        disabled={roleLoading || newRole === selected.role}
                      >
                        {roleLoading ? 'Enregistrement…' : 'Changer le rôle'}
                      </button>
                    </form>
                    {roleError   && <p className="au-action-error">{roleError}</p>}
                    {roleSuccess && <p className="au-action-success">Rôle mis à jour ✓</p>}
                  </div>

                  {/* Statut du compte */}
                  <div className="au-action-card">
                    <h3 className="au-action-title">Statut du compte</h3>
                    <div className="au-statut-actions">
                      {selected.statut !== 'actif' && (
                        <button
                          type="button"
                          className="au-action-btn au-action-btn--success"
                          onClick={() => handleStatut('actif')}
                          disabled={statutLoading}
                        >
                          Réactiver le compte
                        </button>
                      )}
                      {selected.statut !== 'suspendu' && (
                        <button
                          type="button"
                          className="au-action-btn au-action-btn--warn"
                          onClick={() => handleStatut('suspendu')}
                          disabled={statutLoading}
                        >
                          Suspendre
                        </button>
                      )}
                      {selected.statut !== 'banni' && (
                        <button
                          type="button"
                          className="au-action-btn au-action-btn--danger"
                          onClick={() => handleStatut('banni')}
                          disabled={statutLoading}
                        >
                          Bannir
                        </button>
                      )}
                    </div>
                    {statutError && <p className="au-action-error">{statutError}</p>}
                  </div>

                  {/* Envoyer un message */}
                  <div className="au-action-card">
                    <h3 className="au-action-title">Envoyer un message</h3>
                    <p className="au-msg-hint">Reçu par {selected.name} sous forme de notification.</p>
                    <form className="au-msg-form" onSubmit={handleSendMessage}>
                      <textarea
                        className="au-msg-textarea"
                        rows={3}
                        placeholder="Votre message…"
                        value={message}
                        onChange={(e) => { setMessage(e.target.value); setMsgSuccess(false) }}
                        required
                      />
                      {msgError   && <p className="au-action-error">{msgError}</p>}
                      {msgSuccess && <p className="au-action-success">Message envoyé ✓</p>}
                      <button
                        type="submit"
                        className="au-action-btn au-action-btn--primary"
                        disabled={msgLoading || !message.trim()}
                      >
                        {msgLoading ? 'Envoi…' : 'Envoyer la notification'}
                      </button>
                    </form>
                  </div>

                  {/* Supprimer le compte */}
                  {selected.role !== 'admin' && (
                    <div className="au-action-card au-action-card--danger">
                      <h3 className="au-action-title">Zone dangereuse</h3>
                      {!deleteConfirm ? (
                        <button
                          type="button"
                          className="au-action-btn au-action-btn--danger"
                          onClick={() => setDeleteConfirm(true)}
                        >
                          Supprimer ce compte
                        </button>
                      ) : (
                        <div className="au-delete-confirm">
                          <p>Supprimer définitivement le compte de <strong>{selected.name}</strong> ? Cette action est irréversible.</p>
                          {deleteError && <p className="au-action-error">{deleteError}</p>}
                          <div className="au-delete-confirm-actions">
                            <button
                              type="button"
                              className="au-action-btn au-action-btn--danger"
                              onClick={handleDelete}
                              disabled={deleteLoading}
                            >
                              {deleteLoading ? 'Suppression…' : 'Confirmer la suppression'}
                            </button>
                            <button
                              type="button"
                              className="au-action-btn au-action-btn--ghost"
                              onClick={() => { setDeleteConfirm(false); setDeleteError(null) }}
                              disabled={deleteLoading}
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
