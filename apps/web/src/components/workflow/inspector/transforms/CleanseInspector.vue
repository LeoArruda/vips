<script setup lang="ts">
import { ref, watch } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'
import { useBuilderStore } from '@/stores/builder'
import type { SchemaField } from '@/types'

type Operation = 'trim' | 'lowercase' | 'uppercase' | 'replace-null' | 'replace'
interface CleanseOp { field: string; operation: Operation; params: string }
type ErrorMode = 'fail' | 'warn' | 'quarantine' | 'skip'

const PARAM_PLACEHOLDERS: Partial<Record<Operation, string>> = {
  'replace-null': 'replacement value',
  'replace': 'find::replace (e.g. foo::bar)',
}

const props = defineProps<{ data: BuilderNodeData; nodeId: string; upstreamSchema: SchemaField[] }>()
const store = useBuilderStore()
const tab = ref<'config' | 'output' | 'errors'>('config')

const operations = ref<CleanseOp[]>((props.data.config.operations as CleanseOp[] | undefined) ?? [])
const errorMode = ref<ErrorMode>((props.data.config.errorMode as ErrorMode | undefined) ?? 'fail')
const quarantineField = ref((props.data.config.quarantineField as string | undefined) ?? '_quarantine')

function addOperation() { operations.value.push({ field: '', operation: 'trim', params: '' }); save() }
function removeOperation(i: number) { operations.value.splice(i, 1); save() }

function save() {
  store.updateNodeConfig(props.nodeId, {
    operations: operations.value,
    errorMode: errorMode.value,
    quarantineField: quarantineField.value,
    outputSchema: props.upstreamSchema,
  })
}

watch(() => props.data, d => {
  operations.value = (d.config.operations as CleanseOp[] | undefined) ?? []
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
        <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cleanse Operations</p>
        <div class="space-y-2">
          <div v-for="(op, i) in operations" :key="i" class="rounded-md border bg-muted/20 p-2 space-y-1.5">
            <div class="flex items-center gap-1.5">
              <select v-model="op.field" class="flex-1 rounded-md border bg-background px-2 py-1 text-xs" @change="save">
                <option value="">field</option>
                <option v-for="f in upstreamSchema" :key="f.name" :value="f.name">{{ f.name }}</option>
              </select>
              <button class="text-muted-foreground/60 hover:text-red-400" @click="removeOperation(i)">×</button>
            </div>
            <select v-model="op.operation" class="operation-select w-full rounded-md border bg-background px-2 py-1 text-xs" @change="save">
              <option value="trim">trim — remove leading/trailing whitespace</option>
              <option value="lowercase">lowercase</option>
              <option value="uppercase">uppercase</option>
              <option value="replace-null">replace-null — substitute null with value</option>
              <option value="replace">replace — find and replace string</option>
            </select>
            <input v-if="PARAM_PLACEHOLDERS[op.operation]" v-model="op.params"
              :placeholder="PARAM_PLACEHOLDERS[op.operation]"
              class="w-full rounded-md border bg-background px-2 py-1 text-xs" @change="save" />
          </div>
          <button class="add-operation flex w-full items-center gap-1 rounded-md border border-dashed px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-pink-400 hover:text-pink-600" @click="addOperation">
            + Add operation
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
