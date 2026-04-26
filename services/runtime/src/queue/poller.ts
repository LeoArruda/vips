import type { WorkflowDefinition } from '@vipsos/workflow-schema'
import { executeRun } from '../executor/runner.ts'

const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL ?? 'http://localhost:3001'
const WORKER_KEY = process.env.WORKER_KEY ?? ''

interface PendingRun {
  id: string
  workflow_id: string
  workspace_id: string
  status: string
  workflows: { id: string; name: string; definition: WorkflowDefinition } | null
}

function workerHeaders(): Record<string, string> {
  return { 'X-Worker-Key': WORKER_KEY, 'Content-Type': 'application/json' }
}

async function fetchPendingJobs(): Promise<PendingRun[]> {
  try {
    const res = await fetch(`${CONTROL_PLANE_URL}/runs/pending`, { headers: workerHeaders() })
    if (!res.ok) {
      console.error(`[poller] /runs/pending returned ${res.status}`)
      return []
    }
    return (await res.json()) as PendingRun[]
  } catch (err) {
    console.error('[poller] fetch error:', err)
    return []
  }
}

async function postLog(runId: string, nodeId: string | null, level: string, message: string): Promise<void> {
  try {
    await fetch(`${CONTROL_PLANE_URL}/runs/${runId}/logs`, {
      method: 'POST',
      headers: workerHeaders(),
      body: JSON.stringify({ nodeId, level, message }),
    })
  } catch {
    console.error(`[worker] failed to post log for run ${runId}: ${message}`)
  }
}

async function patchRun(runId: string, fields: { status: string; finished_at?: string }): Promise<void> {
  try {
    await fetch(`${CONTROL_PLANE_URL}/runs/${runId}`, {
      method: 'PATCH',
      headers: workerHeaders(),
      body: JSON.stringify(fields),
    })
  } catch {
    console.error(`[worker] failed to patch run ${runId}:`, fields)
  }
}

const inProgress = new Set<string>()

export async function pollAndExecute(): Promise<void> {
  const jobs = await fetchPendingJobs()

  for (const job of jobs) {
    if (inProgress.has(job.id)) continue
    if (!job.workflows?.definition) {
      console.warn(`[worker] run ${job.id} has no workflow definition — skipping`)
      continue
    }

    inProgress.add(job.id)

    executeRun(job.workflows.definition, {
      runId: job.id,
      postLog: (nodeId, level, message) => postLog(job.id, nodeId, level, message),
      patchRun: (fields) => patchRun(job.id, fields),
    })
      .catch((err) => {
        console.error(`[worker] unhandled error in run ${job.id}:`, err)
      })
      .finally(() => {
        inProgress.delete(job.id)
      })
  }
}
