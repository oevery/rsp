import type { BrokerDiscoveryRecord } from '../broker/protocol.js'
import { getBrokerStatus, inspectBroker, startBroker, stopBroker } from '../broker/client.js'
import { BrokerError } from '../broker/protocol.js'
import { emitJson } from '../core/output.js'

export interface BrokerCommandOptions {
  json?: boolean
}

export async function startBrokerCommand(options: BrokerCommandOptions = {}): Promise<{ ok: boolean }> {
  try {
    const result = await startBroker()
    const status = await getBrokerStatus(result.record)
    const output = {
      command: 'broker',
      action: 'start',
      ok: true,
      state: 'running',
      reused: result.reused,
      broker: commandBrokerIdentity(result.record),
      sessionCount: status.sessionCount,
    }
    if (options.json)
      emitJson(output)
    else
      console.log(`  Broker ${result.reused ? 'reused' : 'started'}: ${result.record.endpoint} (pid ${result.record.pid})`)
    return { ok: true }
  }
  catch (error) {
    return brokerCommandFailure('start', error, options)
  }
}

export async function statusBrokerCommand(options: BrokerCommandOptions = {}): Promise<{ ok: boolean }> {
  try {
    const inspection = await inspectBroker()
    let sessionCount: number | null = null
    if (inspection.state === 'running' && inspection.record)
      sessionCount = (await getBrokerStatus(inspection.record)).sessionCount
    const ok = inspection.state === 'running' || inspection.state === 'absent'
    const output = {
      command: 'broker',
      action: 'status',
      ok,
      state: inspection.state,
      broker: inspection.record ? commandBrokerIdentity(inspection.record) : null,
      compatibility: inspection.compatibility,
      reason: inspection.reason,
      sessionCount,
    }
    if (options.json)
      emitJson(output)
    else
      printBrokerStatus(output)
    return { ok }
  }
  catch (error) {
    return brokerCommandFailure('status', error, options)
  }
}

export async function stopBrokerCommand(options: BrokerCommandOptions = {}): Promise<{ ok: boolean }> {
  try {
    const result = await stopBroker()
    const output = {
      command: 'broker',
      action: 'stop',
      ok: true,
      state: 'absent',
      stopped: result.stopped,
      staleRecovered: result.staleRecovered,
      broker: result.record ? commandBrokerIdentity(result.record) : null,
    }
    if (options.json)
      emitJson(output)
    else if (result.stopped)
      console.log('  Broker stopped')
    else if (result.staleRecovered)
      console.log('  Removed stale Broker discovery metadata; no process was signaled')
    else
      console.log('  Broker is not running')
    return { ok: true }
  }
  catch (error) {
    return brokerCommandFailure('stop', error, options)
  }
}

function brokerCommandFailure(
  action: 'start' | 'status' | 'stop',
  error: unknown,
  options: BrokerCommandOptions,
): { ok: false } {
  const code = error instanceof BrokerError ? error.code : 'broker_command_failed'
  const message = error instanceof Error ? error.message : String(error)
  if (options.json) {
    emitJson({
      command: 'broker',
      action,
      ok: false,
      error: { code, message },
    })
  }
  else {
    console.error(`  Error: ${message}`)
  }
  return { ok: false }
}

function commandBrokerIdentity(record: BrokerDiscoveryRecord) {
  return {
    instanceId: record.instanceId,
    pid: record.pid,
    endpoint: record.endpoint,
    protocol: { ...record.protocol },
    runtimeSchema: { ...record.runtimeSchema },
    packageVersion: record.packageVersion,
    startedAt: record.startedAt,
  }
}

function printBrokerStatus(output: {
  state: string
  broker: ReturnType<typeof commandBrokerIdentity> | null
  reason: string | null
  sessionCount: number | null
}): void {
  if (output.state === 'running' && output.broker) {
    console.log(`  Broker running: ${output.broker.endpoint} (pid ${output.broker.pid}, ${output.sessionCount ?? 0} project session(s))`)
    return
  }
  if (output.state === 'absent') {
    console.log('  Broker is not running')
    return
  }
  console.error(`  Broker ${output.state}: ${output.reason ?? 'inspection did not produce a healthy compatible owner'}`)
}
