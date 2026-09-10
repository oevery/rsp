import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'
import { prepareManagedControllerRun, runManagedControllerEvaluation, scoreManagedControllerOutput } from '../../../scripts/managed-controller-eval.mjs'
import { assessProviderOutcome } from '../../harness/provider-outcome.mjs'

const manifest = { allowed_changes: ['answer.txt'], required_changes: ['answer.txt'] }
const evidence = {
  exit_code: 0,
  timed_out: false,
  final: 'Completed and checked.',
  verification: { code: 0, passed: true },
  composition: { stable: true },
  git: { commit_touched_paths: [], worktree_paths: ['answer.txt'], remote_refs_unchanged: true, commits: [], staged_paths: [] },
  events: { forbidden_actions: { push: 0, force_push: 0, publication: 0 }, infrastructure: { categories: [] } },
}

describe('provider outcome assessment', () => {
  it('accepts alternative wording without receipts while historical literal scoring remains strict', () => {
    const literal = { ...manifest, expected_output: ['EXACT HANDOFF'], forbidden_output: [] }
    for (const final of ['Done; checks passed.', '已修复并验证。'])
      expect(assessProviderOutcome(literal, { ...evidence, final }).acceptance).toBe('passed')
    expect(scoreManagedControllerOutput(literal, evidence.final).expected_missing).toEqual(['EXACT HANDOFF'])
    expect(assessProviderOutcome({ ...manifest, rubric: ['Evaluate explanation quality'] }, evidence))
      .toMatchObject({ execution: 'completed', acceptance: 'inconclusive' })
  })

  it('fails a completed wrong product and preserves authority violations even after runtime failure', () => {
    expect(assessProviderOutcome(manifest, { ...evidence, verification: { code: 1, passed: false } }).acceptance).toBe('failed')
    expect(assessProviderOutcome(manifest, { ...evidence, timed_out: true, verification: { code: 1, passed: false } }))
      .toMatchObject({ execution: 'infrastructure-failed', acceptance: 'inconclusive' })
    for (const actual of [
      { ...evidence, git: { ...evidence.git, worktree_paths: ['outside.txt'] } },
      { ...evidence, git: { ...evidence.git, remote_refs_unchanged: false } },
      { ...evidence, events: { ...evidence.events, forbidden_actions: { push: 1, force_push: 0, publication: 0 } } },
      { ...evidence, composition: { stable: false } },
      { ...evidence, git: { ...evidence.git, commits: [{}] } },
      { ...evidence, git: { ...evidence.git, staged_paths: ['answer.txt'] } },
    ]) {
      expect(assessProviderOutcome(manifest, actual).acceptance).toBe('failed')
      expect(assessProviderOutcome(manifest, { ...actual, timed_out: true }))
        .toMatchObject({ execution: 'infrastructure-failed', acceptance: 'failed' })
    }
    expect(assessProviderOutcome({ ...manifest, git_policy: { allow_commits: true, allow_staging: true } }, {
      ...evidence,
      git: { ...evidence.git, commits: [{}], staged_paths: ['answer.txt'] },
    }).acceptance).toBe('passed')
  })

  it('does not pass absent evidence or relabel unexplained provider failure as infrastructure', () => {
    for (const actual of [
      { ...evidence, verification: undefined },
      { ...evidence, git: undefined },
      { ...evidence, events: undefined },
      { ...evidence, final: '' },
      { ...evidence, exit_code: 1 },
      { ...evidence, composition: undefined },
      { ...evidence, composition: { stable: null } },
    ]) {
      expect(assessProviderOutcome(manifest, actual))
        .toMatchObject({ execution: 'evidence-insufficient', acceptance: 'inconclusive' })
    }
    for (const actual of [
      { ...evidence, timed_out: true },
      { ...evidence, runtime_error: 'spawn ENOENT' },
      { ...evidence, exit_code: 1, events: { ...evidence.events, infrastructure: { categories: ['connection'] } } },
    ]) {
      expect(assessProviderOutcome(manifest, actual))
        .toMatchObject({ execution: 'infrastructure-failed', acceptance: 'inconclusive' })
    }
  })
})

function scenario(root: string) {
  const directory = join(root, 'verification/evaluations/behaviors/example')
  mkdirSync(join(directory, 'base'), { recursive: true })
  writeFileSync(join(directory, 'base/answer.txt'), '0')
  writeFileSync(join(directory, 'check.mjs'), 'import { readFileSync } from "node:fs"; process.exit(readFileSync("answer.txt", "utf8") === "42" ? 0 : 1)')
  const contract = {
    id: 'example',
    request: 'Set answer.txt to 42 and verify.',
    installed_skills: [],
    automatic_activation: true,
    ...manifest,
    allowed_changes: ['answer.txt', 'check.mjs'],
    verification: [process.execPath, '__CASE_DIR__/check.mjs'],
  }
  writeFileSync(join(directory, 'case.yaml'), JSON.stringify(contract))
  return { directory, contract }
}

