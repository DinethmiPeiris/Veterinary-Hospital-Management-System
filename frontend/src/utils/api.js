const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8081'

async function parseError(response) {
  try {
    const data = await response.json()
    return data.message || data.error || `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  if (response.status === 204) return null
  return response.json()
}

export { API_BASE }
