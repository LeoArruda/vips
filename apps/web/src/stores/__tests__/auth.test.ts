import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn().mockResolvedValue({}),
    },
  },
}))

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      userId: 'u1',
      email: 'test@example.com',
      workspaceId: 'ws1',
      workspaceName: 'Acme',
      role: 'admin',
      onboardingComplete: true,
    }),
    post: vi.fn().mockResolvedValue({ workspaceId: 'ws1' }),
  },
}))

import { supabase } from '@/lib/supabase'

describe('useAuthStore (real auth)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts unauthenticated', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.session).toBeNull()
  })

  it('sets session after successful login', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ error: null } as never)
    const store = useAuthStore()
    await store.login('test@example.com', 'password')
    expect(store.isAuthenticated).toBe(true)
    expect(store.session?.email).toBe('test@example.com')
  })

  it('sets error on failed login', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      error: { message: 'Invalid credentials' },
    } as never)
    const store = useAuthStore()
    await expect(store.login('bad@email.com', 'wrong')).rejects.toThrow()
    expect(store.error).toBe('Invalid credentials')
  })

  it('clears session on logout', async () => {
    const store = useAuthStore()
    store.session = { userId: 'u1', email: 'x@x.com', workspaceId: 'ws1', workspaceName: 'X', role: 'admin', onboardingComplete: true }
    await store.logout()
    expect(store.session).toBeNull()
  })
})
