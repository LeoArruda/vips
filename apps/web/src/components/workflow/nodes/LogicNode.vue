<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { GitBranch } from 'lucide-vue-next'
import type { BuilderNodeData } from '@/stores/builder'
import { useNodePreview } from './useNodePreview'

const props = defineProps<{ id: string; data: BuilderNodeData; selected: boolean }>()
const { activeTab, outputHint } = useNodePreview(props.id, () => props.data.config)
</script>

<template>
  <div
    class="relative w-40 overflow-visible rounded-lg border bg-white shadow-sm"
    :class="{
      'border-purple-500 ring-2 ring-purple-500/20 shadow-purple-100 shadow-md': props.selected,
      'border-slate-200': !props.selected && props.data.status === 'pending',
      'border-purple-400': !props.selected && props.data.status === 'running',
      'border-green-500': !props.selected && props.data.status === 'success',
      'border-red-500': !props.selected && props.data.status === 'failed',
    }"
  >
    <!-- Accent bar -->
    <div class="h-[5px] rounded-t-[7px] bg-purple-500" />

    <!-- Input handle -->
    <Handle
      type="target"
      :position="Position.Left"
      class="!h-2.5 !w-2.5 !border-2 !border-purple-400 !bg-white"
    />

    <!-- True / False output handles (fixed positions) -->
    <Handle
      id="true"
      type="source"
      :position="Position.Right"
      style="top: 35%"
      class="!h-2.5 !w-2.5 !border-2 !border-purple-400 !bg-white"
    />
    <Handle
      id="false"
      type="source"
      :position="Position.Right"
      style="top: 65%"
      class="!h-2.5 !w-2.5 !border-2 !border-purple-400 !bg-white"
    />

    <!-- Icon + name -->
    <div class="flex items-center gap-2 px-3 pb-1 pt-[7px]">
      <div class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px] bg-purple-50">
        <GitBranch class="h-3.5 w-3.5 text-purple-500" />
      </div>
      <span class="truncate text-[12px] font-semibold leading-tight text-slate-800">{{ props.data.label }}</span>
    </div>

    <!-- Sub-label -->
    <div class="truncate px-3 pb-[6px] text-[10px] leading-tight text-slate-400">true / false</div>

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
          <span class="block truncate font-mono text-[10px] text-violet-600">2 branches</span>
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
      class="absolute -right-1 -top-1 h-2 w-2 rounded-full border-2 border-white"
      :class="{
        'animate-pulse bg-purple-500': props.data.status === 'running',
        'bg-green-500': props.data.status === 'success',
        'bg-red-500': props.data.status === 'failed',
      }"
    />
  </div>
</template>
