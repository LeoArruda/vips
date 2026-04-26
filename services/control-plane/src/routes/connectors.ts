import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.ts'
import { adminClient } from '../lib/supabase.ts'
import type { AuthContext } from '../middleware/auth.ts'

export const connectorRoutes = new Hono()
connectorRoutes.use('*', requireAuth)

connectorRoutes.get('/', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { data, error } = await adminClient
    .from('connectors')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

connectorRoutes.post('/', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const body = await c.req.json<{ type: string; name: string; config?: Record<string, unknown> }>()
  if (!body.type || !body.name) return c.json({ error: 'type and name are required' }, 400)
  const { data, error } = await adminClient
    .from('connectors')
    .insert({ workspace_id: workspaceId, type: body.type, name: body.name, config: body.config ?? {} })
    .select()
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

connectorRoutes.delete('/:id', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { error } = await adminClient
    .from('connectors')
    .delete()
    .eq('id', c.req.param('id'))
    .eq('workspace_id', workspaceId)
  if (error) return c.json({ error: error.message }, 500)
  return c.body(null, 204)
})
