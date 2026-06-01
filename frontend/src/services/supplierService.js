import { apiGet, apiPost, apiPut, apiDelete } from './api.js'

export function fetchSuppliers() {
  return apiGet('/api/suppliers')
}

export function createSupplier(supplier) {
  return apiPost('/api/suppliers', supplier)
}

export function updateSupplier(supplierId, supplier) {
  return apiPut(`/api/suppliers/${supplierId}`, supplier)
}

export function deleteSupplier(supplierId) {
  return apiDelete(`/api/suppliers/${supplierId}`)
}
