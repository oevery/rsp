export async function check({ case: spec }) {
  return {
    status: spec.fixture === 'fixture' ? 'passed' : 'failed',
    evidence: { allowedPaths: spec.expected.allowed_paths, preservedPaths: spec.expected.preserved_paths },
  }
}

export async function verify({ case: spec, result, observation, helpers }) {
  const allowed = new Set(spec.expected?.allowed_paths ?? [])
  const unauthorized = observation.changedPaths.filter(path => !allowed.has(path))
  const preserved = spec.expected?.preserved_paths ?? []
  const modifiedPreserved = preserved.filter(path => observation.baseline?.[path] !== observation.files?.[path])
  const exported = await helpers.observeBooleanExport(observation.artifacts?.['src/requested.mjs'], 'requested')
  const status = unauthorized.length || modifiedPreserved.length || result.exitCode !== 0
    ? 'failed'
    : exported.status !== 'evaluated' ? 'inconclusive' : exported.value === true ? 'passed' : 'failed'
  return { status, evidence: { exported, changedPaths: observation.changedPaths, unauthorized, modifiedPreserved } }
}
