import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { httpRestConnector } from '../connectors/http-rest/index.ts'

let server: ReturnType<typeof Bun.serve>
let baseUrl: string

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    fetch(req) {
      const url = new URL(req.url)
      if (url.pathname === '/json') {
        return new Response(JSON.stringify({ hello: 'world' }), {
          headers: { 'content-type': 'application/json' },
        })
      }
      if (url.pathname === '/error') {
        return new Response('Not Found', { status: 404 })
      }
      if (req.method === 'POST' && url.pathname === '/echo') {
        return req.json().then((body) =>
          new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } }),
        )
      }
      return new Response('OK')
    },
  })
  baseUrl = `http://localhost:${server.port}`
})

afterAll(() => server.stop())

describe('httpRestConnector', () => {
  it('GET — fetches JSON and returns status + body', async () => {
    const result = await httpRestConnector.execute(
      { type: 'http-rest', settings: { method: 'GET', url: `${baseUrl}/json` }, secrets: {} },
      {},
    )
    expect(result.success).toBe(true)
    expect(result.output.status).toBe(200)
    expect((result.output.body as { hello: string }).hello).toBe('world')
    expect(result.logs[0].level).toBe('info')
    expect(result.logs[0].message).toContain('200')
  })

  it('GET — returns success: false on 4xx', async () => {
    const result = await httpRestConnector.execute(
      { type: 'http-rest', settings: { method: 'GET', url: `${baseUrl}/error` }, secrets: {} },
      {},
    )
    expect(result.success).toBe(false)
    expect(result.output.status).toBe(404)
    expect(result.error).toContain('404')
  })

  it('POST — sends body and returns echoed response', async () => {
    const result = await httpRestConnector.execute(
      {
        type: 'http-rest',
        settings: { method: 'POST', url: `${baseUrl}/echo`, body: { ping: 'pong' } },
        secrets: {},
      },
      {},
    )
    expect(result.success).toBe(true)
    expect((result.output.body as { ping: string }).ping).toBe('pong')
  })

  it('returns error result on network failure', async () => {
    const result = await httpRestConnector.execute(
      { type: 'http-rest', settings: { method: 'GET', url: 'http://localhost:1' }, secrets: {} },
      {},
    )
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(result.logs[0].level).toBe('error')
  })
})
