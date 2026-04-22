<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConnectorsStore } from '@/stores/connectors'
import { ArrowLeft, ExternalLink, CheckCircle2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useConnectorsStore()

const detail = computed(() => store.getDetail(route.params.id as string))

const authLabels: Record<string, string> = {
  oauth2: 'OAuth 2.0',
  'api-key': 'API Key',
  basic: 'Basic Auth',
  none: 'No Auth',
}

const categoryColors: Record<string, string> = {
  database: 'bg-blue-100 text-blue-700',
  saas: 'bg-purple-100 text-purple-700',
  storage: 'bg-amber-100 text-amber-700',
  messaging: 'bg-green-100 text-green-700',
  analytics: 'bg-rose-100 text-rose-700',
}
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <!-- Not found -->
    <div v-if="!detail" class="py-12 text-center text-muted-foreground">
      <p class="text-sm">Connector not found.</p>
      <button class="mt-3 text-sm text-primary underline" @click="router.push('/connectors')">
        Back to connectors
      </button>
    </div>

    <!-- Detail -->
    <div v-else>
      <button
        class="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        @click="router.push('/connectors')"
      >
        <ArrowLeft class="h-4 w-4" />
        Connectors
      </button>

      <div class="mb-6 flex items-start gap-4">
        <div
          class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-lg font-bold text-muted-foreground"
        >
          {{ detail.logoInitial }}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-semibold tracking-tight">{{ detail.name }}</h1>
            <span
              v-if="detail.installed"
              class="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700"
            >
              Installed
            </span>
          </div>
          <div class="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span>v{{ detail.version }}</span>
            <span>·</span>
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
              :class="categoryColors[detail.category] ?? 'bg-muted text-muted-foreground'"
            >
              {{ detail.category }}
            </span>
            <span>·</span>
            <span>{{ authLabels[detail.authMethod] ?? detail.authMethod }}</span>
          </div>
          <p class="mt-2 text-sm text-muted-foreground">{{ detail.description }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Supported actions -->
        <div>
          <h2 class="mb-3 text-sm font-semibold">Supported Actions</h2>
          <div class="divide-y rounded-lg border">
            <div
              v-for="action in detail.actions"
              :key="action.actionId"
              class="flex items-start gap-3 px-4 py-3"
            >
              <CheckCircle2 class="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              <div>
                <p class="text-sm font-medium">{{ action.name }}</p>
                <p class="text-xs text-muted-foreground">{{ action.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Auth requirements -->
        <div>
          <h2 class="mb-3 text-sm font-semibold">Auth Requirements</h2>
          <div class="divide-y rounded-lg border">
            <div
              v-for="(req, i) in detail.authRequirements"
              :key="i"
              class="flex items-center gap-3 px-4 py-2.5"
            >
              <div class="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              <span class="text-sm">{{ req }}</span>
            </div>
          </div>

          <div v-if="detail.docsUrl" class="mt-4">
            <a
              :href="detail.docsUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ExternalLink class="h-3.5 w-3.5" />
              View Documentation
            </a>
          </div>
        </div>
      </div>

      <div class="mt-6 border-t pt-6">
        <button
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          {{ detail.installed ? 'Configure Connector' : 'Install Connector' }}
        </button>
      </div>
    </div>
  </div>
</template>
