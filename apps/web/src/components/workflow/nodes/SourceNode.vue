<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { ArrowRightFromLine } from 'lucide-vue-next'
import type { BuilderNodeData } from '@/stores/builder'

const props = defineProps<{ data: BuilderNodeData; selected: boolean }>()
</script>

<template>
  <div
    class="relative flex min-w-[200px] overflow-visible rounded-lg border bg-white shadow-sm transition-all"
    :class="{
      'border-blue-500 shadow-blue-100 shadow-md ring-2 ring-blue-500/20': props.selected,
      'border-gray-200': !props.selected && props.data.status === 'pending',
      'border-blue-400': !props.selected && props.data.status === 'running',
      'border-green-500': !props.selected && props.data.status === 'success',
      'border-red-500': !props.selected && props.data.status === 'failed',
    }"
  >
    <Handle
      type="source"
      :position="Position.Right"
      class="!h-3 !w-3 !border-2 !border-blue-400 !bg-white opacity-60 hover:!opacity-100"
    />
    <div class="flex w-12 flex-shrink-0 items-center justify-center rounded-l-lg bg-blue-500 py-3">
      <ArrowRightFromLine class="h-5 w-5 text-white" />
    </div>
    <div class="flex flex-1 flex-col justify-center px-3 py-2.5">
      <div class="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Source</div>
      <div class="mt-0.5 text-sm font-semibold leading-tight text-gray-800">{{ props.data.label }}</div>
    </div>
    <div v-if="props.data.status !== 'pending'"
      class="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white"
      :class="{
        'animate-pulse bg-blue-500': props.data.status === 'running',
        'bg-green-500': props.data.status === 'success',
        'bg-red-500': props.data.status === 'failed',
      }" />
  </div>
</template>
