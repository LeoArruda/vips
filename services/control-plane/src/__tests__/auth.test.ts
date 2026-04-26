import { describe, it, expect } from 'bun:test'
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.ts'

const app = new Hono()
app.use('/protected', requireAuth)
app.get('/protected', (c) => c.json({ ok: true }))

describe('requireAuth middleware', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await app.request('/protected', { method: 'GET' })
    expect(res.status).toBe(401)
    const body = await res.json() as { error: string }
    expect(body.error).toContain('Missing')
  })

  it('returns 401 when Authorization header is malformed', async () => {
    const res = await app.request('/protected', {
      method: 'GET',
      headers: { Authorization: 'Basic abc' },
    })
    expect(res.status).toBe(401)
  })
})
