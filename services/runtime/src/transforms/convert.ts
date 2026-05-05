import type { TransformFn } from './index.ts'

type TargetType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'unknown'
interface Conversion { field: string; targetType: TargetType; format: string }

const TRUTHY = new Set(['true', '1', 'yes', 'on'])

function coerce(value: unknown, targetType: TargetType): unknown {
  if (value === null || value === undefined) return value
  switch (targetType) {
    case 'string': return String(value)
    case 'number': {
      const n = Number(value)
      return isNaN(n) ? null : n
    }
    case 'boolean': return TRUTHY.has(String(value).toLowerCase())
    case 'date': {
      const d = new Date(String(value))
      return isNaN(d.getTime()) ? null : d.toISOString()
    }
    default: return value
  }
}

export const execute: TransformFn = async (records, config) => {
  const conversions = (config.conversions as Conversion[] | undefined) ?? []
  if (conversions.length === 0) return records
  return records.map(record => {
    const result = { ...record }
    for (const c of conversions) {
      result[c.field] = coerce(result[c.field], c.targetType)
    }
    return result
  })
}
