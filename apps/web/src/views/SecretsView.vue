<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSecretsStore } from '@/stores/secrets'
import { KeyRound, Plus, Trash2 } from 'lucide-vue-next'

const store = useSecretsStore()
const search = ref('')

const filtered = computed(() =>
  store.secrets.filter((s) => s.name.toLowerCase().includes(search.value.toLowerCase())),
)

onMounted(() => store.fetchAll())
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="flex items-center justify-between border-b px-[18px] py-[11px]">
      <div>
        <h1 class="text-[15px] font-semibold tracking-tight">Secrets & Credentials</h1>
        <p class="mt-0.5 text-[11.5px] text-muted-foreground">
          {{ store.secrets.length }} secret{{ store.secrets.length !== 1 ? 's' : '' }}
        </p>
      </div>
      <button class="flex items-center gap-2 rounded-[5px] bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-600">
        <Plus class="h-4 w-4" /> New secret
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-[18px]">
      <div class="mb-4">
        <input
          v-model="search"
          placeholder="Search secrets…"
          class="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div class="overflow-hidden rounded-[7px] border">
        <table class="w-full text-sm">
          <thead class="bg-muted/50">
            <tr>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Name</th>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Created</th>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="s in filtered" :key="s.id" class="hover:bg-muted/30">
              <td class="px-3 py-[7px]">
                <div class="flex items-center gap-2">
                  <KeyRound class="h-3.5 w-3.5 text-muted-foreground" />
                  <span class="text-[11.5px] font-medium">{{ s.name }}</span>
                </div>
              </td>
              <td class="px-3 py-[7px] text-[11.5px] text-muted-foreground">
                {{ new Date(s.created_at).toLocaleDateString() }}
              </td>
              <td class="px-3 py-[7px]">
                <button
                  class="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-600"
                  @click="store.remove(s.id)"
                >
                  <Trash2 class="h-3.5 w-3.5" /> Delete
                </button>
              </td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="3" class="px-3 py-6 text-center text-[11.5px] text-muted-foreground">
                No secrets found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
