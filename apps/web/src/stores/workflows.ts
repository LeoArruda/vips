import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { workflowSummaries, workflowDefinitions } from '@/data/workflows'
import type { WorkflowSummary, WorkflowDefinition } from '@/types'

export const useWorkflowsStore = defineStore('workflows', () => {
  const summaries = ref<WorkflowSummary[]>(workflowSummaries)
  const definitions = ref<WorkflowDefinition[]>(workflowDefinitions)

  const publishedCount = computed(
    () => summaries.value.filter((w) => w.status === 'published').length,
  )

  function getDefinition(workflowId: string): WorkflowDefinition | undefined {
    return definitions.value.find((d) => d.workflowId === workflowId)
  }

  function getSummary(workflowId: string): WorkflowSummary | undefined {
    return summaries.value.find((s) => s.workflowId === workflowId)
  }

  return { summaries, definitions, publishedCount, getDefinition, getSummary }
})
