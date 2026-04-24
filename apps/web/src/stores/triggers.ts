import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { stubTriggers } from '@/data/triggers'
import type { TriggerConfig } from '@/types/platform'

export const useTriggersStore = defineStore('triggers', () => {
  const triggers = ref<TriggerConfig[]>(stubTriggers)

  const enabled = computed(() => triggers.value.filter(t => t.enabled))

  function toggle(triggerId: string) {
    const t = triggers.value.find(t => t.triggerId === triggerId)
    if (t) t.enabled = !t.enabled
  }

  return { triggers, enabled, toggle }
})
