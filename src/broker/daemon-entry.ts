import { getVersion } from '../core/config.js'
import { resolveBrokerPaths } from './host.js'
import {
  claimBrokerDaemonStart,
  parseBrokerStartLockClaimEnvironment,
  releaseBrokerStartLockClaim,
} from './lock.js'
import { BrokerError } from './protocol.js'
import { startBrokerServer } from './server.js'

export async function runBrokerDaemon(): Promise<void> {
  const idleMs = parseIdleMs(process.env.RSP_BROKER_IDLE_MS)
  const paths = resolveBrokerPaths()
  const clientClaim = parseBrokerStartLockClaimEnvironment(process.env.RSP_BROKER_STARTUP_CLAIM)
  const daemonClaim = await claimBrokerDaemonStart(paths, clientClaim)
  let handle: Awaited<ReturnType<typeof startBrokerServer>>
  try {
    handle = await startBrokerServer({
      paths,
      packageVersion: await getVersion(),
      startupClaim: daemonClaim,
      ...(idleMs === undefined ? {} : { idleMs }),
    })
  }
  catch (error) {
    await releaseBrokerStartLockClaim(paths, daemonClaim).catch(() => false)
    throw error
  }
  let closing = false
  const close = (): void => {
    if (closing)
      return
    closing = true
    void handle.close()
  }
  process.once('SIGINT', close)
  process.once('SIGTERM', close)
  process.once('SIGHUP', close)
  await handle.stopped
}

function parseIdleMs(value: string | undefined): number | undefined {
  if (value === undefined)
    return undefined
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 10)
    throw new BrokerError('broker_idle_invalid', 'RSP_BROKER_IDLE_MS must be an integer of at least 10 milliseconds')
  return parsed
}

void runBrokerDaemon().catch((error) => {
  process.stderr.write(`Broker failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
