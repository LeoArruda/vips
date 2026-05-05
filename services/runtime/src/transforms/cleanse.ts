import type { TransformFn } from './index.ts'

type Operation = 'trim' | 'lowercase' | 'uppercase' | 'replace-null' | 'replace'
interface CleanseOp { field: string; operation: Operation; params: string }

function applyOp(value: unknown, op: CleanseOp): unknown {
  switch (op.operation) {
    case 'trim': return typeof value === 'string' ? value.trim() : value
    case 'lowercase': return typeof value === 'string' ? value.toLowerCase() : value
    case 'uppercase': return typeof value === 'string' ? value.toUpperCase() : value
    case 'replace-null': return (value === null || value === undefined) ? op.params : value
    case 'replace': {
      if (typeof value !== 'string') return value
      const sep = op.params.indexOf('::')
      if (sep === -1) return value
      const find = op.params.slice(0, sep)
      const replace = op.params.slice(sep + 2)
      return value.split(find).join(replace)
    }
    default: return value
  }
}

export const execute: TransformFn = async (records, config) => {
  const operations = (config.operations as CleanseOp[] | undefined) ?? []
  if (operations.length === 0) return records
  return records.map(record => {
    const result = { ...record }
    for (const op of operations) {
      result[op.field] = applyOp(result[op.field], op)
    }
    return result
  })
}
