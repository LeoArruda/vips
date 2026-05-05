import { describe, it, expect } from 'bun:test'
import { TRANSFORM_EXECUTORS } from '../../transforms/index.ts'

const EXPECTED_TYPES = [
  'transform.map', 'transform.filter', 'transform.join', 'transform.merge',
  'transform.union', 'transform.convert', 'transform.derive', 'transform.aggregate',
  'transform.flatten', 'transform.lookup', 'transform.validate', 'transform.cleanse',
  'transform.code',
] as const

describe('TRANSFORM_EXECUTORS', () => {
  it('has an entry for all 13 transform types', () => {
    for (const t of EXPECTED_TYPES) {
      expect(typeof TRANSFORM_EXECUTORS[t]).toBe('function')
    }
  })
})
