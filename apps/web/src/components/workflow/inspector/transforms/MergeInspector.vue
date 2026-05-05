<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'
import { useBuilderStore } from '@/stores/builder'
import type { SchemaField } from '@/types'

type Strategy = 'upsert' | 'insert-only' | 'update-only'
type ErrorMode = 'fail' | 'warn' | 'quarantine' | 'skip'

const props = defineProps<{ data: BuilderNodeData; nodeId: string; upstreamSchema: SchemaField[] }>()
const store = useBuilderStore()
const tab = ref<'config' | 'output' | 'errors'>('config')

const matchKey = ref((props.data.config.matchKey as string | undefined) ?? '')
const strategy = ref<Strategy>((props.data.config.strategy as Strategy | undefined) ?? 'upsert')
const errorMode = ref<ErrorMode>((props.data.config.errorMode as ErrorMode | undefined) ?? 'fail')
const quarantineField = ref((props.data.config.quarantineField as string | undefined) ?? '_quarantine')

const computedOutputSchema = computed((): SchemaField[] => [
  ...props.upstreamSchema,
  { name: '_op', type: 'string' },
])

function save() {
  store.updateNodeConfig(props.nodeId, {
    matchKey: matchKey.value,
    strategy: strategy.value,
    errorMode: errorMode.value,
    quarantineField: quarantineField.value,
    outputSchema: computedOutputSchema.value,
  })
}

watch(() => props.data, d => {
  matchKey.value = (d.config.matchKey as string | undefined) ?? ''
  strategy.value = (d.config.strategy as Strategy | undefined) ?? 'upsert'
  errorMode.value = (d.config.errorMode as ErrorMode | undefined) ?? 'fail'
  quarantineField.value = (d.config.quarantineField as string | undefined) ?? '_quarantine'
}, { deep: true })
</script>

<template>
  <div>
    <div class="flex border-b text-[11px] font-semibold">
      <button v-for="t in ['config', 'output', 'errors'] as const" :key="t" :data-tab="t"
        class="px-3 py-2 capitalize transition-colors"
        :class="tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'"
        @click="tab = t">{{ t }}</button>
    </div>
    <div class="space-y-4 p-4">
      <template v-if="tab === 'config'">
        <div>
          <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Match key</p>
          <select v-model="matchKey" class="match-key-select w-full rounded-md border bg-background px-3 py-1.5 text-sm" @change="save">
            <option value="">— select field —</option>
            <option v-for="f in upstreamSchema" :key="f.name" :value="f.name">{{ f.name }} ({{ f.type }})</option>
          </select>
        </div>
        <div>
          <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Strategy</p>
          <select v-model="strategy" class="strategy-select w-full rounded-md border bg-background px-3 py-1.5 text-sm" @change="save">
            <option value="upsert">Upsert — insert or update</option>
            <option value="insert-only">Insert only — skip existing</option>
            <option value="update-only">Update only — skip new</option>
          </select>
        </div>
      </template>

      <template v-else-if="tab === 'output'">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Output fields</p>
        <div v-for="f in computedOutputSchema" :key="f.name" class="flex items-center justify-between rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs">
          <span class="font-medium">{{ f.name }}</span>
          <span class="text-muted-foreground">{{ f.name === '_op' ? 'insert | update | delete' : f.type }}</span>
        </div>
      </template>

      <template v-else>
        <div>
          <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">On error</p>
          <select v-model="errorMode" class="error-mode w-full rounded-md border bg-background px-3 py-1.5 text-sm" @change="save">
            <option value="fail">Fail — stop execution</option>
            <option value="warn">Warn — log and continue</option>
            <option value="quarantine">Quarantine — route to field</option>
            <option value="skip">Skip — drop the record</option>
          </select>
        </div>
        <div v-if="errorMode === 'quarantine'" class="mt-3">
          <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quarantine field</p>
          <input v-model="quarantineField" class="w-full rounded-md border bg-background px-3 py-1.5 text-sm" @change="save" />
        </div>
      </template>
    </div>
  </div>
</template>
