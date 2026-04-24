import { defineStore } from 'pinia'
import { ref } from 'vue'
import { stubEnvironments } from '@/data/environments'
import type { Environment } from '@/types/operations'

export const useEnvironmentsStore = defineStore('environments', () => {
  const environments = ref<Environment[]>(stubEnvironments)
  function findById(envId: string): Environment | undefined {
    return environments.value.find(e => e.envId === envId)
  }
  return { environments, findById }
})
