// services/control-plane/src/__tests__/integration/setup.ts
// Requires: supabase start + SUPABASE_ANON_KEY in .env
import { createClient } from '@supabase/supabase-js'
import { adminClient } from '../../lib/supabase.ts'

export const TEST_EMAIL = `integration-${Date.now()}@vipsos-test.local`
export const TEST_PASSWORD = 'Test123456!'

let _jwt = ''
let _workspaceId = ''
let _userId = ''

export async function provisionTestUser() {
  // Create user via admin API
  const { data, error } = await adminClient.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (error) throw new Error(`Failed to create test user: ${error.message}`)
  _userId = data.user!.id

  // Create workspace
  const { data: ws, error: wsErr } = await adminClient
    .from('workspaces')
    .insert({ name: 'Integration Test Workspace' })
    .select()
    .single()
  if (wsErr) throw new Error(`Failed to create workspace: ${wsErr.message}`)
  _workspaceId = ws.id

  // Create membership
  const { error: memErr } = await adminClient
    .from('workspace_members')
    .insert({ workspace_id: _workspaceId, user_id: _userId, role: 'admin' })
  if (memErr) throw new Error(`Failed to create membership: ${memErr.message}`)

  // Get JWT by signing in with anon key
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!anonKey) throw new Error('SUPABASE_ANON_KEY must be set in .env for integration tests')
  const anonClient = createClient(process.env.SUPABASE_URL!, anonKey)
  const { data: session, error: signInErr } = await anonClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })
  if (signInErr) throw new Error(`Failed to sign in test user: ${signInErr.message}`)
  _jwt = session.session!.access_token
}

export async function cleanupTestUser() {
  if (!_userId) return
  await adminClient.from('run_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await adminClient.from('runs').delete().eq('workspace_id', _workspaceId)
  await adminClient.from('workflow_versions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await adminClient.from('workflows').delete().eq('workspace_id', _workspaceId)
  await adminClient.from('secrets').delete().eq('workspace_id', _workspaceId)
  await adminClient.from('workspace_members').delete().eq('user_id', _userId)
  await adminClient.from('workspaces').delete().eq('id', _workspaceId)
  await adminClient.auth.admin.deleteUser(_userId)
}

export function getJwt(): string { return _jwt }
export function getWorkspaceId(): string { return _workspaceId }
