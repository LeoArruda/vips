<script setup lang="ts">
import { ref } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'

defineProps<{ data: BuilderNodeData }>()

const connectorInstance = ref('')
const targetObject = ref('')
const writeMode = ref('upsert')
const matchKey = ref('')
const onError = ref('skip')
</script>

<template>
  <div class="space-y-4 p-4">
    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connection</p>
      <input v-model="connectorInstance" placeholder="🔑 Connector instance"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Object</p>
      <input v-model="targetObject" placeholder="e.g. Contact, Lead, Account"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Write Mode</p>
      <div class="flex gap-2">
        <label v-for="mode in ['upsert', 'append', 'replace']" :key="mode"
          class="flex flex-1 cursor-pointer items-center justify-center rounded-md border px-2 py-1.5 text-xs font-medium"
          :class="writeMode === mode ? 'border-foreground bg-muted' : ''">
          <input v-model="writeMode" type="radio" :value="mode" class="sr-only" />
          {{ mode }}
        </label>
      </div>
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Match Key (dedup)</p>
      <input v-model="matchKey" placeholder="e.g. email, externalId"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">On Error</p>
      <div class="flex gap-2">
        <label v-for="opt in ['skip', 'fail', 'retry']" :key="opt"
          class="flex flex-1 cursor-pointer items-center justify-center rounded-md border px-2 py-1.5 text-xs font-medium"
          :class="onError === opt ? 'border-foreground bg-muted' : ''">
          <input v-model="onError" type="radio" :value="opt" class="sr-only" />
          {{ opt }}
        </label>
      </div>
    </div>
  </div>
</template>
