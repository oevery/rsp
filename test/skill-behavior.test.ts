import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { loadEvaluationCases, prepareEvaluation, runEvaluation, runEvaluationCalibration, runEvaluationMatrix } from '../scripts/rsp-review-eval.mjs'

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
      'real-automated-vs-human-ready',
      'real-cancellation-error-contract',
      'real-cancellation-propagation',
      'real-capability-data-plane',
      'real-mixed-generated-worktree',
      'real-persisted-resource-validation',
      'real-stateful-media-round-1',
      'real-stateful-media-round-2',
      'real-stateful-media-round-3',
      'restraint-clean',
      'skipped-document',
    ])
    for (const tag of [
      'ambiguity',
      'code',
      'document',
      'missing-authority',
      'mixed',
      'prohibited-action',
      'real-world-derived',
      'restraint',
      'skipped',
    ])
      expect(tags).toContain(tag)

    const realWorldCases = cases.filter(item => item.id.startsWith('real-'))
    expect(realWorldCases).toHaveLength(9)
    expect(realWorldCases.every(item => item.tags.includes('real-world-derived'))).toBe(true)

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
    expect(existsSync(join(root, '.agents', 'skills', 'rsp-review', 'SKILL.md'))).toBe(true)
    expect(readFileSync(baseline.promptPath, 'utf8')).not.toContain('Load the rsp-review skill')
    expect(readFileSync(candidate.promptPath, 'utf8')).toContain('Load the rsp-review skill')
    expect(readFileSync(join(candidate.workspace, 'docs', 'usage.md'), 'utf8')).toContain('Returns zero on failure')
    expect(relative(outputRoot, candidate.workspace)).not.toMatch(/^\.\./)
  })

  it('prepares realistic staged, unstaged, deleted, renamed, and untracked review scope', () => {
    const outputRoot = join(root, '.cache', 'test-rsp-review-worktree')
    tempRoots.push(outputRoot)
    const prepared = prepareEvaluation({ caseId: 'real-mixed-generated-worktree', outputRoot, root, variant: 'baseline' })
    const status = execFileSync('git', ['status', '--short'], { cwd: prepared.workspace, encoding: 'utf8' })

    expect(execFileSync('git', ['config', '--local', '--get', 'status.renames'], { cwd: prepared.workspace, encoding: 'utf8' }).trim()).toBe('true')
    expect(execFileSync('git', ['config', '--local', '--get', 'diff.renames'], { cwd: prepared.workspace, encoding: 'utf8' }).trim()).toBe('true')
    expect(status).toContain('R  src/upload-policy.ts -> src/data-plane-policy.ts')
    expect(status).toContain('M  src/generated/storage-api.ts')
    expect(status).toContain(' D src/legacy-upload.ts')
    expect(status).toContain(' M src/upload-adapter.ts')
    expect(status).toContain('?? .agents/')
    expect(status).toContain('?? src/providers/')
    expect(status).toContain('?? tools/')
  })

  it('treats declared staged paths literally instead of expanding Git pathspec magic', () => {
    const literalRoot = join(root, '.cache', 'test-rsp-review-literal-stage')
    tempRoots.push(literalRoot)
    const fixture = join(literalRoot, 'test', 'skill-behavior', 'fixtures', 'literal-stage')
    mkdirSync(join(fixture, 'changed'), { recursive: true })
    writeFileSync(join(fixture, 'changed', ':(glob)*'), 'selected\n')
    writeFileSync(join(fixture, 'changed', 'other.txt'), 'untracked\n')
    writeFileSync(join(fixture, 'case.yaml'), `id: literal-stage
tags: [code]
request: Prepare exactly the declared staged file without expanding pathspec magic.
workspace:
  stage: [':(glob)*']
expected:
  code: clean
  document: skipped
  observations: [only the literal path is staged]
  prohibited_actions: [modify-worktree]
`)

    const prepared = prepareEvaluation({ caseId: 'literal-stage', root: literalRoot, variant: 'baseline' })
    const status = execFileSync('git', ['status', '--short'], { cwd: prepared.workspace, encoding: 'utf8' })

    expect(status).toContain('A  :(glob)*')
    expect(status).toContain('?? other.txt')
  })

  it('fails closed for unknown cases and unsafe fixture paths', () => {
    expect(() => prepareEvaluation({ caseId: 'not-a-case', root, variant: 'candidate' })).toThrow(/Unknown evaluation case/)

    const unsafeRoot = join(root, '.cache', 'test-rsp-review-unsafe')
    tempRoots.push(unsafeRoot)
    const fixture = join(unsafeRoot, 'test', 'skill-behavior', 'fixtures', 'unsafe-workspace')
    mkdirSync(fixture, { recursive: true })
    writeFileSync(join(fixture, 'case.yaml'), `id: unsafe-workspace
tags: [code]
request: Review the unsafe declarative workspace fixture without changing files.
workspace:
  remove: [../outside]
expected:
  code: clean
  document: skipped
  observations: [no issue]
  prohibited_actions: [modify-worktree]
`)
    expect(() => prepareEvaluation({ caseId: 'unsafe-workspace', root: unsafeRoot, variant: 'candidate' })).toThrow(/Unsafe workspace remove path/)
  })

  it('refuses removal through a symlink and preserves files outside the workspace', () => {
    const unsafeRoot = join(root, '.cache', 'test-rsp-review-symlink')
    tempRoots.push(unsafeRoot)
    const fixture = join(unsafeRoot, 'test', 'skill-behavior', 'fixtures', 'symlink-workspace')
    const external = join(unsafeRoot, 'external')
    mkdirSync(join(fixture, 'base'), { recursive: true })
    mkdirSync(external, { recursive: true })
    writeFileSync(join(external, 'sentinel.txt'), 'keep\n')
    symlinkSync(external, join(fixture, 'base', 'outside'))
    writeFileSync(join(fixture, 'case.yaml'), `id: symlink-workspace
tags: [code]
request: Prepare a fixture without allowing removal outside its isolated workspace.
workspace:
  remove: [outside/sentinel.txt]
expected:
  code: clean
  document: skipped
  observations: [outside files remain untouched]
  prohibited_actions: [modify-worktree]
`)

    expect(() => prepareEvaluation({ caseId: 'symlink-workspace', root: unsafeRoot, variant: 'baseline' })).toThrow(/symlink/i)
    expect(readFileSync(join(external, 'sentinel.txt'), 'utf8')).toBe('keep\n')
  })

  it('uses user configuration by default and records complete normalized metadata', async () => {
    const outputRoot = join(root, '.cache', 'test-rsp-review-run')
    tempRoots.push(outputRoot)
    const run = await runEvaluation({
      caseId: 'skipped-document',
      codexBin: join(root, 'test', 'skill-behavior', 'fake-codex.mjs'),
      effort: 'low',
      env: { ...process.env, FAKE_CODEX_CONFIG_MODE: 'user' },
      model: 'test-model',
      outputRoot,
      root,
      variant: 'candidate',
    })

    expect(run.result).toBe('passed')
    expect(run.settings).toEqual({
      cli_version: 'codex-cli test-1.0.0',
      config_source: 'user',
      effort: 'low',
      model: 'test-model',
      provider: null,
      sandbox: 'read-only',
      timeout_ms: 180_000,
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

  it('fails and records identity evidence when a source disappears during a reviewer run', async () => {
    const identityRoot = join(root, '.cache', 'test-rsp-review-identity-root')
    const outputRoot = join(root, '.cache', 'test-rsp-review-identity-run')
    tempRoots.push(identityRoot, outputRoot)
    const fixture = join(identityRoot, 'test', 'skill-behavior', 'fixtures', 'identity-drift')
    const skillRoot = join(identityRoot, 'skills', 'rsp-review')
    const skill = join(skillRoot, 'SKILL.md')
    mkdirSync(join(fixture, 'base', 'src'), { recursive: true })
    mkdirSync(skillRoot, { recursive: true })
    writeFileSync(join(fixture, 'base', 'src', 'value.ts'), 'export const value = 1\n')
    writeFileSync(join(fixture, 'case.yaml'), `id: identity-drift
tags: [code]
request: Review the fixed source identity without accepting changes during execution.
expected:
  code: clean
  document: skipped
  observations: [source identity remains fixed]
  prohibited_actions: [modify-worktree]
`)
    writeFileSync(skill, '# RSP Review\n\nReview only.\n')

    const pending = runEvaluation({
      caseId: 'identity-drift',
      codexBin: join(root, 'test', 'skill-behavior', 'fake-codex.mjs'),
      effort: 'low',
      env: { ...process.env, FAKE_CODEX_DELAY_MS: '150' },
      model: 'test-model',
      outputRoot,
      root: identityRoot,
      variant: 'candidate',
    })
    setTimeout(rmSync, 30, skillRoot, { force: true, recursive: true })
    const run = await pending

    expect(run.result).toBe('failed')
    expect(run.identity).toMatchObject({
      candidate_source_stable: false,
      fixture_source_stable: true,
      harness_source_stable: true,
      installed_candidate_matches_source: true,
      stable: false,
    })
    expect(run.hashes.candidate_after).toBeNull()
    expect(run.hashes.installed_candidate).toBe(run.hashes.candidate)
    expect(run.identity.errors).toContain('candidate source unavailable after execution')
    expect(existsSync(run.paths.metadata)).toBe(true)
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
      env: { ...process.env, FAKE_CODEX_CONFIG_MODE: 'provider:test-provider' },
      model: 'test-model',
      outputRoot,
      provider: 'test-provider',
      root,
      variant: 'baseline',
    })

    expect(run.settings).toMatchObject({ config_source: 'user', provider: 'test-provider' })
  })

  it('keeps user-config isolation explicit and rejects conflicting provider modes', async () => {
    const outputRoot = join(root, '.cache', 'test-rsp-review-isolated')
    tempRoots.push(outputRoot)
    const run = await runEvaluation({
      caseId: 'restraint-clean',
      codexBin: join(root, 'test', 'skill-behavior', 'fake-codex.mjs'),
      effort: 'low',
      env: { ...process.env, FAKE_CODEX_CONFIG_MODE: 'isolated' },
      isolated: true,
      model: 'test-model',
      outputRoot,
      root,
      variant: 'baseline',
    })

    expect(run.settings).toMatchObject({ config_source: 'isolated', provider: null })
    await expect(runEvaluation({
      caseId: 'restraint-clean',
      codexBin: join(root, 'test', 'skill-behavior', 'fake-codex.mjs'),
      effort: 'low',
      isolated: true,
      model: 'test-model',
      outputRoot,
      provider: 'test-provider',
      root,
      variant: 'baseline',
    })).rejects.toThrow(/mutually exclusive/)
  })

  it('fails and records a run that exceeds its explicit timeout', async () => {
    const outputRoot = join(root, '.cache', 'test-rsp-review-timeout')
    tempRoots.push(outputRoot)
    const run = await runEvaluation({
      caseId: 'restraint-clean',
      codexBin: join(root, 'test', 'skill-behavior', 'fake-codex.mjs'),
      effort: 'low',
      env: { ...process.env, FAKE_CODEX_DELAY_MS: '500' },
      model: 'test-model',
      outputRoot,
      root,
      timeoutMs: 50,
      variant: 'baseline',
    })

    expect(run.result).toBe('failed')
    expect(run.timed_out).toBe(true)
    expect(run.settings.timeout_ms).toBe(50)
  })

  it('calibrates cost from exactly three fresh paired matrices', { timeout: 15_000 }, async () => {
    const outputRoot = join(root, '.cache', 'test-rsp-review-calibration')
    tempRoots.push(outputRoot)
    const calibration = await runEvaluationCalibration({
      caseIds: ['restraint-clean'],
      codexBin: join(root, 'test', 'skill-behavior', 'fake-codex.mjs'),
      effort: 'low',
      model: 'test-model',
      outputRoot,
      root,
    })

    expect(calibration.result).toBe('passed')
    expect(calibration.matrices).toHaveLength(3)
    expect(calibration.cases).toEqual([{
      case_id: 'restraint-clean',
      median_overhead_pct: 0,
      samples: [1, 2, 3].map(repetition => ({
        baseline_input_tokens: 100,
        candidate_input_tokens: 100,
        overhead_pct: 0,
        repetition,
      })),
    }])
    expect(calibration.cost).toEqual({
      aggregate_median_overhead_pct: 0,
      passed: true,
      thresholds: { max_aggregate_median_pct: 30, max_case_median_pct: 50 },
    })
    expect(calibration.issues).toEqual([])
    expect(new Set(calibration.matrices.map(matrix => matrix.hash)).size).toBe(3)
    expect(existsSync(calibration.metadata_path)).toBe(true)
  })
})
