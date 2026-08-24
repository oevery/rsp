import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { markdownLinks, mutateSemanticUnit, satisfiesSemanticContract } from '../support/markdown-contract'

const root = fileURLToPath(new URL('../..', import.meta.url))
const skill = readFileSync(join(root, '.agents/skills/release-acceptance/SKILL.md'), 'utf8')
const read = (name: string) => readFileSync(join(root, '.agents/skills/release-acceptance/references', name), 'utf8')
const deterministic = read('deterministic-acceptance.md')
const behavior = read('provider-behavior-acceptance.md')
const comparison = read('provider-routing-comparison.md')
const candidate = read('exact-candidate.md')

describe('release-acceptance maintainer contract', () => {
  it('loads exactly one directly linked acceptance mode after classification', () => {
    expect(markdownLinks(skill)).toEqual([
      'references/deterministic-acceptance.md',
      'references/provider-behavior-acceptance.md',
      'references/provider-routing-comparison.md',
      'references/exact-candidate.md',
    ])
    expect(skill).toMatch(/Load only the selected mode reference/iu)
    expect(skill).not.toContain('release:provider-compare -- --replay-report')
    expect(deterministic).toContain('release-acceptance.mjs --plan')
    expect(behavior).toContain('exactly ten candidate runs, two baseline calibration runs')
    expect(comparison).toContain('release:provider-compare -- --replay-report')
    expect(candidate).toContain('release:candidate-check')
  })

  it('keeps unavailable provider observations explicit and scenario-owned', () => {
    const observationContract = [
      { all: [/provider-backed modes/iu, /final-response/iu, /resource-event/iu, /first-fix/iu, /model-invocation/iu, /explicit omissions/iu] },
      { all: [/Never infer/iu, /successful result/iu, /neighboring events/iu] },
      { all: [/fails closed/iu, /declared hard dimension/iu, /required structured evidence/iu, /unevaluable/iu, /diagnostic/iu, /cannot strengthen the verdict/iu] },
    ]

    expect(satisfiesSemanticContract(skill, observationContract)).toBe(true)

    const inferredObservation = mutateSemanticUnit(
      skill,
      [/Never infer/iu, /successful result/iu],
      unit => unit.replace(/Never infer/iu, 'Infer'),
    )
    expect(satisfiesSemanticContract(inferredObservation, observationContract)).toBe(false)
  })

  it('preserves mode-specific fail-closed evidence boundaries', () => {
    expect(satisfiesSemanticContract(comparison, [
      { all: [/candidate hard failures/iu, /candidate identity drift/iu, /harness failures/iu, /fail fast/iu] },
      { all: [/missing or mismatched raw metadata/iu, /fails closed/iu, /fresh explicitly authorized provider comparison/iu] },
      { all: [/Token reduction alone/iu, /no release threshold/iu] },
    ])).toBe(true)
    expect(satisfiesSemanticContract(candidate, [
      { all: [/never invokes a provider/iu, /missing or stale behavior evidence/iu, /single-case/iu, /handoff/iu] },
      { all: [/unavailable environments/iu, /incomplete/iu, /never passed/iu] },
    ])).toBe(true)
  })
})
