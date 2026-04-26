<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConnectorsStore } from '@/stores/connectors'
import { ArrowLeft, Settings } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useConnectorsStore()

const detail = computed(() => store.connectors.find((c) => c.id === route.params.id))

const categoryColors: Record<string, string> = {
  database: 'bg-blue-100 text-blue-700',
  saas: 'bg-purple-100 text-purple-700',
  storage: 'bg-amber-100 text-amber-700',
  messaging: 'bg-green-100 text-green-700',
  analytics: 'bg-rose-100 text-rose-700',
}

onMounted(() => {
  if (store.connectors.length === 0) store.fetchAll()
})
</script>

<template>
  <div class="h-full overflow-y-auto p-[18px]">
    <!-- Not found -->
    <div v-if="!detail" class="py-12 text-center text-muted-foreground">
      <p class="text-[11.5px]">Connector not found.</p>
      <button class="mt-3 text-[11.5px] text-primary underline" @click="router.push('/connectors')">
        Back to connectors
      </button>
    </div>

    <!-- Detail -->
    <div v-else>
      <button
        class="mb-4 flex items-center gap-1.5 text-[11.5px] text-muted-foreground hover:text-foreground"
        @click="router.push('/connectors')"
      >
        <ArrowLeft class="h-4 w-4" />
        Connectors
      </button>

      <div class="mb-6 flex items-start gap-4">
        <div
          class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-lg font-bold text-muted-foreground"
        >
          {{ detail.name[0]?.toUpperCase() ?? '?' }}
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-[15px] font-semibold tracking-tight">{{ detail.name }}</h1>
            <span class="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              Installed
            </span>
          </div>
          <div class="mt-1 flex items-center gap-2 text-[11.5px] text-muted-foreground">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
              :class="categoryColors[detail.type] ?? 'bg-muted text-muted-foreground'"
            >
              {{ detail.type }}
            </span>
            <span>·</span>
            <span>Added {{ new Date(detail.created_at).toLocaleDateString() }}</span>
          </div>
        </div>
      </div>

      <!-- Config fields -->
      <div class="mb-6 rounded-[7px] border bg-background p-[11px]">
        <h2 class="mb-3 flex items-center gap-2 text-[10.5px] font-semibold">
          <Settings class="h-3.5 w-3.5" /> Configuration
        </h2>
        <div v-if="Object.keys(detail.config).length === 0" class="text-[11.5px] text-muted-foreground">
          No configuration fields.
        </div>
        <div v-else class="space-y-1">
          <div
            v-for="(value, key) in detail.config"
            :key="key"
            class="flex items-center gap-3 text-[11.5px]"
          >
            <span class="w-32 shrink-0 font-medium text-muted-foreground">{{ key }}</span>
            <span class="truncate">{{ value }}</span>
          </div>
        </div>
      </div>

      <div class="border-t pt-6">
        <button
          class="rounded-[5px] bg-indigo-500 px-4 py-2 text-[11.5px] font-medium text-white hover:bg-indigo-600"
        >
          Configure Connector
        </button>
      </div>
    </div>
  </div>
</template>
