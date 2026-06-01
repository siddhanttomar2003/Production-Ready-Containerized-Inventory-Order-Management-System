import { apiGet, apiPost, apiDelete } from './api.js'

export function fetchCustomers() {
  return apiGet('/api/customers')
}

export function createCustomer(customer) {
  return apiPost('/api/customers', customer)
}

export function deleteCustomer(customerId) {
  return apiDelete(`/api/customers/${customerId}`)
}
