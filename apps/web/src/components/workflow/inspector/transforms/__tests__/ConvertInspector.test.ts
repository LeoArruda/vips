import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ConvertInspector from '../ConvertInspector.vue'
import type { BuilderNodeData } from '@/stores/builder'
import type { SchemaField } from '@/types'

const mockUpdateNodeConfig = vi.fn()
vi.mock('@/stores/builder', () => ({
  useBuilderStore: vi.fn(() => ({ updateNodeConfig: mockUpdateNodeConfig, getUpstreamSchemaPerHandle: vi.fn().mockReturnValue({}) })),
}))

const schema: SchemaField[] = [{ name: 'created_at', type: 'string' }]
const baseData: BuilderNodeData = { label: 'Convert', config: {}, nodeType: 'transform.convert', status: 'pending' }

describe('ConvertInspector', () => {
  beforeEach(() => mockUpdateNodeConfig.mockClear())

  it('renders without error', () => {
    expect(mount(ConvertInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } }).exists()).toBe(true)
  })

  it('adds a conversion row and saves it', async () => {
    const w = mount(ConvertInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } })
    await w.find('button.add-conversion').trigger('click')
    await w.vm.$nextTick()
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({
      conversions: expect.arrayContaining([expect.objectContaining({ targetType: 'string' })]),
    }))
  })
})
