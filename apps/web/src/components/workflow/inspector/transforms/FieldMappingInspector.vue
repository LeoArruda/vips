<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'
import { useBuilderStore } from '@/stores/builder'
import type { SchemaField } from '@/types'

interface Mapping { sourceField: string; targetField: string }
type ErrorMode = 'fail' | 'warn' | 'quarantine' | 'skip'

const props = defineProps<{ data: BuilderNodeData; nodeId: string; upstreamSchema: SchemaField[] }>()
const store = useBuilderStore()
const tab = ref<'config' | 'output' | 'errors'>('config')

const mappings = ref<Mapping[]>((props.data.config.mappings as Mapping[] | undefined) ?? [])
const strictMode = ref(Boolean(props.data.config.strictMode))
const errorMode = ref<ErrorMode>((props.data.config.errorMode as ErrorMode | undefined) ?? 'fail')
const quarantineField = ref((props.data.config.quarantineField as string | undefined) ?? '_quarantine')

const computedOutputSchema = computed((): SchemaField[] => {
  if (strictMode.value) {
    return mappings.value.filter(m => m.targetField).map(m => ({ name: m.targetField, type: 'unknown' as const }))
  }
  const remapped = new Map(mappings.value.map(m => [m.sourceField, m.targetField]))
  const result: SchemaField[] = props.upstreamSchema.map(f => ({
    name: remapped.get(f.name) ?? f.name,
    type: f.type,
    nullable: f.nullable,
  }))
  mappings.value.forEach(m => {
    if (m.targetField && !props.upstreamSchema.some(f => f.name === m.sourceField))
      result.push({ name: m.targetField, type: 'unknown' })
  })
  return result
})

function addMapping() { mappings.value.push({ sourceField: '', targetField: '' }) }
function removeMapping(i: number) { mappings.value.splice(i, 1); save() }

function save() {
  store.updateNodeConfig(props.nodeId, {
    mappings: mappings.value,
    strictMode: strictMode.value,
    errorMode: errorMode.value,
    quarantineField: quarantineField.value,
    outputSchema: computedOutputSchema.value,
  })
}

watch(() => props.data, d => {
  mappings.value = (d.config.mappings as Mapping[] | undefined) ?? []
  strictMode.value = Boolean(d.config.strictMode)
  errorMode.value = (d.config.errorMode as ErrorMode | undefined) ?? 'fail'
  quarantineField.value = (d.config.quarantineField as string | undefined) ?? '_quarantine'
}, { deep: true })
</script>

<template>
  <div>
    <div class="flex border-b text-[11px] font-semibold">
      <button v-for="t in ['config', 'output', 'errors'] as const" :key="t"
        :data-tab="t"
        class="px-3 py-2 capitalize transition-colors"
        :class="tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'"
        @click="tab = t">{{ t }}</button>
    </div>
    <div class="space-y-4 p-4">
      <template v-if="tab === 'config'">
        <div>
          <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Field Mappings</p>
          <div class="space-y-2">
            <div v-for="(m, i) in mappings" :key="i" class="flex items-center gap-1.5">
              <select v-model="m.sourceField" class="source-field flex-1 rounded-md border bg-background px-2 py-1 text-xs" @change="save">
                <option value="">source field</option>
                <option v-for="f in upstreamSchema" :key="f.name" :value="f.name">{{ f.name }}</option>
              </select>
              <span class="text-xs text-muted-foreground">→</span>
              <input v-model="m.targetField" placeholder="target field" class="flex-1 rounded-md border bg-background px-2 py-1 text-xs" @change="save" />
              <button class="text-muted-foreground/60 hover:text-red-400" @click="removeMapping(i)">×</button>
            </div>
            <button class="add-mapping flex w-full items-center gap-1 rounded-md border border-dashed px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary" @click="addMapping">
              + Add mapping
            </button>
          </div>
        </div>
        <div class="flex items-center gap-2 border-t pt-3">
          <input id="strict" v-model="strictMode" type="checkbox" class="h-3.5 w-3.5" @change="save" />
          <label for="strict" class="text-xs">Strict mode — drop unmapped source fields</label>
        </div>
      </template>

      <template v-else-if="tab === 'output'">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Output fields</p>
        <div v-if="!computedOutputSchema.length" class="text-xs italic text-muted-foreground">Add mappings to preview output schema.</div>
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
