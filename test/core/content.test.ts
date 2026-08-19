import { describe, expect, it } from 'vitest'
import { classifyVerifyCheckboxes, countCheckboxes, detectDeltaSections, hasMeaningfulBlockers, parseFrontmatter, parseScenarios, parseYamlLines } from '../../src/core/content.js'
import { collectArchiveReadiness } from '../../src/core/readiness.js'

describe('parseYamlLines', () => {
  it('parses key-value pairs', () => {
    const result = parseYamlLines(['name: foo', 'stage: propose'])
    expect(result).toEqual({ name: 'foo', stage: 'propose' })
  })

  it('parses lists', () => {
    const result = parseYamlLines(['tags:', '  - backend', '  - ui'])
    expect(result).toEqual({ tags: ['backend', 'ui'] })
  })

  it('supports quoted scalars and inline lists', () => {
    const result = parseYamlLines(['kind: "fix"', 'tags: [backend, ui]'])
    expect(result).toEqual({ kind: 'fix', tags: ['backend', 'ui'] })
  })

  it('handles empty input', () => {
    expect(parseYamlLines([])).toEqual({})
  })
})

describe('parseFrontmatter', () => {
  it('extracts frontmatter from markdown content', () => {
    const content = `---
kind: fix
---
# Change`
    const result = parseFrontmatter(content)
    expect(result).toEqual({ kind: 'fix' })
  })

  it('returns null when no frontmatter', () => {
    expect(parseFrontmatter('# Just a heading')).toBeNull()
  })
})

describe('countCheckboxes', () => {
  it('counts todo, progress, done, and dropped checkboxes', () => {
    const content = `- [ ] todo
- [/] in progress
- [x] done
- [-] dropped`
    expect(countCheckboxes(content)).toEqual({ todo: 1, progress: 1, done: 1, dropped: 1, total: 4 })
  })
})

describe('classifyVerifyCheckboxes', () => {
  it('separates required and optional verification', () => {
    const result = classifyVerifyCheckboxes(`### Required
- [x] focused tests
- [ ] real path

### Optional
- [ ] extra browser`)

    expect(result.required).toMatchObject({ done: 1, todo: 1, total: 2 })
    expect(result.optional).toMatchObject({ todo: 1, total: 1 })
    expect(result.unclassified.total).toBe(0)
    expect(result.legacy).toBe(false)
  })

  it('treats unclassified verification as required for legacy safety', () => {
    const result = classifyVerifyCheckboxes(`- [ ] legacy smoke

### Optional
- [ ] extra coverage`)

    expect(result.required.todo).toBe(1)
    expect(result.optional.todo).toBe(1)
    expect(result.legacy).toBe(true)
  })
})

describe('collectArchiveReadiness verification criticality', () => {
  it('allows incomplete optional coverage after required verification passes', () => {
    const content = `# Change: gates

## Spec
#### Scenario: complete
- GIVEN a change
- WHEN it runs
- THEN it works

## Tasks
- [x] done

## Verify
### Required
- [x] tests
### Optional
- [ ] extra

## Blockers
- none`
    const result = collectArchiveReadiness(content)

    expect(result.requiredVerifyTodos).toHaveLength(0)
    expect(result.optionalVerifyTodos).toHaveLength(1)
    expect(result.archiveReady).toBe('yes')
  })
})

describe('detectDeltaSections', () => {
  it('detects ADDED, MODIFIED, and REMOVED markers', () => {
    const content = `## Spec
### ADDED
- x
### MODIFIED
- y
### REMOVED
- z`
    const result = detectDeltaSections(content)
    expect(result).toEqual({ added: true, modified: true, removed: true })
  })

  it('returns false when no deltas exist', () => {
    const content = `## Spec
### Acceptance
#### Scenario: ok
- GIVEN x
- WHEN y
- THEN z`
    expect(detectDeltaSections(content)).toEqual({ added: false, modified: false, removed: false })
  })
})

describe('parseScenarios', () => {
  it('extracts Given/When/Then scenarios', () => {
    const content = `#### Scenario: Valid login
- GIVEN a user
- WHEN they log in
- THEN they see dashboard`
    const scenarios = parseScenarios(content)
    expect(scenarios).toHaveLength(1)
    expect(scenarios[0].heading).toBe('Valid login')
    expect(scenarios[0].steps).toHaveLength(3)
  })
})

describe('hasMeaningfulBlockers', () => {
  it.each([
    '-',
    '*',
    '- none',
    '- None.',
    '* NONE。',
    'none.',
    '  -   NoNe。  ',
  ])('returns false for the unambiguous none variant %j', (blocker) => {
    expect(hasMeaningfulBlockers(`## Blockers\n${blocker}`)).toBe(false)
  })

  it.each([
    '- waiting on api migration',
    '- no blockers',
    '- N/A',
    '- 无',
  ])('returns true for meaningful or unsupported blocker text %j', (blocker) => {
    expect(hasMeaningfulBlockers(`## Blockers\n${blocker}`)).toBe(true)
  })

  it('ignores well-formed HTML comments but keeps incomplete comments fail-closed', () => {
    const commented = `## Blockers
- none
<!--
- requires \`ignored\`: example only
operator guidance
-->`
    const incomplete = `## Blockers
- none
<!-- unresolved guidance`

    expect(hasMeaningfulBlockers(commented)).toBe(false)
    expect(hasMeaningfulBlockers(incomplete)).toBe(true)
  })
})
