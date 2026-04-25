<script setup lang="ts">
import { ref, computed } from 'vue'
import { stubAuditEntries } from '@/data/audit'
import { ChevronDown, ChevronRight } from 'lucide-vue-next'

const search = ref('')
const expandedId = ref<string | null>(null)

const filtered = computed(() =>
  stubAuditEntries.filter(e =>
    [e.actor, e.action, e.resourceType, e.resourceName]
      .some(f => f.toLowerCase().includes(search.value.toLowerCase()))
  )
)

function toggle(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-[18px] py-[11px]">
      <h1 class="text-[15px] font-semibold tracking-tight">Audit & Activity</h1>
      <p class="mt-0.5 text-[11.5px] text-muted-foreground">Governance trail for all platform actions</p>
    </div>

    <div class="flex-1 overflow-y-auto p-[18px]">
      <div class="mb-4">
        <input v-model="search" placeholder="Search by actor, action, or resource…"
          class="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div class="overflow-hidden rounded-[7px] border">
        <table class="w-full text-sm">
          <thead class="bg-muted/50">
            <tr>
              <th class="w-6 px-3 py-2" />
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Timestamp</th>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Actor</th>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Action</th>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Resource</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <template v-for="entry in filtered" :key="entry.entryId">
              <tr class="hover:bg-muted/30" :class="entry.diff ? 'cursor-pointer' : ''"
                @click="entry.diff && toggle(entry.entryId)">
                <td class="px-3 py-[7px] text-muted-foreground">
                  <ChevronDown v-if="entry.diff && expandedId === entry.entryId" class="h-3.5 w-3.5" />
                  <ChevronRight v-else-if="entry.diff" class="h-3.5 w-3.5" />
                </td>
                <td class="px-3 py-[7px] text-[11.5px] text-muted-foreground">{{ new Date(entry.timestamp).toLocaleString() }}</td>
                <td class="px-3 py-[7px] text-[11.5px]">{{ entry.actor }}</td>
                <td class="px-3 py-[7px] text-[11.5px] capitalize font-medium">{{ entry.action }}</td>
                <td class="px-3 py-[7px] text-[11.5px] text-muted-foreground">
                  <span class="capitalize">{{ entry.resourceType }}</span>: {{ entry.resourceName }}
                </td>
              </tr>
              <tr v-if="entry.diff && expandedId === entry.entryId" class="bg-muted/20">
                <td colspan="5" class="px-3 py-[7px]">
                  <div class="grid grid-cols-2 gap-3">
                    <div class="rounded-md border bg-background p-2">
                      <p class="mb-1 text-xs font-semibold text-red-600">Before</p>
                      <pre class="text-xs text-muted-foreground">{{ entry.diff.before }}</pre>
                    </div>
                    <div class="rounded-md border bg-background p-2">
                      <p class="mb-1 text-xs font-semibold text-green-600">After</p>
                      <pre class="text-xs text-muted-foreground">{{ entry.diff.after }}</pre>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
