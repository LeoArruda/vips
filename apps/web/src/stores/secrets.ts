import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { stubSecrets } from '@/data/secrets'
import type { Secret, SecretScope } from '@/types/platform'

export const useSecretsStore = defineStore('secrets', () => {
  const secrets = ref<Secret[]>(stubSecrets)

  const rotationAlertCount = computed(() =>
    secrets.value.filter(s => s.rotationState !== 'ok').length
  )

  function byScope(scope: SecretScope) {
    return secrets.value.filter(s => s.scope === scope)
  }

  return { secrets, rotationAlertCount, byScope }
})
