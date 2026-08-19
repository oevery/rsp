import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../..', import.meta.url))

describe('maintainer research implementation reconciliation', () => {
  it('marks shipped Shape and Implement models as implemented historical inputs', () => {
    const engineering = readFileSync(join(root, 'research/models/rsp-engineering-domain-model.md'), 'utf8')
    const shaping = readFileSync(join(root, 'research/models/rsp-shaping-capability.md'), 'utf8')
    const implementation = readFileSync(join(root, 'research/models/rsp-implementation-capability.md'), 'utf8')
    const index = readFileSync(join(root, 'research/models/INDEX.md'), 'utf8')

    expect(engineering).toContain('implementation_status: superseded')
    expect(engineering).toContain('superseded_on: 2026-08-15')
    expect(engineering).toContain('The historical Current and Proposed target snapshot below is superseded by current Specs')
    expect(shaping).toContain('implementation_status: implemented')
    expect(shaping).toContain('decision_status: accepted')
    expect(shaping).toContain('reconciled_on: 2026-08-15')
    expect(shaping).toContain('implemented by `skills/rsp-shape/SKILL.md`')
    expect(implementation).toContain('implementation_status: implemented')
    expect(implementation).toContain('decision_status: accepted')
    expect(implementation).toContain('reconciled_on: 2026-08-15')
    expect(implementation).toContain('implemented by `skills/rsp-implement/SKILL.md`')
    expect(index).toContain('historical input now implemented by `rsp-shape`')
    expect(index).toContain('historical input now implemented by `rsp-implement`')
  })
})
