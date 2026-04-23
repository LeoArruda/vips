<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const activeTab = ref('general')
const tabs = ['general', 'security', 'notifications', 'branding']

const orgName = ref(auth.session?.org.name ?? '')
const workspaceName = ref(auth.session?.workspaceName ?? '')
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-6 py-4">
      <h1 class="text-xl font-semibold">Settings</h1>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <nav class="w-48 shrink-0 border-r p-4">
        <button v-for="tab in tabs" :key="tab"
          class="mb-1 w-full rounded-md px-3 py-2 text-left text-sm font-medium capitalize transition-colors hover:bg-muted"
          :class="activeTab === tab ? 'bg-muted text-foreground' : 'text-muted-foreground'"
          @click="activeTab = tab">
          {{ tab }}
        </button>
      </nav>

      <div class="flex-1 overflow-y-auto p-6">
        <div v-if="activeTab === 'general'" class="max-w-lg space-y-5">
          <div>
            <label class="mb-1.5 block text-sm font-medium">Organization name</label>
            <input v-model="orgName" class="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium">Workspace name</label>
            <input v-model="workspaceName" class="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button class="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">
            Save changes
          </button>
        </div>
        <div v-else-if="activeTab === 'security'" class="max-w-lg space-y-5">
          <div class="rounded-lg border p-4">
            <h3 class="font-medium">Two-factor authentication</h3>
            <p class="mt-1 text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
            <button class="mt-3 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted">Enable 2FA</button>
          </div>
          <div class="rounded-lg border p-4">
            <h3 class="font-medium">SSO Configuration</h3>
            <p class="mt-1 text-sm text-muted-foreground">Connect your identity provider.</p>
            <button class="mt-3 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted">Configure SSO</button>
          </div>
        </div>
        <div v-else class="max-w-lg">
          <p class="text-sm text-muted-foreground capitalize">{{ activeTab }} settings coming soon.</p>
        </div>
      </div>
    </div>
  </div>
</template>
