import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FilterInspector from '../FilterInspector.vue'
import type { BuilderNodeData } from '@/stores/builder'

const mockUpdateNodeConfig = vi.fn()
vi.mock('@/stores/builder', () => ({
  useBuilderStore: vi.fn(() => ({ updateNodeConfig: mockUpdateNodeConfig, getUpstreamSchemaPerHandle: vi.fn().mockReturnValue({}) })),
}))

const baseData: BuilderNodeData = { label: 'Filter', config: {}, nodeType: 'transform.filter', status: 'pending' }

describe('FilterInspector', () => {
  beforeEach(() => mockUpdateNodeConfig.mockClear())

  it('renders without error', () => {
    expect(mount(FilterInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: [] } }).exists()).toBe(true)
  })

  it('initializes logic from config', () => {
    const data = { ...baseData, config: { logic: 'OR' } }
    const w = mount(FilterInspector, { props: { data, nodeId: 'n1', upstreamSchema: [] } })
    expect((w.find('select.logic-select').element as HTMLSelectElement).value).toBe('OR')
  })

  it('saves with updated logic when select changes', async () => {
    const w = mount(FilterInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: [] } })
    await w.find('select.logic-select').setValue('OR')
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({ logic: 'OR' }))
  })

  it('adds a condition row and saves', async () => {
    const w = mount(FilterInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: [] } })
    await w.find('button.add-condition').trigger('click')
    await w.vm.$nextTick()
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({
      conditions: expect.arrayContaining([expect.objectContaining({ operator: '=' })]),
    }))
  })
})
