<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'
import { useBuilderStore } from '@/stores/builder'
import type { SchemaField } from '@/types'

interface EnrichField { sourceField: string; targetField: string }
type ErrorMode = 'fail' | 'warn' | 'quarantine' | 'skip'

const props = defineProps<{ data: BuilderNodeData; nodeId: string; upstreamSchema: SchemaField[] }>()
const store = useBuilderStore()
const tab = ref<'config' | 'output' | 'errors'>('config')

const lookupKey = ref((props.data.config.lookupKey as string | undefined) ?? '')
const inlineData = ref((props.data.config.inlineData as string | undefined) ?? '')
const enrichFields = ref<EnrichField[]>((props.data.config.enrichFields as EnrichField[] | undefined) ?? [])
const errorMode = ref<ErrorMode>((props.data.config.errorMode as ErrorMode | undefined) ?? 'fail')
const quarantineField = ref((props.data.config.quarantineField as string | undefined) ?? '_quarantine')

const computedOutputSchema = computed((): SchemaField[] => [
  ...props.upstreamSchema,
  ...enrichFields.value.filter(e => e.targetField).map(e => ({ name: e.targetField, type: 'unknown' as const })),
])

function addEnrichField() { enrichFields.value.push({ sourceField: '', targetField: '' }); save() }
function removeEnrichField(i: number) { enrichFields.value.splice(i, 1); save() }

function save() {
  store.updateNodeConfig(props.nodeId, {
    lookupKey: lookupKey.value,
    inlineData: inlineData.value,
    enrichFields: enrichFields.value,
    errorMode: errorMode.value,
    quarantineField: quarantineField.value,
    outputSchema: computedOutputSchema.value,
  })
}

watch(() => props.data, d => {
  lookupKey.value = (d.config.lookupKey as string | undefined) ?? ''
  inlineData.value = (d.config.inlineData as string | undefined) ?? ''
  enrichFields.value = (d.config.enrichFields as EnrichField[] | undefined) ?? []
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
          <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Match key (source)</p>
          <select v-model="lookupKey" class="lookup-key-select w-full rounded-md border bg-background px-3 py-1.5 text-sm" @change="save">
            <option value="">— select field —</option>
            <option v-for="f in upstreamSchema" :key="f.name" :value="f.name">{{ f.name }} ({{ f.type }})</option>
          </select>
        </div>
        <div>
          <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reference data (JSON)</p>
          <p class="mb-1 text-xs text-muted-foreground">Paste a JSON array of reference objects.</p>
          <textarea v-model="inlineData" rows="4" placeholder='[{"code":"CA","name":"Canada"},...]'
            class="w-full rounded-md border bg-background px-3 py-1.5 font-mono text-xs resize-y" @change="save" />
        </div>
        <div>
          <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Enrich fields (reference → output)</p>
          <div class="space-y-1.5">
            <div v-for="(e, i) in enrichFields" :key="i" class="flex items-center gap-1.5">
              <input v-model="e.sourceField" placeholder="ref field" class="flex-1 rounded-md border bg-background px-2 py-1 text-xs" @change="save" />
              <span class="text-xs text-muted-foreground">→</span>
              <input v-model="e.targetField" placeholder="output field" class="flex-1 rounded-md border bg-background px-2 py-1 text-xs" @change="save" />
              <button class="text-muted-foreground/60 hover:text-red-400" @click="removeEnrichField(i)">×</button>
            </div>
            <button class="add-enrich flex w-full items-center gap-1 rounded-md border border-dashed px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-indigo-400 hover:text-indigo-600" @click="addEnrichField">
              + Add enrich field
            </button>
          </div>
        </div>
      </template>

      <template v-else-if="tab === 'output'">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Output fields</p>
        <div v-if="!computedOutputSchema.length" class="text-xs italic text-muted-foreground">Configure enrich fields to preview output schema.</div>
        <div v-for="f in computedOutputSchema" :key="f.name" class="flex items-center justify-between rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs">
          <span class="font-medium">{{ f.name }}</span><span class="text-muted-foreground">{{ f.type }}</span>
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
