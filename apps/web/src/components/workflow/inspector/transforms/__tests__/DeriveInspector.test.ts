import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import DeriveInspector from '../DeriveInspector.vue'
import type { BuilderNodeData } from '@/stores/builder'
import type { SchemaField } from '@/types'

const mockUpdateNodeConfig = vi.fn()
vi.mock('@/stores/builder', () => ({
  useBuilderStore: vi.fn(() => ({ updateNodeConfig: mockUpdateNodeConfig, getUpstreamSchemaPerHandle: vi.fn().mockReturnValue({}) })),
}))

const schema: SchemaField[] = [{ name: 'price', type: 'number' }, { name: 'qty', type: 'number' }]
const baseData: BuilderNodeData = { label: 'Derive', config: {}, nodeType: 'transform.derive', status: 'pending' }

describe('DeriveInspector', () => {
  beforeEach(() => mockUpdateNodeConfig.mockClear())

  it('renders without error', () => {
    expect(mount(DeriveInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } }).exists()).toBe(true)
  })

  it('adds a formula row with default values and saves', async () => {
    const w = mount(DeriveInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } })
    await w.find('button.add-formula').trigger('click')
    await w.vm.$nextTick()
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({
      formulas: expect.arrayContaining([expect.objectContaining({ outputField: '', expression: '' })]),
    }))
  })

  it('saves outputField name when input changes', async () => {
    const w = mount(DeriveInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } })
    await w.find('button.add-formula').trigger('click')
    await w.vm.$nextTick()
    const input = w.find('input.output-field-name')
    await input.setValue('total')
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({
      formulas: expect.arrayContaining([expect.objectContaining({ outputField: 'total' })]),
    }))
  })
})
