import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.ts'
import { adminClient } from '../lib/supabase.ts'
import type { AuthContext } from '../middleware/auth.ts'

export const workflowRoutes = new Hono()

workflowRoutes.use('*', requireAuth)

// GET /workflows — list workflows for the current workspace
workflowRoutes.get('/', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { data, error } = await adminClient
    .from('workflows')
    .select('id, name, status, version, created_at, updated_at, definition')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

// POST /workflows — create a workflow
workflowRoutes.post('/', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const body = await c.req.json<{
    name: string
    description?: string
    trigger?: { type: string }
    nodes?: unknown[]
    edges?: unknown[]
  }>()

  if (!body.name?.trim()) return c.json({ error: 'name is required' }, 400)

  const definition = {
    trigger: body.trigger ?? { type: 'manual' },
    nodes: body.nodes ?? [],
    edges: body.edges ?? [],
  }

  const { data, error } = await adminClient
    .from('workflows')
    .insert({
      workspace_id: workspaceId,
      name: body.name.trim(),
      description: body.description,
      definition,
    })
    .select()
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

// GET /workflows/:id — get a single workflow
workflowRoutes.get('/:id', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { data, error } = await adminClient
    .from('workflows')
    .select('*')
    .eq('id', c.req.param('id'))
    .eq('workspace_id', workspaceId)
    .single()
  if (error || !data) return c.json({ error: 'Not found' }, 404)
  return c.json(data)
})

// PUT /workflows/:id — update a workflow (saves a new version)
workflowRoutes.put('/:id', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const id = c.req.param('id')
  const body = await c.req.json<{
    name?: string
    description?: string
    status?: string
    trigger?: unknown
    nodes?: unknown[]
    edges?: unknown[]
  }>()

  const { data: current } = await adminClient
    .from('workflows')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single()
  if (!current) return c.json({ error: 'Not found' }, 404)

  // Save version snapshot before update
  await adminClient.from('workflow_versions').insert({
    workflow_id: id,
    version: current.version,
    definition: current.definition,
  })

  const newDefinition = {
    trigger: body.trigger ?? current.definition?.trigger ?? { type: 'manual' },
    nodes: body.nodes ?? current.definition?.nodes ?? [],
    edges: body.edges ?? current.definition?.edges ?? [],
  }

  const { data, error } = await adminClient
    .from('workflows')
    .update({
      name: body.name ?? current.name,
      description: body.description ?? current.description,
      status: body.status ?? current.status,
      definition: newDefinition,
      version: current.version + 1,
    })
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// DELETE /workflows/:id
workflowRoutes.delete('/:id', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { error } = await adminClient
    .from('workflows')
    .delete()
    .eq('id', c.req.param('id'))
    .eq('workspace_id', workspaceId)
  if (error) return c.json({ error: error.message }, 500)
  return c.body(null, 204)
})

// GET /workflows/:id/versions — version history
workflowRoutes.get('/:id/versions', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { data: wf } = await adminClient
    .from('workflows')
    .select('id')
    .eq('id', c.req.param('id'))
    .eq('workspace_id', workspaceId)
    .single()
  if (!wf) return c.json({ error: 'Not found' }, 404)

  const { data, error } = await adminClient
    .from('workflow_versions')
    .select('id, version, created_at')
    .eq('workflow_id', c.req.param('id'))
    .order('version', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})
