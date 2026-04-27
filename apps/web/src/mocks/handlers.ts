// apps/web/src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('*/api/auth/me', () =>
    HttpResponse.json({
      userId: 'u1',
      email: 'test@example.com',
      workspaceId: 'ws1',
      workspaceName: 'Acme',
      role: 'admin',
    }),
  ),

  http.get('*/api/workflows', () =>
    HttpResponse.json([
      { id: 'wf1', name: 'Test Flow', status: 'draft', updated_at: '2026-01-01', definition: { trigger: { type: 'manual' } } },
    ]),
  ),

  http.post('*/api/workflows', () =>
    HttpResponse.json(
      { id: 'wf-new', name: 'New Flow', status: 'draft', updated_at: '2026-01-02', definition: { trigger: { type: 'manual' } } },
      { status: 201 },
    ),
  ),

  http.delete('*/api/workflows/:id', () => new HttpResponse(null, { status: 204 })),

  http.get('*/api/runs', () => HttpResponse.json([])),
]
