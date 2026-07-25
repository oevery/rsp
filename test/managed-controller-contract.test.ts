import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { evaluateManagedController, loadManagedControllerCases, prepareManagedControllerRun, readManagedControllerFlag, scoreManagedControllerOutput } from '../scripts/managed-controller-eval.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const candidate = join(root, 'research', 'candidates', 'skills', 'rsp-manage')
const product = join(root, 'skills', 'rsp-manage')

function readSkill(directory = candidate): { body: string, frontmatter: Record<string, any> } {
  const content = readFileSync(join(directory, 'SKILL.md'), 'utf8')
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  expect(match).not.toBeNull()
  return { body: match![2]!, frontmatter: parseYaml(match![1]!) as Record<string, any> }
}

describe('rsp-manage research candidate', () => {
  it('stays compact, explicit-only, host-neutral, and outside the stable suite', () => {
    const { body, frontmatter } = readSkill()

    expect(frontmatter.name).toBe(basename(candidate))
    expect(frontmatter.description).toEqual(expect.any(String))
    expect(frontmatter['disable-model-invocation']).toBeUndefined()
    expect(frontmatter.license).toBe('MIT')
    expect(frontmatter.metadata).toMatchObject({ author: 'oevery', version: expect.stringMatching(/^\d{4}\.\d{2}\.\d{2}(?:\.\d+)?$/) })
    expect(body.trim().split(/\s+/).length).toBeLessThanOrEqual(600)
    expect(lstatSync(join(candidate, 'SKILL.md')).isSymbolicLink()).toBe(false)
    expect(body).not.toMatch(/Codex|Claude|ChatGPT|GitHub Actions|session id|thread id/i)
    expect(body).toContain('Use only when the user explicitly authorizes managed continuation')
    expect(body).not.toContain('**direct:**')
    expect(body).not.toContain('**assisted:**')
    expect(existsSync(join(candidate, 'agents', 'openai.yaml'))).toBe(false)
  })

  it('executes archive only under explicit lifecycle-closeout authority', () => {
    const { body } = readSkill()

    expect(body).toContain('explicit lifecycle-closeout authority')
    expect(body).toContain('run `rsp archive <work-ref>`')
    expect(body).toContain('stop with the advisory archive action')
    expect(body).toContain('never infer Git staging or commit authority')
  })

  it('satisfies every deterministic controller contract fixture', () => {
    const cases = loadManagedControllerCases(root)
    expect(cases.map(item => item.id)).toEqual([
      'authority-stop',
      'dispatch-envelope',
      'explicit-eligibility',
      'fresh-return',
      'interruption-recovery',
      'ordinary-restraint',
    ])
    expect(evaluateManagedController(root)).toEqual(cases.map(item => ({ id: item.id, missing: [], passed: true })))
  })

  it('fails closed when an evaluation flag has no value', () => {
    expect(readManagedControllerFlag(['--model', 'gpt-5.6-terra'], '--output-root')).toBeUndefined()
    expect(() => readManagedControllerFlag(['--output-root', '--model', 'gpt-5.6-terra'], '--output-root'))
      .toThrow('--output-root requires a value')
  })

  it('prepares an explicit decline holdout without granting mutation scope', ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-decline-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))

    const prepared = prepareManagedControllerRun({
      caseId: 'ordinary-restraint',
      outputRoot,
      root,
      variant: 'candidate',
    })

    expect(prepared.manifest.expected_mode).toBe('decline')
    expect(prepared.manifest.allowed_changes).toEqual([])
    expect(prepared.prompt).toContain('Use $rsp-manage')
  })

  it('scores human-facing boundaries in the requested language', () => {
    const manifest = {
      expected_output: ['人工验收', '尚未执行'],
      forbidden_output: ['人工验收已通过'],
    }
    expect(scoreManagedControllerOutput(manifest, '物理设备人工验收尚未执行。')).toEqual({
      expected_missing: [],
      forbidden_present: [],
    })
  })

  it('scores a declined managed request by its boundary and direct next path', () => {
    const manifest = {
      expected_output: ['rsp-manage', '普通'],
      forbidden_output: ['Dispatch Envelope', 'Management Receipt'],
    }
    expect(scoreManagedControllerOutput(
      manifest,
      '未执行改动：该工作未通过 rsp-manage 资格门；下一步走普通 Implement 路径。',
    )).toEqual({ expected_missing: [], forbidden_present: [] })
  })

  it('replays the retained language rescore from sanitized evidence', () => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-rescore-'))
    try {
      const stdout = execFileSync(process.execPath, [
        join(root, 'scripts', 'managed-controller-eval.mjs'),
        'rescore',
        join(root, 'research', 'evaluations', 'rsp-manage', '2026-07-21', 'matrix.json'),
        '--output-root',
        outputRoot,
      ], { encoding: 'utf8' })
      const result = JSON.parse(stdout) as { result: string, runs: Array<{ retained_hash_matches: boolean }> }
      expect(result.result).toBe('passed')
      expect(result.runs.every(run => run.retained_hash_matches)).toBe(true)
    }
    finally {
      rmSync(outputRoot, { force: true, recursive: true })
    }
  })
})

