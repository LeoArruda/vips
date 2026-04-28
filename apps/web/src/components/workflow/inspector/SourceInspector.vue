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
const outputs = ref<number>((props.data.config.outputs as number | undefined) ?? 1)

const MAX_OUTPUTS = 5
const nodeId = computed(() => store.selectedNode?.id ?? '')

function save() {
  if (!nodeId.value) return
  const base: Record<string, unknown> = {
    connectorType: connectorType.value,
    outputs: outputs.value,
  }
  if (connectorType.value === 'http-rest') {
    Object.assign(base, { method: method.value, url: url.value })
  } else if (connectorType.value === 'postgres') {
    Object.assign(base, { query: pgQuery.value })
  } else if (connectorType.value === 'statcan') {
    Object.assign(base, { table_code: tableCode.value })
  }
  store.updateNodeConfig(nodeId.value, base)
}

function addOutput() {
  if (outputs.value < MAX_OUTPUTS) {
    outputs.value++
    save()
  }
}

function removeOutput() {
  if (outputs.value > 1) {
    outputs.value--
    save()
  }
}

watch(() => props.data, (d) => {
  connectorType.value = (d.config.connectorType as ConnectorType) ?? ''
  method.value = (d.config.method as string) ?? 'GET'
  url.value = (d.config.url as string) ?? ''
  pgQuery.value = (d.config.query as string) ?? ''
  tableCode.value = (d.config.table_code as string) ?? ''
  outputs.value = (d.config.outputs as number | undefined) ?? 1
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

    <!-- Outputs section -->
    <div class="border-t pt-4">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outputs</p>
      <div class="space-y-1">
        <!-- Output 1 — always present, not removable -->
        <div class="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5">
          <div class="h-2 w-2 flex-shrink-0 rounded-full border-2 border-blue-400 bg-white" />
          <span class="flex-1 text-xs font-medium text-foreground">Output 1</span>
          <span class="text-[10px] text-muted-foreground">default</span>
        </div>

        <!-- Additional outputs -->
        <div
          v-for="i in outputs - 1"
          :key="i"
          class="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5"
        >
          <div class="h-2 w-2 flex-shrink-0 rounded-full border-2 border-blue-400 bg-white" />
          <span class="flex-1 text-xs font-medium text-foreground">Output {{ i + 1 }}</span>
          <button
            class="text-muted-foreground/60 hover:text-red-400"
            :aria-label="`Remove output ${i + 1}`"
            @click="removeOutput"
          >×</button>
        </div>

        <!-- Add button -->
        <button
          v-if="outputs < MAX_OUTPUTS"
          class="flex w-full items-center gap-1.5 rounded-md border border-dashed px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
          @click="addOutput"
        >
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add destination
        </button>
      </div>
    </div>
  </div>
</template>
