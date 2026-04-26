import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.ts'
import { requireWorkerAuth } from '../middleware/worker.ts'
import { adminClient } from '../lib/supabase.ts'
import type { AuthContext } from '../middleware/auth.ts'

export const runRoutes = new Hono()

// ── User-facing routes (require JWT + workspace) ─────────────────────────────

runRoutes.get('/', requireAuth, async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { data, error } = await adminClient
    .from('runs')
    .select('id, workflow_id, status, triggered_by, started_at, finished_at, workflows(name)')
    .eq('workspace_id', workspaceId)
    .order('started_at', { ascending: false })
    .limit(100)
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

// NOTE: /pending must be registered before /:id to avoid route conflict
runRoutes.get('/pending', requireWorkerAuth, async (c) => {
  const { data, error } = await adminClient
    .from('runs')
    .select('*, workflows(id, name, definition)')
    .eq('status', 'queued')
    .order('started_at', { ascending: true })
    .limit(5)
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

runRoutes.get('/:id', requireAuth, async (c) => {
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

runRoutes.post('/', requireAuth, async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const body = await c.req.json<{ workflowId: string; triggeredBy?: string }>()
  if (!body.workflowId) return c.json({ error: 'workflowId is required' }, 400)

  const { data: workflow } = await adminClient
    .from('workflows')
    .select('id')
    .eq('id', body.workflowId)
    .eq('workspace_id', workspaceId)
    .single()
  if (!workflow) return c.json({ error: 'Workflow not found' }, 404)

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

// ── Worker routes (require X-Worker-Key header) ───────────────────────────────

runRoutes.patch('/:id', requireWorkerAuth, async (c) => {
  const body = await c.req.json<{ status: string; finished_at?: string }>()
  // Only update runs that are in a non-terminal state to prevent a stale worker
  // from overwriting a run that was already completed by another worker instance.
  const { error } = await adminClient
    .from('runs')
    .update({
      status: body.status,
      ...(body.finished_at ? { finished_at: body.finished_at } : {}),
    })
    .eq('id', c.req.param('id'))
    .in('status', ['queued', 'running'])
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ ok: true })
})

runRoutes.post('/:id/logs', requireWorkerAuth, async (c) => {
  const body = await c.req.json<{ nodeId?: string; level: string; message: string }>()
  if (!body.level || !body.message) {
    return c.json({ error: 'level and message are required' }, 400)
  }
  const { error } = await adminClient.from('run_logs').insert({
    run_id: c.req.param('id'),
    node_id: body.nodeId ?? null,
    level: body.level,
    message: body.message,
  })
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ ok: true }, 201)
})
