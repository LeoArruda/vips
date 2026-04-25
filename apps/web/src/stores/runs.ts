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

  function retryNode(runId: string, nodeId: string) {
    const run = details.value.find(r => r.runId === runId)
    if (!run) return
    const node = run.nodes.find(n => n.nodeId === nodeId)
    if (node) {
      node.status = 'running'
      setTimeout(() => {
        if (node) node.status = 'success'
      }, 1500)
    }
  }

  return { records, details, getDetail, getByWorkflow, retryNode }
})
