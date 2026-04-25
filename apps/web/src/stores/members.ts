import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { stubMembers } from '@/data/members'
import type { Member } from '@/types/platform'

export const useMembersStore = defineStore('members', () => {
  const members = ref<Member[]>(stubMembers)

  const activeCount = computed(() =>
    members.value.filter(m => m.status === 'active').length
  )

  function findById(memberId: string): Member | undefined {
    return members.value.find(m => m.memberId === memberId)
  }

  return { members, activeCount, findById }
})
