import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'

export interface UserSession {
  userId: string
  email: string
  workspaceId: string
  workspaceName: string
  role: string
  onboardingComplete: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<UserSession | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => session.value !== null)

  async function init() {
    // INITIAL_SESSION fires on startup with the stored session (or null if none).
    // TOKEN_REFRESHED fires when the access token is silently renewed.
    // Skip loadMe() when there is no session — avoids spurious 401s on startup
    // and the transient 403 that fires during signup before signup-complete runs.
    supabase.auth.onAuthStateChange(async (event, authSession) => {
      if ((event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && authSession) {
        await loadMe()
      }
      if (event === 'SIGNED_OUT') {
        session.value = null
      }
    })
  }

  async function loadMe() {
    try {
      const me = await api.get<UserSession>('/auth/me')
      if (!me) { session.value = null; return }
      session.value = { ...me, onboardingComplete: true }
    } catch {
      session.value = null
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      await loadMe()
      // If workspace is missing (signup-complete never ran, e.g. control plane was down at
      // registration time), create it now — signup-complete is idempotent.
      if (!session.value) {
        await api.post('/auth/signup-complete', {})
        await loadMe()
      }
      if (!session.value) throw new Error('Login failed — unable to load your account')
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Login failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function signup(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const { error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError
      await api.post('/auth/signup-complete', {})
      await loadMe()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : (e as { message?: string })?.message ?? 'Signup failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    error.value = null
    await supabase.auth.signOut()
    session.value = null
  }

  function completeOnboarding() {
    if (session.value) session.value.onboardingComplete = true
  }

  return { session, loading, error, isAuthenticated, init, login, signup, logout, completeOnboarding }
})
