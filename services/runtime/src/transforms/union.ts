import type { TransformFn } from './index.ts'

function allUpstreamIds(config: Record<string, unknown>): string[] {
  const ids = config._upstreamNodeIds as Array<{ source: string; handle: string }> | undefined
  return (ids ?? []).filter(u => u.handle !== 'input-left').map(u => u.source)
}

export const execute: TransformFn = async (records, config, ctx) => {
  const additional = allUpstreamIds(config).flatMap(id => ctx.getNodeOutput(id))
  const all = [...records, ...additional]
  if (!config.deduplicate) return all
  const seen = new Set<string>()
  return all.filter(r => {
    const key = JSON.stringify(r)
    return seen.has(key) ? false : (seen.add(key), true)
  })
}
