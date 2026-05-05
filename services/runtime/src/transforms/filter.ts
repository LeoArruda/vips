import type { TransformFn } from './index.ts'

type Operator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'contains' | 'starts-with' | 'ends-with' | 'is-null' | 'is-not-null'
interface Condition { field: string; operator: Operator; value: string }

function evaluate(record: Record<string, unknown>, c: Condition): boolean {
  const v = record[c.field]
  switch (c.operator) {
    case '=': return String(v) === c.value
    case '!=': return String(v) !== c.value
    case '>': return Number(v) > Number(c.value)
    case '>=': return Number(v) >= Number(c.value)
    case '<': return Number(v) < Number(c.value)
    case '<=': return Number(v) <= Number(c.value)
    case 'contains': return String(v).includes(c.value)
    case 'starts-with': return String(v).startsWith(c.value)
    case 'ends-with': return String(v).endsWith(c.value)
    case 'is-null': return v === null || v === undefined
    case 'is-not-null': return v !== null && v !== undefined
    default: return true
  }
}

export const execute: TransformFn = async (records, config) => {
  const conditions = (config.conditions as Condition[] | undefined) ?? []
  if (conditions.length === 0) return records
  const logic = (config.logic as string | undefined) ?? 'AND'
  return records.filter(record => {
    const results = conditions.map(c => evaluate(record, c))
    return logic === 'OR' ? results.some(Boolean) : results.every(Boolean)
  })
}
