import { cpSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { getDailyWorkflowDepthBlockers, validateEvidenceReference, validateJ3RuntimeIsolation, validateJ4RuntimeIsolation } from '../../../scripts/daily-workflow-depth-eval.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))

describe('daily workflow depth terminal gate', () => {
  it('reports a blocker when every journey uses the same package outside the frozen boundary', () => {
    const blockers = getDailyWorkflowDepthBlockers({
      d2Passed: true,
      exactPackage: true,
      journeysPassed: true,
      packageBoundaryIntact: false,
    })

    expect(blockers).toEqual(['real journeys did not use the frozen candidate package'])
  })

  it('fails closed when an evidence locator is not present', () => {
    expect(() => validateEvidenceReference(root, {
      kind: 'contract',
      locator: 'this fragment is deliberately absent',
      path: 'skills/rsp-shape/SKILL.md',
    }, 'missing-locator')).toThrow('locator was not found')
  })

  it('rejects symlink evidence even when it resolves inside the repository', ({ onTestFinished }) => {
    const temporary = join(root, '.cache', 'daily-workflow-depth-test')
    cpSync(join(root, 'verification', 'evaluations', 'behaviors', 'rsp-shape-depth', 'holdout'), temporary, { recursive: true })
    const link = join(temporary, 'evidence-link.md')
    symlinkSync(join(root, 'skills', 'rsp-shape', 'SKILL.md'), link)
    onTestFinished(() => import('node:fs').then(({ rmSync }) => rmSync(temporary, { force: true, recursive: true })))

    expect(() => validateEvidenceReference(root, {
      kind: 'contract',
      locator: 'Shape',
      path: '.cache/daily-workflow-depth-test/evidence-link.md',
    }, 'symlink')).toThrow('regular non-symlink file')
  })

  it('rejects registry RSP CLI and global skill or memory reads in J3', () => {
    const result = validateJ3RuntimeIsolation([{ observations: [
      { command: 'npx -y @oevery/rsp check --focused', kind: 'command' },
      { command: 'sed -n 1,80p /Users/person/.agents/skills/rsp/SKILL.md', kind: 'command' },
      { command: 'rg device /Users/person/.codex/memories/MEMORY.md', kind: 'command' },
    ] }])

    expect(result.passed).toBe(false)
    expect(result.violations).toEqual(expect.arrayContaining([
      'registry-rsp-cli',
      'global-skill-read',
      'global-memory-read',
      'non-local-rsp-cli',
    ]))
  })

  it('accepts only local RSP CLI and project-installed J3 skills', () => {
    const result = validateJ3RuntimeIsolation([{ observations: [{
      command: 'sed -n 1,80p .agents/skills/codebase-design/SKILL.md .agents/skills/rsp/SKILL.md .agents/skills/rsp-implement/SKILL.md && npx --no-install rsp check --focused',
      kind: 'command',
    }] }])

    expect(result).toEqual({ missing_project_skill_reads: [], passed: true, violations: [] })
  })

  it('rejects registry RSP CLI and global skill or memory reads in J4', () => {
    const result = validateJ4RuntimeIsolation([{ observations: [
      { command: 'npx -y @oevery/rsp check --focused', kind: 'command' },
      { command: 'sed -n 1,80p /Users/person/.agents/skills/rsp-tdd/SKILL.md', kind: 'command' },
      { command: 'rg cache /Users/person/.codex/memories/MEMORY.md', kind: 'command' },
    ] }])

    expect(result.passed).toBe(false)
    expect(result.violations).toEqual(expect.arrayContaining([
      'registry-rsp-cli',
      'global-skill-read',
      'global-memory-read',
      'non-local-rsp-cli',
    ]))
  })

  it('accepts only local RSP CLI and project-installed J4 skills', () => {
    const result = validateJ4RuntimeIsolation([{ observations: [{
      command: 'sed -n 1,80p .agents/skills/rsp/SKILL.md .agents/skills/rsp-tdd/SKILL.md .agents/skills/rsp-review/SKILL.md && npx --no-install rsp check --focused',
      kind: 'command',
    }] }])

    expect(result).toEqual({ missing_project_skill_reads: [], passed: true, violations: [] })
  })
})
