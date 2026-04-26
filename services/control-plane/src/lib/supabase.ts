import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
}

export const adminClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export async function verifyJwt(jwt: string) {
  const { data, error } = await adminClient.auth.getUser(jwt)
  if (error || !data.user) return null
  return data.user
}

export async function getUserWorkspaceId(userId: string): Promise<string | null> {
  const { data } = await adminClient
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .single()
  return data?.workspace_id ?? null
}
