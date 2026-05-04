import { computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import { useBuilderStore } from '@/stores/builder'
import type { SchemaField } from '@/types'

export function useUpstreamSchema(nodeId: Ref<string>): ComputedRef<SchemaField[]> {
  const store = useBuilderStore()
  return computed(() => store.getUpstreamSchema(nodeId.value))
}
