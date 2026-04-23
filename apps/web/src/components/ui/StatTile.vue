<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  value: string | number
  icon?: Component
  colorClass?: string
  subtext?: string
}>()
</script>

<template>
  <div class="rounded-lg border bg-background p-4">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-muted-foreground">{{ label }}</p>
        <p class="mt-1 text-2xl font-bold tracking-tight">{{ value }}</p>
        <p v-if="subtext" class="mt-0.5 text-xs text-muted-foreground">{{ subtext }}</p>
      </div>
      <div
        v-if="icon"
        class="flex h-9 w-9 items-center justify-center rounded-md"
        :class="colorClass ?? 'bg-muted text-muted-foreground'"
      >
        <component :is="icon" class="h-4 w-4" />
      </div>
    </div>
  </div>
</template>
