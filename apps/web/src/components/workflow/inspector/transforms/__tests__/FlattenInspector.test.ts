import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FlattenInspector from '../FlattenInspector.vue'
import type { BuilderNodeData } from '@/stores/builder'
import type { SchemaField } from '@/types'

const mockUpdateNodeConfig = vi.fn()
vi.mock('@/stores/builder', () => ({
  useBuilderStore: vi.fn(() => ({ updateNodeConfig: mockUpdateNodeConfig, getUpstreamSchemaPerHandle: vi.fn().mockReturnValue({}) })),
}))

const schema: SchemaField[] = [{ name: 'address', type: 'object' }]
const baseData: BuilderNodeData = { label: 'Flatten JSON', config: {}, nodeType: 'transform.flatten', status: 'pending' }

describe('FlattenInspector', () => {
  beforeEach(() => mockUpdateNodeConfig.mockClear())

  it('renders without error', () => {
    expect(mount(FlattenInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } }).exists()).toBe(true)
  })

  it('adds a path entry and saves', async () => {
    const w = mount(FlattenInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } })
    await w.find('button.add-path').trigger('click')
    await w.vm.$nextTick()
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({
      paths: expect.arrayContaining(['']),
    }))
  })

  it('saves explodeArrays when checkbox toggled', async () => {
    const w = mount(FlattenInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } })
    await w.find('input[type="checkbox"]').setValue(true)
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({ explodeArrays: true }))
  })
})
