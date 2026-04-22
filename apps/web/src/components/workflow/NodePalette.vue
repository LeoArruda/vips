<script setup lang="ts">
import { ArrowRightFromLine, ArrowLeftRight, ArrowRightToLine, GitBranch } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { NodeType } from '@/types'

interface PaletteItem {
  type: NodeType
  label: string
  description: string
  icon: Component
  colorClass: string
}

const paletteItems: PaletteItem[] = [
  {
    type: 'connector.source',
    label: 'Source',
    description: 'Read from a connector',
    icon: ArrowRightFromLine,
    colorClass: 'bg-blue-50 text-blue-600',
  },
  {
    type: 'transform.map',
    label: 'Transform',
    description: 'Map or reshape data',
    icon: ArrowLeftRight,
    colorClass: 'bg-purple-50 text-purple-600',
  },
  {
    type: 'connector.destination',
    label: 'Destination',
    description: 'Write to a connector',
    icon: ArrowRightToLine,
    colorClass: 'bg-emerald-50 text-emerald-600',
  },
  {
    type: 'logic.branch',
    label: 'Branch',
    description: 'Conditional routing',
    icon: GitBranch,
    colorClass: 'bg-amber-50 text-amber-600',
  },
]

function onDragStart(event: DragEvent, type: NodeType) {
  if (!event.dataTransfer) return
  event.dataTransfer.setData('application/vueflow-node', type)
  event.dataTransfer.effectAllowed = 'move'
}
</script>

<template>
  <aside class="flex w-52 flex-shrink-0 flex-col border-r bg-background">
    <div class="border-b px-4 py-3">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Node Types
      </h2>
    </div>
    <div class="flex-1 space-y-1.5 overflow-y-auto p-3">
      <div
        v-for="item in paletteItems"
        :key="item.type"
        draggable="true"
        class="flex cursor-grab items-center gap-3 rounded-md border bg-background p-2.5 shadow-sm transition-colors hover:bg-muted active:cursor-grabbing"
        @dragstart="onDragStart($event, item.type)"
      >
        <div
          class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md"
          :class="item.colorClass"
        >
          <component :is="item.icon" class="h-4 w-4" />
        </div>
        <div>
          <div class="text-sm font-medium leading-tight">{{ item.label }}</div>
          <div class="text-xs text-muted-foreground">{{ item.description }}</div>
        </div>
      </div>
    </div>
    <div class="border-t px-4 py-3">
      <p class="text-xs text-muted-foreground">Drag a node onto the canvas</p>
    </div>
  </aside>
</template>
