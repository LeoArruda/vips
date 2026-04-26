import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.ts'
import { adminClient } from '../lib/supabase.ts'
import type { AuthContext } from '../middleware/auth.ts'

export const runRoutes = new Hono()
runRoutes.use('*', requireAuth)

runRoutes.get('/', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { data, error } = await adminClient
    .from('runs')
    .select(`id, workflow_id, status, triggered_by, started_at, finished_at, workflows(name)`)
    .eq('workspace_id', workspaceId)
    .order('started_at', { ascending: false })
    .limit(100)
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

runRoutes.get('/:id', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { data: run, error } = await adminClient
    .from('runs')
    .select('*, workflows(name)')
    .eq('id', c.req.param('id'))
    .eq('workspace_id', workspaceId)
    .single()
  if (error || !run) return c.json({ error: 'Not found' }, 404)

  const { data: logs } = await adminClient
    .from('run_logs')
    .select('*')
    .eq('run_id', run.id)
    .order('created_at', { ascending: true })

  return c.json({ ...run, logs: logs ?? [] })
})

runRoutes.post('/', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const body = await c.req.json<{ workflowId: string; triggeredBy?: string }>()
  if (!body.workflowId) return c.json({ error: 'workflowId is required' }, 400)
  const { data, error } = await adminClient
    .from('runs')
    .insert({
      workflow_id: body.workflowId,
      workspace_id: workspaceId,
      triggered_by: body.triggeredBy ?? 'manual',
      status: 'queued',
    })
    .select()
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})
