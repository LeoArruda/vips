import type { Connector } from '@vipsos/connector-sdk'
import { httpRestConnector } from './http-rest/index.ts'
import { postgresConnector } from './postgres/index.ts'
import { statcanConnector } from './statcan/index.ts'

const registry = new Map<string, Connector>([
  ['http-rest', httpRestConnector],
  ['postgres', postgresConnector],
  ['statcan', statcanConnector],
])

export function getConnector(type: string): Connector | undefined {
  return registry.get(type)
}
