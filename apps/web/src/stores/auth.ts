import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { stubSession } from '@/data/auth'
import type { AuthSession } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<AuthSession | null>(null)

  const isAuthenticated = computed(() => session.value !== null)

  function login(_email: string, _password: string) {
    // Demo: accept any credentials and load stub session
    session.value = { ...stubSession }
  }

  function logout() {
    session.value = null
  }

  function completeOnboarding() {
    if (session.value) session.value.onboardingComplete = true
  }

  return { session, isAuthenticated, login, logout, completeOnboarding }
})
