<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { ArrowLeftRight } from 'lucide-vue-next'
import type { BuilderNodeData } from '@/stores/builder'

const props = defineProps<{ data: BuilderNodeData; selected: boolean }>()
</script>

<template>
  <div
    class="relative flex min-w-[200px] overflow-visible rounded-lg border bg-white shadow-sm transition-all"
    :class="{
      'border-purple-500 shadow-purple-100 shadow-md ring-2 ring-purple-500/20': props.selected,
      'border-gray-200': !props.selected && props.data.status === 'pending',
      'border-blue-400': !props.selected && props.data.status === 'running',
      'border-green-500': !props.selected && props.data.status === 'success',
      'border-red-500': !props.selected && props.data.status === 'failed',
    }"
  >
    <!-- Input handle -->
    <Handle
      type="target"
      :position="Position.Left"
      class="!border-gray-400 !bg-white"
      :class="{
        '!border-blue-400': props.data.status === 'running',
        '!border-green-500': props.data.status === 'success',
        '!border-red-500': props.data.status === 'failed',
      }"
    />

    <!-- Output handle -->
    <Handle
      type="source"
      :position="Position.Right"
      class="!border-gray-400 !bg-white"
      :class="{
        '!border-blue-400': props.data.status === 'running',
        '!border-green-500': props.data.status === 'success',
        '!border-red-500': props.data.status === 'failed',
      }"
    />

    <!-- Colored icon strip -->
    <div
      class="flex w-12 flex-shrink-0 items-center justify-center rounded-l-lg bg-purple-500 py-3"
    >
      <ArrowLeftRight class="h-5 w-5 text-white" />
    </div>

    <!-- Node content -->
    <div class="flex flex-1 flex-col justify-center px-3 py-2.5">
      <div class="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        Transform
      </div>
      <div class="mt-0.5 text-sm font-semibold leading-tight text-gray-800">
        {{ props.data.label }}
      </div>
    </div>

    <!-- Status dot -->
    <div
      v-if="props.data.status !== 'pending'"
      class="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white"
      :class="{
        'animate-pulse bg-blue-500': props.data.status === 'running',
        'bg-green-500': props.data.status === 'success',
        'bg-red-500': props.data.status === 'failed',
      }"
    />
  </div>
</template>
