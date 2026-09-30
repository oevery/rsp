// Host attribution is necessary, but role quality and authority remain semantic.
export function gradeNativeCoordination(spec, evidence, executor) {
  if (!spec.native)
    return { status: 'passed', required: false }
  if (!evidence?.complete)
    return { status: 'inconclusive', required: true, reasons: evidence?.reasons ?? ['native-host-evidence-missing'] }
  const root = evidence.threads.find(thread => thread.id === evidence.rootThreadId)
  if (executor && (!root?.model || !root.effort))
    return { status: 'inconclusive', required: true, reasons: ['root-configuration-unobserved'] }
  if (executor && (root.model !== executor.model || root.effort !== executor.effort))
    return { status: 'failed', required: true, reasons: ['root-configuration-mismatch'] }
  const workers = evidence.threads.filter(thread => thread.id !== evidence.rootThreadId && thread.parentId === evidence.rootThreadId && thread.completed)
  if (executor && workers.some(thread => !thread.model || !thread.effort))
    return { status: 'inconclusive', required: true, reasons: ['worker-configuration-unobserved'] }
  if (executor && workers.some(thread => thread.model !== executor.model || thread.effort !== executor.effort))
    return { status: 'failed', required: true, reasons: ['worker-configuration-mismatch'] }
  const minimum = spec.native.minCompletedWorkers
  if (!Number.isInteger(minimum) || minimum < 0 || (spec.native.maxWorkers !== undefined && (!Number.isInteger(spec.native.maxWorkers) || spec.native.maxWorkers < minimum)))
    return { status: 'inconclusive', required: true, reasons: ['invalid-native-case-contract'] }
  const distinct = new Set(workers.map(thread => thread.id)).size
  const maximum = spec.native.maxWorkers
  const spawned = new Set(evidence.dispatches.filter(item => item.tool === 'spawn_agent').map(item => item.receiverId)).size
  return { status: distinct >= minimum && (maximum === undefined || spawned <= maximum) ? 'passed' : 'failed', required: true, completedWorkers: distinct, minimum, spawnedWorkers: spawned, semanticRoles: 'requires-independent-review' }
}
