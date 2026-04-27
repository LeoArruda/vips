import { describe, it, expect } from 'bun:test'
import { Hono } from 'hono'
import { requireWorkerAuth } from '../middleware/worker.ts'

// process.env.WORKER_KEY = 'test-worker-key-for-unit-tests' (set by test-setup.ts)

const app = new Hono()
app.use('/worker', requireWorkerAuth)
app.get('/worker', (c) => c.json({ ok: true }))

describe('requireWorkerAuth middleware', () => {
  it('returns 401 when X-Worker-Key header is missing', async () => {
    const res = await app.request('/worker', { method: 'GET' })
    expect(res.status).toBe(401)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 401 when X-Worker-Key is wrong', async () => {
    const res = await app.request('/worker', {
      method: 'GET',
      headers: { 'X-Worker-Key': 'wrong-key' },
    })
    expect(res.status).toBe(401)
  })

  it('passes through with correct X-Worker-Key', async () => {
    const res = await app.request('/worker', {
      method: 'GET',
      headers: { 'X-Worker-Key': 'test-worker-key-for-unit-tests' },
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { ok: boolean }
    expect(body.ok).toBe(true)
  })

  it('returns 401 when WORKER_KEY env var is empty string', async () => {
    const saved = process.env.WORKER_KEY
    process.env.WORKER_KEY = ''
    const res = await app.request('/worker', {
      method: 'GET',
      headers: { 'X-Worker-Key': '' },
    })
    process.env.WORKER_KEY = saved
    expect(res.status).toBe(401)
  })
})
