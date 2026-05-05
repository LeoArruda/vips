<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'
import { useBuilderStore } from '@/stores/builder'
import type { SchemaField } from '@/types'

type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'unknown'
type ErrorMode = 'fail' | 'warn' | 'quarantine' | 'skip'

const props = defineProps<{ data: BuilderNodeData; nodeId: string; upstreamSchema: SchemaField[] }>()
const store = useBuilderStore()
const tab = ref<'config' | 'output' | 'errors'>('config')

const code = ref((props.data.config.code as string | undefined) ?? '')
const timeoutSeconds = ref((props.data.config.timeoutSeconds as number | undefined) ?? 30)
const declaredOutputSchema = ref<SchemaField[]>((props.data.config.declaredOutputSchema as SchemaField[] | undefined) ?? [])
const errorMode = ref<ErrorMode>((props.data.config.errorMode as ErrorMode | undefined) ?? 'fail')
const quarantineField = ref((props.data.config.quarantineField as string | undefined) ?? '_quarantine')

const FIELD_TYPES: FieldType[] = ['string', 'number', 'boolean', 'date', 'object', 'array', 'unknown']

const computedOutputSchema = computed(() => declaredOutputSchema.value)

function addOutputField() { declaredOutputSchema.value.push({ name: '', type: 'unknown' }); save() }
function removeOutputField(i: number) { declaredOutputSchema.value.splice(i, 1); save() }

function save() {
  store.updateNodeConfig(props.nodeId, {
    code: code.value,
    timeoutSeconds: Number(timeoutSeconds.value),
    declaredOutputSchema: declaredOutputSchema.value,
    errorMode: errorMode.value,
    quarantineField: quarantineField.value,
    outputSchema: computedOutputSchema.value,
  })
}

watch(() => props.data, d => {
  code.value = (d.config.code as string | undefined) ?? ''
  timeoutSeconds.value = (d.config.timeoutSeconds as number | undefined) ?? 30
  declaredOutputSchema.value = (d.config.declaredOutputSchema as SchemaField[] | undefined) ?? []
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
          <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">JavaScript</p>
          <p class="mb-1.5 text-xs text-muted-foreground">Receives <span class="font-mono">records</span> (array). Must return an array.</p>
          <textarea v-model="code" rows="10" spellcheck="false"
            class="code-editor w-full rounded-md border bg-slate-950 px-3 py-2 font-mono text-xs text-slate-100 resize-y"
            placeholder="// Example&#10;return records.map(r => ({&#10;  ...r,&#10;  fullName: r.first + ' ' + r.last,&#10;}))"
            @change="save" />
        </div>
        <div class="flex items-center gap-3">
          <label class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeout (s)</label>
          <input v-model.number="timeoutSeconds" type="number" min="1" max="300"
            class="timeout-input w-20 rounded-md border bg-background px-2 py-1 text-xs" @change="save" />
        </div>
      </template>

      <template v-else-if="tab === 'output'">
        <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Declared output fields</p>
        <p class="mb-2 text-xs text-muted-foreground">Code output is opaque — declare fields manually so downstream nodes can reference them.</p>
        <div class="space-y-1.5">
          <div v-for="(f, i) in declaredOutputSchema" :key="i" class="flex items-center gap-1.5">
            <input v-model="f.name" placeholder="field name" class="flex-1 rounded-md border bg-background px-2 py-1 text-xs font-mono" @change="save" />
            <select v-model="f.type" class="rounded-md border bg-background px-2 py-1 text-xs" @change="save">
              <option v-for="t in FIELD_TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
            <button class="text-muted-foreground/60 hover:text-red-400" @click="removeOutputField(i)">×</button>
          </div>
          <button class="add-output-field flex w-full items-center gap-1 rounded-md border border-dashed px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-slate-400 hover:text-slate-600" @click="addOutputField">
            + Declare output field
          </button>
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
