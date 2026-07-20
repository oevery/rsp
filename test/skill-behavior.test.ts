import { existsSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { loadEvaluationCases, prepareEvaluation, runEvaluation, runEvaluationMatrix } from '../scripts/rsp-review-eval.mjs'

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

  it('records a reproducible read-only run with complete normalized metadata', async () => {
    const outputRoot = join(root, '.cache', 'test-rsp-review-run')
    tempRoots.push(outputRoot)
    const run = await runEvaluation({
      caseId: 'skipped-document',
      codexBin: join(root, 'test', 'skill-behavior', 'fake-codex.mjs'),
      effort: 'low',
      model: 'test-model',
      outputRoot,
      root,
      variant: 'candidate',
    })

    expect(run.result).toBe('passed')
    expect(run.settings).toEqual({
      cli_version: 'codex-cli test-1.0.0',
      config_source: 'isolated',
      effort: 'low',
      model: 'test-model',
      provider: null,
      sandbox: 'read-only',
    })
    expect(run.events).toMatchObject({
      by_item_type: { command_execution: 1 },
      by_type: { 'item.completed': 1, 'thread.started': 1, 'turn.completed': 1 },
      tool_calls: 1,
      total: 3,
    })
    expect(run.usage).toEqual({
      cached_input_tokens: 60,
      input_tokens: 100,
      output_tokens: 20,
      reasoning_output_tokens: 5,
    })
    expect(run.worktree.mutated).toBe(false)
    expect(Object.values(run.hashes).filter(Boolean).every(value => /^[a-f0-9]{64}$/.test(value!))).toBe(true)
    expect(existsSync(run.paths.raw_events)).toBe(true)
    expect(existsSync(run.paths.final_output)).toBe(true)
    expect(existsSync(run.paths.metadata)).toBe(true)
  })

  it('fails a run when the reviewer mutates the prepared workspace', async () => {
    const outputRoot = join(root, '.cache', 'test-rsp-review-mutation')
    tempRoots.push(outputRoot)
    const run = await runEvaluation({
      caseId: 'prohibited-action',
      codexBin: join(root, 'test', 'skill-behavior', 'fake-codex.mjs'),
      effort: 'low',
      env: { ...process.env, FAKE_CODEX_MUTATE: '1' },
      model: 'test-model',
      outputRoot,
      root,
      variant: 'candidate',
    })

    expect(run.result).toBe('failed')
    expect(run.worktree.mutated).toBe(true)
    expect(run.worktree.after_status).toContain('unauthorized.txt')
    expect(run.hashes.after_workspace).not.toBe(run.hashes.before_workspace)
  })

  it('keeps paired matrix settings and candidate identity fixed', async () => {
    const outputRoot = join(root, '.cache', 'test-rsp-review-matrix')
    tempRoots.push(outputRoot)
    const matrix = await runEvaluationMatrix({
      caseIds: ['restraint-clean', 'skipped-document'],
      codexBin: join(root, 'test', 'skill-behavior', 'fake-codex.mjs'),
      effort: 'low',
      model: 'test-model',
      outputRoot,
      provider: 'test-provider',
      root,
    })

    expect(matrix.result).toBe('passed')
    expect(matrix.runs).toHaveLength(4)
    expect(matrix.runs.map(run => `${run.case.id}:${run.variant}`)).toEqual([
      'restraint-clean:baseline',
      'restraint-clean:candidate',
      'skipped-document:baseline',
      'skipped-document:candidate',
    ])
    expect(matrix.candidate_hashes).toHaveLength(1)
    expect(matrix.fixture_hashes).toHaveLength(1)
    expect(matrix.harness_hashes).toHaveLength(1)
    expect(matrix.provider).toBe('test-provider')
    expect(new Set(matrix.runs.map(run => `${run.settings.model}:${run.settings.effort}`))).toEqual(new Set(['test-model:low']))
    expect(new Set(matrix.runs.map(run => run.settings.provider))).toEqual(new Set(['test-provider']))
    expect(existsSync(matrix.metadata_path)).toBe(true)
  })

  it('records an explicitly selected user-config provider', async () => {
    const outputRoot = join(root, '.cache', 'test-rsp-review-provider')
    tempRoots.push(outputRoot)
    const run = await runEvaluation({
      caseId: 'restraint-clean',
      codexBin: join(root, 'test', 'skill-behavior', 'fake-codex.mjs'),
      effort: 'low',
      model: 'test-model',
      outputRoot,
      provider: 'test-provider',
      root,
      variant: 'baseline',
    })

    expect(run.settings).toMatchObject({ config_source: 'user', provider: 'test-provider' })
  })
})
