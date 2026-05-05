import type { TransformFn, TransformContext } from './index.ts'

interface Formula { outputField: string; expression: string }

export const execute: TransformFn = async (
  records: Record<string, unknown>[],
  config: Record<string, unknown>,
  ctx: TransformContext,
) => {
  const formulas = (config.formulas as Formula[] | undefined) ?? []
  if (formulas.length === 0) return records

  return records.map(record => {
    const result = { ...record }
    for (const f of formulas) {
      try {
        // User-authored expression evaluated in sandboxed context — record is the only binding
        // eslint-disable-next-line no-new-func
        result[f.outputField] = new Function('record', `return (${f.expression})`)(record)
      } catch (err) {
        ctx.log('warn', `derive expression error for "${f.outputField}": ${err instanceof Error ? err.message : String(err)}`)
        result[f.outputField] = null
      }
    }
    return result
  })
}
