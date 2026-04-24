import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMembersStore } from '../members'

describe('useMembersStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('loads stub members', () => {
    const store = useMembersStore()
    expect(store.members.length).toBeGreaterThan(0)
  })

  it('counts active members', () => {
    const store = useMembersStore()
    const expected = store.members.filter(m => m.status === 'active').length
    expect(store.activeCount).toBe(expected)
  })

  it('finds a member by id', () => {
    const store = useMembersStore()
    expect(store.findById('u_001')?.name).toBe('Alex Rivera')
  })
})
