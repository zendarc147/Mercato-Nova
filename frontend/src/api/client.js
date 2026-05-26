const BASE_URL = '/api'

let csrfToken = null

export function setCsrfToken(token) {
  csrfToken = token
}

async function request(method, endpoint, body = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (csrfToken && method !== 'GET') {
    headers['X-CSRF-Token'] = csrfToken
  }

  const options = { method, credentials: 'include', headers }
  if (body) options.body = JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${endpoint}`, options)
  const data = await res.json()

  if (!res.ok) throw new Error(data.message || 'Erreur serveur')
  return data
}

export const api = {
  get: (endpoint) => request('GET', endpoint),
  post: (endpoint, body) => request('POST', endpoint, body),
  put: (endpoint, body) => request('PUT', endpoint, body),
  delete: (endpoint) => request('DELETE', endpoint),
}
