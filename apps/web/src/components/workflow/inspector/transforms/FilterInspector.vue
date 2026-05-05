<script setup lang="ts">
import { ref, watch } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'
import { useBuilderStore } from '@/stores/builder'
import type { SchemaField } from '@/types'

type Operator = '=' | '!=' | '>' | '>=' | '<' | '<=' | 'contains' | 'starts-with' | 'ends-with' | 'is-null' | 'is-not-null'
interface Condition { field: string; operator: Operator; value: string }
type ErrorMode = 'fail' | 'warn' | 'quarantine' | 'skip'

const OPERATORS: { value: Operator; label: string }[] = [
  { value: '=', label: '= equals' },
  { value: '!=', label: '≠ not equals' },
  { value: '>', label: '> greater than' },
  { value: '>=', label: '≥ greater or equal' },
  { value: '<', label: '< less than' },
  { value: '<=', label: '≤ less or equal' },
  { value: 'contains', label: 'contains' },
  { value: 'starts-with', label: 'starts with' },
  { value: 'ends-with', label: 'ends with' },
  { value: 'is-null', label: 'is null' },
  { value: 'is-not-null', label: 'is not null' },
]

const props = defineProps<{ data: BuilderNodeData; nodeId: string; upstreamSchema: SchemaField[] }>()
const store = useBuilderStore()
const tab = ref<'config' | 'output' | 'errors'>('config')

const conditions = ref<Condition[]>((props.data.config.conditions as Condition[] | undefined) ?? [])
const logic = ref<'AND' | 'OR'>((props.data.config.logic as 'AND' | 'OR' | undefined) ?? 'AND')
const errorMode = ref<ErrorMode>((props.data.config.errorMode as ErrorMode | undefined) ?? 'fail')
const quarantineField = ref((props.data.config.quarantineField as string | undefined) ?? '_quarantine')

const noValueOps = new Set<Operator>(['is-null', 'is-not-null'])

function addCondition() {
  conditions.value.push({ field: '', operator: '=', value: '' })
  save()
}
function removeCondition(i: number) { conditions.value.splice(i, 1); save() }

function save() {
  store.updateNodeConfig(props.nodeId, {
    conditions: conditions.value,
    logic: logic.value,
    errorMode: errorMode.value,
    quarantineField: quarantineField.value,
    outputSchema: props.upstreamSchema,
  })
}

watch(() => props.data, d => {
  conditions.value = (d.config.conditions as Condition[] | undefined) ?? []
  logic.value = (d.config.logic as 'AND' | 'OR' | undefined) ?? 'AND'
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
        <div class="flex items-center gap-2">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Match</p>
          <select v-model="logic" class="logic-select rounded-md border bg-background px-2 py-1 text-xs" @change="save">
            <option value="AND">ALL conditions (AND)</option>
            <option value="OR">ANY condition (OR)</option>
          </select>
        </div>
        <div class="space-y-2">
          <div v-for="(c, i) in conditions" :key="i" class="space-y-1 rounded-md border bg-muted/20 p-2">
            <div class="flex items-center gap-1.5">
              <select v-model="c.field" class="flex-1 rounded-md border bg-background px-2 py-1 text-xs" @change="save">
                <option value="">field</option>
                <option v-for="f in upstreamSchema" :key="f.name" :value="f.name">{{ f.name }}</option>
              </select>
              <button class="text-muted-foreground/60 hover:text-red-400 text-sm" @click="removeCondition(i)">×</button>
            </div>
            <select v-model="c.operator" class="w-full rounded-md border bg-background px-2 py-1 text-xs" @change="save">
              <option v-for="op in OPERATORS" :key="op.value" :value="op.value">{{ op.label }}</option>
            </select>
            <input v-if="!noValueOps.has(c.operator)" v-model="c.value" placeholder="value" class="w-full rounded-md border bg-background px-2 py-1 text-xs" @change="save" />
          </div>
          <button class="add-condition flex w-full items-center gap-1 rounded-md border border-dashed px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-red-400 hover:text-red-500" @click="addCondition">
            + Add condition
          </button>
        </div>
      </template>

      <template v-else-if="tab === 'output'">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Output fields (same as input)</p>
        <div v-if="!upstreamSchema.length" class="text-xs italic text-muted-foreground">Connect an upstream node to see schema.</div>
        <div v-for="f in upstreamSchema" :key="f.name" class="flex items-center justify-between rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs">
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
