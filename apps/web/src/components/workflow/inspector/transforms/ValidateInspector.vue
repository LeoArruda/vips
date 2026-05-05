<script setup lang="ts">
import { ref, watch } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'
import { useBuilderStore } from '@/stores/builder'
import type { SchemaField } from '@/types'

type RuleType = 'required' | 'not-null' | 'min-length' | 'max-length' | 'regex' | 'min-value' | 'max-value'
type RuleErrorMode = 'fail' | 'warn' | 'quarantine' | 'skip'
interface ValidationRule { field: string; rule: RuleType; params: string; errorMode: RuleErrorMode }
type ErrorMode = 'fail' | 'warn' | 'quarantine' | 'skip'

const PARAM_RULES = new Set<RuleType>(['min-length', 'max-length', 'regex', 'min-value', 'max-value'])
const PARAM_PLACEHOLDERS: Partial<Record<RuleType, string>> = {
  'min-length': 'min chars (e.g. 3)',
  'max-length': 'max chars (e.g. 255)',
  'regex': 'pattern (e.g. ^\\d+$)',
  'min-value': 'min value (e.g. 0)',
  'max-value': 'max value (e.g. 100)',
}

const props = defineProps<{ data: BuilderNodeData; nodeId: string; upstreamSchema: SchemaField[] }>()
const store = useBuilderStore()
const tab = ref<'config' | 'output' | 'errors'>('config')

const rules = ref<ValidationRule[]>((props.data.config.rules as ValidationRule[] | undefined) ?? [])
const errorMode = ref<ErrorMode>((props.data.config.errorMode as ErrorMode | undefined) ?? 'fail')
const quarantineField = ref((props.data.config.quarantineField as string | undefined) ?? '_quarantine')

function addRule() { rules.value.push({ field: '', rule: 'required', params: '', errorMode: 'fail' }); save() }
function removeRule(i: number) { rules.value.splice(i, 1); save() }

function save() {
  store.updateNodeConfig(props.nodeId, {
    rules: rules.value,
    errorMode: errorMode.value,
    quarantineField: quarantineField.value,
    outputSchema: props.upstreamSchema,
  })
}

watch(() => props.data, d => {
  rules.value = (d.config.rules as ValidationRule[] | undefined) ?? []
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
        <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Validation Rules</p>
        <div class="space-y-2">
          <div v-for="(r, i) in rules" :key="i" class="rounded-md border bg-muted/20 p-2 space-y-1.5">
            <div class="flex items-center gap-1.5">
              <select v-model="r.field" class="flex-1 rounded-md border bg-background px-2 py-1 text-xs" @change="save">
                <option value="">field</option>
                <option v-for="f in upstreamSchema" :key="f.name" :value="f.name">{{ f.name }}</option>
              </select>
              <button class="text-muted-foreground/60 hover:text-red-400" @click="removeRule(i)">×</button>
            </div>
            <select v-model="r.rule" class="w-full rounded-md border bg-background px-2 py-1 text-xs" @change="save">
              <option value="required">required — field must be present</option>
              <option value="not-null">not-null — value must not be null</option>
              <option value="min-length">min-length</option>
              <option value="max-length">max-length</option>
              <option value="regex">regex — matches pattern</option>
              <option value="min-value">min-value — numeric minimum</option>
              <option value="max-value">max-value — numeric maximum</option>
            </select>
            <input v-if="PARAM_RULES.has(r.rule)" v-model="r.params" :placeholder="PARAM_PLACEHOLDERS[r.rule]"
              class="w-full rounded-md border bg-background px-2 py-1 text-xs" @change="save" />
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] text-muted-foreground">On fail:</span>
              <select v-model="r.errorMode" class="flex-1 rounded-md border bg-background px-2 py-0.5 text-[10px]" @change="save">
                <option value="fail">stop</option>
                <option value="warn">warn</option>
                <option value="quarantine">quarantine</option>
                <option value="skip">skip</option>
              </select>
            </div>
          </div>
          <button class="add-rule flex w-full items-center gap-1 rounded-md border border-dashed px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-lime-500 hover:text-lime-600" @click="addRule">
            + Add rule
          </button>
        </div>
      </template>

      <template v-else-if="tab === 'output'">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Output fields (same as input)</p>
        <div v-if="!upstreamSchema.length" class="text-xs italic text-muted-foreground">Connect an upstream node to preview schema.</div>
        <div v-for="f in upstreamSchema" :key="f.name" class="flex items-center justify-between rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs">
          <span class="font-medium">{{ f.name }}</span><span class="text-muted-foreground">{{ f.type }}</span>
        </div>
      </template>

      <template v-else>
        <div>
          <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Default on error</p>
          <p class="mb-2 text-xs text-muted-foreground">Per-rule error modes above override this default.</p>
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
