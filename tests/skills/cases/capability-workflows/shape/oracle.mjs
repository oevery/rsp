export async function check() {
  return { status: 'passed' }
}
export async function verify({ observation }) {
  const ready = observation.checks?.rspReady?.result
  return { status: ready?.ok && ready.readiness.incompleteTasks > 0 && ready.readiness.archiveReady === 'no' && Object.hasOwn(observation.files, '.rsp/focus.d/cache-expiry') ? 'passed' : 'failed', evidence: { ready, semantics: 'requires-independent-review' } }
}
