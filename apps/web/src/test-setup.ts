// Vitest setup: patch Node.js 25+ built-in localStorage stub that lacks getItem/setItem
// Node 25 exposes a global `localStorage` object without the full Web Storage API
// unless --localstorage-file is provided. We replace it with a Map-backed implementation
// so stores that call localStorage.getItem/setItem at init time work in tests.
if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
  const store = new Map<string, string>()
  ;(globalThis as Record<string, unknown>).localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value) },
    removeItem: (key: string) => { store.delete(key) },
    clear: () => { store.clear() },
    get length() { return store.size },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
  }
}

import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server.ts'

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
