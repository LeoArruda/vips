<script setup lang="ts">
import { computed, markRaw } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { ArrowLeftRight } from 'lucide-vue-next'
import type { BuilderNodeData } from '@/stores/builder'
import type { TransformNodeType } from '@/types'
import { TRANSFORM_REGISTRY } from '@/transforms/registry'
import { useNodePreview } from './useNodePreview'

const props = defineProps<{ id: string; data: BuilderNodeData; selected: boolean }>()

const regDef = computed(() => TRANSFORM_REGISTRY[props.data.nodeType as TransformNodeType])
const accentColor = computed(() => regDef.value?.accentColor ?? '#f59e0b')
const nodeIcon = computed(() => regDef.value?.icon ?? markRaw(ArrowLeftRight))
const inputCount = computed(() => regDef.value?.inputCount ?? 1)
const outputCount = computed(() => (props.data.config.outputs as number | undefined) ?? 1)
const typeLabel = computed(() => regDef.value?.label ?? 'Transform')

function handleTop(i: number, total: number): string {
  return `${((i + 1) / (total + 1)) * 100}%`
}

const { activeTab, outputHint } = useNodePreview(props.id, () => props.data.config)
</script>

<template>
  <div
    class="relative w-40 overflow-visible rounded-lg border bg-white shadow-sm"
    :class="{
      'shadow-md': props.selected,
      'border-slate-200': !props.selected && props.data.status === 'pending',
      'border-amber-400': !props.selected && props.data.status === 'running',
      'border-green-500': !props.selected && props.data.status === 'success',
      'border-red-500': !props.selected && props.data.status === 'failed',
    }"
    :style="props.selected
      ? { borderColor: accentColor, boxShadow: `0 0 0 4px ${accentColor}33, 0 4px 6px -1px rgb(0 0 0 / 0.1)` }
      : {}"
  >
    <div class="h-[5px] rounded-t-[7px]" :style="{ backgroundColor: accentColor }" />

    <!-- Single input handle -->
    <Handle
      v-if="inputCount === 1"
      type="target"
      :position="Position.Left"
      class="!h-2.5 !w-2.5 !border-2 !bg-white"
      :style="{ borderColor: accentColor }"
    />

    <!-- Dual input handles (join / union / merge) -->
    <template v-else>
      <Handle
        type="target"
        id="input-left"
        :position="Position.Left"
        :style="{ top: '35%', borderColor: accentColor }"
        class="!absolute !h-2.5 !w-2.5 !border-2 !bg-white"
      />
      <Handle
        type="target"
        id="input-right"
        :position="Position.Left"
        :style="{ top: '65%', borderColor: accentColor }"
        class="!absolute !h-2.5 !w-2.5 !border-2 !bg-white"
      />
    </template>

    <!-- Output handles -->
    <Handle
      v-for="i in outputCount"
      :key="i"
      type="source"
      :position="Position.Right"
      :id="`output-${i - 1}`"
      :style="{ top: handleTop(i - 1, outputCount), borderColor: accentColor }"
      class="!h-2.5 !w-2.5 !border-2 !bg-white"
    />

    <div class="flex items-center gap-2 px-3 pb-1 pt-[7px]">
      <div
        class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px]"
        :style="{ backgroundColor: accentColor + '18' }"
      >
        <component :is="nodeIcon" class="h-3.5 w-3.5" :style="{ color: accentColor }" />
      </div>
      <span class="truncate text-[12px] font-semibold leading-tight text-slate-800">{{ props.data.label }}</span>
    </div>

    <div class="truncate px-3 pb-[6px] text-[10px] leading-tight text-slate-400">{{ typeLabel }}</div>

    <div class="rounded-b-[7px] border-t border-slate-100">
      <div class="flex">
        <button
          class="flex-1 py-[3px] text-[10px] font-semibold transition-colors"
          :class="activeTab === 'schema' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-400 hover:text-slate-600'"
          @click.stop="activeTab = 'schema'"
        >Schema</button>
        <button
          class="flex-1 py-[3px] text-[10px] font-semibold transition-colors"
          :class="activeTab === 'output' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-400 hover:text-slate-600'"
          @click.stop="activeTab = 'output'"
        >Output</button>
      </div>
      <div class="px-3 py-[4px]">
        <template v-if="activeTab === 'schema'">
          <span class="block truncate font-mono text-[10px] text-violet-600">{{ typeLabel }}</span>
        </template>
        <template v-else>
          <span v-if="outputHint" class="block truncate font-mono text-[10px] text-green-600">{{ outputHint }}</span>
          <span v-else class="block truncate text-[10px] italic text-slate-300">Run to see output</span>
        </template>
      </div>
    </div>

    <div
      v-if="props.data.status !== 'pending'"
      class="absolute -right-1 -top-1 h-2 w-2 rounded-full border-2 border-white"
      :class="{
        'animate-pulse bg-amber-500': props.data.status === 'running',
        'bg-green-500': props.data.status === 'success',
        'bg-red-500': props.data.status === 'failed',
      }"
    />
  </div>
</template>
