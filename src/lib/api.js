let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn)

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && path !== '/login') onUnauthorized()
  if (!res.ok) throw new Error(data.error || `Gagal (${res.status})`)
  return data
}

export const api = {
  me: () => request('/me'),
  login: (password, remember) => request('/login', { method: 'POST', body: { password, remember } }),
  logout: () => request('/logout', { method: 'POST' }),
  listEntries: () => request('/entries'),
  createEntry: (entry) => request('/entries', { method: 'POST', body: entry }),
  updateEntry: (id, entry) => request(`/entries/${encodeURIComponent(id)}`, { method: 'PUT', body: entry }),
  deleteEntry: (id) => request(`/entries/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
