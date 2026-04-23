export interface User {
  userId: string
  name: string
  email: string
  role: 'admin' | 'builder' | 'operator' | 'partner'
  avatarInitial: string
}

export interface Organization {
  orgId: string
  name: string
  industry?: string
}

export interface AuthSession {
  user: User
  org: Organization
  workspaceId: string
  workspaceName: string
  onboardingComplete: boolean
}
