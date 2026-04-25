<!-- apps/web/src/views/OnboardingView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const step = ref(1)

const org = ref({ name: '', industry: '', teamSize: '' })
const workspace = ref({ name: '', env: 'dev' })
const invites = ref([{ email: '', role: 'builder' }])

const industries = ['Technology', 'Finance', 'Healthcare', 'Retail', 'Education', 'Other']

function addInvite() {
  invites.value.push({ email: '', role: 'builder' })
}

function finish() {
  auth.completeOnboarding()
  router.push('/dashboard')
}

function nextStep() {
  if (step.value < 4) step.value++
  else finish()
}

function skip() {
  if (step.value < 4) step.value++
  else finish()
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/40">
    <div class="w-full max-w-lg rounded-[7px] border bg-background p-8 shadow-sm">

      <!-- Stepper -->
      <div class="mb-8 flex items-center gap-2">
        <template v-for="n in 4" :key="n">
          <div
            class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
            :class="n <= step ? 'bg-indigo-500 text-white' : 'border text-muted-foreground'"
          >{{ n }}</div>
          <div v-if="n < 4" class="flex-1 border-t" :class="n < step ? 'border-foreground' : ''" />
        </template>
      </div>

      <!-- Step 1: Organization -->
      <div v-if="step === 1">
        <h2 class="text-lg font-semibold">Create your organization</h2>
        <p class="mb-4 mt-1 text-sm text-muted-foreground">This is required to continue.</p>
        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-sm font-medium">Organization name <span class="text-red-500">*</span></label>
            <input v-model="org.name" type="text" placeholder="Acme Corp"
              class="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Industry</label>
            <select v-model="org.industry" class="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select industry</option>
              <option v-for="i in industries" :key="i" :value="i">{{ i }}</option>
            </select>
          </div>
        </div>
        <button :disabled="!org.name"
          class="mt-6 w-full rounded-[5px] bg-indigo-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-indigo-600"
          @click="nextStep">Continue</button>
      </div>

      <!-- Step 2: Workspace -->
      <div v-if="step === 2">
        <h2 class="text-lg font-semibold">Create your first workspace</h2>
        <p class="mb-4 mt-1 text-sm text-muted-foreground">Workspaces group your workflows and connectors.</p>
        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-sm font-medium">Workspace name</label>
            <input v-model="workspace.name" type="text" placeholder="Production"
              class="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Environment</label>
            <div class="flex gap-2">
              <label v-for="env in ['dev', 'staging', 'prod']" :key="env"
                class="flex flex-1 cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-medium"
                :class="workspace.env === env ? 'border-foreground bg-muted' : ''">
                <input v-model="workspace.env" type="radio" :value="env" class="sr-only" />
                {{ env }}
              </label>
            </div>
          </div>
        </div>
        <div class="mt-6 flex gap-2">
          <button class="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted" @click="skip">Skip</button>
          <button class="flex-1 rounded-[5px] bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600" @click="nextStep">Continue</button>
        </div>
      </div>

      <!-- Step 3: Invite team -->
      <div v-if="step === 3">
        <h2 class="text-lg font-semibold">Invite your team</h2>
        <p class="mb-4 mt-1 text-sm text-muted-foreground">Add teammates by email. You can do this later too.</p>
        <div class="space-y-2">
          <div v-for="(invite, i) in invites" :key="i" class="flex gap-2">
            <input v-model="invite.email" type="email" placeholder="colleague@company.com"
              class="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <select v-model="invite.role" class="rounded-md border px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="admin">Admin</option>
              <option value="builder">Builder</option>
              <option value="operator">Operator</option>
            </select>
          </div>
          <button class="text-sm text-muted-foreground underline" @click="addInvite">+ Add another</button>
        </div>
        <div class="mt-6 flex gap-2">
          <button class="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted" @click="skip">Skip</button>
          <button class="flex-1 rounded-[5px] bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600" @click="nextStep">Send invites</button>
        </div>
      </div>

      <!-- Step 4: First connector -->
      <div v-if="step === 4">
        <h2 class="text-lg font-semibold">Connect your first system</h2>
        <p class="mb-4 mt-1 text-sm text-muted-foreground">Pick a connector to get started. You can add more later.</p>
        <div class="grid grid-cols-3 gap-2">
          <button v-for="connector in ['Postgres', 'Salesforce', 'HubSpot', 'BigQuery', 'Stripe', 'Slack']" :key="connector"
            class="rounded-md border p-3 text-sm font-medium hover:bg-muted"
            @click="finish">
            {{ connector }}
          </button>
        </div>
        <div class="mt-6 flex gap-2">
          <button class="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted" @click="finish">Skip for now</button>
        </div>
      </div>

    </div>
  </div>
</template>
