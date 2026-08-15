function dimension(status, evidence) {
  return { status, evidence }
}

function finiteNumber(value) {
  return Number.isFinite(value) ? value : null
}

function nonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0 ? value : null
}

function firstFixResult(value) {
  return value === 'passed' || value === 'failed' ? value : null
}

function tokenMeasurements(usage) {
  const input = finiteNumber(usage?.input_tokens)
  const output = finiteNumber(usage?.output_tokens)
  const total = finiteNumber(usage?.total_tokens)
    ?? (input !== null && output !== null ? input + output : null)
  return { input, output, total }
}

export function projectSkillEvaluationObservability({
  elapsedMs,
  outcome,
  outputContract,
  receiptObservations,
  toolCalls,
  unauthorizedPaths,
  usage,
} = {}) {
  const expectedMissing = Array.isArray(outputContract?.expected_missing)
    ? outputContract.expected_missing
    : null
  const forbiddenPresent = Array.isArray(outputContract?.forbidden_present)
    ? outputContract.forbidden_present
    : null
  const unauthorized = Array.isArray(unauthorizedPaths) ? unauthorizedPaths : null
  const triggerObservation = receiptObservations?.trigger
  const trigger = triggerObservation?.status === 'passed' || triggerObservation?.status === 'failed'
    ? dimension(triggerObservation.status, triggerObservation.evidence ?? null)
    : dimension('not-observed', null)
  const compliance = expectedMissing === null
    ? dimension('not-observed', null)
    : dimension(expectedMissing.length === 0 ? 'passed' : 'failed', { expected_missing: expectedMissing })
  const boundary = forbiddenPresent?.length || unauthorized?.length
    ? dimension('failed', {
        forbidden_present: forbiddenPresent ?? [],
        unauthorized_paths: unauthorized ?? [],
      })
    : forbiddenPresent !== null && unauthorized !== null
      ? dimension('passed', { forbidden_present: [], unauthorized_paths: [] })
      : dimension('not-observed', null)
  const taskResult = outcome === 'passed' || outcome === 'failed'
    ? dimension(outcome, { outcome })
    : dimension('not-observed', outcome ? { outcome } : null)
  const tokens = tokenMeasurements(usage)
  const correctionCount = nonNegativeInteger(receiptObservations?.correction_count)
  const workerDispatchCount = nonNegativeInteger(receiptObservations?.worker_dispatch_count)
  const observedFirstFixResult = firstFixResult(receiptObservations?.first_fix_result)
  const measurements = {
    corrections: correctionCount,
    first_fix_result: observedFirstFixResult,
    worker_dispatch_count: workerDispatchCount,
    tool_calls: finiteNumber(toolCalls),
    elapsed_ms: finiteNumber(elapsedMs),
    tokens,
  }
  const omissions = [
    ...(trigger.status === 'not-observed' ? ['trigger observation is unavailable'] : []),
    ...(compliance.status === 'not-observed' ? ['compliance evidence is unavailable'] : []),
    ...(boundary.status === 'not-observed' ? ['boundary evidence is unavailable'] : []),
    ...(taskResult.status === 'not-observed' ? ['task result is unavailable'] : []),
    ...(correctionCount === null ? ['correction count is unavailable'] : []),
    ...(observedFirstFixResult === null ? ['first-fix result is unavailable'] : []),
    ...(workerDispatchCount === null ? ['worker dispatch count is unavailable'] : []),
    ...(measurements.tool_calls === null ? ['tool-call count is unavailable'] : []),
    ...(measurements.elapsed_ms === null ? ['elapsed time is unavailable'] : []),
    ...(tokens.input === null ? ['input-token count is unavailable'] : []),
    ...(tokens.output === null ? ['output-token count is unavailable'] : []),
    ...(tokens.total === null ? ['total-token count is unavailable'] : []),
  ]
  return {
    dimensions: {
      trigger,
      compliance,
      boundary,
      task_result: taskResult,
    },
    measurements,
    omissions,
  }
}
