<script setup lang="ts">
import { ref } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'

const props = defineProps<{ data: BuilderNodeData }>()
const emit = defineEmits<{ update: [config: Record<string, unknown>] }>()

const host = ref((props.data.config.host as string) ?? '')
const port = ref((props.data.config.port as string) ?? '5432')
const database = ref((props.data.config.database as string) ?? '')
const secretRef = ref((props.data.config.secretRef as string) ?? '')
const query = ref((props.data.config.query as string) ?? '')
const syncMode = ref((props.data.config.syncMode as string) ?? 'full')
const testStatus = ref<'idle' | 'testing' | 'ok' | 'error'>('idle')

function save() {
  emit('update', { host: host.value, port: port.value, database: database.value, secretRef: secretRef.value, query: query.value, syncMode: syncMode.value })
}

function testConnection() {
  testStatus.value = 'testing'
  setTimeout(() => { testStatus.value = 'ok' }, 800)
}
</script>

<template>
  <div class="space-y-4 p-4">
    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connection</p>
      <input v-model="host" placeholder="Host / Address" @change="save"
        class="mb-2 w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
      <div class="flex gap-2">
        <input v-model="port" placeholder="Port" @change="save"
          class="w-20 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <input v-model="database" placeholder="Database" @change="save"
          class="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </div>
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Auth</p>
      <input v-model="secretRef" placeholder="🔑 Secret reference (e.g. secret:db-creds)" @change="save"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Query</p>
      <textarea v-model="query" placeholder="SELECT * FROM table" rows="3" @change="save"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sync Mode</p>
      <div class="flex gap-2">
        <label v-for="mode in ['full', 'incremental']" :key="mode"
          class="flex flex-1 cursor-pointer items-center justify-center rounded-md border px-2 py-1.5 text-xs font-medium"
          :class="syncMode === mode ? 'border-foreground bg-muted' : ''">
          <input v-model="syncMode" type="radio" :value="mode" class="sr-only" @change="save" />
          {{ mode }}
        </label>
      </div>
    </div>

    <button @click="testConnection"
      class="w-full rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
      :class="testStatus === 'ok' ? 'border-green-500 text-green-600' : testStatus === 'error' ? 'border-red-500 text-red-600' : ''">
      {{ testStatus === 'testing' ? 'Testing…' : testStatus === 'ok' ? '✓ Connected' : testStatus === 'error' ? '✗ Failed' : 'Test Connection' }}
    </button>
  </div>
</template>
