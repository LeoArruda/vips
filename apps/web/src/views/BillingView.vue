<script setup lang="ts">
import { stubBilling } from '@/data/billing'
import { TrendingUp } from 'lucide-vue-next'

const billing = stubBilling

function usagePercent(used: number, limit: number): number {
  return Math.min(Math.round((used / limit) * 100), 100)
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-[18px] py-[11px]">
      <h1 class="text-[15px] font-semibold tracking-tight">Billing & Usage</h1>
    </div>

    <div class="flex-1 overflow-y-auto p-[18px] space-y-3 max-w-2xl">
      <div class="rounded-[7px] border p-[11px]">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Plan</p>
            <p class="mt-1 text-2xl font-bold">{{ billing.plan }}</p>
          </div>
          <button class="rounded-[5px] bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600">
            Upgrade
          </button>
        </div>
        <div class="mt-3 flex gap-6 text-sm text-muted-foreground">
          <span>Renews {{ billing.renewsAt }}</span>
          <span>{{ billing.seatCount }} seats</span>
        </div>
      </div>

      <div>
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Usage</h2>
        <div class="space-y-4">
          <div v-for="meter in billing.meters" :key="meter.dimension">
            <div class="mb-1.5 flex items-center justify-between text-sm">
              <span class="font-medium">{{ meter.dimension }}</span>
              <span class="text-muted-foreground">
                {{ meter.used.toLocaleString() }} / {{ meter.limit.toLocaleString() }} {{ meter.unit }}
              </span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-muted">
              <div class="h-full rounded-full transition-all"
                :class="usagePercent(meter.used, meter.limit) >= 90 ? 'bg-red-500' : usagePercent(meter.used, meter.limit) >= 70 ? 'bg-amber-500' : 'bg-green-500'"
                :style="{ width: usagePercent(meter.used, meter.limit) + '%' }" />
            </div>
            <div v-if="usagePercent(meter.used, meter.limit) >= 90"
              class="mt-1 flex items-center gap-1 text-xs text-red-600">
              <TrendingUp class="h-3 w-3" /> Approaching limit — consider upgrading
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
