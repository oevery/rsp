import { describe, expect, it } from 'vitest'
import { generateChangeContent, generateDesignContent, generateSpecContent } from '../../src/core/artifacts.js'

describe('generateChangeContent', () => {
  it('includes change name in heading', () => {
    const content = generateChangeContent('my-change')
    expect(content).toContain('# Change: my-change')
  })

  it('uses the provided summary as the observable outcome', () => {
    const content = generateChangeContent('my-change', 'A cool change')
    expect(content).toContain('- Outcome: A cool change')
  })

  it('contains required sections', () => {
    const content = generateChangeContent('test')
    expect(content).toContain('## Proposal')
    expect(content).toContain('## Spec')
    expect(content).toContain('## Design')
    expect(content).toContain('## Tasks')
    expect(content).toContain('## Verify')
    expect(content).toContain('## Blockers')
    expect(content).toContain('- Boundaries:')
    expect(content).toContain('- Coverage:')
    expect(content).not.toContain('Finalize the proposal, spec, and design details')
    expect(content).not.toContain('Durable updates:')
  })

  it('renders one kind-aware template for tracked changes of every size', () => {
    const content = generateChangeContent('small-fix', 'Fix small issue', 'fix')
    expect(content).toContain('kind: "fix"')
    expect(content).toContain('- Outcome: Fix small issue')
    expect(content).toContain('## Proposal')
    expect(content).toContain('## Spec')
    expect(content).toContain('## Design')
    expect(content).toContain('## Tasks')
    expect(content).toContain('## Verify')
    expect(content).toContain('## Blockers')
    expect(content).toContain('- [ ] <…>')
    expect(content).not.toContain('Finalize the proposal, spec, and design details')
    expect(content).toContain('- Coverage:')
    expect(content).not.toContain('Durable updates:')
    expect(content).toContain('- [ ] <…> — proves: <…>')
    expect(content).not.toContain('Exact prerequisite:')
  })

  it('reminds the user to choose kind explicitly', () => {
    const content = generateChangeContent('test')
    expect(content).toContain('kind: "<choose: feature | fix | refactor | docs | ops | research>"')
  })

  it('uses a neutral bootstrap scaffold for project-setup', () => {
    const content = generateChangeContent('project-setup')
    expect(content).toContain('# Change: project-setup')
    expect(content).toContain('.rsp/specs/design.md')
    expect(content).toContain('CONTEXT.md')
    expect(content).toContain('AGENTS.md')
    expect(content).toContain('rsp doctor — proves: <…>')
    expect(content).not.toContain('Capture the project model')
    expect(content).not.toContain('Stable navigation and context')
    expect(content).toContain('- Current facts:')
    expect(content).toContain('- Lasting rationale:')
  })

  it('preserves kind-specific delta markers without authored guidance prose', () => {
    const content = generateChangeContent('docs-update', 'Improve docs', 'docs')
    expect(content).toContain('### MODIFIED')
    expect(content).toContain('- Requirement: <…>')
    expect(content).not.toContain('documentation accuracy')
    expect(generateChangeContent('new-capability', '', 'feature')).toContain('### ADDED')
    expect(generateChangeContent('investigate', '', 'research')).toContain('### ADDED')
  })

  it('does not let the fix template invent an unexplained root cause', () => {
    const content = generateChangeContent('repair-cache', 'Repair cache behavior', 'fix')
    expect(content).toContain('- Approach:\n  - <…>')
    expect(content).not.toContain('confirmed cause')
    expect(content).not.toContain('<root cause analysis and fix strategy>')
    expect(content).not.toContain('regression test')
    expect(content).not.toContain('Exact prerequisite:')
  })

  it('uses neutral placeholders for affected areas and verification', () => {
    const content = generateChangeContent('my-change')
    expect(content).toContain('- Affected areas:\n  - <…>\n  - <…>')
    expect(content).toContain('- [ ] <…> — proves: <…>')
    expect(content).toContain('- Constraints:\n  - <…>')
  })

  it('does not make a new test the default automated evidence for any change kind', () => {
    for (const kind of ['feature', 'fix', 'refactor', 'docs', 'research', 'ops'] as const) {
      const content = generateChangeContent(`${kind}-change`, `${kind} outcome`, kind)
      expect(content).toContain('- [ ] <…> — proves: <…>')
      expect(content).not.toContain('regression test')
    }
  })

  it('keeps durable review separate from implementation verification', () => {
    const content = generateChangeContent('my-change')
    expect(content).toContain('- Coverage:\n  - <…>')
    expect(content).not.toContain('Durable updates:')
    expect(content).not.toContain('before archive')
  })

  it('uses consistent verification and durable-outcome ownership in project setup', () => {
    const content = generateChangeContent('project-setup')
    expect(content).toContain('- Manual or environment:\n  - [ ] <…>')
    expect(content).toContain('- Coverage:\n  - <…>')
    expect(content).toContain('- Durable outcome targets:')
    expect(content).not.toContain('## Durable Outcomes')
  })
})

describe('generateSpecContent', () => {
  it('uses a durable-truth oriented structure', () => {
    const content = generateSpecContent('status')
    expect(content).toContain('# Status')
    expect(content).toContain('## Purpose')
    expect(content).toContain('## Stable Facts')
    expect(content).toContain('## Boundaries')
    expect(content).toContain('## Constraints')
    expect(content).not.toContain('## Details')
    expect(content).toContain('- <…>')
    expect(content).not.toContain('why this project-level spec exists')
  })

  it('keeps project design structure without authored guidance prose', () => {
    const content = generateDesignContent('示例项目')
    expect(content).toContain('# Project Design: 示例项目')
    expect(content).toContain('## Stable Facts')
    expect(content).toContain('- <…>')
    expect(content).not.toContain('future agents or developers')
  })
})

describe('behavior-first spec templates', () => {
  it('omits scaffold comments for every change kind', () => {
    for (const kind of [undefined, 'feature', 'fix', 'refactor', 'docs', 'research', 'ops'] as const) {
      const content = generateChangeContent('test', 'summary', kind)
      expect(content).not.toContain('<!--')
    }
  })
})
