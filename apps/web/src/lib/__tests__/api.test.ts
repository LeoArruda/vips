// apps/web/src/lib/__tests__/api.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'

// Mock supabase so api.ts can import it in the test environment
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'test-jwt' } } }),
    },
  },
}))

import { api } from '../api'

describe('api client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET — returns parsed JSON on 200', async () => {
    server.use(
      http.get('*/api/test-get', () => HttpResponse.json({ hello: 'world' })),
    )
    const result = await api.get<{ hello: string }>('/test-get')
    expect(result?.hello).toBe('world')
  })

  it('DELETE — returns undefined on 204', async () => {
    server.use(
      http.delete('*/api/test-delete', () => new HttpResponse(null, { status: 204 })),
    )
    const result = await api.delete('/test-delete')
    expect(result).toBeUndefined()
  })

  it('throws with error message on non-ok response with JSON body', async () => {
    server.use(
      http.get('*/api/test-error', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 }),
      ),
    )
    await expect(api.get('/test-error')).rejects.toThrow('Not found')
  })

  it('throws with status fallback on non-ok response with non-JSON body', async () => {
    server.use(
      http.get('*/api/test-bad-body', () =>
        new HttpResponse('<html>Error</html>', {
          status: 500,
          headers: { 'content-type': 'text/html' },
        }),
      ),
    )
    await expect(api.get('/test-bad-body')).rejects.toThrow('500')
  })

  it('injects Authorization header from Supabase session', async () => {
    let capturedAuth = ''
    server.use(
      http.get('*/api/test-auth', ({ request }) => {
        capturedAuth = request.headers.get('Authorization') ?? ''
        return HttpResponse.json({ ok: true })
      }),
    )
    await api.get('/test-auth')
    expect(capturedAuth).toBe('Bearer test-jwt')
  })
})
