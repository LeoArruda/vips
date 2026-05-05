<script setup lang="ts">
import { ref, watch } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'
import { useBuilderStore } from '@/stores/builder'
import type { SchemaField } from '@/types'

type ErrorMode = 'fail' | 'warn' | 'quarantine' | 'skip'

const props = defineProps<{ data: BuilderNodeData; nodeId: string; upstreamSchema: SchemaField[] }>()
const store = useBuilderStore()
const tab = ref<'config' | 'output' | 'errors'>('config')

const paths = ref<string[]>((props.data.config.paths as string[] | undefined) ?? [])
const explodeArrays = ref(Boolean(props.data.config.explodeArrays))
const errorMode = ref<ErrorMode>((props.data.config.errorMode as ErrorMode | undefined) ?? 'fail')
const quarantineField = ref((props.data.config.quarantineField as string | undefined) ?? '_quarantine')

function addPath() { paths.value.push(''); save() }
function removePath(i: number) { paths.value.splice(i, 1); save() }

function save() {
  store.updateNodeConfig(props.nodeId, {
    paths: paths.value,
    explodeArrays: explodeArrays.value,
    errorMode: errorMode.value,
    quarantineField: quarantineField.value,
    outputSchema: props.upstreamSchema,
  })
}

watch(() => props.data, d => {
  paths.value = (d.config.paths as string[] | undefined) ?? []
  explodeArrays.value = Boolean(d.config.explodeArrays)
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
          <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">JSON paths to flatten</p>
          <p class="mb-2 text-xs text-muted-foreground">Use dot notation, e.g. <span class="font-mono">address.city</span></p>
          <div class="space-y-1.5">
            <div v-for="(p, i) in paths" :key="i" class="flex items-center gap-1.5">
              <input v-model="paths[i]" placeholder="path.to.field" class="flex-1 rounded-md border bg-background px-2 py-1 text-xs font-mono" @change="save" />
              <button class="text-muted-foreground/60 hover:text-red-400" @click="removePath(i)">×</button>
            </div>
            <button class="add-path flex w-full items-center gap-1 rounded-md border border-dashed px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-sky-400 hover:text-sky-600" @click="addPath">
              + Add path
            </button>
          </div>
        </div>
        <div class="flex items-center gap-2 border-t pt-3">
          <input id="explode" v-model="explodeArrays" type="checkbox" class="h-3.5 w-3.5" @change="save" />
          <label for="explode" class="text-xs">Explode arrays — multiply rows for each array element</label>
        </div>
      </template>

      <template v-else-if="tab === 'output'">
        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Output fields (same as input — paths determine expansion at runtime)</p>
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
