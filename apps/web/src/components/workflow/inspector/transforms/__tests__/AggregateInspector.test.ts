import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import AggregateInspector from '../AggregateInspector.vue'
import type { BuilderNodeData } from '@/stores/builder'
import type { SchemaField } from '@/types'

const mockUpdateNodeConfig = vi.fn()
vi.mock('@/stores/builder', () => ({
  useBuilderStore: vi.fn(() => ({ updateNodeConfig: mockUpdateNodeConfig, getUpstreamSchemaPerHandle: vi.fn().mockReturnValue({}) })),
}))

const schema: SchemaField[] = [{ name: 'region', type: 'string' }, { name: 'revenue', type: 'number' }]
const baseData: BuilderNodeData = { label: 'Aggregate', config: {}, nodeType: 'transform.aggregate', status: 'pending' }

describe('AggregateInspector', () => {
  beforeEach(() => mockUpdateNodeConfig.mockClear())

  it('renders without error', () => {
    expect(mount(AggregateInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } }).exists()).toBe(true)
  })

  it('adds a groupBy field and saves', async () => {
    const w = mount(AggregateInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } })
    await w.find('select.groupby-select').setValue('region')
    await w.find('button.add-groupby').trigger('click')
    await w.vm.$nextTick()
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({
      groupBy: expect.arrayContaining(['region']),
    }))
  })

  it('adds an aggregation row and saves', async () => {
    const w = mount(AggregateInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } })
    await w.find('button.add-aggregation').trigger('click')
    await w.vm.$nextTick()
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({
      aggregations: expect.arrayContaining([expect.objectContaining({ function: 'count' })]),
    }))
  })
})
