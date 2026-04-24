import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { stubMonitoringStats, stubLiveRuns } from '@/data/monitoring'

export const useMonitoringStore = defineStore('monitoring', () => {
  const stats = ref({ ...stubMonitoringStats })
  const liveRuns = ref([...stubLiveRuns])
  const degradedWorkerCount = computed(() =>
    stats.value.workers.filter(w => w.health !== 'healthy').length
  )
  return { stats, liveRuns, degradedWorkerCount }
})
