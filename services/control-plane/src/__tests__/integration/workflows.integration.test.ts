// services/control-plane/src/__tests__/integration/workflows.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { app } from '../../index.ts'
import { provisionTestUser, cleanupTestUser, getJwt } from './setup.ts'

let createdWorkflowId = ''

beforeAll(async () => { await provisionTestUser() })
afterAll(async () => { await cleanupTestUser() })

function authHeaders() {
  return { Authorization: `Bearer ${getJwt()}`, 'Content-Type': 'application/json' }
}

describe('Workflows routes — integration', () => {
  it('GET /workflows returns 401 without token', async () => {
    const res = await app.request('/workflows')
    expect(res.status).toBe(401)
  })

  it('POST /workflows creates a workflow', async () => {
    const res = await app.request('/workflows', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: 'Integration Test Flow',
        trigger: { type: 'manual' },
        nodes: [],
        edges: [],
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json() as { id: string; name: string; status: string }
    expect(body.id).toBeTruthy()
    expect(body.name).toBe('Integration Test Flow')
    expect(body.status).toBe('draft')
    createdWorkflowId = body.id
  })

  it('GET /workflows returns the created workflow', async () => {
    const res = await app.request('/workflows', { headers: authHeaders() })
    expect(res.status).toBe(200)
    const body = await res.json() as Array<{ id: string }>
    expect(body.some((w) => w.id === createdWorkflowId)).toBe(true)
  })

  it('GET /workflows/:id returns workflow with definition', async () => {
    const res = await app.request(`/workflows/${createdWorkflowId}`, { headers: authHeaders() })
    expect(res.status).toBe(200)
    const body = await res.json() as { id: string; definition: unknown }
    expect(body.id).toBe(createdWorkflowId)
    expect(body.definition).toBeTruthy()
  })

  it('PUT /workflows/:id updates the workflow', async () => {
    const res = await app.request(`/workflows/${createdWorkflowId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ name: 'Updated Flow', status: 'published' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { name: string; status: string }
    expect(body.name).toBe('Updated Flow')
    expect(body.status).toBe('published')
  })

  it('POST /secrets creates a secret (value never returned)', async () => {
    const res = await app.request('/secrets', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name: 'TEST_API_KEY', value: 'super-secret-value' }),
    })
    expect(res.status).toBe(201)
    const body = await res.json() as Record<string, unknown>
    expect(body.id).toBeTruthy()
    expect(body.name).toBe('TEST_API_KEY')
    expect(Object.keys(body)).not.toContain('encrypted_value')
    expect(Object.keys(body)).not.toContain('value')
  })

  it('DELETE /workflows/:id removes the workflow', async () => {
    const res = await app.request(`/workflows/${createdWorkflowId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    expect(res.status).toBe(204)
  })

  it('GET /workflows/:id returns 404 after deletion', async () => {
    const res = await app.request(`/workflows/${createdWorkflowId}`, { headers: authHeaders() })
    expect(res.status).toBe(404)
  })
})
