<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'
import { useBuilderStore } from '@/stores/builder'

const props = defineProps<{ data: BuilderNodeData }>()
const store = useBuilderStore()

type ConnectorType = 'http-rest' | 'postgres' | 'statcan' | ''

const connectorType = ref<ConnectorType>((props.data.config.connectorType as ConnectorType) ?? '')
const method = ref((props.data.config.method as string) ?? 'GET')
const url = ref((props.data.config.url as string) ?? '')
const pgQuery = ref((props.data.config.query as string) ?? '')
const tableCode = ref((props.data.config.table_code as string) ?? '')

const nodeId = computed(() => store.selectedNode?.id ?? '')

function save() {
  if (!nodeId.value) return
  const base: Record<string, unknown> = { connectorType: connectorType.value }
  if (connectorType.value === 'http-rest') {
    Object.assign(base, { method: method.value, url: url.value })
  } else if (connectorType.value === 'postgres') {
    Object.assign(base, { query: pgQuery.value })
  } else if (connectorType.value === 'statcan') {
    Object.assign(base, { table_code: tableCode.value })
  }
  store.updateNodeConfig(nodeId.value, base)
}

watch(() => props.data, (d) => {
  connectorType.value = (d.config.connectorType as ConnectorType) ?? ''
  method.value = (d.config.method as string) ?? 'GET'
  url.value = (d.config.url as string) ?? ''
  pgQuery.value = (d.config.query as string) ?? ''
  tableCode.value = (d.config.table_code as string) ?? ''
}, { deep: true })
</script>

<template>
  <div class="space-y-4 p-4">
    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connector Type</p>
      <select
        v-model="connectorType"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        @change="save"
      >
        <option value="">— select a connector —</option>
        <option value="http-rest">HTTP / REST</option>
        <option value="postgres">Postgres</option>
        <option value="statcan">Statistics Canada (StatCan)</option>
      </select>
    </div>

    <template v-if="connectorType === 'http-rest'">
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Method</p>
        <select
          v-model="method"
          class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          @change="save"
        >
          <option v-for="m in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']" :key="m">{{ m }}</option>
        </select>
      </div>
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">URL</p>
        <input
          v-model="url"
          placeholder="https://api.example.com/data"
          class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          @input="save"
        />
      </div>
    </template>

    <template v-else-if="connectorType === 'postgres'">
      <div class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Connection string is injected via the <code class="font-mono">POSTGRES_CONNECTION_STRING</code> env var in the runtime worker.
      </div>
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">SQL Query</p>
        <textarea
          v-model="pgQuery"
          placeholder="SELECT * FROM public.workflows LIMIT 10"
          rows="4"
          class="w-full rounded-md border bg-background px-3 py-1.5 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
          @input="save"
        />
      </div>
    </template>

    <template v-else-if="connectorType === 'statcan'">
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Table Code</p>
        <input
          v-model="tableCode"
          placeholder="14-10-0287-01"
          class="w-full rounded-md border bg-background px-3 py-1.5 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
          @input="save"
        />
        <p class="mt-1 text-xs text-muted-foreground">StatCan WDS table ID — e.g. Labour Force Survey: 14-10-0287-01</p>
      </div>
    </template>

    <div v-else class="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
      Select a connector type above to configure this node.
    </div>

    <div v-if="connectorType" class="rounded-md bg-muted px-3 py-2">
      <p class="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Saved config</p>
      <pre class="overflow-x-auto text-xs">{{ JSON.stringify(data.config, null, 2) }}</pre>
    </div>
  </div>
</template>
