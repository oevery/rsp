import { closeSync, openSync, rmSync } from 'node:fs'

// Unknown in-flight work is never silently retried. A stale lock needs inspection.
export async function withBatchLock(path, action) {
  const lock = `${path}.lock`
  const fd = openSync(lock, 'wx', 0o600)
  try {
    return await action()
  }
  finally {
    closeSync(fd)
    rmSync(lock)
  }
}

export function usageTotal(attempts) {
  const tokens = attempts.map((attempt) => {
    const usage = attempt.usage
    return [usage?.input_tokens, usage?.output_tokens].every(value => Number.isSafeInteger(value) && value >= 0) ? usage.input_tokens + usage.output_tokens : null
  })
  return { sessions: attempts.length, tokens: tokens.reduce((sum, value) => sum + (value ?? 0), 0), missingUsage: tokens.filter(value => value === null).length }
}

export function budgetStop(attempts, { maxSessions, maxTokens } = {}) {
  for (const value of [maxSessions, maxTokens]) {
    if (value !== undefined && (!Number.isInteger(value) || value < 1))
      throw new Error('Batch budgets must be positive integers')
  }
  const usage = usageTotal(attempts)
  if (maxSessions !== undefined && usage.sessions >= maxSessions)
    return 'session-budget'
  if (maxTokens !== undefined && usage.missingUsage)
    return 'token-usage-unavailable'
  if (maxTokens !== undefined && usage.tokens >= maxTokens)
    return 'token-budget'
  return null
}
