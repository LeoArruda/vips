import type { AuthSession } from '@/types/auth'

export const stubSession: AuthSession = {
  user: {
    userId: 'u_001',
    name: 'Alex Rivera',
    email: 'alex@acme.io',
    role: 'admin',
    avatarInitial: 'A',
  },
  org: {
    orgId: 'org_001',
    name: 'Acme Corp',
    industry: 'Technology',
  },
  workspaceId: 'ws_001',
  workspaceName: 'Production',
  onboardingComplete: false,
}
