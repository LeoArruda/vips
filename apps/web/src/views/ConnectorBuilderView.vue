<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const step = ref(1)
const totalSteps = 5
const stepLabels = ['Metadata', 'Auth', 'Endpoints', 'Schema', 'Test & Publish']

const metadata = ref({ name: '', category: '', description: '', version: '1.0.0' })
const auth = ref({ type: 'api-key', callbackUrl: '' })
const endpoints = ref([{ name: '', method: 'GET', urlTemplate: '', paginationType: 'none', cursorField: '' }])
const sampleResponse = ref('')
const testStatus = ref<'idle' | 'running' | 'pass' | 'fail'>('idle')

const canProceed = computed(() => {
  if (step.value === 1) return !!metadata.value.name
  if (step.value === 3) return endpoints.value.some(e => e.name && e.urlTemplate)
  return true
})

function addEndpoint() {
  endpoints.value.push({ name: '', method: 'GET', urlTemplate: '', paginationType: 'none', cursorField: '' })
}

function runTest() {
  testStatus.value = 'running'
  setTimeout(() => { testStatus.value = 'pass' }, 1200)
}

function publish() {
  router.push('/connectors')
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-6 py-4">
      <h1 class="text-xl font-semibold">Connector Builder</h1>
      <p class="mt-0.5 text-sm text-muted-foreground">Define and publish a custom connector</p>
    </div>

    <div class="flex-1 overflow-y-auto p-6 max-w-2xl">
      <!-- Stepper -->
      <div class="mb-8 flex items-center gap-1">
        <template v-for="(label, i) in stepLabels" :key="label">
          <div class="flex items-center gap-2">
            <div class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shrink-0"
              :class="i + 1 < step ? 'bg-green-500 text-white' : i + 1 === step ? 'bg-foreground text-background' : 'border text-muted-foreground'">
              {{ i + 1 }}
            </div>
            <span class="text-sm font-medium hidden sm:block"
              :class="i + 1 === step ? 'text-foreground' : 'text-muted-foreground'">{{ label }}</span>
          </div>
          <div v-if="i < stepLabels.length - 1" class="flex-1 border-t mx-2"
            :class="i + 1 < step ? 'border-green-500' : ''" />
        </template>
      </div>

      <!-- Step 1: Metadata -->
      <div v-if="step === 1" class="space-y-4">
        <h2 class="font-semibold">Connector Metadata</h2>
        <div>
          <label class="mb-1.5 block text-sm font-medium">Name <span class="text-red-500">*</span></label>
          <input v-model="metadata.name" placeholder="My Custom API"
            class="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium">Category</label>
          <select v-model="metadata.category" class="w-full rounded-md border px-3 py-2 text-sm outline-none">
            <option value="">Select category</option>
            <option>CRM</option><option>Databases</option><option>Finance</option>
            <option>Marketing</option><option>Analytics</option><option>Communication</option>
          </select>
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium">Description</label>
          <textarea v-model="metadata.description" rows="3"
            class="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium">Version</label>
          <input v-model="metadata.version" class="w-32 rounded-md border px-3 py-2 text-sm outline-none" />
        </div>
      </div>

      <!-- Step 2: Auth -->
      <div v-if="step === 2" class="space-y-4">
        <h2 class="font-semibold">Authentication</h2>
        <div>
          <label class="mb-2 block text-sm font-medium">Auth type</label>
          <div class="grid grid-cols-3 gap-2">
            <label v-for="t in ['oauth2', 'api-key', 'basic']" :key="t"
              class="flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-medium capitalize"
              :class="auth.type === t ? 'border-foreground bg-muted' : ''">
              <input v-model="auth.type" type="radio" :value="t" class="sr-only" />
              {{ t }}
            </label>
          </div>
        </div>
        <div v-if="auth.type === 'oauth2'">
          <label class="mb-1.5 block text-sm font-medium">Callback URL</label>
          <input v-model="auth.callbackUrl" placeholder="https://api.example.com/oauth/callback"
            class="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div v-if="auth.type === 'api-key'">
          <label class="mb-1.5 block text-sm font-medium">Header name</label>
          <input placeholder="X-API-Key" class="w-full rounded-md border px-3 py-2 text-sm outline-none" />
        </div>
      </div>

      <!-- Step 3: Endpoints -->
      <div v-if="step === 3" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">Endpoints</h2>
          <button class="text-sm text-muted-foreground hover:text-foreground" @click="addEndpoint">+ Add endpoint</button>
        </div>
        <div v-for="(ep, i) in endpoints" :key="i" class="rounded-lg border p-4 space-y-3">
          <div class="flex gap-2">
            <input v-model="ep.name" placeholder="Action name"
              class="flex-1 rounded-md border px-3 py-1.5 text-sm outline-none" />
            <select v-model="ep.method" class="rounded-md border px-3 py-1.5 text-sm outline-none">
              <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
            </select>
          </div>
          <input v-model="ep.urlTemplate" placeholder="https://api.example.com/v1/contacts"
            class="w-full rounded-md border px-3 py-1.5 text-sm outline-none" />
          <div class="flex gap-2">
            <select v-model="ep.paginationType" class="flex-1 rounded-md border px-3 py-1.5 text-sm outline-none">
              <option value="none">No pagination</option>
              <option value="cursor">Cursor-based</option>
              <option value="offset">Offset-based</option>
            </select>
            <input v-if="ep.paginationType === 'cursor'" v-model="ep.cursorField" placeholder="cursor field"
              class="flex-1 rounded-md border px-3 py-1.5 text-sm outline-none" />
          </div>
        </div>
      </div>

      <!-- Step 4: Schema -->
      <div v-if="step === 4" class="space-y-4">
        <h2 class="font-semibold">Schema Mapping</h2>
        <div>
          <label class="mb-1.5 block text-sm font-medium">Sample API response (JSON)</label>
          <textarea v-model="sampleResponse" rows="8"
            placeholder='{"id": "123", "email": "user@example.com"}'
            class="w-full rounded-md border px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <!-- Schema mismatch failure state -->
        <div v-if="sampleResponse && !sampleResponse.trim().startsWith('{')"
          class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Schema mismatch: expected a JSON object. Review the raw response and adjust.
        </div>
      </div>

      <!-- Step 5: Test & Publish -->
      <div v-if="step === 5" class="space-y-4">
        <h2 class="font-semibold">Test & Publish</h2>
        <p class="text-sm text-muted-foreground">Run a test against the live API to verify your connector works.</p>
        <button class="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          :disabled="testStatus === 'running'" @click="runTest">
          {{ testStatus === 'running' ? 'Running test…' : testStatus === 'pass' ? '✓ Test passed — run again' : testStatus === 'fail' ? '✗ Test failed — retry' : 'Run test' }}
        </button>
        <div v-if="testStatus === 'pass'"
          class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          All endpoints responded successfully. Ready to save or submit for certification.
        </div>
      </div>

      <!-- Navigation -->
      <div class="mt-8 flex gap-3">
        <button v-if="step > 1" class="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          @click="step--">Back</button>
        <button v-if="step < totalSteps" :disabled="!canProceed"
          class="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50 hover:bg-foreground/90"
          @click="step++">Continue</button>
        <template v-if="step === totalSteps">
          <button class="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            @click="publish">Save as draft</button>
          <button class="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
            @click="publish">Submit for certification</button>
        </template>
      </div>
    </div>
  </div>
</template>
