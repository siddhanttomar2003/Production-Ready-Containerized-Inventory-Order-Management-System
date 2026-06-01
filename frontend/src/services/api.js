export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const headers = {
  'Content-Type': 'application/json',
}

export async function apiGet(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, { headers })
  return response.json()
}

export async function apiPost(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  return response.json()
}

export async function apiPut(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  })
  return response.json()
}

export async function apiDelete(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers,
  })
  if (response.status === 204) {
    return null
  }
  return response.json()
}
