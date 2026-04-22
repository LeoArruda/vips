import { defineStore } from 'pinia'
import { ref } from 'vue'
import { runRecords, runDetails } from '@/data/runs'
import type { RunRecord, RunDetail } from '@/types'

export const useRunsStore = defineStore('runs', () => {
  const records = ref<RunRecord[]>(runRecords)
  const details = ref<RunDetail[]>(runDetails)

  function getDetail(runId: string): RunDetail | undefined {
    return details.value.find((d) => d.runId === runId)
  }

  function getByWorkflow(workflowId: string): RunRecord[] {
    return records.value.filter((r) => r.workflowId === workflowId)
  }

  return { records, details, getDetail, getByWorkflow }
})
