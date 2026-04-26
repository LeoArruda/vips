import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.ts'
import type { AuthContext } from '../middleware/auth.ts'
import { adminClient } from '../lib/supabase.ts'

export const authRoutes = new Hono()

// GET /auth/me — returns the current user + workspace
authRoutes.get('/me', requireAuth, async (c) => {
  const { userId, workspaceId } = c.get('auth') as AuthContext

  const { data: user } = await adminClient.auth.admin.getUserById(userId)
  const { data: workspace } = await adminClient
    .from('workspaces')
    .select('id, name')
    .eq('id', workspaceId)
    .single()
  const { data: member } = await adminClient
    .from('workspace_members')
    .select('role')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .single()

  if (!user?.user || !workspace) {
    return c.json({ error: 'User or workspace not found' }, 404)
  }

  return c.json({
    userId,
    email: user.user.email,
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    role: member?.role ?? 'operator',
  })
})

// POST /auth/signup-complete — auto-creates workspace on first sign-up
authRoutes.post('/signup-complete', requireAuth, async (c) => {
  const { userId } = c.get('auth') as AuthContext

  // Idempotent: skip if already has a workspace
  const { data: existing } = await adminClient
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .single()

  if (existing) {
    return c.json({ workspaceId: existing.workspace_id }, 200)
  }

  // Create a new workspace
  const { data: workspace, error: wsError } = await adminClient
    .from('workspaces')
    .insert({ name: 'My Workspace' })
    .select()
    .single()
  if (wsError || !workspace) return c.json({ error: 'Failed to create workspace' }, 500)

  // Link user as admin
  const { error: memberError } = await adminClient
    .from('workspace_members')
    .insert({ workspace_id: workspace.id, user_id: userId, role: 'admin' })
  if (memberError) return c.json({ error: 'Failed to create membership' }, 500)

  return c.json({ workspaceId: workspace.id }, 201)
})
