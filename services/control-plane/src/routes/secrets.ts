import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.ts'
import { adminClient } from '../lib/supabase.ts'
import { encrypt } from '../lib/crypto.ts'
import type { AuthContext } from '../middleware/auth.ts'

export const secretRoutes = new Hono()
secretRoutes.use('*', requireAuth)

// List secrets — returns names only, NEVER the encrypted_value
secretRoutes.get('/', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { data, error } = await adminClient
    .from('secrets')
    .select('id, name, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

// Create a secret — value is encrypted before storage
secretRoutes.post('/', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const body = await c.req.json<{ name: string; value: string }>()
  if (!body.name?.trim() || !body.value) return c.json({ error: 'name and value are required' }, 400)

  const encryptedValue = await encrypt(body.value)
  const { data, error } = await adminClient
    .from('secrets')
    .insert({ workspace_id: workspaceId, name: body.name.trim(), encrypted_value: encryptedValue })
    .select('id, name, created_at')
    .single()
  if (error) {
    if (error.code === '23505') return c.json({ error: `Secret '${body.name}' already exists` }, 409)
    return c.json({ error: error.message }, 500)
  }
  return c.json(data, 201)
})

// Delete a secret
secretRoutes.delete('/:id', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { error } = await adminClient
    .from('secrets')
    .delete()
    .eq('id', c.req.param('id'))
    .eq('workspace_id', workspaceId)
  if (error) return c.json({ error: error.message }, 500)
  return c.body(null, 204)
})
