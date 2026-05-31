import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SiteHeader from '../components/SiteHeader'
import EditProduitForm from '../components/EditProduitForm'
import { getNegociations } from '../api/negociations'
import { getProduit, updateProduit, deleteProduit } from '../api/produits'

// Normalise les chemins d'images produits.
function getImageSrc(imageUrl) {
  if (!imageUrl) return null
  if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) return imageUrl
  return `/uploads/produits/${imageUrl}`
}

const ETAT_LABEL = {
  en_attente:   'En attente',
  contre_offre: 'Contre-offre',
  accepte:      'Acceptée',
  refuse:       'Refusée',
  expire:       'Expirée',
}

const ETAT_CLASS = {
  en_attente:   'nego-badge--attente',
  contre_offre: 'nego-badge--encours',
  accepte:      'nego-badge--accepte',
  refuse:       'nego-badge--refuse',
  expire:       'nego-badge--expire',
}

// Determine si c'est le tour de l'utilisateur dans une negociation.
function statutTour(nego, userId) {
  const terminee = ['accepte', 'refuse', 'expire'].includes(nego.etat)
  if (terminee) return null
  const monRole = String(nego.acheteur_id) === String(userId) ? 'acheteur' : 'vendeur'
  return nego.dernier_acteur !== monRole ? 'mon-tour' : 'attente'
}

// Verifie si l'utilisateur connecte est le vendeur dans cette negociation.
function isVendeur(nego, userId) {
  return String(nego.acheteur_id) !== String(userId)
}