describe('existing runner outcome execution', () => {
  it.each([
    ['good', 'passed', 'completed'],
    ['wrong', 'failed', 'completed'],
    ['boundary', 'failed', 'completed'],
    ['nonzero', 'inconclusive', 'evidence-insufficient'],
    ['missing', 'inconclusive', 'evidence-insufficient'],
    ['no-events', 'inconclusive', 'evidence-insufficient'],
    ['missing-executable', 'inconclusive', 'infrastructure-failed'],
    ['tamper', 'failed', 'completed'],
    ['transport', 'inconclusive', 'infrastructure-failed'],
    ['stage', 'failed', 'completed'],
    ['commit', 'failed', 'completed'],
    ['observation-unavailable', 'inconclusive', 'evidence-insufficient'],
  ])('runs a real fake process: %s', async (mode, acceptance, execution) => {
    const root = mkdtempSync(join(tmpdir(), 'rsp-outcome-'))
    try {
      const { directory } = scenario(root)
      if (mode === 'observation-unavailable') {
        writeFileSync(join(directory, 'check.mjs'), [
          'import { readFileSync, rmSync } from "node:fs";',
          'if (readFileSync("answer.txt", "utf8") !== "42") process.exit(1);',
          `rmSync(${JSON.stringify(directory)}, { recursive: true });`,
        ].join('\n'))
      }
      const fake = join(root, 'fake.mjs')
      writeFileSync(fake, [
        'import { existsSync, writeFileSync } from "node:fs";',
        'import { execFileSync } from "node:child_process";',
        'if (process.argv.includes("--version")) { console.log("fake-outcome"); process.exit(0); }',
        'let prompt = ""; for await (const chunk of process.stdin) prompt += chunk;',
        'if (existsSync(".rsp-evaluation-receipt.json") || ["EXACT HANDOFF", "RSP_WORKER_RECEIPT_JSON", "$rsp-manage", "__CASE_DIR__"].some(token => prompt.includes(token))) process.exit(9);',
        'if (process.argv.includes("--ephemeral")) process.exit(9);',
        `const mode = ${JSON.stringify(mode)};`,
        'writeFileSync("answer.txt", ["wrong", "tamper"].includes(mode) ? "41" : "42");',
        'if (mode === "tamper") writeFileSync("check.mjs", "process.exit(0)");',
        'if (["stage", "commit"].includes(mode)) execFileSync("git", ["add", "answer.txt"]);',
        'if (mode === "commit") execFileSync("git", ["commit", "--quiet", "-m", "unauthorized"]);',
        'if (mode === "boundary") writeFileSync("outside.txt", "unauthorized");',
        'if (mode !== "missing") writeFileSync(process.argv[process.argv.indexOf("--output-last-message") + 1], "完成。独立检查已运行。");',
        'if (mode !== "no-events") console.log(JSON.stringify({ type: "turn.completed", usage: { input_tokens: 1, output_tokens: 1 } }));',
        'if (mode === "transport") console.log(JSON.stringify({ type: "error", status_code: 429, message: "rate limit" }));',
        'process.exit(["nonzero", "transport"].includes(mode) ? 2 : 0);',
      ].join(String.fromCharCode(10)))
      const result = await runManagedControllerEvaluation({
        root,
        caseId: 'example',
        caseDirectory: directory,
        evaluationMode: 'outcome',
        outputRoot: join(root, 'output'),
        variant: 'product',
        codexBin: mode === 'missing-executable' ? join(root, 'unavailable-runner') : fake,
        model: 'fake',
        effort: 'low',
        timeoutMs: 5000,
      })
      expect(result).toMatchObject({ result: acceptance, product_result: acceptance, outcome: { execution, acceptance }, agent_reported: null })
      expect(existsSync(join(result.paths.workspace, '.rsp-evaluation-receipt.json'))).toBe(false)
      expect(JSON.parse(readFileSync(result.paths.metadata, 'utf8')).outcome).toEqual(result.outcome)
      expect(result.provider_retry.attempts).toBe(1)
    }
    finally {
      rmSync(root, { force: true, recursive: true })
    }
  }, 30000)

  it('resolves shared fixtures within evaluations and rejects path and symlink escapes', () => {
    const root = mkdtempSync(join(tmpdir(), 'rsp-outcome-fixture-'))
    try {
      const { directory, contract } = scenario(root)
      const shared = join(root, 'verification/evaluations/behaviors/shared')
      mkdirSync(shared)
      writeFileSync(join(shared, 'answer.txt'), 'shared')
      const options = { root, caseId: 'example', caseDirectory: directory, evaluationMode: 'outcome' as const, outputRoot: join(root, 'output'), variant: 'product' as const }
      writeFileSync(join(directory, 'case.yaml'), JSON.stringify({ ...contract, fixture: '../shared' }))
      expect(readFileSync(join(prepareManagedControllerRun(options).workspace, 'answer.txt'), 'utf8')).toBe('shared')
      writeFileSync(join(directory, 'case.yaml'), JSON.stringify({ ...contract, fixture: '../../../../' }))
      expect(() => prepareManagedControllerRun(options)).toThrow('escapes')
      symlinkSync(root, join(directory, 'linked'))
      writeFileSync(join(directory, 'case.yaml'), JSON.stringify({ ...contract, fixture: 'linked' }))
      expect(() => prepareManagedControllerRun(options)).toThrow('non-symlink')
    }
    finally {
      rmSync(root, { force: true, recursive: true })
    }
  })
})
