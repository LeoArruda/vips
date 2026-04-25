<script setup lang="ts">
import { ref, computed } from 'vue'
import { stubTemplates } from '@/data/templates'
import { useRouter } from 'vue-router'
import { Star, Users } from 'lucide-vue-next'

const router = useRouter()
const search = ref('')
const selectedCategory = ref('all')

const categories = ['all', 'crm', 'analytics', 'finance', 'marketing', 'devops']

const filtered = computed(() =>
  stubTemplates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.value.toLowerCase()) ||
      t.description.toLowerCase().includes(search.value.toLowerCase())
    const matchesCategory = selectedCategory.value === 'all' || t.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
)

function useTemplate(_templateId: string) {
  router.push('/workflows')
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-[18px] py-[11px]">
      <h1 class="text-[15px] font-semibold tracking-tight">Templates</h1>
      <p class="mt-0.5 text-[11.5px] text-muted-foreground">Start from a proven workflow pattern</p>
    </div>

    <div class="flex-1 overflow-y-auto p-[18px]">
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <input v-model="search" placeholder="Search templates…"
          class="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring w-64" />
        <div class="flex gap-2 flex-wrap">
          <button v-for="cat in categories" :key="cat"
            class="rounded-full px-3 py-1 text-[11.5px] font-medium capitalize transition-colors"
            :class="selectedCategory === cat ? 'bg-indigo-500 text-white' : 'border hover:bg-muted'"
            @click="selectedCategory = cat">
            {{ cat }}
          </button>
        </div>
      </div>

      <div v-if="filtered.some(t => t.featured)" class="mb-8">
        <h2 class="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Featured</h2>
        <div class="grid grid-cols-2 gap-2">
          <div v-for="t in filtered.filter(t => t.featured)" :key="t.templateId"
            class="rounded-[7px] border bg-gradient-to-br from-background to-muted/30 p-[11px] hover:shadow-sm">
            <div class="mb-2 flex items-start justify-between">
              <h3 class="font-semibold">{{ t.name }}</h3>
              <Star class="h-4 w-4 text-amber-400 fill-amber-400" />
            </div>
            <p class="mb-3 text-[11.5px] text-muted-foreground">{{ t.description }}</p>
            <div class="mb-3 flex flex-wrap gap-1.5">
              <span v-for="c in t.connectors" :key="c"
                class="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{{ c }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1 text-xs text-muted-foreground">
                <Users class="h-3 w-3" /> {{ t.usageCount.toLocaleString() }} uses
              </span>
              <button class="rounded-[5px] bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600"
                @click="useTemplate(t.templateId)">
                Use template
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 class="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">All Templates</h2>
        <div class="grid grid-cols-3 gap-2">
          <div v-for="t in filtered.filter(t => !t.featured)" :key="t.templateId"
            class="rounded-[7px] border p-[11px] hover:shadow-sm">
            <h3 class="font-semibold">{{ t.name }}</h3>
            <p class="mt-1 text-[11.5px] text-muted-foreground line-clamp-2">{{ t.description }}</p>
            <div class="mt-2 flex flex-wrap gap-1">
              <span v-for="c in t.connectors" :key="c"
                class="rounded-full bg-muted px-2 py-0.5 text-xs">{{ c }}</span>
            </div>
            <div class="mt-3 flex items-center justify-between">
              <span class="text-xs text-muted-foreground">{{ t.usageCount.toLocaleString() }} uses</span>
              <button class="text-xs font-medium text-foreground underline underline-offset-2 hover:no-underline"
                @click="useTemplate(t.templateId)">Use</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
