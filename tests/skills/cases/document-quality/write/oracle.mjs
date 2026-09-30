// Mechanical outcome only. Meaning and reader usefulness require semantic review.
export async function check({ case: spec }) {
  const documents = spec.expected?.documents
  return { status: Array.isArray(documents) && documents.length > 0 && documents.every(path => spec.hard.allowed_paths.includes(path)) ? 'passed' : 'failed' }
}

export async function verify({ case: spec, observation, result }) {
  const missing = spec.expected.documents.filter(path => !observation.artifacts?.[path]?.trim())
  const unauthorized = observation.changedPaths.filter(path => !spec.hard.allowed_paths.includes(path))
  const changedDocument = observation.changedPaths.some(path => spec.expected.documents.includes(path))
  return {
    status: result.exitCode === 0 && result.finalOutput?.trim() && changedDocument && missing.length === 0 && unauthorized.length === 0 ? 'passed' : 'failed',
    evidence: { missing, unauthorized, changedDocument, semanticQuality: 'requires-independent-review' },
  }
}
