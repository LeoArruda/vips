import { describe, it, expect } from 'vitest'
import { positionsForNodesMissingLayout } from '../layoutFallback'

describe('positionsForNodesMissingLayout', () => {
  it('assigns stable grid positions sorted by id', () => {
    const pos = positionsForNodesMissingLayout(['b', 'a'])
    expect(pos.a).toEqual({ x: 50, y: 150 })
    expect(pos.b).toEqual({ x: 320, y: 150 })
  })
})
