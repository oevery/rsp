import { matchesCommand } from '../../../runner/graders/commit-outcome.mjs'

export async function check() {
  return { status: 'passed' }
}
export async function verify({ observation, events }) {
  const ready = observation.checks?.rspReady?.result
  const failedCheckObserved = events.commands.some(item => matchesCommand(item.command, '.tooling/node tools/check.mjs', observation.workspaceRoot) && item.status === 'completed' && item.evidenceRedacted !== true && Number.isInteger(item.exitCode) && item.exitCode !== 0)
  return { status: !ready ? 'inconclusive' : ready.ok && ready.readiness.archiveReady === 'no' && ready.readiness.incompleteRequiredVerify > 0 && failedCheckObserved ? 'passed' : 'failed', evidence: { ready, failedCheckObserved } }
}
