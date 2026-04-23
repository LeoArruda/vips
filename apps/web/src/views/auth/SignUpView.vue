<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const name = ref('')
const email = ref('')
const password = ref('')
const agreed = ref(false)
const error = ref('')
const auth = useAuthStore()
const router = useRouter()

function submit() {
  if (!name.value || !email.value || !password.value) {
    error.value = 'All fields are required.'
    return
  }
  if (!agreed.value) {
    error.value = 'You must agree to the terms.'
    return
  }
  auth.login(email.value, password.value)
  router.push('/onboarding')
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/40">
    <div class="w-full max-w-sm rounded-xl border bg-background p-8 shadow-sm">
      <div class="mb-6 text-center">
        <h1 class="text-2xl font-bold tracking-tight">Create your account</h1>
        <p class="mt-1 text-sm text-muted-foreground">Get started with vipsOS</p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="mb-1.5 block text-sm font-medium">Full name</label>
          <input v-model="name" type="text" placeholder="Alex Rivera"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium">Work email</label>
          <input v-model="email" type="email" placeholder="you@company.com"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium">Password</label>
          <input v-model="password" type="password" placeholder="Min. 8 characters"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <label class="flex items-start gap-2 text-sm">
          <input v-model="agreed" type="checkbox" class="mt-0.5 h-4 w-4 rounded border" />
          <span class="text-muted-foreground">
            I agree to the <a href="#" class="underline">Terms of Service</a> and <a href="#" class="underline">Privacy Policy</a>
          </span>
        </label>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <button type="submit"
          class="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">
          Create account
        </button>
      </form>

      <p class="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?
        <RouterLink to="/auth/login" class="font-medium underline underline-offset-4">Sign in</RouterLink>
      </p>
    </div>
  </div>
</template>
