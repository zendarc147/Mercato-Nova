import { api } from './client'

export async function getProfil() {
  return await api.get('/profil/profil.php')
}

export async function savePreferences(preferences) {
  return await api.put('/profil/profil.php', { preferences })
}
