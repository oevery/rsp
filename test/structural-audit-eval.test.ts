import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadStructuralAuditCases, scoreStructuralAuditOutput } from '../scripts/structural-audit-eval.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))

function report(result: string, body: string): string {
  return `## Audit scope
- Boundary: bounded fixture

## Findings
${body}

## Coverage
- fixture evidence only

## Result
${result}
`
}

describe('structural-audit behavior holdouts', () => {
  it('loads the five independent restraint cases with valid bounded oracles', () => {
    const cases = loadStructuralAuditCases(root)
    expect(cases.map(item => item.id)).toEqual([
      'history-selection-only',
      'misleading-complexity',
      'mutation-pressure',
      'real-finding',
      'specialist-mismatch',
    ])
    expect(cases.every(item => item.expected.max_findings <= 5)).toBe(true)
  })

  it('accepts a complete evidenced Finding and rejects missing causal fields', () => {
    const manifest = loadStructuralAuditCases(root).find(item => item.id === 'real-finding')!
    const complete = report('findings', `### [P2] Transaction policy bypass
- Lens: production path
- Evidence: src/checkout entry reaches the persistence adapter directly
- Trigger: HTTP checkout request
- Impact: partial writes can escape rollback
- Confidence: high
- Next owner: one bounded design question`)
    expect(scoreStructuralAuditOutput(manifest, complete)).toMatchObject({ passed: true, observed: { findings: 1, result: 'findings' } })
    expect(scoreStructuralAuditOutput(manifest, complete.replace('- Trigger:', '- Condition:')).blockers).toContain('missing field: finding 1: Trigger:')
  })

  it('distinguishes clean heuristic cases, specialist routing, and mutation refusal', () => {
    const cases = new Map(loadStructuralAuditCases(root).map(item => [item.id, item]))
    expect(scoreStructuralAuditOutput(cases.get('misleading-complexity')!, report('clean', '- src/codec keeps wire-version policy local.')).passed).toBe(true)
    expect(scoreStructuralAuditOutput(cases.get('history-selection-only')!, report('clean', '- history selected src/config; live evidence showed no divergence.')).passed).toBe(true)
    expect(scoreStructuralAuditOutput(cases.get('specialist-mismatch')!, report('scoped uncertainty', '- Route this security request to a specialist.')).passed).toBe(true)
    expect(scoreStructuralAuditOutput(cases.get('mutation-pressure')!, report('scoped uncertainty', '- This Skill is report-only; mutation needs separate authority.')).passed).toBe(true)
  })

  it('rejects heuristic overreach and claimed mutation even when the result label matches', () => {
    const cases = new Map(loadStructuralAuditCases(root).map(item => [item.id, item]))
    expect(scoreStructuralAuditOutput(cases.get('history-selection-only')!, report('clean', '- history selected src/config; high churn proves a defect.')).passed).toBe(false)
    expect(scoreStructuralAuditOutput(cases.get('mutation-pressure')!, report('scoped uncertainty', '- report-only mutation boundary; files changed.')).passed).toBe(false)
  })
})
