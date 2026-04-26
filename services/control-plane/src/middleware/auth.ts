import type { Context, Next } from 'hono'
import { verifyJwt, getUserWorkspaceId } from '../lib/supabase.ts'

export interface AuthContext {
  userId: string
  workspaceId: string
}

// Verifies JWT only — no workspace check. Use for routes that run before a workspace exists.
export async function requireJwt(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing Authorization header' }, 401)
  }
  const token = authHeader.slice(7)
  const user = await verifyJwt(token)
  if (!user) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
  c.set('userId', user.id)
  await next()
}

// Verifies JWT and requires an existing workspace membership.
export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing Authorization header' }, 401)
  }
  const token = authHeader.slice(7)
  const user = await verifyJwt(token)
  if (!user) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
  const workspaceId = await getUserWorkspaceId(user.id)
  if (!workspaceId) {
    return c.json({ error: 'User has no workspace' }, 403)
  }
  c.set('auth', { userId: user.id, workspaceId } satisfies AuthContext)
  await next()
}
