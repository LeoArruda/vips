import type { TransformFn } from './index.ts'

type JoinType = 'inner' | 'left' | 'right' | 'full'

function rightNodeId(config: Record<string, unknown>): string | undefined {
  const ids = config._upstreamNodeIds as Array<{ source: string; handle: string }> | undefined
  return (ids?.find(u => u.handle === 'input-right') ?? ids?.[1])?.source
}

export const execute: TransformFn = async (records, config, ctx) => {
  const rightId = rightNodeId(config)
  const rightRecords = rightId ? ctx.getNodeOutput(rightId) : []
  const leftKey = config.leftKey as string ?? ''
  const rightKey = config.rightKey as string ?? ''
  const joinType = (config.joinType as JoinType | undefined) ?? 'inner'

  const rightByKey = new Map<unknown, Record<string, unknown>>()
  for (const r of rightRecords) rightByKey.set(r[rightKey], r)

  const result: Record<string, unknown>[] = []
  const matchedRightKeys = new Set<unknown>()

  for (const left of records) {
    const right = rightByKey.get(left[leftKey])
    if (right) {
      matchedRightKeys.add(left[leftKey])
      result.push({ ...right, ...left })
    } else if (joinType === 'left' || joinType === 'full') {
      result.push({ ...left })
    }
  }

  if (joinType === 'right' || joinType === 'full') {
    for (const r of rightRecords) {
      if (!matchedRightKeys.has(r[rightKey])) result.push({ ...r })
    }
  }

  return result
}
