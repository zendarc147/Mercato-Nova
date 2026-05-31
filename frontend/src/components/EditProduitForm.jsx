import { useState } from 'react'

const ETAT_OPTIONS = [
  { value: 'neuf',        label: 'Neuf' },
  { value: 'bon_etat',    label: 'Bon état' },
  { value: 'correct',     label: 'Correct' },
  { value: 'mauvais_etat', label: 'Mauvais état' },
]

export default function EditProduitForm({ product, onSave, onCancel, loading, error }) {
  const [titre,       setTitre]       = useState(product?.titre       ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [prix,        setPrix]        = useState(product?.prix        ?? '')
  const [stock,       setStock]       = useState(product?.stock       ?? '')
  const [etat,        setEtat]        = useState(product?.etat        ?? 'bon_etat')

  function handleSubmit(e) {
    e.preventDefault()
    onSave({
      titre:       titre.trim(),
      description: description.trim(),
      prix:        Number(prix),
      stock:       Number(stock),
      etat,
    })
  }

  return (
    <form className="edit-produit-form" onSubmit={handleSubmit} noValidate>
      <div className="edit-produit-field">
        <label htmlFor="ep-titre">Titre</label>
        <input
          id="ep-titre"
          type="text"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          required
        />
      </div>
      <div className="edit-produit-field">
        <label htmlFor="ep-desc">Description</label>
        <textarea
          id="ep-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div className="edit-produit-row">
        <div className="edit-produit-field">
          <label htmlFor="ep-prix">Prix (€)</label>
          <input
            id="ep-prix"
            type="number"
            min="0"
            step="0.01"
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            required
          />
        </div>
        <div className="edit-produit-field">
          <label htmlFor="ep-stock">Stock</label>
          <input
            id="ep-stock"
            type="number"
            min="0"
            step="1"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>
        <div className="edit-produit-field">
          <label htmlFor="ep-etat">État</label>
          <select id="ep-etat" value={etat} onChange={(e) => setEtat(e.target.value)}>
            {ETAT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
      {error && <p className="edit-produit-error">{error}</p>}
      <div className="edit-produit-actions">
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" className="profil-edit-cancel" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  )
}
