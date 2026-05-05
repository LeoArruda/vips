import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CodeInspector from '../CodeInspector.vue'
import type { BuilderNodeData } from '@/stores/builder'

const mockUpdateNodeConfig = vi.fn()
vi.mock('@/stores/builder', () => ({
  useBuilderStore: vi.fn(() => ({ updateNodeConfig: mockUpdateNodeConfig, getUpstreamSchemaPerHandle: vi.fn().mockReturnValue({}) })),
}))

const baseData: BuilderNodeData = { label: 'Code Step', config: {}, nodeType: 'transform.code', status: 'pending' }

describe('CodeInspector', () => {
  beforeEach(() => mockUpdateNodeConfig.mockClear())

  it('renders without error', () => {
    expect(mount(CodeInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: [] } }).exists()).toBe(true)
  })

  it('initializes code from config', () => {
    const data = { ...baseData, config: { code: 'return records' } }
    const w = mount(CodeInspector, { props: { data, nodeId: 'n1', upstreamSchema: [] } })
    expect((w.find('textarea.code-editor').element as HTMLTextAreaElement).value).toBe('return records')
  })

  it('saves code when textarea changes', async () => {
    const w = mount(CodeInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: [] } })
    await w.find('textarea.code-editor').setValue('return records.filter(r => r.active)')
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({
      code: 'return records.filter(r => r.active)',
    }))
  })

  it('saves timeout when input changes', async () => {
    const w = mount(CodeInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: [] } })
    await w.find('input.timeout-input').setValue('60')
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({
      timeoutSeconds: 60,
    }))
  })

  it('adds a declared output field and saves', async () => {
    const w = mount(CodeInspector, { props: { data: baseData, nodeId: 'n1', upstreamSchema: [] } })
    await w.find('[data-tab="output"]').trigger('click')
    await w.vm.$nextTick()
    await w.find('button.add-output-field').trigger('click')
    await w.vm.$nextTick()
    expect(mockUpdateNodeConfig).toHaveBeenCalledWith('n1', expect.objectContaining({
      declaredOutputSchema: expect.arrayContaining([expect.objectContaining({ name: '', type: 'unknown' })]),
    }))
  })
})
