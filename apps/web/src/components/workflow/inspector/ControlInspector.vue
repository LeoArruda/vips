<script setup lang="ts">
import { ref } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'

defineProps<{ data: BuilderNodeData }>()

const controlType = ref('branch')
const condition = ref('')
const truePath = ref('next node')
const falsePath = ref('error handler')
const maxAttempts = ref(3)
const backoffSeconds = ref(30)

const controlTypes = ['branch', 'wait', 'retry', 'merge', 'filter']
</script>

<template>
  <div class="space-y-4 p-4">
    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Control Type</p>
      <select v-model="controlType"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring">
        <option v-for="t in controlTypes" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Condition</p>
      <input v-model="condition" placeholder="e.g. status == 'active'"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Branches</p>
      <div class="space-y-1.5">
        <div class="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
          <span class="text-green-600">✓ True</span>
          <span class="mx-1 text-muted-foreground">→</span>
          <input v-model="truePath" class="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <div class="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
          <span class="text-red-500">✗ False</span>
          <span class="mx-1 text-muted-foreground">→</span>
          <input v-model="falsePath" class="flex-1 bg-transparent text-sm outline-none" />
        </div>
      </div>
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Retry Policy</p>
      <div class="flex gap-2">
        <div class="flex-1">
          <label class="mb-1 block text-xs text-muted-foreground">Max attempts</label>
          <input v-model.number="maxAttempts" type="number" min="1" max="10"
            class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none" />
        </div>
        <div class="flex-1">
          <label class="mb-1 block text-xs text-muted-foreground">Backoff (s)</label>
          <input v-model.number="backoffSeconds" type="number" min="0"
            class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none" />
        </div>
      </div>
    </div>
  </div>
</template>
