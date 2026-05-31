import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { savePreferences, updateInfos } from '../api/profil'
import { soumettreDemandeVendeur, getDemandeVendeur } from '../api/vendeurs'
import DemandeVendeurForm from '../components/DemandeVendeurForm'
import ProfileMenu from '../components/ProfileMenu'
import logoFondVert from '../assets/logo-fond-vert.png'

const PREFERENCES = [
  'Peinture',
  'Sculpture',
  "Mobilier d'exception",
  'Joaillerie et accessoires',
  'Curiosités et collections',
  "Métiers d'art",
]

const ROLE_LABEL = {
  acheteur: 'Acheteur',
  vendeur: 'Vendeur',
  admin: 'Administrateur',
}

// Page profil : informations compte, preferences, demande vendeur et deconnexion.
export default function Profil() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [prefs, setPrefs] = useState([])
  const [prefsSaved, setPrefsSaved] = useState(false)
  const [prefsError, setPrefsError] = useState(null)
  const [prefsLoading, setPrefsLoading] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [logoutError, setLogoutError] = useState(null)

  const [showEditForm, setShowEditForm] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editPasswordConfirm, setEditPasswordConfirm] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState(null)
  const [editSaved, setEditSaved] = useState(false)
  const [demandeEtat, setDemandeEtat] = useState(null)
  const [showDemandeForm, setShowDemandeForm] = useState(false)
  const [demandeLoading, setDemandeLoading] = useState(false)
  const [demandeError, setDemandeError] = useState(null)
  const [demandeSuccess, setDemandeSuccess] = useState(false)

  // Recopie les infos utilisateur dans le formulaire des qu'elles changent.
  useEffect(() => {
    if (user?.preferences) setPrefs(user.preferences)
  }, [user])

  // Ouvre le formulaire de modification avec les valeurs actuelles.
  function openEditForm() {
    setEditName(user?.name ?? '')
    setEditEmail(user?.email ?? '')
    setEditPassword('')
    setEditPasswordConfirm('')
    setEditError(null)
    setEditSaved(false)
    setShowEditForm(true)
  }

  // Enregistre les modifications du compte puis recharge la session.
  async function handleEditSubmit(e) {
    e.preventDefault()
    if (editPassword && editPassword !== editPasswordConfirm) {
      setEditError('Les mots de passe ne correspondent pas.')
      return
    }
    setEditLoading(true)
    setEditError(null)
    setEditSaved(false)
    const data = {}
    if (editName.trim() && editName.trim() !== user?.name) data.name = editName.trim()
    if (editEmail.trim() && editEmail.trim() !== user?.email) data.email = editEmail.trim()
    if (editPassword) data.mot_de_passe = editPassword
    if (Object.keys(data).length === 0) {
      setEditError('Aucune modification détectée.')
      setEditLoading(false)
      return
    }
    try {
      await updateInfos(data)
      await refreshUser()
      setEditSaved(true)
      setEditPassword('')
      setEditPasswordConfirm('')
    } catch (err) {
      setEditError(err.message || 'Erreur lors de la mise à jour.')
    } finally {
      setEditLoading(false)
    }
  }

  // Charge l'etat de la demande vendeur pour adapter l'affichage.
  useEffect(() => {
    if (user?.role === 'acheteur') {
      getDemandeVendeur()
        .then(({ demande }) => setDemandeEtat(demande?.etat ?? null))
        .catch(() => {})
    }
  }, [user])

  // Envoie une demande pour devenir vendeur.
  async function handleDemandeSubmit(demandeData) {
    setDemandeLoading(true)
    setDemandeError(null)
    try {
      await soumettreDemandeVendeur(demandeData)
      setDemandeSuccess(true)
      setShowDemandeForm(false)
      setDemandeEtat('en_attente')
    } catch (err) {
      setDemandeError(err.message || 'Erreur lors de l\'envoi.')
    } finally {
      setDemandeLoading(false)
    }
  }

  // Deconnecte l'utilisateur puis le renvoie a l'accueil.
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

  const displayName = user?.prenom
    ? `${user.prenom} ${user.nom}`
    : (user?.name ?? '')

  // Ajoute ou retire une preference artistique.
  function togglePref(pref) {
    setPrefsSaved(false)
    setPrefs((p) => p.includes(pref) ? p.filter((x) => x !== pref) : [...p, pref])
  }

  // Sauvegarde les preferences dans le profil backend.
  async function handleSavePrefs(e) {
    e.preventDefault()
    setPrefsLoading(true)
    setPrefsError(null)
    setPrefsSaved(false)
    try {
      await savePreferences(prefs)
      await refreshUser()
      setPrefsSaved(true)
    } catch (err) {
      setPrefsError(err.message || 'Erreur lors de la sauvegarde.')
    } finally {
      setPrefsLoading(false)
    }
  }

  return (
    <main className="profil-page">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Mercato Nova accueil">
          <img className="brand-logo" src={logoFondVert} alt="" />
          <span className="brand-name">Mercato Nova</span>
        </Link>
        <nav className="main-nav" aria-label="Navigation principale">
          <Link to="/encheres">Enchères</Link>
          <Link to="/catalogue">Catalogue</Link>
        </nav>
        <ProfileMenu />
      </header>

      <div className="profil-content">
        <div className="profil-identity">
          <div className="profil-avatar" aria-hidden="true">
            <span className="profil-avatar-head" />
            <span className="profil-avatar-body" />
          </div>
          <div className="profil-info">
            <h1 className="profil-name">{displayName}</h1>
            <p className="profil-meta">Mail associé au compte : <strong>{user?.email}</strong></p>
            <p className="profil-meta">
              Type utilisateur : <span className="profil-role-badge">{ROLE_LABEL[user?.role] ?? user?.role}</span>
            </p>
          </div>
        </div>

        <section className="profil-edit-section">
          {!showEditForm ? (
            <button className="secondary-button profil-edit-toggle" onClick={openEditForm}>
              Modifier mes informations
            </button>
          ) : (
            <form className="profil-edit-form" onSubmit={handleEditSubmit} noValidate>
              <h2 className="profil-edit-title">Modifier mes informations</h2>
              <div className="profil-edit-field">
                <label htmlFor="edit-name">Nom</label>
                <input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoComplete="name"
                />
              </div>
              <div className="profil-edit-field">
                <label htmlFor="edit-email">Adresse e-mail</label>
                <input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="profil-edit-field">
                <label htmlFor="edit-password">Nouveau mot de passe <span className="profil-edit-optional">(laisser vide pour ne pas changer)</span></label>
                <input
                  id="edit-password"
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="8 caractères minimum"
                />
              </div>
              {editPassword && (
                <div className="profil-edit-field">
                  <label htmlFor="edit-password-confirm">Confirmer le mot de passe</label>
                  <input
                    id="edit-password-confirm"
                    type="password"
                    value={editPasswordConfirm}
                    onChange={(e) => setEditPasswordConfirm(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              )}
              {editError && <p className="profil-edit-error">{editError}</p>}
              {editSaved && <p className="profil-edit-success">Informations mises à jour ✓</p>}
              <div className="profil-edit-actions">
                <button type="submit" className="primary-button" disabled={editLoading}>
                  {editLoading ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button type="button" className="profil-edit-cancel" onClick={() => setShowEditForm(false)}>
                  Annuler
                </button>
              </div>
            </form>
          )}
        </section>

        {user?.role === 'acheteur' && (
          <section className="profil-vendeur-section">
            {demandeSuccess && (
              <div className="profil-demande-success">
                Demande envoyée — un modérateur examinera votre dossier.
              </div>
            )}

            {!demandeSuccess && demandeEtat === 'en_attente' && (
              <div className="profil-demande-pending">
                Votre demande vendeur est en cours d'examen.
              </div>
            )}

            {!demandeSuccess && demandeEtat === 'refuse' && !showDemandeForm && (
              <>
                <div className="profil-demande-refused">
                  Votre demande a été refusée. Vous pouvez en soumettre une nouvelle.
                </div>
                <button
                  className="primary-button profil-vendeur-btn"
                  onClick={() => { setDemandeError(null); setShowDemandeForm(true) }}
                >
                  Soumettre une nouvelle demande
                </button>
              </>
            )}

            {!demandeSuccess && demandeEtat === null && !showDemandeForm && (
              <button
                className="primary-button profil-vendeur-btn"
                onClick={() => { setDemandeError(null); setShowDemandeForm(true) }}
              >
                Être Vendeur
              </button>
            )}

            {showDemandeForm && (
              <div className="profil-demande-form-wrapper">
                <h2 className="profil-demande-title">Demande vendeur</h2>
                <p className="profil-demande-subtitle">
                  Votre dossier sera examiné par un modérateur avant validation.
                </p>
                <DemandeVendeurForm
                  onSubmit={handleDemandeSubmit}
                  onCancel={() => setShowDemandeForm(false)}
                  loading={demandeLoading}
                  error={demandeError}
                />
              </div>
            )}
          </section>
        )}

        <section className="profil-prefs">
          <h2>Mes préférences :</h2>
          <form onSubmit={handleSavePrefs}>
            <div className="prefs-grid">
              {PREFERENCES.map((pref) => (
                <label key={pref} className="pref-option">
                  <input
                    type="checkbox"
                    checked={prefs.includes(pref)}
                    onChange={() => togglePref(pref)}
                  />
                  {pref}
                </label>
              ))}
            </div>
            {prefsSaved && (
              <p className="profil-saved-msg">Préférences enregistrées ✓</p>
            )}
            {prefsError && (
              <p className="profil-saved-msg profil-error-msg">{prefsError}</p>
            )}
            <button type="submit" className="secondary-button profil-save-btn" disabled={prefsLoading}>
              {prefsLoading ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </form>
        </section>

        <div className="profil-logout-section">
          {logoutError && <p className="profil-logout-error">{logoutError}</p>}
          <button
            className="danger-button profil-logout-btn"
            onClick={handleLogout}
            disabled={logoutLoading}
          >
            {logoutLoading ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
        </div>

      </div>
    </main>
  )
}
