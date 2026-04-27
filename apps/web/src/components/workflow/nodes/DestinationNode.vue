<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { Database } from 'lucide-vue-next'
import type { BuilderNodeData } from '@/stores/builder'
import { useNodePreview } from './useNodePreview'

const props = defineProps<{ data: BuilderNodeData; selected: boolean }>()
const { activeTab, schemaHint, outputHint } = useNodePreview(() => props.data.config)
</script>

<template>
  <div
    class="relative w-40 overflow-visible rounded-lg border bg-white shadow-sm"
    :class="{
      'border-green-500 ring-2 ring-green-500/20 shadow-green-100 shadow-md': props.selected,
      'border-slate-200': !props.selected && props.data.status === 'pending',
      'border-green-400': !props.selected && props.data.status === 'running',
      'border-green-600': !props.selected && props.data.status === 'success',
      'border-red-500': !props.selected && props.data.status === 'failed',
    }"
  >
    <!-- Accent bar -->
    <div class="h-[5px] rounded-t-[7px] bg-green-500" />

    <!-- Input handle -->
    <Handle
      type="target"
      :position="Position.Left"
      class="!h-2.5 !w-2.5 !border-2 !border-green-400 !bg-white"
    />

    <!-- Icon + name -->
    <div class="flex items-center gap-2 px-3 pb-1 pt-[7px]">
      <div class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px] bg-green-50">
        <Database class="h-3.5 w-3.5 text-green-600" />
      </div>
      <span class="truncate text-[12px] font-semibold leading-tight text-slate-800">{{ props.data.label }}</span>
    </div>

    <!-- Sub-label -->
    <div class="truncate px-3 pb-[6px] text-[10px] leading-tight text-slate-400">{{ schemaHint }}</div>

    <!-- Preview band -->
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
          <span class="block truncate font-mono text-[10px] text-violet-600">{{ schemaHint }}</span>
        </template>
        <template v-else>
          <span v-if="outputHint" class="block truncate font-mono text-[10px] text-green-600">{{ outputHint }}</span>
          <span v-else class="block truncate text-[10px] italic text-slate-300">Run to see output</span>
        </template>
      </div>
    </div>

    <!-- Status dot -->
    <div
      v-if="props.data.status !== 'pending'"
      class="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-white"
      :class="{
        'animate-pulse bg-green-400': props.data.status === 'running',
        'bg-green-600': props.data.status === 'success',
        'bg-red-500': props.data.status === 'failed',
      }"
    />
  </div>
</template>
