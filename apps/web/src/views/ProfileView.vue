<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const user = auth.session?.user
const displayName = ref(user?.name ?? '')
const email = ref(user?.email ?? '')
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-6 py-4">
      <h1 class="text-xl font-semibold">My Profile</h1>
    </div>
    <div class="p-6">
      <div class="flex items-center gap-5 mb-8">
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl font-bold">
          {{ user?.avatarInitial ?? '?' }}
        </div>
        <div>
          <p class="text-lg font-semibold">{{ user?.name }}</p>
          <p class="text-sm text-muted-foreground capitalize">{{ user?.role }}</p>
        </div>
      </div>
      <div class="max-w-lg space-y-4">
        <div>
          <label class="mb-1.5 block text-sm font-medium">Display name</label>
          <input v-model="displayName" class="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium">Email</label>
          <input v-model="email" type="email" class="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button class="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">
          Save changes
        </button>
      </div>
    </div>
  </div>
</template>
