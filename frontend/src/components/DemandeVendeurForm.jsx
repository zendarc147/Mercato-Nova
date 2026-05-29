import { useState } from 'react'

const CATEGORIES = ['Peinture', 'Sculpture', 'Photographie', 'Gravure', 'Céramique', 'Bijoux']
const EXPERIENCE_OPTIONS = [
  { value: 'debutant', label: 'Débutant — je me lance' },
  { value: '1_3_ans',  label: '1 à 3 ans' },
  { value: '3_5_ans',  label: '3 à 5 ans' },
  { value: '5_plus',   label: 'Plus de 5 ans' },
]

export default function DemandeVendeurForm({ onSubmit, onCancel, loading, error }) {
  const [form, setForm] = useState({
    nom_boutique: '',
    description: '',
    categories: [],
    experience: '',
    site_web: '',
    telephone: '',
    motivation: '',
  })

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleCatToggle(e) {
    const { value, checked } = e.target
    setForm((f) => ({
      ...f,
      categories: checked
        ? [...f.categories, value]
        : f.categories.filter((c) => c !== value),
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="demande-vendeur-form">
      {error && <p className="form-error">{error}</p>}

      <div className="form-field">
        <label htmlFor="dv-nom-boutique">
          Nom de votre boutique / marque <span>*</span>
        </label>
        <input
          id="dv-nom-boutique"
          type="text"
          name="nom_boutique"
          value={form.nom_boutique}
          onChange={handleChange}
          placeholder="Ex. Atelier Lumière"
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="dv-description">
          Décrivez votre activité artistique <span>*</span>
        </label>
        <textarea
          id="dv-description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          placeholder="Quelles œuvres créez-vous ou vendez-vous ? Votre démarche artistique…"
          required
          minLength={20}
        />
      </div>

      <fieldset className="form-field demande-categories-field">
        <legend>Catégories proposées</legend>
        <div className="demande-categories">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="preference-option">
              <input
                type="checkbox"
                value={cat}
                checked={form.categories.includes(cat)}
                onChange={handleCatToggle}
              />
              <span>{cat}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="form-field">
        <label htmlFor="dv-experience">
          Expérience dans la vente d'art <span>*</span>
        </label>
        <select
          id="dv-experience"
          name="experience"
          value={form.experience}
          onChange={handleChange}
          required
        >
          <option value="">Sélectionner…</option>
          {EXPERIENCE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="dv-site-web">
          Site web ou portfolio <span>(optionnel)</span>
        </label>
        <input
          id="dv-site-web"
          type="url"
          name="site_web"
          value={form.site_web}
          onChange={handleChange}
          placeholder="https://monportfolio.fr"
        />
      </div>

      <div className="form-field">
        <label htmlFor="dv-telephone">
          Téléphone <span>(optionnel)</span>
        </label>
        <input
          id="dv-telephone"
          type="tel"
          name="telephone"
          value={form.telephone}
          onChange={handleChange}
          placeholder="+33 6 00 00 00 00"
        />
      </div>

      <div className="form-field">
        <label htmlFor="dv-motivation">
          Pourquoi souhaitez-vous vendre sur Mercato Nova ? <span>*</span>
        </label>
        <textarea
          id="dv-motivation"
          name="motivation"
          value={form.motivation}
          onChange={handleChange}
          rows={3}
          placeholder="Vos motivations, votre vision, ce que vous apportez à la plateforme…"
          required
          minLength={20}
        />
      </div>

      <div className="auth-actions">
        <button type="button" className="secondary-button" onClick={onCancel} disabled={loading}>
          Retour
        </button>
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Envoi…' : 'Envoyer ma demande'}
        </button>
      </div>
    </form>
  )
}
