import { pollAndExecute } from './queue/poller.ts'

const POLL_INTERVAL_MS = 2000

if (!process.env.WORKER_KEY) {
  console.error('[worker] FATAL: WORKER_KEY env var is not set — cannot authenticate with control plane')
  process.exit(1)
}

console.log('[worker] Runtime started — polling every 2s')
console.log(`[worker] Control plane: ${process.env.CONTROL_PLANE_URL ?? 'http://localhost:3001'}`)

async function loop(): Promise<void> {
  while (true) {
    await pollAndExecute()
    await Bun.sleep(POLL_INTERVAL_MS)
  }
}

loop().catch((err) => {
  console.error('[worker] Fatal error in polling loop:', err)
  process.exit(1)
})
