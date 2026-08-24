import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { mutateSemanticUnit, satisfiesSemanticContract } from '../support/markdown-contract'

const root = fileURLToPath(new URL('../..', import.meta.url))
const skill = readFileSync(join(root, '.agents/skills/release-acceptance/SKILL.md'), 'utf8')

describe('release-acceptance maintainer contract', () => {
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
})
