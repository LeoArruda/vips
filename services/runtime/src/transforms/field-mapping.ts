import type { TransformFn } from './index.ts'

interface Mapping { sourceField: string; targetField: string }

export const execute: TransformFn = async (records, config) => {
  const mappings = (config.mappings as Mapping[] | undefined) ?? []
  const strict = Boolean(config.strictMode)

  if (mappings.length === 0) return records

  return records.map(record => {
    if (strict) {
      return Object.fromEntries(mappings.map(m => [m.targetField, record[m.sourceField]]))
    }
    const result = { ...record }
    for (const m of mappings) {
      if (m.sourceField !== m.targetField) {
        result[m.targetField] = result[m.sourceField]
        delete result[m.sourceField]
      }
    }
    return result
  })
}
