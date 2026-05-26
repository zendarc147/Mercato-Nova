import { api } from './client'

export const getUsers = () => api.get('/admin/users.php')
export const updateUserRole = (id, role) => api.patch('/admin/users.php', { id, role })
