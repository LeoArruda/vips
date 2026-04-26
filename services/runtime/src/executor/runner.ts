import type { WorkflowDefinition } from '@vipsos/workflow-schema'
import { topoSort } from './graph.ts'
import { getConnector } from '../connectors/registry.ts'

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
    await ctx.postLog(node.id, 'info', `Node completed successfully`)
  }

  await ctx.postLog(null, 'info', `Run ${ctx.runId} completed successfully`)
  await ctx.patchRun({ status: 'success', finished_at: new Date().toISOString() })
}
