<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'
import { useBuilderStore } from '@/stores/builder'

const props = defineProps<{ data: BuilderNodeData }>()
const store = useBuilderStore()
const nodeId = computed(() => store.selectedNode?.id ?? '')

const transformType = ref((props.data.config.transformType as string | undefined) ?? 'map')
const outputs = ref<number>((props.data.config.outputs as number | undefined) ?? 1)
const MAX_OUTPUTS = 5

const transformTypes = ['map', 'filter', 'join', 'aggregate', 'split']

function save() {
  if (!nodeId.value) return
  store.updateNodeConfig(nodeId.value, {
    transformType: transformType.value,
    outputs: outputs.value,
  })
}

function addOutput() {
  if (outputs.value < MAX_OUTPUTS) { outputs.value++; save() }
}

function removeOutput() {
  if (outputs.value > 1) { outputs.value--; save() }
}

watch(() => props.data, (d) => {
  transformType.value = (d.config.transformType as string | undefined) ?? 'map'
  outputs.value = (d.config.outputs as number | undefined) ?? 1
}, { deep: true })
</script>

<template>
  <div class="space-y-4 p-4">
    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transform Type</p>
      <select
        v-model="transformType"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        @change="save"
      >
        <option v-for="t in transformTypes" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <!-- Outputs section -->
    <div class="border-t pt-4">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outputs</p>
      <div class="space-y-1">
        <div class="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5">
          <div class="h-2 w-2 flex-shrink-0 rounded-full border-2 border-amber-400 bg-white" />
          <span class="flex-1 text-xs font-medium text-foreground">Output 1</span>
          <span class="text-[10px] text-muted-foreground">default</span>
        </div>

        <div
          v-for="i in outputs - 1"
          :key="i"
          class="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5"
        >
          <div class="h-2 w-2 flex-shrink-0 rounded-full border-2 border-amber-400 bg-white" />
          <span class="flex-1 text-xs font-medium text-foreground">Output {{ i + 1 }}</span>
          <button
            v-if="i === outputs - 1"
            class="text-muted-foreground/60 hover:text-red-400"
            :aria-label="`Remove output ${i + 1}`"
            @click="removeOutput"
          >×</button>
        </div>

        <button
          v-if="outputs < MAX_OUTPUTS"
          class="flex w-full items-center gap-1.5 rounded-md border border-dashed px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-600"
          @click="addOutput"
        >
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add destination
        </button>
      </div>
    </div>
  </div>
</template>
