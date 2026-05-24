import { describe, expect, it } from 'vitest'
import { countCheckboxes, detectCycles, detectDeltaSections, featureNameFromPath, generateFeatureContent, parseFrontmatter, parseScenarios, parseYamlLines } from '../src/core/helpers.js'

describe('parseYamlLines', () => {
  it('parses key-value pairs', () => {
    const result = parseYamlLines(['name: foo', 'status: draft'])
    expect(result).toEqual({ name: 'foo', status: 'draft' })
  })

  it('parses lists', () => {
    const result = parseYamlLines(['tags:', '  - backend', '  - ui'])
    expect(result).toEqual({ tags: ['backend', 'ui'] })
  })

  it('handles empty list', () => {
    const result = parseYamlLines(['tags: []'])
    expect(result).toEqual({ tags: [] })
  })

  it('handles empty list with items below', () => {
    const result = parseYamlLines(['tags:', '  - backend'])
    expect(result).toEqual({ tags: ['backend'] })
  })

  it('allows comments inside lists without breaking them', () => {
    const result = parseYamlLines(['tags:', '# a comment', '  - item1', '  - item2'])
    expect(result).toEqual({ tags: ['item1', 'item2'] })
  })

  it('ignores comment lines', () => {
    const result = parseYamlLines(['# just a comment', 'key: value'])
    expect(result).toEqual({ key: 'value' })
  })

  it('ignores empty lines', () => {
    const result = parseYamlLines(['key: value', '', 'key2: value2'])
    expect(result).toEqual({ key: 'value', key2: 'value2' })
  })

  it('handles empty input', () => {
    expect(parseYamlLines([])).toEqual({})
  })
})

describe('parseFrontmatter', () => {
  it('extracts frontmatter from markdown content', () => {
    const content = `---
status: draft
priority: medium
---
# Feature`
    const result = parseFrontmatter(content)
    expect(result).toEqual({ status: 'draft', priority: 'medium' })
  })

  it('handles tags list in frontmatter', () => {
    const content = `---
status: draft
tags:
  - backend
  - auth
---
# Feature`
    const result = parseFrontmatter(content)
    expect(result).toEqual({ status: 'draft', tags: ['backend', 'auth'] })
  })

  it('returns null when no frontmatter', () => {
    expect(parseFrontmatter('# Just a heading')).toBeNull()
  })

  it('handles empty frontmatter with empty line', () => {
    const content = `---

---
# Feature`
    const result = parseFrontmatter(content)
    expect(result).toEqual({})
  })

  it('extracts frontmatter from CRLF markdown content', () => {
    const content = '---\r\nstatus: draft\r\npriority: medium\r\n---\r\n# Feature\r\n'
    const result = parseFrontmatter(content)
    expect(result).toEqual({ status: 'draft', priority: 'medium' })
  })
})

describe('countCheckboxes', () => {
  it('counts todo, progress, and done checkboxes', () => {
    const content = `- [ ] todo
- [/] in progress
- [x] done`
    expect(countCheckboxes(content)).toEqual({ todo: 1, progress: 1, done: 1, total: 3 })
  })

  it('returns zeros when no checkboxes present', () => {
    expect(countCheckboxes('just some text')).toEqual({ todo: 0, progress: 0, done: 0, total: 0 })
  })

  it('counts multiple of each type', () => {
    const content = `- [ ] a
- [ ] b
- [x] c
- [x] d`
    expect(countCheckboxes(content)).toEqual({ todo: 2, progress: 0, done: 2, total: 4 })
  })

  it('counts dropped checkboxes [-],', () => {
    const content = `- [ ] todo
- [-] dropped
- [x] done`
    expect(countCheckboxes(content)).toEqual({ todo: 1, progress: 0, done: 1, total: 3 })
  })
})

