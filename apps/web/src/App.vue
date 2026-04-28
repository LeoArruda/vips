<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppShell from '@/components/layout/AppShell.vue'

const route = useRoute()
const auth = useAuthStore()
const useShell = computed(
  () => !route.path.startsWith('/auth/') && route.path !== '/embedded',
)

onMounted(() => auth.init())
</script>

<template>
  <AppShell v-if="useShell">
    <RouterView />
  </AppShell>
  <RouterView v-else />
</template>
