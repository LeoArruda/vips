import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import JoinInspector from '../JoinInspector.vue'
import type { BuilderNodeData } from '@/stores/builder'
import type { SchemaField } from '@/types'

const mockUpdateNodeConfig = vi.fn()
const mockGetUpstreamSchemaPerHandle = vi.fn().mockReturnValue({
  'input-left': [{ name: 'user_id', type: 'number' }] as SchemaField[],
  'input-right': [{ name: 'order_user_id', type: 'number' }] as SchemaField[],
})
vi.mock('@/stores/builder', () => ({
  useBuilderStore: vi.fn(() => ({ updateNodeConfig: mockUpdateNodeConfig, getUpstreamSchemaPerHandle: mockGetUpstreamSchemaPerHandle })),
}))

const baseData: BuilderNodeData = { label: 'Join', config: {}, nodeType: 'transform.join', status: 'pending' }

describe('JoinInspector', () => {
  beforeEach(() => mockUpdateNodeConfig.mockClear())

  it('renders without error', () => {
    expect(mount(JoinInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: [] } }).exists()).toBe(true)
  })

  it('initializes joinType from config', () => {
    const data = { ...baseData, config: { joinType: 'left' } }
    const w = mount(JoinInspector, { props: { data, nodeId: 'n1', upstreamSchema: [] } })
    expect((w.find('select.join-type').element as HTMLSelectElement).value).toBe('left')
  })

  it('saves with new joinType when select changes', async () => {
    const w = mount(JoinInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: [] } })
    await w.find('select.join-type').setValue('right')
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({ joinType: 'right' }))
  })
})
