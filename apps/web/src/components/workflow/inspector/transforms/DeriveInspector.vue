<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'
import { useBuilderStore } from '@/stores/builder'
import type { SchemaField } from '@/types'

interface Formula { outputField: string; expression: string }
type ErrorMode = 'fail' | 'warn' | 'quarantine' | 'skip'

const props = defineProps<{ data: BuilderNodeData; nodeId: string; upstreamSchema: SchemaField[] }>()
const store = useBuilderStore()
const tab = ref<'config' | 'output' | 'errors'>('config')

const formulas = ref<Formula[]>((props.data.config.formulas as Formula[] | undefined) ?? [])
const errorMode = ref<ErrorMode>((props.data.config.errorMode as ErrorMode | undefined) ?? 'fail')
const quarantineField = ref((props.data.config.quarantineField as string | undefined) ?? '_quarantine')

const computedOutputSchema = computed((): SchemaField[] => [
  ...props.upstreamSchema,
  ...formulas.value.filter(f => f.outputField).map(f => ({ name: f.outputField, type: 'unknown' as const })),
])

function addFormula() { formulas.value.push({ outputField: '', expression: '' }); save() }
function removeFormula(i: number) { formulas.value.splice(i, 1); save() }

function save() {
  store.updateNodeConfig(props.nodeId, {
    formulas: formulas.value,
    errorMode: errorMode.value,
    quarantineField: quarantineField.value,
    outputSchema: computedOutputSchema.value,
  })
}

watch(() => props.data, d => {
  formulas.value = (d.config.formulas as Formula[] | undefined) ?? []
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
        <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Derived Columns</p>
        <p class="text-xs text-muted-foreground">Available fields: <span class="font-mono">{{ upstreamSchema.map(f => f.name).join(', ') || 'none' }}</span></p>
        <div class="space-y-3">
          <div v-for="(f, i) in formulas" :key="i" class="rounded-md border bg-muted/20 p-2 space-y-1.5">
            <div class="flex items-center gap-1.5">
              <input v-model="f.outputField" placeholder="output field name" class="output-field-name flex-1 rounded-md border bg-background px-2 py-1 text-xs font-mono" @change="save" />
              <button class="text-muted-foreground/60 hover:text-red-400" @click="removeFormula(i)">×</button>
            </div>
            <textarea v-model="f.expression" placeholder="expression, e.g. record.price * record.qty" rows="2"
              class="w-full rounded-md border bg-background px-2 py-1 font-mono text-xs resize-none" @change="save" />
          </div>
          <button class="add-formula flex w-full items-center gap-1 rounded-md border border-dashed px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-orange-400 hover:text-orange-600" @click="addFormula">
            + Add formula
          </button>
        </div>
      </template>

      <template v-else-if="tab === 'output'">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Output fields</p>
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
