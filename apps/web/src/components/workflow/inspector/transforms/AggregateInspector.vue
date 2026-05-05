<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'
import { useBuilderStore } from '@/stores/builder'
import type { SchemaField } from '@/types'

type AggFn = 'count' | 'sum' | 'avg' | 'min' | 'max'
interface Aggregation { field: string; function: AggFn; alias: string }
type ErrorMode = 'fail' | 'warn' | 'quarantine' | 'skip'

const props = defineProps<{ data: BuilderNodeData; nodeId: string; upstreamSchema: SchemaField[] }>()
const store = useBuilderStore()
const tab = ref<'config' | 'output' | 'errors'>('config')

const groupBy = ref<string[]>((props.data.config.groupBy as string[] | undefined) ?? [])
const aggregations = ref<Aggregation[]>((props.data.config.aggregations as Aggregation[] | undefined) ?? [])
const pendingGroupBy = ref('')
const errorMode = ref<ErrorMode>((props.data.config.errorMode as ErrorMode | undefined) ?? 'fail')
const quarantineField = ref((props.data.config.quarantineField as string | undefined) ?? '_quarantine')

const computedOutputSchema = computed((): SchemaField[] => {
  const groupFields = groupBy.value
    .map(name => props.upstreamSchema.find(f => f.name === name) ?? { name, type: 'unknown' as const })
  const aggFields = aggregations.value
    .filter(a => a.alias)
    .map(a => ({ name: a.alias, type: 'number' as const }))
  return [...groupFields, ...aggFields]
})

function addGroupBy() {
  if (pendingGroupBy.value && !groupBy.value.includes(pendingGroupBy.value)) {
    groupBy.value.push(pendingGroupBy.value)
    pendingGroupBy.value = ''
    save()
  }
}
function removeGroupBy(field: string) { groupBy.value = groupBy.value.filter(f => f !== field); save() }
function addAggregation() { aggregations.value.push({ field: '', function: 'count', alias: '' }); save() }
function removeAggregation(i: number) { aggregations.value.splice(i, 1); save() }

function save() {
  store.updateNodeConfig(props.nodeId, {
    groupBy: groupBy.value,
    aggregations: aggregations.value,
    errorMode: errorMode.value,
    quarantineField: quarantineField.value,
    outputSchema: computedOutputSchema.value,
  })
}

watch(() => props.data, d => {
  groupBy.value = (d.config.groupBy as string[] | undefined) ?? []
  aggregations.value = (d.config.aggregations as Aggregation[] | undefined) ?? []
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
          <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Group by</p>
          <div class="mb-2 flex flex-wrap gap-1">
            <span v-for="f in groupBy" :key="f" class="flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {{ f }}
              <button class="hover:text-red-400" @click="removeGroupBy(f)">×</button>
            </span>
          </div>
          <div class="flex gap-1.5">
            <select v-model="pendingGroupBy" class="groupby-select flex-1 rounded-md border bg-background px-2 py-1 text-xs">
              <option value="">add field…</option>
              <option v-for="f in upstreamSchema.filter(f => !groupBy.includes(f.name))" :key="f.name" :value="f.name">{{ f.name }}</option>
            </select>
            <button class="add-groupby rounded-md border px-2 py-1 text-xs hover:bg-muted" @click="addGroupBy">Add</button>
          </div>
        </div>
        <div>
          <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aggregations</p>
          <div class="space-y-2">
            <div v-for="(a, i) in aggregations" :key="i" class="rounded-md border bg-muted/20 p-2 space-y-1.5">
              <div class="flex gap-1.5">
                <select v-model="a.function" class="rounded-md border bg-background px-2 py-1 text-xs" @change="save">
                  <option v-for="fn in ['count','sum','avg','min','max']" :key="fn" :value="fn">{{ fn }}</option>
                </select>
                <select v-model="a.field" class="flex-1 rounded-md border bg-background px-2 py-1 text-xs" @change="save">
                  <option value="">field</option>
                  <option v-for="f in upstreamSchema" :key="f.name" :value="f.name">{{ f.name }}</option>
                </select>
                <button class="text-muted-foreground/60 hover:text-red-400" @click="removeAggregation(i)">×</button>
              </div>
              <input v-model="a.alias" placeholder="output alias" class="w-full rounded-md border bg-background px-2 py-1 text-xs" @change="save" />
            </div>
            <button class="add-aggregation flex w-full items-center gap-1 rounded-md border border-dashed px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-cyan-400 hover:text-cyan-600" @click="addAggregation">
              + Add aggregation
            </button>
          </div>
        </div>
      </template>

      <template v-else-if="tab === 'output'">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Output fields</p>
        <div v-if="!computedOutputSchema.length" class="text-xs italic text-muted-foreground">Add group-by fields and aggregations above.</div>
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
