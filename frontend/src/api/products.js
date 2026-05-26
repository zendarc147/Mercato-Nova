import { api } from './client'

export const getProducts = (params = '') => api.get(`/products/index.php${params}`)
export const getProduct = (id) => api.get(`/products/show.php?id=${id}`)
export const createProduct = (data) => api.post('/products/create.php', data)
