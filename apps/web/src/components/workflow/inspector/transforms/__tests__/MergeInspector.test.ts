import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MergeInspector from '../MergeInspector.vue'
import type { BuilderNodeData } from '@/stores/builder'
import type { SchemaField } from '@/types'

const mockUpdateNodeConfig = vi.fn()
vi.mock('@/stores/builder', () => ({
  useBuilderStore: vi.fn(() => ({ updateNodeConfig: mockUpdateNodeConfig, getUpstreamSchemaPerHandle: vi.fn().mockReturnValue({}) })),
}))

const schema: SchemaField[] = [{ name: 'id', type: 'number' }, { name: 'name', type: 'string' }]
const baseData: BuilderNodeData = { label: 'Merge', config: {}, nodeType: 'transform.merge', status: 'pending' }

describe('MergeInspector', () => {
  beforeEach(() => mockUpdateNodeConfig.mockClear())

  it('renders without error', () => {
    expect(mount(MergeInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } }).exists()).toBe(true)
  })

  it('initializes strategy from config', () => {
    const data = { ...baseData, config: { strategy: 'insert-only' } }
    const w = mount(MergeInspector, { props: { data, nodeId: 'n1', upstreamSchema: schema } })
    expect((w.find('select.strategy-select').element as HTMLSelectElement).value).toBe('insert-only')
  })

  it('saves with new strategy when select changes', async () => {
    const w = mount(MergeInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } })
    await w.find('select.strategy-select').setValue('update-only')
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({ strategy: 'update-only' }))
  })

  it('saves with matchKey when key picker changes', async () => {
    const w = mount(MergeInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: schema } })
    await w.find('select.match-key-select').setValue('id')
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({ matchKey: 'id' }))
  })
})
