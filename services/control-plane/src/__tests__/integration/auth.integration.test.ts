// services/control-plane/src/__tests__/integration/auth.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { app } from '../../index.ts'
import { provisionTestUser, cleanupTestUser, getJwt } from './setup.ts'

beforeAll(async () => { await provisionTestUser() })
afterAll(async () => { await cleanupTestUser() })

describe('Auth routes — integration', () => {
  it('GET /auth/me returns 401 without token', async () => {
    const res = await app.request('/auth/me')
    expect(res.status).toBe(401)
  })

  it('GET /auth/me returns 401 with malformed token', async () => {
    const res = await app.request('/auth/me', {
      headers: { Authorization: 'Bearer not-a-real-jwt' },
    })
    expect(res.status).toBe(401)
  })

  it('GET /auth/me returns user and workspace with valid JWT', async () => {
    const res = await app.request('/auth/me', {
      headers: { Authorization: `Bearer ${getJwt()}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { userId: string; email: string; workspaceId: string; role: string }
    expect(body.userId).toBeTruthy()
    expect(body.email).toContain('@')
    expect(body.workspaceId).toBeTruthy()
    expect(body.role).toBe('admin')
  })

  it('GET /runs/pending returns 401 without worker key', async () => {
    const res = await app.request('/runs/pending')
    expect(res.status).toBe(401)
  })

  it('GET /runs/pending returns 200 empty array with correct worker key', async () => {
    const res = await app.request('/runs/pending', {
      headers: { 'X-Worker-Key': process.env.WORKER_KEY ?? '' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })
})
