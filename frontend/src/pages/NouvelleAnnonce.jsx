import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createProduit } from '../api/produits'
import SiteHeader from '../components/SiteHeader'

const CATEGORIES = [
  'Peinture',
  'Sculpture',
  'Bijoux',
  'Ceramique',
  'Gravure',
  'Photographie',
  'Mobilier',
  'Livres et manuscrits',
  'Montres et horlogerie',
  'Autres',
]

const ETAT_LABELS = {
  neuf: 'Neuf',
  bon_etat: 'Bon etat',
  correct: 'Correct',
  mauvais_etat: 'Mauvais etat',
}

function toDatetimeLocal(date) {
  const d = new Date(date)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

const NOW_MIN = toDatetimeLocal(new Date())

export default function NouvelleAnnonce() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialType = searchParams.get('type') === 'enchere' ? 'enchere' : 'achat_immediat'

  const [form, setForm] = useState({
    titre: '',
    description: '',
    categorie: '',
    etat: 'bon_etat',
    type_vente: initialType,
    prix: '',
    stock: '1',
    date_debut: '',
    date_fin: '',
    image_url: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isEnchere = form.type_vente === 'enchere'
  const returnPath = isEnchere ? '/mes-encheres' : '/mes-ventes'

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function validate() {
    if (!form.titre.trim()) return 'Le titre est obligatoire.'
    if (form.titre.trim().length < 3) return 'Le titre doit contenir au moins 3 caracteres.'
    if (!form.description.trim()) return 'La description est obligatoire.'
    if (!form.categorie) return 'Veuillez choisir une categorie.'
    if (!form.prix || Number(form.prix) <= 0) return 'Le prix doit etre superieur a 0.'

    if (isEnchere) {
      if (!form.date_fin) return 'La date de fin est obligatoire pour une enchere.'
      if (new Date(form.date_fin) <= new Date()) return 'La date de fin doit etre dans le futur.'
      if (form.date_debut && new Date(form.date_debut) >= new Date(form.date_fin)) {
        return 'La date de debut doit etre anterieure a la date de fin.'
      }
    } else {
      if (!form.stock || Number(form.stock) < 1) return 'Le stock doit etre d\'au moins 1.'
    }

    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setLoading(true)

    const payload = {
      titre: form.titre.trim(),
      description: form.description.trim(),
      categorie: form.categorie,
      etat: form.etat,
      type_vente: form.type_vente,
      prix: Number(form.prix),
    }

    if (isEnchere) {
      payload.prix_depart = Number(form.prix)
      payload.date_fin = form.date_fin
      if (form.date_debut) payload.date_debut = form.date_debut
    } else {
      payload.stock = Number(form.stock)
    }

    if (form.image_url.trim()) payload.image_url = form.image_url.trim()

    try {
      await createProduit(payload)
      navigate(returnPath)
    } catch (err) {
      setError(err.message || "Impossible de creer l'annonce.")
    } finally {
      setLoading(false)
    }
  }

  const prixLabel = isEnchere ? 'Prix de depart (EUR)' : form.type_vente === 'negociation' ? 'Prix demande (EUR)' : 'Prix de vente (EUR)'

  return (
    <main className="nouvelle-annonce-page">
      <SiteHeader user={user} />

      <section className="nouvelle-annonce-content">
        <div className="nouvelle-annonce-heading">
          <div>
            <p>Vendeur</p>
            <h1>Nouvelle annonce</h1>
          </div>
          <Link className="nouvelle-annonce-back-link" to={returnPath}>
            Retour
          </Link>
        </div>

        <form className="nouvelle-annonce-form" onSubmit={handleSubmit} noValidate>
          {error && <p className="nouvelle-annonce-error" role="alert">{error}</p>}

          <div className="nouvelle-annonce-section">
            <h2 className="nouvelle-annonce-section-title">Description</h2>

            <div className="nouvelle-annonce-field">
              <label htmlFor="na-titre">Titre de l'annonce *</label>
              <input
                id="na-titre"
                type="text"
                name="titre"
                value={form.titre}
                onChange={handleChange}
                placeholder="Ex : Vase en ceramique raku..."
                maxLength={255}
                required
              />
            </div>

            <div className="nouvelle-annonce-field">
              <label htmlFor="na-description">Description *</label>
              <textarea
                id="na-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Decrivez le produit, son etat, ses dimensions, son histoire..."
                rows={5}
                required
              />
            </div>
          </div>

          <div className="nouvelle-annonce-section">
            <h2 className="nouvelle-annonce-section-title">Details</h2>

            <div className="nouvelle-annonce-row">
              <div className="nouvelle-annonce-field">
                <label htmlFor="na-categorie">Categorie *</label>
                <select
                  id="na-categorie"
                  name="categorie"
                  value={form.categorie}
                  onChange={handleChange}
                  required
                >
                  <option value="">Choisir une categorie</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="nouvelle-annonce-field">
                <label htmlFor="na-etat">Etat du produit *</label>
                <select
                  id="na-etat"
                  name="etat"
                  value={form.etat}
                  onChange={handleChange}
                  required
                >
                  {Object.entries(ETAT_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="nouvelle-annonce-field">
              <label htmlFor="na-type-vente">Type de vente *</label>
              <div className="nouvelle-annonce-type-options">
                {[
                  { value: 'achat_immediat', label: 'Achat immediat', desc: 'L\'acheteur paie le prix affiche directement.' },
                  { value: 'enchere', label: 'Enchere', desc: 'Les acheteurs s\'affrontent en temps limite.' },
                  { value: 'negociation', label: 'Negociation', desc: 'Le prix est discute entre acheteur et vendeur.' },
                ].map(({ value, label, desc }) => (
                  <label
                    key={value}
                    className={`nouvelle-annonce-type-option${form.type_vente === value ? ' nouvelle-annonce-type-option--active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="type_vente"
                      value={value}
                      checked={form.type_vente === value}
                      onChange={handleChange}
                    />
                    <span className="nouvelle-annonce-type-label">{label}</span>
                    <span className="nouvelle-annonce-type-desc">{desc}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="nouvelle-annonce-section">
            <h2 className="nouvelle-annonce-section-title">Tarification</h2>

            <div className="nouvelle-annonce-row">
              <div className="nouvelle-annonce-field">
                <label htmlFor="na-prix">{prixLabel} *</label>
                <input
                  id="na-prix"
                  type="number"
                  name="prix"
                  value={form.prix}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              {!isEnchere && (
                <div className="nouvelle-annonce-field">
                  <label htmlFor="na-stock">Quantite disponible *</label>
                  <input
                    id="na-stock"
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    placeholder="1"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {isEnchere && (
            <div className="nouvelle-annonce-section">
              <h2 className="nouvelle-annonce-section-title">Dates de l'enchere</h2>

              <div className="nouvelle-annonce-row">
                <div className="nouvelle-annonce-field">
                  <label htmlFor="na-date-debut">Date de debut (optionnel)</label>
                  <input
                    id="na-date-debut"
                    type="datetime-local"
                    name="date_debut"
                    value={form.date_debut}
                    onChange={handleChange}
                    min={NOW_MIN}
                  />
                  <span className="nouvelle-annonce-hint">Laisser vide pour demarrer immediatement.</span>
                </div>

                <div className="nouvelle-annonce-field">
                  <label htmlFor="na-date-fin">Date de fin *</label>
                  <input
                    id="na-date-fin"
                    type="datetime-local"
                    name="date_fin"
                    value={form.date_fin}
                    onChange={handleChange}
                    min={form.date_debut || NOW_MIN}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <div className="nouvelle-annonce-section">
            <h2 className="nouvelle-annonce-section-title">Photo</h2>

            <div className="nouvelle-annonce-field">
              <label htmlFor="na-image-url">URL de l'image (optionnel)</label>
              <input
                id="na-image-url"
                type="url"
                name="image_url"
                value={form.image_url}
                onChange={handleChange}
                placeholder="https://..."
              />
              <span className="nouvelle-annonce-hint">Lien direct vers une image en ligne (jpg, png...).</span>
            </div>
          </div>

          <div className="nouvelle-annonce-actions">
            <Link className="nouvelle-annonce-cancel-link" to={returnPath}>
              Annuler
            </Link>
            <button type="submit" className="nouvelle-annonce-submit" disabled={loading}>
              {loading ? 'Publication...' : 'Publier l\'annonce'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
