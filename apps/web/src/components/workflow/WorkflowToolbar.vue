<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { Play, Save, Rocket, Loader2, Check, CheckCircle2, XCircle } from 'lucide-vue-next'
import { useBuilderStore } from '@/stores/builder'
import { useWorkflowsStore } from '@/stores/workflows'
import { useRunsStore } from '@/stores/runs'

const builderStore = useBuilderStore()
const workflowsStore = useWorkflowsStore()
const runsStore = useRunsStore()

const isRunning = ref(false)
const isSaving = ref(false)
const saveOk = ref(false)
const runError = ref<string | null>(null)
const runResult = ref<'success' | 'failed' | null>(null)
let pollCancelled = false
onUnmounted(() => { pollCancelled = true })

async function save() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    await builderStore.saveWorkflow()
    saveOk.value = true
    setTimeout(() => { saveOk.value = false }, 2000)
  } finally {
    isSaving.value = false
  }
}

async function publish() {
  isSaving.value = true
  try {
    await builderStore.publishWorkflow()
    saveOk.value = true
    setTimeout(() => { saveOk.value = false }, 2000)
  } finally {
    isSaving.value = false
  }
}

const workflow = computed(() =>
  builderStore.currentWorkflowId
    ? workflowsStore.getSummary(builderStore.currentWorkflowId)
    : null,
)

const statusColors: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-muted text-muted-foreground',
  archived: 'bg-red-100 text-red-700',
}

async function triggerRun() {
  if (!builderStore.currentWorkflowId || isRunning.value) return
  isRunning.value = true
  runError.value = null
  runResult.value = null
  builderStore.resetNodeStatuses()

  try {
    const run = await runsStore.triggerRun(builderStore.currentWorkflowId)
    if (!run) throw new Error('Run could not be started')

    pollCancelled = false
    // Poll until terminal state — max 2 minutes (60 × 2s)
    for (let i = 0; i < 60; i++) {
      await new Promise<void>((resolve) => setTimeout(resolve, 2000))
      if (pollCancelled) break

      const detail = await runsStore.fetchDetail(run.id)
      if (!detail || pollCancelled) break

      builderStore.applyRunLogs(detail.logs)

      if (detail.status === 'success') {
        builderStore.setAllNodeStatus('success')
        runResult.value = 'success'
        break
      }
      if (detail.status === 'failed') {
        builderStore.setAllNodeStatus('failed')
        runResult.value = 'failed'
        runError.value = 'Run failed — check node logs'
        break
      }
    }
  } catch (err) {
    runError.value = err instanceof Error ? err.message : 'Run failed'
    builderStore.setAllNodeStatus('failed')
  } finally {
    isRunning.value = false
  }
}
</script>

<template>
  <div class="flex h-12 flex-shrink-0 items-center justify-between border-b bg-background px-4">
    <div class="flex items-center gap-2.5">
      <span class="text-[11.5px] font-semibold">
        {{ workflow?.name ?? 'Workflow Builder' }}
      </span>
      <span
        v-if="workflow"
        class="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
        :class="statusColors[workflow.status] ?? 'bg-muted text-muted-foreground'"
      >
        {{ workflow.status }}
      </span>
    </div>

    <div class="flex items-center gap-2">
      <span v-if="runError" class="text-xs text-red-500">{{ runError }}</span>
      <button
        class="flex items-center gap-1.5 rounded-[5px] px-3 py-[5px] text-[11.5px] font-medium transition-colors hover:bg-muted disabled:opacity-40"
        :class="saveOk ? 'text-green-600' : 'text-muted-foreground'"
        :disabled="!builderStore.currentWorkflowId || isSaving"
        title="Save workflow"
        @click="save"
      >
        <Check v-if="saveOk" class="h-3.5 w-3.5" />
        <Loader2 v-else-if="isSaving" class="h-3.5 w-3.5 animate-spin" />
        <Save v-else class="h-3.5 w-3.5" />
        Save
      </button>
      <button
        class="flex items-center gap-1.5 rounded-[5px] px-3 py-[5px] text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
        :disabled="!builderStore.currentWorkflowId || isSaving"
        title="Save and publish workflow"
        @click="publish"
      >
        <Rocket class="h-3.5 w-3.5" />
        Publish
      </button>
      <button
        class="flex items-center gap-1.5 rounded-[5px] px-3 py-[5px] text-[11.5px] font-medium text-white transition-opacity disabled:opacity-50"
        :class="{
          'bg-green-500 hover:bg-green-600': runResult === 'success',
          'bg-red-500 hover:bg-red-600': runResult === 'failed',
          'bg-indigo-500 hover:bg-indigo-600': !runResult,
        }"
        :disabled="isRunning || !builderStore.currentWorkflowId || builderStore.nodes.length === 0"
        @click="triggerRun"
      >
        <Loader2 v-if="isRunning" class="h-3.5 w-3.5 animate-spin" />
        <CheckCircle2 v-else-if="runResult === 'success'" class="h-3.5 w-3.5" />
        <XCircle v-else-if="runResult === 'failed'" class="h-3.5 w-3.5" />
        <Play v-else class="h-3.5 w-3.5" />
        {{ isRunning ? 'Running…' : runResult === 'success' ? 'Done' : runResult === 'failed' ? 'Failed' : 'Run' }}
      </button>
    </div>
  </div>
</template>
