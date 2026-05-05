import type { TransformFn, TransformContext } from './index.ts'

interface EnrichField { sourceField: string; targetField: string }

export const execute: TransformFn = async (
  records: Record<string, unknown>[],
  config: Record<string, unknown>,
  ctx: TransformContext,
) => {
  const lookupKey = config.lookupKey as string ?? ''
  const enrichFields = (config.enrichFields as EnrichField[] | undefined) ?? []
  const inlineDataStr = config.inlineData as string | undefined

  if (!inlineDataStr) return records

  let refData: Record<string, unknown>[]
  try {
    refData = JSON.parse(inlineDataStr) as Record<string, unknown>[]
    if (!Array.isArray(refData)) throw new Error('not an array')
  } catch (err) {
    ctx.log('warn', `lookup: failed to parse inlineData — ${err instanceof Error ? err.message : String(err)}`)
    return records
  }

  if (enrichFields.length === 0) return records

  const refByKey = new Map<unknown, Record<string, unknown>>()
  for (const ref of refData) {
    const key = ref[enrichFields.find(e => e.targetField === lookupKey)?.sourceField ?? lookupKey]
      ?? ref[lookupKey]
    refByKey.set(key, ref)
  }

  return records.map(record => {
    const ref = refByKey.get(record[lookupKey])
    if (!ref) return record
    const enriched = { ...record }
    for (const e of enrichFields) {
      enriched[e.targetField] = ref[e.sourceField]
    }
    return enriched
  })
}
