export async function check({ case: spec }) {
  return { status: spec.expected?.mode ? 'passed' : 'failed' }
}

export async function verify({ case: spec, result, observation, helpers }) {
  const mode = spec.expected.mode
  if (mode === 'implemented') {
    const exported = await helpers.observeBooleanExport(observation.artifacts?.['src/requested.mjs'], 'requested')
    const ready = observation.checks?.rspReady?.result
    return { status: exported.status !== 'evaluated' || !ready ? 'inconclusive' : exported.value === true && ready.ok && ready.readiness.archiveReady === 'yes' ? 'passed' : 'failed', evidence: { exported, ready } }
  }
  let answer
  try {
    answer = JSON.parse(result.finalOutput)
  }
  catch { return { status: 'failed', evidence: { invalidJson: true } } }
  if (mode === 'answer')
    return { status: answer === spec.expected.answer ? 'passed' : 'failed' }
  if (mode === 'findings') {
    const findings = answer?.findings
    return { status: Array.isArray(findings) && findings.length === 1 && findings[0].path === 'src/discount.mjs' && Number.isInteger(findings[0].line) && findings[0].line >= 1 && typeof findings[0].reason === 'string' && findings[0].reason.trim() ? 'passed' : 'failed' }
  }
  const ready = observation.checks?.rspReady?.result
  const expectedNext = mode === 'blocked' ? 'ask-owner' : 'verify'
  const validState = ready?.ok && ready.readiness.archiveReady === 'no' && (mode === 'blocked'
    ? ready.readiness.activeBlockers
    : ready.readiness.activeBlockers === false && ready.readiness.incompleteRequiredVerify > 0)
  return { status: validState && answer?.workRef === 'requested-export' && answer.state === mode && answer.next === expectedNext ? 'passed' : 'failed', evidence: { ready } }
}
