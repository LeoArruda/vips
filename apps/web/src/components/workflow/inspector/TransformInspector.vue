<script setup lang="ts">
import { ref } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'

defineProps<{ data: BuilderNodeData }>()

interface FieldMapping { from: string; to: string }
interface TypeCoercion { fromType: string; toType: string }

const transformType = ref('map')
const mappings = ref<FieldMapping[]>([{ from: '', to: '' }])
const coercions = ref<TypeCoercion[]>([])
const newFieldExpr = ref('')

const transformTypes = ['map', 'filter', 'join', 'aggregate', 'split']

function addMapping() { mappings.value.push({ from: '', to: '' }) }
function removeMapping(i: number) { mappings.value.splice(i, 1) }
function addCoercion() { coercions.value.push({ fromType: 'string', toType: 'date' }) }
</script>

<template>
  <div class="space-y-4 p-4">
    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transform Type</p>
      <select v-model="transformType"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring">
        <option v-for="t in transformTypes" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <div>
      <div class="mb-2 flex items-center justify-between">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Field Mappings</p>
        <button class="text-xs text-muted-foreground hover:text-foreground" @click="addMapping">+ Add</button>
      </div>
      <div class="space-y-1.5">
        <div v-for="(m, i) in mappings" :key="i" class="flex items-center gap-1.5">
          <input v-model="m.from" placeholder="source.field"
            class="flex-1 rounded-md border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring" />
          <span class="text-xs text-muted-foreground">→</span>
          <input v-model="m.to" placeholder="dest.field"
            class="flex-1 rounded-md border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring" />
          <button class="text-xs text-muted-foreground hover:text-red-500" @click="removeMapping(i)">✕</button>
        </div>
      </div>
    </div>

    <div>
      <div class="mb-2 flex items-center justify-between">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type Coercions</p>
        <button class="text-xs text-muted-foreground hover:text-foreground" @click="addCoercion">+ Add</button>
      </div>
      <div class="space-y-1.5">
        <div v-for="(c, i) in coercions" :key="i" class="flex items-center gap-1.5">
          <input v-model="c.fromType" placeholder="string"
            class="flex-1 rounded-md border bg-background px-2 py-1 text-xs outline-none" />
          <span class="text-xs opacity-50">→</span>
          <input v-model="c.toType" placeholder="date"
            class="flex-1 rounded-md border bg-background px-2 py-1 text-xs outline-none" />
        </div>
      </div>
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Field / Expression</p>
      <textarea v-model="newFieldExpr" placeholder="e.g. fullName = firstName + ' ' + lastName" rows="2"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring" />
    </div>
  </div>
</template>