describe('rsp-manage product Skill', () => {
  it('is compact, portable, explicit-only, and distinct from retained research', () => {
    const { body, frontmatter } = readSkill(product)

    expect(frontmatter).toMatchObject({
      name: 'rsp-manage',
      license: 'MIT',
      metadata: { author: 'oevery', version: expect.stringMatching(/^\d{4}\.\d{2}\.\d{2}(?:\.\d+)?$/) },
    })
    expect(body.trim().split(/\s+/).length).toBeLessThanOrEqual(600)
    expect(lstatSync(join(product, 'SKILL.md')).isSymbolicLink()).toBe(false)
    expect(body).toContain('only after the user explicitly requests managed continuation')
    expect(body).toContain('one selected ready Change or shallow Change Group')
    expect(body).toContain('Keep RSP artifacts as durable truth and process data transient')
    expect(readFileSync(join(candidate, 'SKILL.md'), 'utf8')).not.toBe(readFileSync(join(product, 'SKILL.md'), 'utf8'))
  })

  it('declines ordinary work without controller overhead', () => {
    const { body } = readSkill(product)

    expect(body).toContain('A small single slice, tightly coupled scopes, or host worker availability alone is ineligible')
    expect(body).toContain('make no mutation, create no dispatch envelope, receipt, budget, or controller state')
    expect(body).toContain('return the exact Core or Discipline next action without executing it')
  })

  it('bounds authority reads, dispatch, correction, and verification', () => {
    const { body } = readSkill(product)

    expect(body).toContain('Snapshot the user authority')
    expect(body).toContain('Send an internal compact envelope only for real work')
    expect(body).toContain('four worker dispatches and one corrective retry')
    expect(body).toContain('Choose the cheapest decisive check')
    expect(body).toContain('Run at most one broader integration gate')
    expect(body).toContain('During interruption recovery, reread current authority and referenced evidence')
  })

  it('preserves child owners and follows derived Group waves', () => {
    const { body } = readSkill(product)

    expect(body).toContain('one focused ready Change, or one explicitly selected shallow Group')
    expect(body).toContain('at least two ready direct children')
    expect(body).toContain('dispatch only child WorkRefs in the current derived `plan.waves` wave')
    expect(body).toContain('rerun `rsp status --json`')
    expect(body).toContain('restrict it to declared children')
    expect(body).toContain('shared paths, lockfiles, generated artifacts, and broad integration outputs as overlapping')
    expect(body).toContain('Keep overlaps, blockers, later waves, and dependent verification sequential')
  })

  it('prepares a product Group holdout with real waves and bounded mutations', ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-product-group-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))

    const prepared = prepareManagedControllerRun({
      caseId: 'group-waves',
      outputRoot,
      root,
      variant: 'product',
    })
    const status = JSON.parse(execFileSync(process.execPath, [
      join(root, 'dist', 'cli.mjs'),
      'status',
      '--json',
    ], { cwd: prepared.workspace, encoding: 'utf8' })) as {
      plan: {
        blocked: Array<{ change: string, external: boolean, requires: string[] }>
        ready: string[]
        waves: string[][]
      }
    }

    expect(readFileSync(join(prepared.workspace, '.agents', 'skills', 'rsp-manage', 'SKILL.md'), 'utf8'))
      .toBe(readFileSync(join(product, 'SKILL.md'), 'utf8'))
    expect(status.plan.ready).toEqual(['delivery/header', 'delivery/retry'])
    expect(status.plan.waves).toEqual([
      ['delivery/header', 'delivery/retry'],
      ['delivery/summary'],
    ])
    expect(status.plan.blocked).toEqual([
      { change: 'delivery/blocked', external: true, requires: [] },
      { change: 'delivery/summary', external: false, requires: ['delivery/header'] },
    ])
    expect(prepared.manifest.allowed_changes).not.toContain('.rsp/changes/delivery/summary.md')
    expect(prepared.manifest.allowed_changes).not.toContain('.rsp/changes/delivery/blocked.md')
    expect(prepared.manifest.allowed_changes).not.toContain('package-lock.json')
    expect(prepared.prompt).toContain('Use $rsp-manage')
  })

  it('replays retained product Group behavior evidence', () => {
    const retained = join(root, 'research', 'evaluations', 'rsp-manage', '2026-07-25-product-group-waves')
    const metadata = JSON.parse(readFileSync(join(retained, 'metadata.json'), 'utf8')) as {
      changed_paths: string[]
      final_hash: string
      original_runner_result: string
      output_score: { expected_missing: string[], forbidden_present: string[] }
      result: string
      unauthorized_paths: string[]
      verification: { failures: number, passed: boolean, tests: number }
    }
    const observations = JSON.parse(readFileSync(join(retained, 'observations.json'), 'utf8')) as {
      execution: { controller_state_created: boolean, declared_sequence: string[], shared_path_changed: boolean }
      postflight: { dependent_or_blocked_paths_changed: boolean, pending: string[], status_reread: boolean }
      preflight: { ready: string[], waves: string[][] }
    }
    const final = readFileSync(join(retained, 'final.md'), 'utf8')
    const manifest = parseYaml(readFileSync(join(root, 'test', 'managed-controller', 'holdout', 'group-waves', 'case.yaml'), 'utf8')) as {
      expected_output: string[]
      forbidden_output: string[]
    }

    expect(metadata).toMatchObject({
      original_runner_result: 'failed',
      output_score: { expected_missing: [], forbidden_present: [] },
      result: 'passed',
      unauthorized_paths: [],
      verification: { failures: 0, passed: true, tests: 7 },
    })
    expect(createHash('sha256').update(final).digest('hex')).toBe(metadata.final_hash)
    expect(scoreManagedControllerOutput(manifest, final)).toEqual(metadata.output_score)
    expect(metadata.changed_paths).toEqual([
      '.rsp/changes/delivery/header.md',
      '.rsp/changes/delivery/retry.md',
      'src/header.mjs',
      'src/retry.mjs',
      'test/header.test.mjs',
      'test/retry.test.mjs',
    ])
    expect(observations.preflight).toMatchObject({
      ready: ['delivery/header', 'delivery/retry'],
      waves: [['delivery/header', 'delivery/retry'], ['delivery/summary']],
    })
    expect(observations.execution).toEqual({
      controller_state_created: false,
      declared_sequence: ['delivery/header', 'delivery/retry'],
      sequence_evidence: expect.any(String),
      shared_path: 'package-lock.json',
      shared_path_changed: false,
    })
    expect(observations.postflight).toMatchObject({
      dependent_or_blocked_paths_changed: false,
      pending: ['delivery/summary', 'delivery/blocked'],
      status_reread: true,
    })
  })

  it('keeps Group scheduling transient and lifecycle child-scoped', () => {
    const { body } = readSkill(product)

    expect(body).toContain('out of Changes, Group Briefs, Specs, Decision Records')
    expect(body).toContain('Update each executable Change only with converged requirements')
    expect(body).toContain('Keep shared completion in the Brief without copying child tasks or live state')
    expect(body).toContain('commit completed Changes as independently reviewable logical units')
    expect(body).toContain('exact per-Change commit boundaries and owners')
    expect(body).toContain('claim Group closure')
  })

  it('keeps process chronology transient and returns only outcome evidence', () => {
    const { body } = readSkill(product)

    expect(body).toContain('Keep dispatch chronology out of Changes, Group Briefs, Specs, Decision Records')
    expect(body).toContain('Return only completed and pending WorkRefs or slices, fresh verification, omissions, the real boundary owner, and one next action')
    expect(body).toContain('Do not expose retry or budget chronology')
    expect(body).toContain('Archive never grants Git or publication authority')
  })

  it('keeps Change commits separate from late release finalization', () => {
    const { body } = readSkill(product)

    expect(body).toContain('Release identity is unconfirmed unless explicit user or repository authority supplies it')
    expect(body).toContain('commit completed Changes as independently reviewable logical units after closeout')
    expect(body).toContain('Return to Core before a separate release operation and dedicated release commit')
    expect(body).toContain('Otherwise return exact per-Change commit boundaries and owners')
  })
})
