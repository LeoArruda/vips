import type { WorkflowDefinition } from '@vipsos/workflow-schema'
import { topoSort } from './graph.ts'
import { getConnector } from '../connectors/registry.ts'

function deriveSchemaLog(output: Record<string, unknown>): string | null {
  // HTTP body: array of objects → "Output: N records · field1 · field2"
  if (Array.isArray(output.body) && output.body.length > 0 && typeof output.body[0] === 'object' && output.body[0] !== null) {
    const fields = Object.keys(output.body[0] as object).join(' · ')
    return `Output: ${output.body.length} records · ${fields}`
  }
  // HTTP body: single object → "Output: 1 record · field1 · field2"
  if (output.body && typeof output.body === 'object' && !Array.isArray(output.body)) {
    const fields = Object.keys(output.body as object).join(' · ')
    return `Output: 1 record · ${fields}`
  }
  // Postgres rows array
  if (Array.isArray(output.rows) && (output.rows as unknown[]).length > 0 && typeof (output.rows as unknown[])[0] === 'object') {
    const fields = Object.keys((output.rows as object[])[0]).join(' · ')
    return `Output: ${(output.rows as unknown[]).length} rows · ${fields}`
  }
  // StatCan data array
  if (Array.isArray(output.data) && (output.data as unknown[]).length > 0) {
    return `Output: ${(output.data as unknown[]).length} records`
  }
  return null
}

export interface RunContext {
  runId: string
  postLog(nodeId: string | null, level: 'info' | 'warn' | 'error', message: string): Promise<void>
  patchRun(fields: { status: string; finished_at?: string }): Promise<void>
}

export async function executeRun(definition: WorkflowDefinition, ctx: RunContext): Promise<void> {
  await ctx.patchRun({ status: 'running' })
  await ctx.postLog(null, 'info', `Run ${ctx.runId} started`)

  const executableNodes = definition.nodes.filter((n) => n.type !== 'trigger')
  const executableEdges = definition.edges.filter(
    (e) =>
      executableNodes.some((n) => n.id === e.source) &&
      executableNodes.some((n) => n.id === e.target),
  )

  let sortedNodes: ReturnType<typeof topoSort>
  try {
    sortedNodes = topoSort(executableNodes, executableEdges)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await ctx.postLog(null, 'error', msg)
    await ctx.patchRun({ status: 'failed', finished_at: new Date().toISOString() })
    return
  }

  const outputs = new Map<string, Record<string, unknown>>()

  for (const node of sortedNodes) {
    await ctx.postLog(node.id, 'info', `Starting node: ${node.label}`)

    // connectorType must be set explicitly in node.config — node.type values like
    // 'connector.source' are UI categories, not connector IDs. Nodes without
    // config.connectorType will fail here with a clear error rather than silently skip.
    const connectorType = node.config.connectorType as string | undefined
    if (!connectorType) {
      await ctx.postLog(node.id, 'error', `Node "${node.label}" has no config.connectorType — set it to "http-rest", "postgres", or "statcan"`)
      await ctx.patchRun({ status: 'failed', finished_at: new Date().toISOString() })
      return
    }

    const connector = getConnector(connectorType)
    if (!connector) {
      await ctx.postLog(node.id, 'error', `Unknown connector type "${connectorType}" — supported: http-rest, postgres, statcan`)
      await ctx.patchRun({ status: 'failed', finished_at: new Date().toISOString() })
      return
    }

    const inputs: Record<string, unknown> = {}
    for (const [id, output] of outputs) {
      inputs[id] = output
    }

    const secrets: Record<string, string> = {}
    if (process.env.POSTGRES_CONNECTION_STRING) {
      secrets.connection_string = process.env.POSTGRES_CONNECTION_STRING
    }

    const result = await connector.execute(
      { type: connectorType, settings: node.config, secrets },
      inputs,
    )

    for (const log of result.logs) {
      await ctx.postLog(node.id, log.level, log.message)
    }

    if (!result.success) {
      await ctx.postLog(node.id, 'error', `Node failed: ${result.error ?? 'unknown error'}`)
      await ctx.patchRun({ status: 'failed', finished_at: new Date().toISOString() })
      return
    }

    outputs.set(node.id, result.output)

    // Log a structured schema line so the frontend can surface field names in the node Output tab
    const schemaLine = deriveSchemaLog(result.output)
    if (schemaLine) await ctx.postLog(node.id, 'info', schemaLine)

    await ctx.postLog(node.id, 'info', `Node completed successfully`)
  }

  await ctx.postLog(null, 'info', `Run ${ctx.runId} completed successfully`)
  await ctx.patchRun({ status: 'success', finished_at: new Date().toISOString() })
}
