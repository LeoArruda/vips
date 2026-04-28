import { ref, computed } from 'vue'

export function useNodePreview(getConfig: () => Record<string, unknown>) {
  const activeTab = ref<'schema' | 'output'>('schema')

  const schemaHint = computed((): string => {
    const c = getConfig()
    const ct = c.connectorType as string | undefined
    if (!ct) return '—'

    if (ct === 'http-rest') {
      const method = (c.method as string | undefined) ?? 'GET'
      const url = (c.url as string | undefined) ?? ''
      if (!url) return `${method} · configure URL`
      try {
        const { hostname, pathname } = new URL(url)
        return `${method} · ${hostname}${pathname === '/' ? '' : pathname}`
      } catch {
        return `${method} · ${url}`
      }
    }

    if (ct === 'postgres') {
      const query = ((c.query as string | undefined) ?? '').trim()
      if (!query) return 'configure query'
      const match = query.match(/FROM\s+([^\s;,()\n]+)/i)
      return match ? `→ ${match[1]}` : query.slice(0, 28)
    }

    if (ct === 'statcan') {
      const code = (c.table_code as string | undefined) ?? ''
      return code ? `table ${code}` : 'configure table code'
    }

    return ct
  })

  const outputHint = computed((): string | null => {
    const out = getConfig().lastRunOutput as
      | { rowCount?: number; error?: string }
      | undefined
    if (!out) return null
    if (out.error) return `✗ ${String(out.error)}`
    return `✓ ${out.rowCount ?? 0} rows`
  })

  return { activeTab, schemaHint, outputHint }
}
