<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const brandName = (route.query.brand as string) || 'YourApp'
const step = ref<'select' | 'auth' | 'success' | 'error'>('select')
const selectedProvider = ref('')

const providers = ['Salesforce', 'HubSpot', 'Stripe', 'Slack', 'Postgres', 'Google Sheets']

function selectProvider(name: string) {
  selectedProvider.value = name
  step.value = 'auth'
}

function connect() {
  step.value = 'success'
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/40 p-4">
    <div class="w-full max-w-sm rounded-xl border bg-background shadow-sm overflow-hidden">
      <!-- Branded header -->
      <div class="border-b px-5 py-3 flex items-center gap-2">
        <div class="h-6 w-6 rounded bg-foreground" />
        <span class="text-sm font-semibold">{{ brandName }}</span>
        <span class="mx-1 text-muted-foreground">·</span>
        <span class="text-xs text-muted-foreground">Powered by vipsOS</span>
      </div>

      <!-- Select provider -->
      <div v-if="step === 'select'" class="p-5">
        <h2 class="text-base font-semibold mb-1">Connect your app</h2>
        <p class="text-sm text-muted-foreground mb-4">Choose a provider to get started.</p>
        <div class="grid grid-cols-2 gap-2">
          <button v-for="p in providers" :key="p"
            class="rounded-lg border px-3 py-2.5 text-sm font-medium hover:bg-muted text-left"
            @click="selectProvider(p)">{{ p }}</button>
        </div>
      </div>

      <!-- Authenticate -->
      <div v-if="step === 'auth'" class="p-5">
        <h2 class="text-base font-semibold mb-1">Connect {{ selectedProvider }}</h2>
        <p class="text-sm text-muted-foreground mb-4">Authorize access to sync your data securely.</p>
        <div class="mb-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <p class="font-medium mb-1">Permissions requested:</p>
          <ul class="list-disc list-inside space-y-0.5">
            <li>Read contacts and accounts</li>
            <li>Write sync status back</li>
          </ul>
        </div>
        <div class="space-y-2">
          <button class="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
            @click="connect">
            Authorize {{ selectedProvider }}
          </button>
          <button class="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            @click="step = 'select'">Back</button>
        </div>
      </div>

      <!-- Success -->
      <div v-if="step === 'success'" class="p-5 text-center">
        <div class="mb-3 text-4xl">✓</div>
        <h2 class="text-base font-semibold mb-1">Connected!</h2>
        <p class="text-sm text-muted-foreground mb-4">
          {{ selectedProvider }} is now syncing with {{ brandName }}.
        </p>
        <button class="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">
          Done
        </button>
      </div>

      <!-- Error -->
      <div v-if="step === 'error'" class="p-5 text-center">
        <div class="mb-3 text-4xl">✗</div>
        <h2 class="text-base font-semibold mb-1">Connection failed</h2>
        <p class="text-sm text-muted-foreground mb-4">Could not authorize {{ selectedProvider }}. Please try again.</p>
        <div class="space-y-2">
          <button class="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
            @click="step = 'auth'">Try again</button>
          <button class="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Contact support</button>
        </div>
      </div>

    </div>
  </div>
</template>
