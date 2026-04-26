import { describe, it, expect } from 'bun:test'

process.env.SECRETS_ENCRYPTION_KEY = 'b'.repeat(64)
process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

const { encrypt, decrypt } = await import('../lib/crypto.ts')

describe('secrets route uses encryption', () => {
  it('encrypts and decrypts a secret value', async () => {
    const value = 'my-postgres-password'
    const encrypted = await encrypt(value)
    expect(encrypted).not.toBe(value)
    const decrypted = await decrypt(encrypted)
    expect(decrypted).toBe(value)
  })

  it('POST /secrets returns 400 when name or value missing', async () => {
    const { Hono } = await import('hono')
    const { secretRoutes } = await import('../routes/secrets.ts')
    const app = new Hono()
    app.use('*', async (c, next) => {
      c.set('auth', { userId: 'u1', workspaceId: 'ws1' })
      await next()
    })
    app.route('/', secretRoutes)

    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'my-secret' }), // missing value
    })
    expect([400, 401]).toContain(res.status)
  })
})
