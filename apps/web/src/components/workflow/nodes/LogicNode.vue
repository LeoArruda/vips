<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { GitBranch } from 'lucide-vue-next'
import type { BuilderNodeData } from '@/stores/builder'

const props = defineProps<{ data: BuilderNodeData; selected: boolean }>()
</script>

<template>
  <div
    class="min-w-[160px] rounded-lg border-2 bg-background p-3 shadow-sm transition-all"
    :class="{
      'border-blue-500 ring-2 ring-blue-500/20': props.selected,
      'border-border': !props.selected && props.data.status === 'pending',
      'border-blue-400 animate-pulse': props.data.status === 'running',
      'border-green-500': props.data.status === 'success',
      'border-red-500': props.data.status === 'failed',
    }"
  >
    <Handle type="target" :position="Position.Left" />
    <Handle type="source" :position="Position.Right" id="a" style="top: 30%" />
    <Handle type="source" :position="Position.Right" id="b" style="top: 70%" />
    <div class="flex items-center gap-2">
      <div
        class="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-600"
      >
        <GitBranch class="h-3.5 w-3.5" />
      </div>
      <div>
        <div class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Logic
        </div>
        <div class="text-sm font-medium leading-tight">{{ props.data.label }}</div>
      </div>
    </div>
  </div>
</template>
