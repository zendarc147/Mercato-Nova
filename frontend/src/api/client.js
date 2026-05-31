const BASE_URL = '/api'

// Le token CSRF protege les actions qui modifient des donnees cote serveur.
let csrfToken = null

export function setCsrfToken(token) {
  csrfToken = token
}

// Fonction commune a tous les appels API : elle evite de repeter fetch partout.
async function request(method, endpoint, body = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (csrfToken && method !== 'GET') {
    headers['X-CSRF-Token'] = csrfToken
  }

  const options = { method, credentials: 'include', headers }
  if (body) options.body = JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${endpoint}`, options)
  const text = await res.text()
  // Le backend renvoie parfois une reponse vide : on ne parse le JSON que si du texte existe.
  const data = text ? JSON.parse(text) : null

  if (!res.ok) throw new Error(data?.message || data?.error || 'Erreur serveur')
  return data
}

// Petit objet utilitaire pour appeler api.get(), api.post(), etc. dans les autres fichiers.
export const api = {
  get: (endpoint) => request('GET', endpoint),
  post: (endpoint, body) => request('POST', endpoint, body),
  put: (endpoint, body) => request('PUT', endpoint, body),
  patch: (endpoint, body) => request('PATCH', endpoint, body),
  delete: (endpoint) => request('DELETE', endpoint),
}
