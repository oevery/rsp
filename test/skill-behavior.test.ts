import { existsSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { loadEvaluationCases, prepareEvaluation } from '../scripts/rsp-review-eval.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const tempRoots: string[] = []

afterEach(async () => {
  const { rm } = await import('node:fs/promises')
  await Promise.all(tempRoots.splice(0).map(path => rm(path, { force: true, recursive: true })))
})

describe('rsp-review behavior fixtures', () => {
  it('covers every selected behavioral boundary with explicit expectations', () => {
    const cases = loadEvaluationCases(root)
    const tags = new Set(cases.flatMap(item => item.tags))

    expect(cases.map(item => item.id)).toEqual([
      'ambiguous-focus',
      'code-issues',
      'document-issues',
      'missing-authority',
      'mixed-change',
      'prohibited-action',
      'restraint-clean',
      'skipped-document',
    ])
    expect(tags).toEqual(new Set([
      'ambiguity',
      'code',
      'document',
      'missing-authority',
      'mixed',
      'prohibited-action',
      'restraint',
      'skipped',
    ]))

    for (const item of cases) {
      expect(item.request.length).toBeGreaterThan(20)
      expect(item.expected.observations.length).toBeGreaterThan(0)
      expect(item.expected.prohibited_actions).toContain('modify-worktree')
    }
  })

  it('prepares isolated baseline and candidate workspaces from the same case', () => {
    const outputRoot = join(root, '.cache', 'test-rsp-review-eval')
    tempRoots.push(outputRoot)
    const baseline = prepareEvaluation({ caseId: 'mixed-change', outputRoot, root, variant: 'baseline' })
    const candidate = prepareEvaluation({ caseId: 'mixed-change', outputRoot, root, variant: 'candidate' })

    expect(baseline.workspace).not.toBe(candidate.workspace)
    expect(existsSync(join(baseline.workspace, '.agents', 'skills', 'rsp-review'))).toBe(false)
    expect(existsSync(join(candidate.workspace, '.agents', 'skills', 'rsp-review', 'SKILL.md'))).toBe(true)
    expect(existsSync(join(root, '.agents', 'skills', 'rsp-review'))).toBe(false)
    expect(readFileSync(baseline.promptPath, 'utf8')).not.toContain('Load the rsp-review skill')
    expect(readFileSync(candidate.promptPath, 'utf8')).toContain('Load the rsp-review skill')
    expect(readFileSync(join(candidate.workspace, 'docs', 'usage.md'), 'utf8')).toContain('Returns zero on failure')
    expect(relative(outputRoot, candidate.workspace)).not.toMatch(/^\.\./)
  })

  it('fails closed for unknown cases and unsafe fixture paths', () => {
    expect(() => prepareEvaluation({ caseId: 'not-a-case', root, variant: 'candidate' })).toThrow(/Unknown evaluation case/)
  })
})
