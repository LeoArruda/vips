import type { Context, Next } from 'hono'

export async function requireWorkerAuth(c: Context, next: Next) {
  const key = c.req.header('X-Worker-Key')
  const expected = process.env.WORKER_KEY
  if (!expected || key !== expected) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}