describe('detectDeltaSections', () => {
  it('detects ADDED section', () => {
    const content = `## Spec\n- Summary: x\n### ADDED\n- new requirement`
    const result = detectDeltaSections(content)
    expect(result.added).toBe(true)
    expect(result.modified).toBe(false)
    expect(result.removed).toBe(false)
  })

  it('detects MODIFIED section', () => {
    const content = `## Spec\n- Summary: x\n### MODIFIED\n- changed`
    expect(detectDeltaSections(content).modified).toBe(true)
  })

  it('detects REMOVED section', () => {
    const content = `## Spec\n- Summary: x\n### REMOVED\n- deleted`
    expect(detectDeltaSections(content).removed).toBe(true)
  })

  it('detects multiple deltas', () => {
    const content = `## Spec\n- Summary: x\n### ADDED\n- new\n### MODIFIED\n- changed`
    const result = detectDeltaSections(content)
    expect(result.added).toBe(true)
    expect(result.modified).toBe(true)
    expect(result.removed).toBe(false)
  })

  it('returns false when no deltas', () => {
    const content = `## Spec\n- Summary: x\n- Requirements:\n  - [ ] something`
    const result = detectDeltaSections(content)
    expect(result.added).toBe(false)
    expect(result.modified).toBe(false)
    expect(result.removed).toBe(false)
  })

  it('handles spec as last section', () => {
    const content = `# Feature\n## Spec\n- Summary: test`
    expect(detectDeltaSections(content).added).toBe(false)
  })
})

describe('parseScenarios', () => {
  it('extracts Given/When/Then scenarios', () => {
    const content = `### Scenario: Valid login
- GIVEN a user
- WHEN they log in
- THEN they see dashboard`
    const scenarios = parseScenarios(content)
    expect(scenarios).toHaveLength(1)
    expect(scenarios[0].heading).toBe('Valid login')
    expect(scenarios[0].steps).toHaveLength(3)
  })

  it('extracts multiple scenarios', () => {
    const content = `### Scenario: First
- GIVEN a
- WHEN b
- THEN c
### Scenario: Second
- GIVEN d
- WHEN e
- THEN f`
    expect(parseScenarios(content)).toHaveLength(2)
  })

  it('returns empty array when no scenarios', () => {
    expect(parseScenarios('## Plan\n- [ ] task')).toEqual([])
  })

  it('skips scenario with no recognizable steps', () => {
    const content = `### Scenario: Unstructured
- Just some text
- More text`
    expect(parseScenarios(content)).toHaveLength(0)
  })
})

describe('detectCycles', () => {
  it('returns empty for acyclic graph', () => {
    const graph = new Map([['a', ['b']], ['b', ['c']], ['c', []]])
    expect(detectCycles(graph)).toEqual([])
  })

  it('detects direct cycle (A→B→A)', () => {
    const graph = new Map([['a', ['b']], ['b', ['a']]])
    const cycles = detectCycles(graph)
    expect(cycles.length).toBeGreaterThanOrEqual(1)
    expect(cycles[0]).toContain('a')
    expect(cycles[0]).toContain('b')
  })

  it('detects self-loop', () => {
    const graph = new Map([['a', ['a']]])
    const cycles = detectCycles(graph)
    expect(cycles.length).toBeGreaterThanOrEqual(1)
  })

  it('handles empty graph', () => {
    expect(detectCycles(new Map())).toEqual([])
  })
})

describe('generateFeatureContent', () => {
  it('includes feature name in heading', () => {
    const content = generateFeatureContent('my-feature')
    expect(content).toContain('# Feature: my-feature')
  })

  it('separates frontmatter from the title with a blank line', () => {
    const content = generateFeatureContent('my-feature')
    expect(content).toContain('---\n\n# Feature: my-feature')
  })

  it('includes summary when provided', () => {
    const content = generateFeatureContent('my-feature', 'A cool feature')
    expect(content).toContain('- Summary: A cool feature')
  })

  it('uses placeholder when no summary', () => {
    const content = generateFeatureContent('my-feature')
    expect(content).toContain('<one-line summary>')
  })

  it('contains required sections', () => {
    const content = generateFeatureContent('test')
    expect(content).toContain('## Spec')
    expect(content).toContain('## Plan')
    expect(content).toContain('## Tests')
  })
})

describe('featureNameFromPath', () => {
  it('strips .md extension', () => {
    expect(featureNameFromPath('/features', '/features/login.md')).toBe('login')
  })

  it('preserves subdirectory structure', () => {
    expect(featureNameFromPath('/features', '/features/auth/login.md')).toBe('auth/login')
  })
})
