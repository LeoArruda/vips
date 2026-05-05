import type { WorkflowDefinition } from '@vipsos/workflow-schema'
import type { TransformNodeType } from '@vipsos/workflow-schema'
import { topoSort } from './graph.ts'
import { getConnector } from '../connectors/registry.ts'
import { TRANSFORM_EXECUTORS } from '../transforms/index.ts'
import type { TransformContext } from '../transforms/index.ts'

function toRecords(output: Record<string, unknown> | undefined): Record<string, unknown>[] {
  if (!output) return []
  if (Array.isArray(output.records)) return output.records as Record<string, unknown>[]
  if (Array.isArray(output.rows)) return output.rows as Record<string, unknown>[]
  if (Array.isArray(output.body)) return output.body as Record<string, unknown>[]
  if (Array.isArray(output.data)) return output.data as Record<string, unknown>[]
  return []
}

function deriveSchemaLog(output: Record<string, unknown>): string | null {
  if (Array.isArray(output.records)) {
    if (output.records.length > 0 && typeof output.records[0] === 'object' && output.records[0] !== null) {
      const fields = Object.keys(output.records[0] as object).join(' · ')
      return `Output: ${output.records.length} records · ${fields}`
    }
    return `Output: ${output.records.length} records`
  }
  if (Array.isArray(output.body) && output.body.length > 0 && typeof output.body[0] === 'object' && output.body[0] !== null) {
    const fields = Object.keys(output.body[0] as object).join(' · ')
    return `Output: ${output.body.length} records · ${fields}`
  }
  if (output.body && typeof output.body === 'object' && !Array.isArray(output.body)) {
    const fields = Object.keys(output.body as object).join(' · ')
    return `Output: 1 record · ${fields}`
  }
  if (Array.isArray(output.rows) && (output.rows as unknown[]).length > 0 && typeof (output.rows as unknown[])[0] === 'object') {
    const fields = Object.keys((output.rows as object[])[0]).join(' · ')
    return `Output: ${(output.rows as unknown[]).length} rows · ${fields}`
  }
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

    if (node.type.startsWith('transform.')) {
      const fn = TRANSFORM_EXECUTORS[node.type as TransformNodeType]
      if (!fn) {
        await ctx.postLog(node.id, 'error', `Unknown transform type: ${node.type}`)
        await ctx.patchRun({ status: 'failed', finished_at: new Date().toISOString() })
        return
      }

      const incomingEdges = executableEdges.filter(e => e.target === node.id)
      const leftEdge = incomingEdges.find(e => e.targetHandle === 'input-left') ?? incomingEdges[0]
      const leftRecords = leftEdge ? toRecords(outputs.get(leftEdge.source)) : []

      const augmentedConfig: Record<string, unknown> = {
        ...node.config,
        _upstreamNodeIds: incomingEdges.map(e => ({
          source: e.source,
          handle: e.targetHandle ?? (e === leftEdge ? 'input-left' : 'input-right'),
        })),
      }

      const transformCtx: TransformContext = {
        log: (level, msg) => { void ctx.postLog(node.id, level, msg) },
        getNodeOutput: (nodeId) => toRecords(outputs.get(nodeId)),
      }

      let transformOutput: Record<string, unknown>[]
      try {
        transformOutput = await fn(leftRecords, augmentedConfig, transformCtx)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        await ctx.postLog(node.id, 'error', `Transform failed: ${msg}`)
        await ctx.patchRun({ status: 'failed', finished_at: new Date().toISOString() })
        return
      }

      outputs.set(node.id, { records: transformOutput })
      const schemaLine = deriveSchemaLog({ records: transformOutput })
      if (schemaLine) await ctx.postLog(node.id, 'info', schemaLine)
      await ctx.postLog(node.id, 'info', `Node completed successfully`)
      continue
    }

    // connectorType must be set explicitly in node.config — node.type values like
    // 'connector.source' are UI categories, not connector IDs.
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
    for (const [id, output] of outputs) inputs[id] = output

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
    const schemaLine = deriveSchemaLog(result.output)
    if (schemaLine) await ctx.postLog(node.id, 'info', schemaLine)
    await ctx.postLog(node.id, 'info', `Node completed successfully`)
  }

  await ctx.postLog(null, 'info', `Run ${ctx.runId} completed successfully`)
  await ctx.patchRun({ status: 'success', finished_at: new Date().toISOString() })
}
