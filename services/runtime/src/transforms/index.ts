import type { TransformNodeType } from '@vipsos/workflow-schema'
import { execute as fieldMapping } from './field-mapping.ts'
import { execute as filter } from './filter.ts'
import { execute as join } from './join.ts'
import { execute as merge } from './merge.ts'
import { execute as union } from './union.ts'
import { execute as convert } from './convert.ts'
import { execute as derive } from './derive.ts'
import { execute as aggregate } from './aggregate.ts'
import { execute as flatten } from './flatten.ts'
import { execute as lookup } from './lookup.ts'
import { execute as validate } from './validate.ts'
import { execute as cleanse } from './cleanse.ts'
import { execute as code } from './code.ts'

export interface TransformContext {
  log: (level: 'info' | 'warn' | 'error', msg: string) => void
  getNodeOutput: (nodeId: string) => Record<string, unknown>[]
}

export type TransformFn = (
  records: Record<string, unknown>[],
  config: Record<string, unknown>,
  ctx: TransformContext,
) => Promise<Record<string, unknown>[]>

export const TRANSFORM_EXECUTORS: Record<TransformNodeType, TransformFn> = {
  'transform.map': fieldMapping,
  'transform.filter': filter,
  'transform.join': join,
  'transform.merge': merge,
  'transform.union': union,
  'transform.convert': convert,
  'transform.derive': derive,
  'transform.aggregate': aggregate,
  'transform.flatten': flatten,
  'transform.lookup': lookup,
  'transform.validate': validate,
  'transform.cleanse': cleanse,
  'transform.code': code,
}
