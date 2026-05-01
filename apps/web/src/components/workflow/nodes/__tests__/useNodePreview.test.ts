import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNodePreview } from '../useNodePreview'
import { useBuilderStore } from '@/stores/builder'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('useNodePreview — schemaHint', () => {
  it('returns — for empty config', () => {
    const { schemaHint } = useNodePreview('n1', () => ({}))
    expect(schemaHint.value).toBe('—')
  })

  it('returns — for unknown connectorType', () => {
    const { schemaHint } = useNodePreview('n1', () => ({ connectorType: 'unknown' }))
    expect(schemaHint.value).toBe('unknown')
  })

  it('formats http-rest with full URL', () => {
    const { schemaHint } = useNodePreview('n1', () => ({
      connectorType: 'http-rest',
      method: 'POST',
      url: 'https://api.example.com/users',
    }))
    expect(schemaHint.value).toBe('POST · api.example.com/users')
  })

  it('formats http-rest with root path omitted', () => {
    const { schemaHint } = useNodePreview('n1', () => ({
      connectorType: 'http-rest',
      method: 'GET',
      url: 'https://api.example.com',
    }))
    expect(schemaHint.value).toBe('GET · api.example.com')
  })

  it('prompts to configure when http-rest url is empty', () => {
    const { schemaHint } = useNodePreview('n1', () => ({ connectorType: 'http-rest', method: 'GET', url: '' }))
    expect(schemaHint.value).toBe('GET · configure URL')
  })

  it('extracts table from postgres FROM clause', () => {
    const { schemaHint } = useNodePreview('n1', () => ({
      connectorType: 'postgres',
      query: 'SELECT id, name FROM public.workflows LIMIT 5',
    }))
    expect(schemaHint.value).toBe('→ public.workflows')
  })

  it('prompts to configure when postgres query is empty', () => {
    const { schemaHint } = useNodePreview('n1', () => ({ connectorType: 'postgres', query: '' }))
    expect(schemaHint.value).toBe('configure query')
  })

  it('formats statcan with table code', () => {
    const { schemaHint } = useNodePreview('n1', () => ({
      connectorType: 'statcan',
      table_code: '14-10-0287-01',
    }))
    expect(schemaHint.value).toBe('table 14-10-0287-01')
  })

  it('prompts to configure when statcan table_code is empty', () => {
    const { schemaHint } = useNodePreview('n1', () => ({ connectorType: 'statcan', table_code: '' }))
    expect(schemaHint.value).toBe('configure table code')
  })
})

describe('useNodePreview — outputHint', () => {
  it('returns null when store has no output for node', () => {
    const { outputHint } = useNodePreview('n1', () => ({}))
    expect(outputHint.value).toBeNull()
  })

  it('returns record count on success', () => {
    const store = useBuilderStore()
    store.nodeOutputs['n1'] = { rowCount: 42 }
    const { outputHint } = useNodePreview('n1', () => ({}))
    expect(outputHint.value).toBe('✓ 42 records')
  })

  it('returns singular record when count is 1', () => {
    const store = useBuilderStore()
    store.nodeOutputs['n1'] = { rowCount: 1 }
    const { outputHint } = useNodePreview('n1', () => ({}))
    expect(outputHint.value).toBe('✓ 1 record')
  })

  it('returns 0 records when rowCount absent', () => {
    const store = useBuilderStore()
    store.nodeOutputs['n1'] = {}
    const { outputHint } = useNodePreview('n1', () => ({}))
    expect(outputHint.value).toBe('✓ 0 records')
  })

  it('appends schema fields when present', () => {
    const store = useBuilderStore()
    store.nodeOutputs['n1'] = { rowCount: 5, schema: 'id · name · email' }
    const { outputHint } = useNodePreview('n1', () => ({}))
    expect(outputHint.value).toBe('✓ 5 records · id · name · email')
  })

  it('returns full error message', () => {
    const store = useBuilderStore()
    store.nodeOutputs['n1'] = { error: 'Connection refused' }
    const { outputHint } = useNodePreview('n1', () => ({}))
    expect(outputHint.value).toBe('✗ Connection refused')
  })

  it('does not leak output between nodes', () => {
    const store = useBuilderStore()
    store.nodeOutputs['n1'] = { rowCount: 10 }
    const { outputHint } = useNodePreview('n2', () => ({}))
    expect(outputHint.value).toBeNull()
  })
})

describe('useNodePreview — runSchema', () => {
  it('returns null when no output', () => {
    const { runSchema } = useNodePreview('n1', () => ({}))
    expect(runSchema.value).toBeNull()
  })

  it('returns schema string from store', () => {
    const store = useBuilderStore()
    store.nodeOutputs['n1'] = { rowCount: 3, schema: 'id · title · body' }
    const { runSchema } = useNodePreview('n1', () => ({}))
    expect(runSchema.value).toBe('id · title · body')
  })

  it('returns null when output has no schema', () => {
    const store = useBuilderStore()
    store.nodeOutputs['n1'] = { rowCount: 3 }
    const { runSchema } = useNodePreview('n1', () => ({}))
    expect(runSchema.value).toBeNull()
  })
})

describe('useNodePreview — tab state', () => {
  it('starts with schema tab active', () => {
    const { activeTab } = useNodePreview('n1', () => ({}))
    expect(activeTab.value).toBe('schema')
  })

  it('tab can be toggled to output', () => {
    const { activeTab } = useNodePreview('n1', () => ({}))
    activeTab.value = 'output'
    expect(activeTab.value).toBe('output')
  })
})
