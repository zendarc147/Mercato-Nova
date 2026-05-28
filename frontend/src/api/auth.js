import { api } from './client'

export const getCsrfToken = () => api.get('/auth/csrf.php')
export const login = (email, password) => api.post('/auth/login.php', { email, mot_de_passe: password })
export const register = (data) => api.post('/auth/register.php', data)
export const logout = () => api.post('/auth/logout.php')
export const getMe = () => api.get('/auth/me.php')
