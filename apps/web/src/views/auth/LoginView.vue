<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const error = ref('')
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

function submit() {
  if (!email.value || !password.value) {
    error.value = 'Please enter your email and password.'
    return
  }
  auth.login(email.value, password.value)
  const redirect = (route.query.redirect as string) || '/dashboard'
  router.push(redirect)
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/40">
    <div class="w-full max-w-sm rounded-xl border bg-background p-8 shadow-sm">
      <div class="mb-6 text-center">
        <h1 class="text-2xl font-bold tracking-tight">Sign in to vipsOS</h1>
        <p class="mt-1 text-sm text-muted-foreground">Enter your credentials to continue</p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="mb-1.5 block text-sm font-medium">Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="you@company.com"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium">Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
          />
        </div>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <button
          type="submit"
          class="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
        >
          Sign in
        </button>
      </form>

      <div class="my-4 flex items-center gap-3">
        <div class="flex-1 border-t" />
        <span class="text-xs text-muted-foreground">OR</span>
        <div class="flex-1 border-t" />
      </div>

      <button
        class="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        @click="submit"
      >
        Continue with SSO
      </button>

      <p class="mt-4 text-center text-sm text-muted-foreground">
        Don't have an account?
        <RouterLink to="/auth/signup" class="font-medium underline underline-offset-4">Sign up</RouterLink>
      </p>
    </div>
  </div>
</template>
