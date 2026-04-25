<script setup lang="ts">
import { ref } from 'vue'
import { useMembersStore } from '@/stores/members'
import { UserPlus } from 'lucide-vue-next'

const store = useMembersStore()
const showInvite = ref(false)
const inviteEmail = ref('')
const inviteRole = ref('builder')

const roleBadge: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  builder: 'bg-blue-100 text-blue-700',
  operator: 'bg-amber-100 text-amber-700',
  partner: 'bg-green-100 text-green-700',
}

const statusBadge: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  invited: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="flex items-center justify-between border-b px-[18px] py-[11px]">
      <div>
        <h1 class="text-[15px] font-semibold tracking-tight">Members & Roles</h1>
        <p class="mt-0.5 text-[11.5px] text-muted-foreground">{{ store.activeCount }} active members</p>
      </div>
      <button class="flex items-center gap-2 rounded-[5px] bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-600"
        @click="showInvite = true">
        <UserPlus class="h-4 w-4" /> Invite member
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-[18px]">
      <div class="overflow-hidden rounded-[7px] border">
        <table class="w-full text-sm">
          <thead class="bg-muted/50">
            <tr>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Name</th>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Email</th>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Role</th>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Status</th>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Joined</th>
              <th class="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="m in store.members" :key="m.memberId" class="hover:bg-muted/30">
              <td class="px-3 py-[7px]">
                <div class="flex items-center gap-2.5">
                  <div class="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {{ m.name.charAt(0) }}
                  </div>
                  <span class="text-[11.5px] font-medium">{{ m.name }}</span>
                </div>
              </td>
              <td class="px-3 py-[7px] text-[11.5px] text-muted-foreground">{{ m.email }}</td>
              <td class="px-3 py-[7px]">
                <span class="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                  :class="roleBadge[m.role]">{{ m.role }}</span>
              </td>
              <td class="px-3 py-[7px]">
                <span class="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                  :class="statusBadge[m.status]">{{ m.status }}</span>
              </td>
              <td class="px-3 py-[7px] text-[11.5px] text-muted-foreground">
                {{ new Date(m.joinedAt).toLocaleDateString() }}
              </td>
              <td class="px-3 py-[7px]">
                <select class="rounded-[5px] border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring">
                  <option value="admin">Admin</option>
                  <option value="builder">Builder</option>
                  <option value="operator">Operator</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Insufficient permissions failure state -->
      <div class="mt-4 flex items-center gap-3 rounded-[7px] border border-muted px-3 py-[7px] text-[11.5px] text-muted-foreground">
        <span class="text-lg">🔒</span>
        <span>Some settings require <strong>Admin</strong> permissions. Contact your workspace admin to request access.</span>
      </div>
    </div>

    <div v-if="showInvite" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="showInvite = false">
      <div class="w-full max-w-sm rounded-[7px] border bg-background p-[18px] shadow-lg">
        <h2 class="text-lg font-semibold">Invite team member</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="mb-1 block text-sm font-medium">Email</label>
            <input v-model="inviteEmail" type="email" placeholder="colleague@company.com"
              class="w-full rounded-[5px] border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Role</label>
            <select v-model="inviteRole" class="w-full rounded-[5px] border px-3 py-2 text-sm outline-none">
              <option value="admin">Admin</option>
              <option value="builder">Builder</option>
              <option value="operator">Operator</option>
            </select>
          </div>
        </div>
        <div class="mt-4 flex gap-2">
          <button class="flex-1 rounded-[5px] border px-4 py-2 text-sm font-medium hover:bg-muted"
            @click="showInvite = false">Cancel</button>
          <button class="flex-1 rounded-[5px] bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
            @click="showInvite = false">Send invite</button>
        </div>
      </div>
    </div>
  </div>
</template>
