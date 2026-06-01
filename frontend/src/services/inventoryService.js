import { apiGet, apiPost, apiPut, apiDelete } from './api.js'

export function fetchProducts() {
  return apiGet('/api/products')
}

export function createProduct(product) {
  return apiPost('/api/products', product)
}

export function updateProduct(productId, product) {
  return apiPut(`/api/products/${productId}`, product)
}

export function deleteProduct(productId) {
  return apiDelete(`/api/products/${productId}`)
}
