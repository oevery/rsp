import { describe, expect, it } from 'vitest'
import { collectArchiveChecklist, collectArchiveReadiness, toArchiveReadinessOutput } from '../../src/core/readiness.js'

describe('collectArchiveChecklist', () => {
  it('reports incomplete tasks and verify items', () => {
    const content = `---
kind: feature
---

# Change: test
## Tasks
- [ ] unimplemented task

## Verify
- Automated:
  - [ ] not run
- Manual:
  - [ ] not checked
`
    const warnings = collectArchiveChecklist(content)
    expect(warnings.some(w => w.includes('task item(s) still incomplete'))).toBe(true)
    expect(warnings.some(w => w.includes('required Verify item(s) are still incomplete'))).toBe(true)
  })

  it('reports active blockers', () => {
    const content = `## Blockers
- waiting on api migration`
    const warnings = collectArchiveChecklist(content)
    expect(warnings).toContain('active blockers are present in the change file')
  })

  it('reports missing scenarios', () => {
    const content = `## Spec
### ADDED
- Requirement: test`
    const warnings = collectArchiveChecklist(content)
    expect(warnings).toContain('no Scenario blocks found (some changes do not need them)')
  })

  it('returns empty when all checks pass', () => {
    const content = `---
kind: feature
---

# Change: test
## Tasks
- [x] done

## Verify
- Automated:
  - [x] done
- Manual:
  - [x] done

## Spec
### ADDED
- Requirement: test

### Acceptance
#### Scenario: test works
- GIVEN x
- WHEN y
- THEN z

## Blockers
- none
`
    const warnings = collectArchiveChecklist(content)
    expect(warnings).toEqual([])
  })
})

describe('collectArchiveReadiness', () => {
  it('returns exact incomplete task and verify counts', () => {
    const content = `---
kind: feature
---

# Change: test
## Tasks
- [ ] task one
- [ ] task two
- [x] task three

## Verify
- Automated:
  - [ ] run tests
- Manual:
  - [ ] smoke test
- Durable updates:
  - [ ] decide writeback

## Spec
### ADDED
- Requirement: test

### Acceptance
#### Scenario: test works
- GIVEN x
- WHEN y
- THEN z

## Blockers
- none
`
    const readiness = collectArchiveReadiness(content)
    expect(readiness.taskTodos).toHaveLength(2)
    expect(readiness.verifyTodos).toHaveLength(3)
    expect(readiness.activeBlockers).toBe(false)
    expect(readiness.missingScenarios).toBe(false)
    expect(readiness.scenarioCount).toBe(1)
  })

  it('projects the shared readiness shape used by command surfaces', () => {
    const content = `---
kind: feature
---

# Change: projection
## Tasks
- [x] task

## Verify
### Required
- [x] required check
### Optional
- [ ] optional check

## Spec
### Acceptance
#### Scenario: projection works
- GIVEN x
- WHEN y
- THEN z

## Blockers
- none
`
    const readiness = collectArchiveReadiness(content)
    expect(toArchiveReadinessOutput(readiness)).toEqual({
      incompleteTasks: 0,
      incompleteVerify: 1,
      incompleteRequiredVerify: 0,
      incompleteOptionalVerify: 1,
      requiredVerify: { todo: 0, progress: 0, done: 1, dropped: 0, total: 1 },
      optionalVerify: { todo: 1, progress: 0, done: 0, dropped: 0, total: 1 },
      legacyVerify: false,
      completionGate: 'pass',
      coverageWarnings: 1,
      activeBlockers: false,
      missingScenarios: false,
      deterministic: 'warnings',
      semantic: 'needs-review',
      archiveReady: 'yes',
    })
  })
})
