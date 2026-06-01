import { apiPost } from './api.js'

export function login(credentials) {
  return apiPost('/api/auth/login', credentials)
}

export function register(data) {
  return apiPost('/api/auth/register', data)
}