// Page qui regroupe les negociations actives et terminees de l'utilisateur.
export default function MesNegociations() {
  const { user } = useAuth()
  const [negociations, setNegociations] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  const [editingNegoId,    setEditingNegoId]    = useState(null)
  const [editingProduit,   setEditingProduit]   = useState(null)
  const [fetchingProduit,  setFetchingProduit]  = useState(false)
  const [editNegoLoading,  setEditNegoLoading]  = useState(false)
  const [editNegoError,    setEditNegoError]    = useState(null)

  const [confirmDeleteNegoId, setConfirmDeleteNegoId] = useState(null)
  const [deleteNegoLoading,   setDeleteNegoLoading]   = useState(false)
  const [deleteNegoError,     setDeleteNegoError]     = useState(null)

  // Charge toutes les negociations liees a l'utilisateur connecte.
  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getNegociations()
        setNegociations(data.negociations ?? [])
      } catch (err) {
        setError(err.message || 'Impossible de charger les négociations.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Ouvre l'edition du produit lie a une negociation vendeur.
  async function openNegoEdit(nego) {
    setEditingNegoId(nego.id)
    setEditingProduit(null)
    setEditNegoError(null)
    setFetchingProduit(true)
    try {
      const produit = await getProduit(nego.produit_id)
      setEditingProduit(produit)
    } catch {
      setEditingProduit({ titre: nego.produit_titre, prix: nego.derniere_offre, description: '', stock: 1, etat: 'bon_etat' })
    } finally {
      setFetchingProduit(false)
    }
  }

  // Ferme l'edition et nettoie les erreurs temporaires.
  function closeNegoEdit() {
    setEditingNegoId(null)
    setEditingProduit(null)
    setEditNegoError(null)
  }

  // Enregistre les modifications du produit attache a la negociation.
  async function handleEditNegoProduit(produitId, data) {
    setEditNegoLoading(true)
    setEditNegoError(null)
    try {
      await updateProduit(produitId, data)
      closeNegoEdit()
    } catch (err) {
      setEditNegoError(err.message || 'Erreur lors de la mise à jour.')
    } finally {
      setEditNegoLoading(false)
    }
  }

  // Supprime le produit d'une negociation apres confirmation.
  async function handleDeleteNegoProduit(produitId) {
    setDeleteNegoLoading(true)
    setDeleteNegoError(null)
    try {
      await deleteProduit(produitId)
      setNegociations((prev) => prev.filter((n) => n.produit_id !== produitId))
      setConfirmDeleteNegoId(null)
    } catch (err) {
      setDeleteNegoError(err.message || 'Erreur lors de la suppression.')
      setDeleteNegoLoading(false)
    }
  }

  const actives  = negociations.filter((n) => ['en_attente', 'contre_offre'].includes(n.etat))
  const termines = negociations.filter((n) => ['accepte', 'refuse', 'expire'].includes(n.etat))

  function renderManageButtons(nego) {
    if (!isVendeur(nego, user?.id)) return null
    const isConfirming = confirmDeleteNegoId === nego.id
    const isEditing    = editingNegoId === nego.id

    if (isEditing) {
      return (
        <div className="mes-negos-edit-wrapper">
          {fetchingProduit ? (
            <p className="mes-negos-state">Chargement de l'annonce…</p>
          ) : editingProduit ? (
            <>
              <p className="mes-negos-edit-heading">Modifier « {nego.produit_titre} »</p>
              <EditProduitForm
                product={editingProduit}
                onSave={(data) => handleEditNegoProduit(nego.produit_id, data)}
                onCancel={closeNegoEdit}
                loading={editNegoLoading}
                error={editNegoError}
              />
            </>
          ) : (
            <p className="mes-negos-state mes-negos-state--error">Impossible de charger l'annonce.</p>
          )}
        </div>
      )
    }

    if (isConfirming) {
      return (
        <div className="mes-negos-delete-confirm">
          <span>Supprimer cette annonce ?</span>
          {deleteNegoError && <span className="mes-ventes-delete-error">{deleteNegoError}</span>}
          <button
            className="mes-ventes-delete-confirm-btn"
            onClick={() => handleDeleteNegoProduit(nego.produit_id)}
            disabled={deleteNegoLoading}
          >
            {deleteNegoLoading ? 'Suppression…' : 'Confirmer'}
          </button>
          <button
            className="profil-edit-cancel"
            onClick={() => { setConfirmDeleteNegoId(null); setDeleteNegoError(null) }}
          >
            Annuler
          </button>
        </div>
      )
    }

    return (
      <div className="mes-negos-manage-btns">
        <button
          className="mes-ventes-edit-btn"
          onClick={() => { openNegoEdit(nego); setConfirmDeleteNegoId(null) }}
        >
          Modifier l'annonce
        </button>
        <button
          className="mes-ventes-delete-btn"
          onClick={() => { setConfirmDeleteNegoId(nego.id); setEditingNegoId(null) }}
        >
          Supprimer l'annonce
        </button>
      </div>
    )
  }

  return (
    <main className="mes-negos-page">
      <SiteHeader user={user} />

      <div className="mes-negos-content">
        <h1 className="mes-negos-title">Mes négociations</h1>

        {loading && <p className="mes-negos-state">Chargement…</p>}
        {error   && <p className="mes-negos-state mes-negos-state--error">{error}</p>}

        {!loading && !error && negociations.length === 0 && (
          <p className="mes-negos-state mes-negos-state--empty">
            Aucune négociation pour le moment.{' '}
            <Link to="/catalogue">Explorer le catalogue</Link>
          </p>
        )}

        {!loading && !error && actives.length > 0 && (
          <section className="mes-negos-section">
            <h2 className="mes-negos-section-title">En cours</h2>
            <ul className="mes-negos-list">
              {actives.map((nego) => {
                const tour   = statutTour(nego, user?.id)
                const imgSrc = getImageSrc(nego.produit_image)
                return (
                  <li key={nego.id}>
                    <Link to={`/negociation/${nego.produit_id}`} className="mes-negos-item">
                      <div className="mes-negos-item-image">
                        {imgSrc
                          ? <img src={imgSrc} alt={nego.produit_titre} />
                          : <span>produit</span>}
                      </div>
                      <div className="mes-negos-item-info">
                        <p className="mes-negos-item-titre">{nego.produit_titre}</p>
                        <p className="mes-negos-item-offre">
                          Dernière offre : <strong>{Number(nego.derniere_offre).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong>
                        </p>
                        <span className={`nego-badge ${ETAT_CLASS[nego.etat] ?? ''}`}>
                          {ETAT_LABEL[nego.etat] ?? nego.etat}
                        </span>
                      </div>
                      <div className="mes-negos-item-tour">
                        {tour === 'mon-tour' ? (
                          <span className="tour-badge tour-badge--action">À vous de jouer</span>
                        ) : (
                          <span className="tour-badge tour-badge--attente">En attente</span>
                        )}
                      </div>
                    </Link>
                    {renderManageButtons(nego)}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {!loading && !error && termines.length > 0 && (
          <section className="mes-negos-section">
            <h2 className="mes-negos-section-title">Terminées</h2>
            <ul className="mes-negos-list mes-negos-list--termines">
              {termines.map((nego) => {
                const imgSrc = getImageSrc(nego.produit_image)
                return (
                  <li key={nego.id}>
                    <Link to={`/negociation/${nego.produit_id}`} className="mes-negos-item mes-negos-item--termine">
                      <div className="mes-negos-item-image">
                        {imgSrc
                          ? <img src={imgSrc} alt={nego.produit_titre} />
                          : <span>produit</span>}
                      </div>
                      <div className="mes-negos-item-info">
                        <p className="mes-negos-item-titre">{nego.produit_titre}</p>
                        <p className="mes-negos-item-offre">
                          Prix final : <strong>{Number(nego.derniere_offre).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong>
                        </p>
                        <span className={`nego-badge ${ETAT_CLASS[nego.etat] ?? ''}`}>
                          {ETAT_LABEL[nego.etat] ?? nego.etat}
                        </span>
                      </div>
                    </Link>
                    {renderManageButtons(nego)}
                  </li>
                )
              })}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
