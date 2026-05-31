import { api } from './client'

// Appels API pour lire et mettre a jour les informations du profil.
export async function getProfil() {
  return await api.get('/profil/profil.php')
}

export async function savePreferences(preferences) {
  return await api.put('/profil/profil.php', { preferences })
}

export async function updateInfos(data) {
  return await api.put('/profil/profil.php', data)
}
