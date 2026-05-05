import type { TransformFn, TransformContext } from './index.ts'

type RuleType = 'required' | 'not-null' | 'min-length' | 'max-length' | 'regex' | 'min-value' | 'max-value'
type ErrorMode = 'fail' | 'warn' | 'quarantine' | 'skip'
interface ValidationRule { field: string; rule: RuleType; params: string; errorMode: ErrorMode }

function check(record: Record<string, unknown>, rule: ValidationRule): string | null {
  const v = record[rule.field]
  switch (rule.rule) {
    case 'required': return (v === undefined) ? `${rule.field} is required` : null
    case 'not-null': return (v === null || v === undefined) ? `${rule.field} must not be null` : null
    case 'min-length': return (typeof v === 'string' && v.length < Number(rule.params)) ? `${rule.field} min-length ${rule.params}` : null
    case 'max-length': return (typeof v === 'string' && v.length > Number(rule.params)) ? `${rule.field} max-length ${rule.params}` : null
    case 'regex': {
      try { return new RegExp(rule.params).test(String(v)) ? null : `${rule.field} does not match ${rule.params}` }
      catch { return `invalid regex: ${rule.params}` }
    }
    case 'min-value': return (Number(v) < Number(rule.params)) ? `${rule.field} min-value ${rule.params}` : null
    case 'max-value': return (Number(v) > Number(rule.params)) ? `${rule.field} max-value ${rule.params}` : null
    default: return null
  }
}

export const execute: TransformFn = async (
  records: Record<string, unknown>[],
  config: Record<string, unknown>,
  ctx: TransformContext,
) => {
  const rules = (config.rules as ValidationRule[] | undefined) ?? []
  if (rules.length === 0) return records

  const result: Record<string, unknown>[] = []

  for (const record of records) {
    let failed = false
    let quarantineMsg: string | undefined

    for (const rule of rules) {
      const err = check(record, rule)
      if (!err) continue

      const mode = rule.errorMode ?? 'fail'
      if (mode === 'fail') throw new Error(`Validation failed: ${err}`)
      if (mode === 'warn') { ctx.log('warn', `Validation warning: ${err}`); continue }
      if (mode === 'skip') { failed = true; break }
      if (mode === 'quarantine') { quarantineMsg = err; break }
    }

    if (failed) continue
    if (quarantineMsg) {
      result.push({ ...record, _quarantine: quarantineMsg })
    } else {
      result.push(record)
    }
  }

  return result
}
