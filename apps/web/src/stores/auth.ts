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
    try {
      const { data } = await supabase.auth.getSession()
      if (data.session) await loadMe()
    } catch {
      // getSession failed (e.g. network unavailable) — start unauthenticated
    }
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') await loadMe()
      if (event === 'SIGNED_OUT') session.value = null
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
