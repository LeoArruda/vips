import type { TransformFn } from './index.ts'

function flattenObject(obj: Record<string, unknown>, prefix: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, fullKey))
    } else {
      result[fullKey] = value
    }
  }
  return result
}

export const execute: TransformFn = async (records, config) => {
  const paths = (config.paths as string[] | undefined) ?? []
  const explodeArrays = Boolean(config.explodeArrays)
  if (paths.length === 0) return records

  const output: Record<string, unknown>[] = []

  for (const record of records) {
    let rows: Record<string, unknown>[] = [{ ...record }]

    for (const path of paths) {
      const next: Record<string, unknown>[] = []
      for (const row of rows) {
        const value = row[path]
        if (value === null || value === undefined) { next.push(row); continue }
        if (Array.isArray(value) && explodeArrays) {
          for (const item of value) {
            next.push({ ...row, [path]: item })
          }
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          const flattened = flattenObject(value as Record<string, unknown>, path)
          const updated = { ...row }
          delete updated[path]
          next.push({ ...updated, ...flattened })
        } else {
          next.push(row)
        }
      }
      rows = next
    }

    output.push(...rows)
  }

  return output
}
