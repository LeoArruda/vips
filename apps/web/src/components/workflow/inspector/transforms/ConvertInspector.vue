<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'
import { useBuilderStore } from '@/stores/builder'
import type { SchemaField } from '@/types'

type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'unknown'
interface Conversion { field: string; targetType: FieldType; format: string }
type ErrorMode = 'fail' | 'warn' | 'quarantine' | 'skip'

const props = defineProps<{ data: BuilderNodeData; nodeId: string; upstreamSchema: SchemaField[] }>()
const store = useBuilderStore()
const tab = ref<'config' | 'output' | 'errors'>('config')

const conversions = ref<Conversion[]>((props.data.config.conversions as Conversion[] | undefined) ?? [])
const errorMode = ref<ErrorMode>((props.data.config.errorMode as ErrorMode | undefined) ?? 'fail')
const quarantineField = ref((props.data.config.quarantineField as string | undefined) ?? '_quarantine')

const computedOutputSchema = computed((): SchemaField[] => {
  const overrides = new Map(conversions.value.map(c => [c.field, c.targetType]))
  return props.upstreamSchema.map(f => ({ ...f, type: overrides.get(f.name) ?? f.type }))
})

function addConversion() {
  conversions.value.push({ field: '', targetType: 'string', format: '' })
  save()
}
function removeConversion(i: number) { conversions.value.splice(i, 1); save() }

function save() {
  store.updateNodeConfig(props.nodeId, {
    conversions: conversions.value,
    errorMode: errorMode.value,
    quarantineField: quarantineField.value,
    outputSchema: computedOutputSchema.value,
  })
}

watch(() => props.data, d => {
  conversions.value = (d.config.conversions as Conversion[] | undefined) ?? []
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
    <div class="space-y-3 p-4">
      <template v-if="tab === 'config'">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type Conversions</p>
        <div class="space-y-2">
          <div v-for="(c, i) in conversions" :key="i" class="rounded-md border bg-muted/20 p-2 space-y-1.5">
            <div class="flex items-center gap-1.5">
              <select v-model="c.field" class="flex-1 rounded-md border bg-background px-2 py-1 text-xs" @change="save">
                <option value="">field</option>
                <option v-for="f in upstreamSchema" :key="f.name" :value="f.name">{{ f.name }}</option>
              </select>
              <button class="text-muted-foreground/60 hover:text-red-400" @click="removeConversion(i)">×</button>
            </div>
            <select v-model="c.targetType" class="w-full rounded-md border bg-background px-2 py-1 text-xs" @change="save">
              <option v-for="t in ['string','number','boolean','date','object','array']" :key="t" :value="t">→ {{ t }}</option>
            </select>
            <input v-if="c.targetType === 'date'" v-model="c.format" placeholder="format (e.g. YYYY-MM-DD)" class="w-full rounded-md border bg-background px-2 py-1 text-xs" @change="save" />
          </div>
          <button class="add-conversion flex w-full items-center gap-1 rounded-md border border-dashed px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-green-400 hover:text-green-600" @click="addConversion">
            + Add conversion
          </button>
        </div>
      </template>

      <template v-else-if="tab === 'output'">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Output fields</p>
        <div v-if="!computedOutputSchema.length" class="text-xs italic text-muted-foreground">Connect an upstream node to preview schema.</div>
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
