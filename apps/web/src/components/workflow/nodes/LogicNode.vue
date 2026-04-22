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
      'border-amber-500 shadow-amber-100 shadow-md ring-2 ring-amber-500/20': props.selected,
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

    <!-- Two output handles (true / false branches) -->
    <Handle
      id="a"
      type="source"
      :position="Position.Right"
      :style="{ top: '30%' }"
      class="!border-gray-400 !bg-white"
      :class="{
        '!border-blue-400': props.data.status === 'running',
        '!border-green-500': props.data.status === 'success',
        '!border-red-500': props.data.status === 'failed',
      }"
    />
    <Handle
      id="b"
      type="source"
      :position="Position.Right"
      :style="{ top: '70%' }"
      class="!border-gray-400 !bg-white"
      :class="{
        '!border-blue-400': props.data.status === 'running',
        '!border-green-500': props.data.status === 'success',
        '!border-red-500': props.data.status === 'failed',
      }"
    />

    <!-- Colored icon strip -->
    <div
      class="flex w-12 flex-shrink-0 items-center justify-center rounded-l-lg bg-amber-500 py-3"
    >
      <GitBranch class="h-5 w-5 text-white" />
    </div>

    <!-- Node content -->
    <div class="flex flex-1 flex-col justify-center px-3 py-2.5">
      <div class="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Logic</div>
      <div class="mt-0.5 text-sm font-semibold leading-tight text-gray-800">
        {{ props.data.label }}
      </div>
      <!-- Branch labels aligned with handles -->
      <div class="mt-1 flex flex-col gap-2 text-[10px] text-gray-400">
        <span class="leading-none">true</span>
        <span class="leading-none">false</span>
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
