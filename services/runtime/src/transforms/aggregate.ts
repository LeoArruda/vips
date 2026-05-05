import type { TransformFn } from './index.ts'

type AggFn = 'count' | 'sum' | 'avg' | 'min' | 'max'
interface Aggregation { field: string; function: AggFn; alias: string }

export const execute: TransformFn = async (records, config) => {
  const groupBy = (config.groupBy as string[] | undefined) ?? []
  const aggregations = (config.aggregations as Aggregation[] | undefined) ?? []

  const groupKey = (record: Record<string, unknown>) =>
    groupBy.map(k => String(record[k])).join('\0')

  const groups = new Map<string, Record<string, unknown>[]>()
  for (const record of records) {
    const key = groupKey(record)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(record)
  }

  const result: Record<string, unknown>[] = []
  for (const [, rows] of groups) {
    const out: Record<string, unknown> = {}
    for (const k of groupBy) out[k] = rows[0][k]
    for (const agg of aggregations) {
      const nums = rows.map(r => Number(r[agg.field])).filter(n => !isNaN(n))
      switch (agg.function) {
        case 'count': out[agg.alias] = rows.length; break
        case 'sum': out[agg.alias] = nums.reduce((a, b) => a + b, 0); break
        case 'avg': out[agg.alias] = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null; break
        case 'min': out[agg.alias] = nums.length ? Math.min(...nums) : null; break
        case 'max': out[agg.alias] = nums.length ? Math.max(...nums) : null; break
      }
    }
    result.push(out)
  }
  return result
}
