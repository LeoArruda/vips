import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CleanseInspector from '../CleanseInspector.vue'
import type { BuilderNodeData } from '@/stores/builder'
import type { SchemaField } from '@/types'

const mockUpdateNodeConfig = vi.fn()
vi.mock('@/stores/builder', () => ({
  useBuilderStore: vi.fn(() => ({ updateNodeConfig: mockUpdateNodeConfig, getUpstreamSchemaPerHandle: vi.fn().mockReturnValue({}) })),
}))

const schema: SchemaField[] = [{ name: 'name', type: 'string' }, { name: 'phone', type: 'string' }]
const baseData: BuilderNodeData = { label: 'Cleanse', config: {}, nodeType: 'transform.cleanse', status: 'pending' }

describe('CleanseInspector', () => {
  beforeEach(() => mockUpdateNodeConfig.mockClear())

  it('renders without error', () => {
    expect(mount(CleanseInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } }).exists()).toBe(true)
  })

  it('adds an operation row and saves', async () => {
    const w = mount(CleanseInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } })
    await w.find('button.add-operation').trigger('click')
    await w.vm.$nextTick()
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({
      operations: expect.arrayContaining([expect.objectContaining({ operation: 'trim' })]),
    }))
  })

  it('saves updated operation when select changes', async () => {
    const data = { ...baseData, config: { operations: [{ field: 'name', operation: 'trim', params: '' }] } }
    const w = mount(CleanseInspector, { props: { data, nodeId: 'n1', upstreamSchema: schema } })
    const opSelect = w.find('select.operation-select')
    await opSelect.setValue('lowercase')
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({
      operations: expect.arrayContaining([expect.objectContaining({ operation: 'lowercase' })]),
    }))
  })
})
