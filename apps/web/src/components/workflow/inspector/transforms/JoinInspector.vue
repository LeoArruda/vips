<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'
import { useBuilderStore } from '@/stores/builder'
import type { SchemaField } from '@/types'

type JoinType = 'inner' | 'left' | 'right' | 'full'
type ErrorMode = 'fail' | 'warn' | 'quarantine' | 'skip'

const props = defineProps<{ data: BuilderNodeData; nodeId: string; upstreamSchema: SchemaField[] }>()
const store = useBuilderStore()
const tab = ref<'config' | 'output' | 'errors'>('config')

const joinType = ref<JoinType>((props.data.config.joinType as JoinType | undefined) ?? 'inner')
const leftKey = ref((props.data.config.leftKey as string | undefined) ?? '')
const rightKey = ref((props.data.config.rightKey as string | undefined) ?? '')
const errorMode = ref<ErrorMode>((props.data.config.errorMode as ErrorMode | undefined) ?? 'fail')
const quarantineField = ref((props.data.config.quarantineField as string | undefined) ?? '_quarantine')

const byHandle = computed(() => store.getUpstreamSchemaPerHandle(props.nodeId))
const leftSchema = computed((): SchemaField[] => byHandle.value['input-left'] ?? Object.values(byHandle.value)[0] ?? [])
const rightSchema = computed((): SchemaField[] => byHandle.value['input-right'] ?? Object.values(byHandle.value)[1] ?? [])

const computedOutputSchema = computed((): SchemaField[] => {
  const seen = new Set<string>()
  const result: SchemaField[] = []
  for (const f of [...leftSchema.value, ...rightSchema.value]) {
    if (!seen.has(f.name)) { seen.add(f.name); result.push(f) }
  }
  return result
})

function save() {
  store.updateNodeConfig(props.nodeId, {
    joinType: joinType.value,
    leftKey: leftKey.value,
    rightKey: rightKey.value,
    errorMode: errorMode.value,
    quarantineField: quarantineField.value,
    outputSchema: computedOutputSchema.value,
  })
}

watch(() => props.data, d => {
  joinType.value = (d.config.joinType as JoinType | undefined) ?? 'inner'
  leftKey.value = (d.config.leftKey as string | undefined) ?? ''
  rightKey.value = (d.config.rightKey as string | undefined) ?? ''
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
          <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Join type</p>
          <select v-model="joinType" class="join-type w-full rounded-md border bg-background px-3 py-1.5 text-sm" @change="save">
            <option value="inner">Inner — matching rows only</option>
            <option value="left">Left — all left rows</option>
            <option value="right">Right — all right rows</option>
            <option value="full">Full outer — all rows</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Left key</p>
            <select v-model="leftKey" class="w-full rounded-md border bg-background px-2 py-1.5 text-xs" @change="save">
              <option value="">— select —</option>
              <option v-for="f in leftSchema" :key="f.name" :value="f.name">{{ f.name }}</option>
            </select>
          </div>
          <div>
            <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Right key</p>
            <select v-model="rightKey" class="w-full rounded-md border bg-background px-2 py-1.5 text-xs" @change="save">
              <option value="">— select —</option>
              <option v-for="f in rightSchema" :key="f.name" :value="f.name">{{ f.name }}</option>
            </select>
          </div>
        </div>
        <p v-if="!leftSchema.length && !rightSchema.length" class="text-xs italic text-muted-foreground">
          Connect two upstream nodes to the left and right input handles.
        </p>
      </template>

      <template v-else-if="tab === 'output'">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Output fields (union of both inputs)</p>
        <div v-if="!computedOutputSchema.length" class="text-xs italic text-muted-foreground">Connect both inputs to preview schema.</div>
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
