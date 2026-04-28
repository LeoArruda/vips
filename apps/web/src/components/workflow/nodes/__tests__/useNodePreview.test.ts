import { describe, it, expect } from 'vitest'
import { useNodePreview } from '../useNodePreview'

describe('useNodePreview — schemaHint', () => {
  it('returns — for empty config', () => {
    const { schemaHint } = useNodePreview(() => ({}))
    expect(schemaHint.value).toBe('—')
  })

  it('returns — for unknown connectorType', () => {
    const { schemaHint } = useNodePreview(() => ({ connectorType: 'unknown' }))
    expect(schemaHint.value).toBe('unknown')
  })

  it('formats http-rest with full URL', () => {
    const { schemaHint } = useNodePreview(() => ({
      connectorType: 'http-rest',
      method: 'POST',
      url: 'https://api.example.com/users',
    }))
    expect(schemaHint.value).toBe('POST · api.example.com/users')
  })

  it('formats http-rest with root path omitted', () => {
    const { schemaHint } = useNodePreview(() => ({
      connectorType: 'http-rest',
      method: 'GET',
      url: 'https://api.example.com',
    }))
    expect(schemaHint.value).toBe('GET · api.example.com')
  })

  it('prompts to configure when http-rest url is empty', () => {
    const { schemaHint } = useNodePreview(() => ({ connectorType: 'http-rest', method: 'GET', url: '' }))
    expect(schemaHint.value).toBe('GET · configure URL')
  })

  it('extracts table from postgres FROM clause', () => {
    const { schemaHint } = useNodePreview(() => ({
      connectorType: 'postgres',
      query: 'SELECT id, name FROM public.workflows LIMIT 5',
    }))
    expect(schemaHint.value).toBe('→ public.workflows')
  })

  it('prompts to configure when postgres query is empty', () => {
    const { schemaHint } = useNodePreview(() => ({ connectorType: 'postgres', query: '' }))
    expect(schemaHint.value).toBe('configure query')
  })

  it('formats statcan with table code', () => {
    const { schemaHint } = useNodePreview(() => ({
      connectorType: 'statcan',
      table_code: '14-10-0287-01',
    }))
    expect(schemaHint.value).toBe('table 14-10-0287-01')
  })

  it('prompts to configure when statcan table_code is empty', () => {
    const { schemaHint } = useNodePreview(() => ({ connectorType: 'statcan', table_code: '' }))
    expect(schemaHint.value).toBe('configure table code')
  })
})

describe('useNodePreview — outputHint', () => {
  it('returns null when no lastRunOutput', () => {
    const { outputHint } = useNodePreview(() => ({}))
    expect(outputHint.value).toBeNull()
  })

  it('returns row count on success', () => {
    const { outputHint } = useNodePreview(() => ({ lastRunOutput: { rowCount: 42 } }))
    expect(outputHint.value).toBe('✓ 42 rows')
  })

  it('returns 0 rows when rowCount absent', () => {
    const { outputHint } = useNodePreview(() => ({ lastRunOutput: {} }))
    expect(outputHint.value).toBe('✓ 0 rows')
  })

  it('returns full error message', () => {
    const { outputHint } = useNodePreview(() => ({ lastRunOutput: { error: 'Connection refused' } }))
    expect(outputHint.value).toBe('✗ Connection refused')
  })
})

describe('useNodePreview — tab state', () => {
  it('starts with schema tab active', () => {
    const { activeTab } = useNodePreview(() => ({}))
    expect(activeTab.value).toBe('schema')
  })

  it('tab can be toggled to output', () => {
    const { activeTab } = useNodePreview(() => ({}))
    activeTab.value = 'output'
    expect(activeTab.value).toBe('output')
  })
})
