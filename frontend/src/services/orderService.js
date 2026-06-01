import { apiGet, apiPost, apiDelete } from './api.js'

export function fetchOrders() {
  return apiGet('/api/orders')
}

export function createOrder(orderData) {
  return apiPost('/api/orders', orderData)
}

export function deleteOrder(orderId) {
  return apiDelete(`/api/orders/${orderId}`)
}
