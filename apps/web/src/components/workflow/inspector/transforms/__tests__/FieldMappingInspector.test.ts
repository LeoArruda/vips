import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FieldMappingInspector from '../FieldMappingInspector.vue'
import type { BuilderNodeData } from '@/stores/builder'
import type { SchemaField } from '@/types'

const mockUpdateNodeConfig = vi.fn()
vi.mock('@/stores/builder', () => ({
  useBuilderStore: vi.fn(() => ({
    updateNodeConfig: mockUpdateNodeConfig,
    getUpstreamSchemaPerHandle: vi.fn().mockReturnValue({}),
  })),
}))

const baseData: BuilderNodeData = { label: 'Map Fields', config: {}, nodeType: 'transform.map', status: 'pending' }
const schema: SchemaField[] = [{ name: 'id', type: 'number' }, { name: 'email', type: 'string' }]

describe('FieldMappingInspector', () => {
  beforeEach(() => mockUpdateNodeConfig.mockClear())

  it('renders without error', () => {
    const w = mount(FieldMappingInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } })
    expect(w.exists()).toBe(true)
  })

  it('initializes strictMode from props.data.config', () => {
    const data = { ...baseData, config: { strictMode: true } }
    const w = mount(FieldMappingInspector, { props: { data, nodeId: 'n1', upstreamSchema: schema } })
    const checkbox = w.find('input[type="checkbox"]')
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)
  })

  it('calls updateNodeConfig with mappings array when source field is changed', async () => {
    const w = mount(FieldMappingInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } })
    await w.find('button.add-mapping').trigger('click')
    await w.vm.$nextTick()
    const select = w.find('select.source-field')
    await select.setValue('email')
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({
      mappings: expect.arrayContaining([expect.objectContaining({ sourceField: 'email' })]),
    }))
  })

  it('calls updateNodeConfig with errorMode when error tab select changes', async () => {
    const w = mount(FieldMappingInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } })
    await w.find('[data-tab="errors"]').trigger('click')
    await w.vm.$nextTick()
    await w.find('select.error-mode').setValue('warn')
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({ errorMode: 'warn' }))
  })
})
