import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import UnionInspector from '../UnionInspector.vue'
import type { BuilderNodeData } from '@/stores/builder'

const mockUpdateNodeConfig = vi.fn()
vi.mock('@/stores/builder', () => ({
  useBuilderStore: vi.fn(() => ({ updateNodeConfig: mockUpdateNodeConfig, getUpstreamSchemaPerHandle: vi.fn().mockReturnValue({}) })),
}))

const baseData: BuilderNodeData = { label: 'Union', config: {}, nodeType: 'transform.union', status: 'pending' }

describe('UnionInspector', () => {
  beforeEach(() => mockUpdateNodeConfig.mockClear())

  it('renders without error', () => {
    expect(mount(UnionInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: [] } }).exists()).toBe(true)
  })

  it('initializes deduplicate from config', () => {
    const data = { ...baseData, config: { deduplicate: true } }
    const w = mount(UnionInspector, { props: { data, nodeId: 'n1', upstreamSchema: [] } })
    expect((w.find('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(true)
  })

  it('saves deduplicate:true when checkbox toggled on', async () => {
    const w = mount(UnionInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: [] } })
    await w.find('input[type="checkbox"]').setValue(true)
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({ deduplicate: true }))
  })
})
