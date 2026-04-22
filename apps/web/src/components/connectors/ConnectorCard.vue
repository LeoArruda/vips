<script setup lang="ts">
import type { ConnectorCard } from '@/types'

defineProps<{ connector: ConnectorCard }>()

const categoryColors: Record<string, string> = {
  database: 'bg-blue-100 text-blue-700',
  saas: 'bg-purple-100 text-purple-700',
  storage: 'bg-amber-100 text-amber-700',
  messaging: 'bg-green-100 text-green-700',
  analytics: 'bg-rose-100 text-rose-700',
}

const authLabels: Record<string, string> = {
  oauth2: 'OAuth 2.0',
  'api-key': 'API Key',
  basic: 'Basic Auth',
  none: 'No Auth',
}
</script>

<template>
  <div class="flex flex-col rounded-lg border bg-background p-4 transition-shadow hover:shadow-md">
    <div class="mb-3 flex items-start justify-between">
      <div
        class="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-sm font-bold text-muted-foreground"
      >
        {{ connector.logoInitial }}
      </div>
      <div class="flex items-center gap-1.5">
        <span
          v-if="connector.installed"
          class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
        >
          Installed
        </span>
        <span
          v-if="connector.certified"
          class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
        >
          ✓ Certified
        </span>
      </div>
    </div>

    <h3 class="text-sm font-semibold">{{ connector.name }}</h3>
    <p class="mt-0.5 text-xs text-muted-foreground">{{ connector.description }}</p>

    <div class="mt-3 flex flex-wrap gap-1.5">
      <span
        class="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
        :class="categoryColors[connector.category] ?? 'bg-muted text-muted-foreground'"
      >
        {{ connector.category }}
      </span>
      <span class="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        {{ authLabels[connector.authMethod] ?? connector.authMethod }}
      </span>
    </div>

    <div class="mt-4 flex flex-1 items-end">
      <button
        class="w-full rounded-md border py-1.5 text-xs font-medium transition-colors hover:bg-muted"
      >
        {{ connector.installed ? 'Configure' : 'Install' }}
      </button>
    </div>
  </div>
</template>
