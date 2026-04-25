import type { Environment } from '@/types/operations'

export const stubEnvironments: Environment[] = [
  { envId: 'env_001', name: 'Cloud (default)', type: 'cloud', health: 'healthy', workerCount: 3, region: 'us-east-1', agentVersion: '1.4.2', assignedWorkflows: ['wf_001', 'wf_002', 'wf_003'] },
  { envId: 'env_002', name: 'On-Premise EU', type: 'agent', health: 'degraded', workerCount: 2, region: 'eu-west-1', agentVersion: '1.3.8', assignedWorkflows: ['wf_004'] },
]
