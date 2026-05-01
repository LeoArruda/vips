<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkflowsStore } from '@/stores/workflows'
import { GitBranch, Clock, Webhook, Play, Plus, MoreHorizontal, Copy, Archive, Download, Loader2 } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { WorkflowSummary } from '@/types'

const router = useRouter()
const store = useWorkflowsStore()

onMounted(() => store.fetchAll())

const creating = ref(false)
const newName = ref('')
const showNameInput = ref(false)

async function startCreate() {
  showNameInput.value = true
  newName.value = 'New Workflow'
}

async function confirmCreate() {
  if (!newName.value.trim() || creating.value) return
  creating.value = true
  try {
    const wf = await store.create({ name: newName.value.trim(), trigger: { type: 'manual' } })
    showNameInput.value = false
    newName.value = ''
    router.push(`/workflows/${wf.workflowId}/builder`)
  } catch {
    // creation failed — stay on page, user can retry
  } finally {
    creating.value = false
  }
}

function cancelCreate() {
  showNameInput.value = false
  newName.value = ''
}

const triggerIcons: Record<string, Component> = {
  schedule: Clock,
  webhook: Webhook,
  manual: Play,
}

const statusColors: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-muted text-muted-foreground',
  archived: 'bg-red-100 text-red-700',
}

const runStatusColors: Record<string, string> = {
  success: 'text-green-600',
  failed: 'text-red-600',
  running: 'text-blue-600',
  pending: 'text-muted-foreground',
}

function openBuilder(wf: WorkflowSummary) {
  router.push(`/workflows/${wf.workflowId}/builder`)
}

const openMenuId = ref<string | null>(null)

function duplicate(workflowId: string) {
  const source = store.summaries.find(s => s.workflowId === workflowId)
  if (!source) return
  store.summaries.push({
    ...source,
    workflowId: `wf_${Date.now()}`,
    name: source.name + ' (copy)',
    status: 'draft' as const,
    updatedAt: new Date().toISOString(),
  })
  openMenuId.value = null
}

function archive(workflowId: string) {
  const w = store.summaries.find(s => s.workflowId === workflowId)
  if (w) w.status = 'archived' as const
  openMenuId.value = null
}

function exportWorkflow(workflowId: string) {
  const def = store.getDefinition(workflowId)
  if (!def) return
  const blob = new Blob([JSON.stringify(def, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workflow-${workflowId}.json`
  a.click()
  URL.revokeObjectURL(url)
  openMenuId.value = null
}
</script>

<template>
  <div class="h-full overflow-y-auto p-[18px]" @click="openMenuId = null">
    <div class="mb-5 flex items-center justify-between">
      <div>
        <h1 class="text-[15px] font-semibold tracking-tight">Workflows</h1>
        <p class="mt-1 text-[11.5px] text-muted-foreground">
          {{ store.summaries.length }} workflows · {{ store.publishedCount }} published
        </p>
      </div>
      <div v-if="showNameInput" class="flex items-center gap-2">
        <input
          v-model="newName"
          class="rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Workflow name"
          autofocus
          @keyup.enter="confirmCreate"
          @keyup.escape="cancelCreate"
        />
        <button
          class="flex items-center gap-1.5 rounded-[5px] bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
          :disabled="creating || !newName.trim()"
          @click="confirmCreate"
        >
          <Loader2 v-if="creating" class="h-4 w-4 animate-spin" />
          <span v-else>Create</span>
        </button>
        <button
          class="rounded-[5px] border px-3 py-2 text-sm font-medium hover:bg-muted"
          @click="cancelCreate"
        >
          Cancel
        </button>
      </div>
      <button
        v-else
        class="flex items-center gap-1.5 rounded-[5px] bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-600"
        @click="startCreate"
      >
        <Plus class="h-4 w-4" />
        New Workflow
      </button>
    </div>

    <div class="divide-y rounded-[7px] border">
      <div
        v-for="wf in store.summaries"
        :key="wf.workflowId"
        class="flex items-center gap-4 px-3 py-[7px]"
      >
        <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted">
          <GitBranch class="h-4 w-4 text-muted-foreground" />
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="truncate text-[11.5px] font-medium">{{ wf.name }}</span>
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
              :class="statusColors[wf.status]"
            >
              {{ wf.status }}
            </span>
          </div>
          <div class="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span class="flex items-center gap-1">
              <component :is="triggerIcons[wf.trigger?.type ?? 'manual'] ?? Play" class="h-3 w-3" />
              {{ wf.trigger?.type ?? 'manual' }}
              <template v-if="wf.trigger?.cron">({{ wf.trigger.cron }})</template>
            </span>
            <span
              v-if="wf.lastRunStatus"
              class="capitalize"
              :class="runStatusColors[wf.lastRunStatus] ?? ''"
            >
              Last run: {{ wf.lastRunStatus }}
            </span>
          </div>
        </div>

        <button
          class="rounded-[5px] border px-3 py-1.5 text-[11.5px] font-medium transition-colors hover:bg-muted"
          @click="openBuilder(wf)"
        >
          Open
        </button>

        <div class="relative">
          <button class="rounded-[5px] p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            @click.stop="openMenuId = openMenuId === wf.workflowId ? null : wf.workflowId">
            <MoreHorizontal class="h-4 w-4" />
          </button>
          <div v-if="openMenuId === wf.workflowId"
            class="absolute right-3 top-9 z-10 w-40 rounded-[7px] border bg-background shadow-md py-1">
            <button class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
              @click="duplicate(wf.workflowId)">
              <Copy class="h-3.5 w-3.5" /> Duplicate
            </button>
            <button class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
              @click="exportWorkflow(wf.workflowId)">
              <Download class="h-3.5 w-3.5" /> Export JSON
            </button>
            <button class="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-muted"
              @click="archive(wf.workflowId)">
              <Archive class="h-3.5 w-3.5" /> Archive
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
