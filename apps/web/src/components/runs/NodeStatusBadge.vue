<script setup lang="ts">
import { CheckCircle2, XCircle, Clock, Play, MinusCircle } from 'lucide-vue-next'
import type { NodeStatus } from '@/types'
import type { Component } from 'vue'

const props = defineProps<{ status: NodeStatus }>()

const config: Record<NodeStatus, { icon: Component; colorClass: string; label: string }> = {
  pending: { icon: Clock, colorClass: 'text-muted-foreground', label: 'Pending' },
  running: { icon: Play, colorClass: 'text-blue-600', label: 'Running' },
  success: { icon: CheckCircle2, colorClass: 'text-green-600', label: 'Success' },
  failed: { icon: XCircle, colorClass: 'text-red-600', label: 'Failed' },
  skipped: { icon: MinusCircle, colorClass: 'text-muted-foreground', label: 'Skipped' },
}
</script>

<template>
  <span class="flex items-center gap-1" :class="config[props.status]?.colorClass">
    <component :is="config[props.status]?.icon" class="h-3.5 w-3.5" />
    <span class="text-xs font-medium">{{ config[props.status]?.label }}</span>
  </span>
</template>
