import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import LookupInspector from '../LookupInspector.vue'
import type { BuilderNodeData } from '@/stores/builder'
import type { SchemaField } from '@/types'

const mockUpdateNodeConfig = vi.fn()
vi.mock('@/stores/builder', () => ({
  useBuilderStore: vi.fn(() => ({ updateNodeConfig: mockUpdateNodeConfig, getUpstreamSchemaPerHandle: vi.fn().mockReturnValue({}) })),
}))

const schema: SchemaField[] = [{ name: 'country_code', type: 'string' }]
const baseData: BuilderNodeData = { label: 'Lookup', config: {}, nodeType: 'transform.lookup', status: 'pending' }

describe('LookupInspector', () => {
  beforeEach(() => mockUpdateNodeConfig.mockClear())

  it('renders without error', () => {
    expect(mount(LookupInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } }).exists()).toBe(true)
  })

  it('initializes lookupKey from config', () => {
    const data = { ...baseData, config: { lookupKey: 'country_code' } }
    const w = mount(LookupInspector, { props: { data, nodeId: 'n1', upstreamSchema: schema } })
    expect((w.find('select.lookup-key-select').element as HTMLSelectElement).value).toBe('country_code')
  })

  it('saves lookupKey when select changes', async () => {
    const w = mount(LookupInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } })
    await w.find('select.lookup-key-select').setValue('country_code')
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({ lookupKey: 'country_code' }))
  })

  it('adds an enrich-field row and saves', async () => {
    const w = mount(LookupInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } })
    await w.find('button.add-enrich').trigger('click')
    await w.vm.$nextTick()
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({
      enrichFields: expect.arrayContaining([expect.objectContaining({ sourceField: '', targetField: '' })]),
    }))
  })
})
