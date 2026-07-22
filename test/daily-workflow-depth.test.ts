import { cpSync, readdirSync, readFileSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { evaluateDailyWorkflowDepth, getDailyWorkflowDepthBlockers, validateEvidenceReference, validateJ3RuntimeIsolation, validateJ4RuntimeIsolation } from '../scripts/daily-workflow-depth-eval.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))

describe('daily workflow depth terminal gate', () => {
  it('passes when five oracle-shaped replays are bound to same-case host observations', () => {
    const result = evaluateDailyWorkflowDepth(root)

    expect(result.passed).toBe(true)
    expect(result.journeys.map(item => item.id)).toEqual([
      'j1-ambiguous-intent',
      'j2-domain-language',
      'j3-module-seam',
      'j4-ordinary-correction',
      'j5-multi-session-continuation',
    ])
    expect(result.oracle_replay_passed).toBe(true)
    expect(result.package_boundary_intact).toBe(true)
    expect(result.stable_skills).toHaveLength(7)
    expect(result.rejected_product_owner).toBe('rsp-manage')
    expect(result.recommendation).toBe('resume-release-preparation')
    expect(result.blockers).toEqual([])
    expect(result.journeys.every(item => item.passed)).toBe(true)
    expect(result.d2.passed).toBe(true)
    expect(result.exact_package_sha256).toBe('7d64fab954b7366688db5bccf3e38db86c9ad0a671df1669d0e833495c368011')
  })

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
    cpSync(join(root, 'test', 'rsp-shape-depth', 'holdout'), temporary, { recursive: true })
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

  it('marks every retained failed run as invalid evidence', () => {
    const realRuns = join(root, 'research', 'evaluations', 'rsp-daily-workflow-depth', '2026-07-21', 'real-runs')
    const attempts = readdirSync(realRuns, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .flatMap((entry) => {
        const invalidRoot = join(realRuns, entry.name, 'invalid-attempts')
        try {
          return readdirSync(invalidRoot, { withFileTypes: true })
            .filter(attempt => attempt.isDirectory())
            .map(attempt => join(invalidRoot, attempt.name, 'invalid-reason.json'))
        }
        catch {
          return []
        }
      })

    expect(attempts.length).toBeGreaterThan(0)
    for (const path of attempts)
      expect(JSON.parse(readFileSync(path, 'utf8')).evidence_class).toBe('invalid-attempt')
  })
})
