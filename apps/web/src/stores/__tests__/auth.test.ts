import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'

describe('useAuthStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('starts unauthenticated', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.session).toBeNull()
  })

  it('authenticates after login', () => {
    const store = useAuthStore()
    store.login('alex@acme.io', 'password')
    expect(store.isAuthenticated).toBe(true)
    expect(store.session?.user.email).toBe('alex@acme.io')
  })

  it('clears session on logout', () => {
    const store = useAuthStore()
    store.login('alex@acme.io', 'password')
    store.logout()
    expect(store.isAuthenticated).toBe(false)
    expect(store.session).toBeNull()
  })

  it('marks onboarding complete', () => {
    const store = useAuthStore()
    store.login('alex@acme.io', 'password')
    store.completeOnboarding()
    expect(store.session?.onboardingComplete).toBe(true)
  })
})
