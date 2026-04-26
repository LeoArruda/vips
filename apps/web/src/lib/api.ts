import { supabase } from './supabase.ts'

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T | undefined> {
  const authHeaders = await getAuthHeader()
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return undefined

  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const errBody = await res.json()
      message = errBody?.error ?? message
    } catch { /* non-JSON error body */ }
    throw new Error(message)
  }

  return (await res.json()) as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
