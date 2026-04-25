<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSecretsStore } from '@/stores/secrets'
import { KeyRound, AlertTriangle, RotateCw, Plus } from 'lucide-vue-next'

const store = useSecretsStore()
const search = ref('')

const filtered = computed(() =>
  store.secrets.filter(s => s.name.toLowerCase().includes(search.value.toLowerCase()))
)

const rotationBadge: Record<string, string> = {
  ok: 'bg-green-100 text-green-700',
  due: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="flex items-center justify-between border-b px-[18px] py-[11px]">
      <div>
        <h1 class="text-[15px] font-semibold tracking-tight">Secrets & Credentials</h1>
        <p class="mt-0.5 text-[11.5px] text-muted-foreground">
          {{ store.rotationAlertCount }} secret{{ store.rotationAlertCount !== 1 ? 's' : '' }} need rotation
        </p>
      </div>
      <button class="flex items-center gap-2 rounded-[5px] bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-600">
        <Plus class="h-4 w-4" /> New secret
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-[18px]">
      <div v-if="store.rotationAlertCount > 0"
        class="mb-4 flex items-center gap-3 rounded-[7px] border border-amber-200 bg-amber-50 px-3 py-[7px] text-[11.5px] text-amber-800">
        <AlertTriangle class="h-4 w-4 shrink-0" />
        {{ store.rotationAlertCount }} secret(s) are due or overdue for rotation. Rotate them to maintain security compliance.
      </div>

      <div class="mb-4">
        <input v-model="search" placeholder="Search secrets…"
          class="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div class="overflow-hidden rounded-[7px] border">
        <table class="w-full text-sm">
          <thead class="bg-muted/50">
            <tr>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Name</th>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Scope</th>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Environment</th>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Rotation</th>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Last rotated</th>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="s in filtered" :key="s.secretId" class="hover:bg-muted/30">
              <td class="px-3 py-[7px]">
                <div class="flex items-center gap-2">
                  <KeyRound class="h-3.5 w-3.5 text-muted-foreground" />
                  <span class="text-[11.5px] font-medium">{{ s.name }}</span>
                </div>
              </td>
              <td class="px-3 py-[7px] text-[11.5px] text-muted-foreground capitalize">{{ s.scope }}</td>
              <td class="px-3 py-[7px] text-[11.5px] text-muted-foreground">{{ s.environment }}</td>
              <td class="px-3 py-[7px]">
                <span class="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                  :class="rotationBadge[s.rotationState]">
                  {{ s.rotationState }}
                </span>
              </td>
              <td class="px-3 py-[7px] text-[11.5px] text-muted-foreground">
                {{ new Date(s.lastRotatedAt).toLocaleDateString() }}
              </td>
              <td class="px-3 py-[7px]">
                <button class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <RotateCw class="h-3.5 w-3.5" /> Rotate
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
