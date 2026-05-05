import type { TransformFn } from './index.ts'
import { runInNewContext } from 'node:vm'

export const execute: TransformFn = async (records, config) => {
  const code = (config.code as string | undefined) ?? 'return records'
  const timeoutMs = ((config.timeoutSeconds as number | undefined) ?? 30) * 1000

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Code Step timeout after ${config.timeoutSeconds ?? 30}s`))
    }, timeoutMs)

    try {
      const wrapped = `(function(records) { ${code} })(records)`
      const result = runInNewContext(wrapped, { records }, { timeout: timeoutMs })
      clearTimeout(timer)
      Promise.resolve(result).then(resolved => {
        if (!Array.isArray(resolved)) {
          reject(new Error('Code Step must return an array'))
          return
        }
        resolve(resolved as Record<string, unknown>[])
      }).catch(err => {
        reject(new Error(`Code Step error: ${err instanceof Error ? err.message : String(err)}`))
      })
    } catch (err) {
      clearTimeout(timer)
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('timed out') || msg.includes('Script execution timed out')) {
        reject(new Error(`Code Step timeout after ${config.timeoutSeconds ?? 30}s`))
      } else {
        reject(new Error(`Code Step error: ${msg}`))
      }
    }
  })
}
