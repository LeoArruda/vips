<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import type { Component } from 'vue'
import {
  ArrowRightFromLine, ArrowRightToLine, ArrowLeftRight,
  GitBranch, Globe, Database, Table2,
} from 'lucide-vue-next'
import type { NodeType } from '@/types'

interface PaletteItem {
  key: string
  label: string
  description: string
  icon: Component
  accentColor: string
  dragType: NodeType
  dragConfig?: Record<string, unknown>
}

const sections: Array<{ title: string; items: PaletteItem[] }> = [
  {
    title: 'Data Flow',
    items: [
      { key: 'source', label: 'Source', description: 'Read from any connector', icon: markRaw(ArrowRightFromLine), accentColor: '#3b82f6', dragType: 'connector.source' },
      { key: 'destination', label: 'Destination', description: 'Write to any connector', icon: markRaw(ArrowRightToLine), accentColor: '#22c55e', dragType: 'connector.destination' },
    ],
  },
  {
    title: 'Logic',
    items: [
      { key: 'transform', label: 'Transform', description: 'Map / reshape data', icon: markRaw(ArrowLeftRight), accentColor: '#f59e0b', dragType: 'transform.map' },
      { key: 'branch', label: 'Branch', description: 'Conditional routing', icon: markRaw(GitBranch), accentColor: '#a855f7', dragType: 'logic.branch' },
    ],
  },
  {
    title: 'Connectors',
    items: [
      { key: 'http-rest', label: 'HTTP / REST', description: 'GET · POST · PUT · DELETE', icon: markRaw(Globe), accentColor: '#3b82f6', dragType: 'connector.source', dragConfig: { connectorType: 'http-rest' } },
      { key: 'postgres', label: 'Postgres', description: 'Query or write rows', icon: markRaw(Database), accentColor: '#22c55e', dragType: 'connector.source', dragConfig: { connectorType: 'postgres' } },
      { key: 'statcan', label: 'StatCan', description: 'Statistics Canada data', icon: markRaw(Table2), accentColor: '#ca8a04', dragType: 'connector.source', dragConfig: { connectorType: 'statcan' } },
    ],
  },
]

const search = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return sections
  return sections
    .map((s) => ({ ...s, items: s.items.filter((i) => i.label.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)) }))
    .filter((s) => s.items.length > 0)
})

function onDragStart(event: DragEvent, item: PaletteItem) {
  if (!event.dataTransfer) return
  // Encode type + optional config + optional label as JSON
  const payload = item.dragConfig
    ? JSON.stringify({ type: item.dragType, config: item.dragConfig, label: item.label })
    : item.dragType   // plain string for generic items — backward-compatible
  event.dataTransfer.setData('application/vueflow-node', payload)
  event.dataTransfer.effectAllowed = 'move'
}
</script>

<template>
  <aside class="flex w-52 flex-shrink-0 flex-col border-r bg-background">
    <!-- Search -->
    <div class="border-b px-2 py-2">
      <div class="flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1.5">
        <svg class="h-3 w-3 flex-shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="search"
          placeholder="Search nodes…"
          class="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>

    <!-- Sections -->
    <div class="flex-1 overflow-y-auto py-1">
      <!-- Empty search state -->
      <div v-if="filtered.length === 0" class="px-3 py-6 text-center text-xs text-muted-foreground">
        No nodes match "{{ search }}"
      </div>

      <template v-for="section in filtered" :key="section.title">
        <!-- Section label with divider -->
        <div class="flex items-center gap-2 px-3 pb-1 pt-3">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{{ section.title }}</span>
          <div class="flex-1 border-t border-border/50" />
        </div>

        <!-- Items -->
        <div
          v-for="item in section.items"
          :key="item.key"
          draggable="true"
          class="mx-1.5 mb-0.5 flex cursor-grab items-center gap-2.5 rounded-[5px] border bg-background px-2 py-[5px] shadow-sm transition-colors hover:bg-muted active:cursor-grabbing"
          @dragstart="onDragStart($event, item)"
        >
          <div
            class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px]"
            :style="{ background: item.accentColor + '18' }"
          >
            <component :is="item.icon" class="h-3.5 w-3.5" :style="{ color: item.accentColor }" />
          </div>
          <div>
            <div class="text-[11.5px] font-semibold leading-tight text-foreground">{{ item.label }}</div>
            <div class="text-[10px] leading-tight text-muted-foreground">{{ item.description }}</div>
          </div>
        </div>
      </template>
    </div>

    <div class="border-t px-3 py-[7px]">
      <p class="text-xs text-muted-foreground">Drag a node onto the canvas</p>
    </div>
  </aside>
</template>
