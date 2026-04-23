<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { GitBranch } from 'lucide-vue-next'
import type { BuilderNodeData } from '@/stores/builder'

const props = defineProps<{ data: BuilderNodeData; selected: boolean }>()
</script>

<template>
  <div
    class="relative flex min-w-[200px] overflow-visible rounded-lg border bg-white shadow-sm transition-all"
    :class="{
      'border-purple-500 shadow-purple-100 shadow-md ring-2 ring-purple-500/20': props.selected,
      'border-gray-200': !props.selected && props.data.status === 'pending',
      'border-purple-400': !props.selected && props.data.status === 'running',
      'border-green-500': !props.selected && props.data.status === 'success',
      'border-red-500': !props.selected && props.data.status === 'failed',
    }"
  >
    <Handle type="target" :position="Position.Left"
      class="!h-3 !w-3 !border-2 !border-purple-400 !bg-white opacity-60 hover:!opacity-100" />
    <Handle type="source" :position="Position.Right" id="true"
      class="!h-3 !w-3 !border-2 !border-purple-400 !bg-white opacity-60 hover:!opacity-100" style="top: 30%" />
    <Handle type="source" :position="Position.Right" id="false"
      class="!h-3 !w-3 !border-2 !border-purple-400 !bg-white opacity-60 hover:!opacity-100" style="top: 70%" />
    <div class="flex w-12 flex-shrink-0 items-center justify-center rounded-l-lg bg-purple-500 py-3">
      <GitBranch class="h-5 w-5 text-white" />
    </div>
    <div class="flex flex-1 flex-col justify-center px-3 py-2.5">
      <div class="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Control</div>
      <div class="mt-0.5 text-sm font-semibold leading-tight text-gray-800">{{ props.data.label }}</div>
    </div>
  </div>
</template>
