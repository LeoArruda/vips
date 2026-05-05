import type { TransformFn } from './index.ts'

function rightNodeId(config: Record<string, unknown>): string | undefined {
  const ids = config._upstreamNodeIds as Array<{ source: string; handle: string }> | undefined
  return (ids?.find(u => u.handle === 'input-right') ?? ids?.[1])?.source
}

export const execute: TransformFn = async (records, config, ctx) => {
  const rightId = rightNodeId(config)
  const targetRecords = rightId ? ctx.getNodeOutput(rightId) : []
  const matchKey = config.matchKey as string ?? ''
  const strategy = (config.strategy as string | undefined) ?? 'upsert'

  const sourceKeys = new Set(records.map(r => r[matchKey]))
  const targetKeys = new Set(targetRecords.map(r => r[matchKey]))

  const result: Record<string, unknown>[] = []

  for (const src of records) {
    if (targetKeys.has(src[matchKey])) {
      if (strategy !== 'insert-only') result.push({ ...src, _op: 'update' })
    } else {
      if (strategy !== 'update-only') result.push({ ...src, _op: 'insert' })
    }
  }

  for (const tgt of targetRecords) {
    if (!sourceKeys.has(tgt[matchKey])) {
      result.push({ ...tgt, _op: 'delete' })
    }
  }

  return result
}
