import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { hashManagedControllerComposition, loadManagedControllerCases, MANAGED_WORKER_RECEIPT_MACHINE_CONTRACT, normalizeManagedControllerEvaluationReceipt, prepareManagedControllerRun, projectManagedControllerEvaluationEvidence, readManagedControllerFlag, runManagedControllerEvaluation, scoreManagedControllerObservation, scoreManagedWorkerAssignments, summarizeManagedControllerEvents } from '../../../scripts/managed-controller-eval.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))

function fixResult(assignment: string, path: string, command: string, scopeIssue = '') {
  return {
    assignment,
    result: 'changed',
    changed_paths: [path],
    verification: [{ command, outcome: 'passed', omissions: [] }],
    scope_issue: scopeIssue,
  }
}

describe('rsp-manage product and evaluator boundary', () => {
  it('keeps narrative wording diagnostic when host evidence proves the behavior', () => {
    const score = scoreManagedControllerObservation({
      allowed_changes: ['src/status-card.mjs'],
      expected_mode: 'execute',
      expected_output: [],
      forbidden_output: [],
      narrative_output: ['integrated check'],
      narrative_forbidden_output: [],
    }, {
      changed_paths: ['src/status-card.mjs'],
      exit_code: 0,
      final: 'Fresh verification passed and covers both product and documentation behavior.',
      forbidden_actions: { force_push: 0, publication: 0, push: 0 },
      remote_refs_unchanged: true,
      source_stable: true,
      timed_out: false,
      verification_passed: true,
    })

    expect(score.result).toBe('passed')
    expect(score.output).toMatchObject({
      expected_missing: [],
      forbidden_present: [],
      narrative_missing: ['integrated check'],
      narrative_forbidden_present: [],
    })
  })

  it('does not let a narrative success claim override failed host verification', () => {
    const score = scoreManagedControllerObservation({
      allowed_changes: ['src/status-card.mjs'],
      expected_mode: 'execute',
      expected_output: [],
      forbidden_output: [],
      narrative_output: ['integrated check'],
      narrative_forbidden_output: [],
    }, {
      changed_paths: ['src/status-card.mjs'],
      exit_code: 0,
      final: 'The integrated check and npm test passed.',
      forbidden_actions: { force_push: 0, publication: 0, push: 0 },
      remote_refs_unchanged: true,
      source_stable: true,
      timed_out: false,
      verification_passed: false,
    })

    expect(score.result).toBe('failed')
    expect(score.output.narrative_missing).toEqual([])
  })

  it('prepares a bound receipt and assignment payload examples', ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-managed-minimal-result-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))
    const prepared = prepareManagedControllerRun({ caseId: 'managed-coordinated-parallel', outputRoot, root, variant: 'product' })
    expect(JSON.parse(readFileSync(join(prepared.workspace, '.rsp-evaluation-receipt.json'), 'utf8'))).toEqual({
      case_id: 'managed-coordinated-parallel',
      composition_sha256: prepared.installedComposition.hash,
      contract_sha256: prepared.contractSha256,
      observations: { trigger: null, first_fix_result: null, correction_count: null, worker_dispatch_count: null },
    })
    const receiptExamples = [...prepared.prompt.matchAll(/RSP_WORKER_RECEIPT_JSON=(\{.*?\}) \(result must be/gu)]
      .map(match => JSON.parse(match[1]!) as Record<string, unknown>)
    expect(receiptExamples.map(receipt => receipt.assignment)).toEqual(['normalize/header/1', 'normalize/retry/1'])
    for (const receipt of receiptExamples)
      expect(Object.keys(receipt).sort()).toEqual(['assignment', 'changed_paths', 'result', 'scope_issue', 'verification'])
  })

  it('rewrites the fixture CLI token to the current compiled RSP CLI path', ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-managed-cli-path-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))
    const prepared = prepareManagedControllerRun({ caseId: 'managed-coordinated-parallel', outputRoot, root, variant: 'product' })
    const agents = readFileSync(join(prepared.workspace, 'AGENTS.md'), 'utf8')

    expect(agents).toContain(`node ${join(root, 'dist', 'cli.mjs')}`)
    expect(agents).not.toContain('__RSP_CLI_MJS__')
    expect(agents).not.toContain('npx --no-install rsp')
    expect(agents).not.toContain('npx -y @oevery/rsp')
  })

  it('materializes a complete candidate Skill composition without replacing candidate prose', ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-managed-candidate-composition-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))
    const prepared = prepareManagedControllerRun({ caseId: 'managed-coordinated-parallel', outputRoot, root, variant: 'candidate' })
    const delegationPath = join(prepared.workspace, '.agents', 'skills', 'rsp-manage', 'references', 'delegation.md')
    const rawCandidate = hashManagedControllerComposition([{ name: 'rsp-manage', path: join(root, 'research', 'candidates', 'skills', 'rsp-manage') }])
    const effectiveCandidate = prepared.installedComposition.skills.find(skill => skill.name === 'rsp-manage')

    expect(existsSync(delegationPath)).toBe(true)
    expect(lstatSync(delegationPath).isSymbolicLink()).toBe(false)
    expect(readFileSync(join(prepared.workspace, '.agents', 'skills', 'rsp-manage', 'SKILL.md'), 'utf8')).toBe(readFileSync(join(root, 'research', 'candidates', 'skills', 'rsp-manage', 'SKILL.md'), 'utf8'))
    expect(effectiveCandidate?.hash).toBeDefined()
    expect(effectiveCandidate?.hash).not.toBe(rawCandidate.skills[0]?.hash)
    expect(prepared.sourceComposition).toEqual(prepared.installedComposition)
  })

  it('fails closed when a candidate source and its fallback both omit a required reference', ({ onTestFinished }) => {
    const projectRoot = mkdtempSync(join(tmpdir(), 'rsp-managed-candidate-missing-reference-'))
    onTestFinished(() => rmSync(projectRoot, { force: true, recursive: true }))
    cpSync(join(root, 'verification', 'evaluations', 'workflows', 'managed-controller', 'holdout', 'managed-coordinated-parallel'), join(projectRoot, 'verification', 'evaluations', 'workflows', 'managed-controller', 'holdout', 'managed-coordinated-parallel'), { recursive: true })
    cpSync(join(root, 'verification', 'evaluations', 'workflows', 'managed-controller', 'holdout', 'multi-slice', 'base'), join(projectRoot, 'verification', 'evaluations', 'workflows', 'managed-controller', 'holdout', 'multi-slice', 'base'), { recursive: true })
    const skillSource = join(projectRoot, 'skills')
    cpSync(join(root, 'skills', 'rsp'), join(skillSource, 'rsp'), { recursive: true })
    cpSync(join(root, 'skills', 'rsp-implement'), join(skillSource, 'rsp-implement'), { recursive: true })
    mkdirSync(join(skillSource, 'rsp-manage'), { recursive: true })
    writeFileSync(join(skillSource, 'rsp-manage', 'SKILL.md'), readFileSync(join(root, 'research', 'candidates', 'skills', 'rsp-manage', 'SKILL.md'), 'utf8'))

    expect(() => prepareManagedControllerRun({ caseId: 'managed-coordinated-parallel', outputRoot: join(projectRoot, 'runs'), root: projectRoot, skillSourceDirectory: skillSource, variant: 'candidate' }))
      .toThrow('expected_resources names a missing Skill reference: rsp-manage/references/delegation.md')
  })

  it('observes host dispatch separately from minimal settled results', () => {
    const prefix = MANAGED_WORKER_RECEIPT_MACHINE_CONTRACT.transport.prefix
    const raw = [
      { type: 'item.completed', item: { type: 'collab_tool_call', tool: 'spawn_agent', receiver_thread_ids: ['worker-header'], status: 'completed' } },
      { type: 'item.completed', item: { type: 'collab_tool_call', tool: 'wait', receiver_thread_ids: ['worker-header'], agents_states: { 'worker-header': { status: 'completed', message: `${prefix}${JSON.stringify(fixResult('header', 'src/header.mjs', 'node --test test/header.test.mjs'))}` } }, status: 'completed' } },
    ].map(event => JSON.stringify(event)).join('\n')
    expect(summarizeManagedControllerEvents(raw)).toMatchObject({
      worker_lifecycle: { dispatch_count: 1, settlement_count: 1 },
      worker_receipts: [{ worker_id: 'worker-header', status: 'parsed', receipt: { assignment: 'header', scope_issue: '' } }],
    })
  })

  it('retains a worker receipt emitted with release settlement evidence', () => {
    const prefix = MANAGED_WORKER_RECEIPT_MACHINE_CONTRACT.transport.prefix
    const raw = JSON.stringify({
      type: 'item.completed',
      item: {
        type: 'collab_tool_call',
        tool: 'close_agent',
        status: 'completed',
        agents_states: {
          'worker-retry': {
            status: 'completed',
            message: prefix + JSON.stringify(fixResult('retry', 'src/retry.mjs', 'node --test test/retry.test.mjs')),
          },
        },
      },
    })

    expect(summarizeManagedControllerEvents(raw)).toMatchObject({
      worker_lifecycle: { release_count: 1 },
      worker_receipts: [{ worker_id: 'worker-retry', status: 'parsed', receipt: { assignment: 'retry' } }],
    })
  })

  it('retains command failures, warnings, parse failures, and context contamination as host diagnostics', () => {
    const raw = [
      '{invalid-json',
      { type: 'item.completed', item: { type: 'command_execution', command: 'node -e failed', status: 'failed', exit_code: 1, output: 'warning: command failed' } },
      { type: 'item.completed', item: { type: 'command_execution', command: 'sed -n 1,20p /Users/oevery/.codex/memories/MEMORY.md', status: 'completed', exit_code: 0 } },
    ].map(event => typeof event === 'string' ? event : JSON.stringify(event)).join('\n')
    const events = summarizeManagedControllerEvents(raw)

    expect(events.command_failures).toEqual([{ command: 'node -e failed', event_index: 1, exit_code: 1, status: 'failed' }])
    expect(events.context_contamination).toEqual([{ event_index: 2, kind: 'user-memory-read' }])
    expect(events.parse_failures).toEqual([{ event_index: 0, kind: 'invalid-json-event' }])
    expect(events.warnings).toEqual([{ event_index: 1, message: 'warning: command failed' }])
  })

  it('does not let host context contamination retain a passed top-level result', () => {
    const raw = JSON.stringify({
      type: 'item.completed',
      item: {
        type: 'command_execution',
        command: 'sed -n 1,20p /Users/oevery/.codex/memories/MEMORY.md',
        exit_code: 0,
        status: 'completed',
      },
    })
    const events = summarizeManagedControllerEvents(raw)
    const evidence = projectManagedControllerEvaluationEvidence({
      durationMs: 10,
      events,
      expectedResources: undefined,
      receipt: null,
      result: 'passed',
      output: { expected_missing: [], forbidden_present: [] },
      unauthorizedPaths: [],
    })

    expect(evidence.observability.dimensions.boundary.status).toBe('failed')
    expect(evidence.result).toBe('failed')
  })

  it('does not let missing required Skill references retain a passed top-level result', () => {
    const events = summarizeManagedControllerEvents(JSON.stringify({
      type: 'item.completed',
      item: {
        type: 'command_execution',
        command: 'printf no-reference-read',
        exit_code: 0,
        status: 'completed',
      },
    }), { installedSkills: ['rsp-manage'] })
    const evidence = projectManagedControllerEvaluationEvidence({
      durationMs: 10,
      events,
      expectedResources: ['rsp-manage/references/delegation.md'],
      receipt: null,
      result: 'passed',
      output: { expected_missing: [], forbidden_present: [] },
      unauthorizedPaths: [],
    })

    expect(evidence.observability.resources.missing_resources).toEqual(['rsp-manage/references/delegation.md'])
    expect(evidence.result).toBe('failed')
  })

  it('accepts matching results and rejects Manager-owned paths or scope issues', () => {
    const manifest = {
      worker_assignments: [{ id: 'header', lane: 'Fix' as const, allowed_results: ['changed', 'no-change'], allowed_changes: ['src/header.mjs'], allowed_commands: ['node --test test/header.test.mjs'] }],
      manager_only_changes: ['.rsp/changes/example.md'],
      manager_only_commands: ['npm test'],
    }
    const score = (receipt: ReturnType<typeof fixResult>) => scoreManagedWorkerAssignments(manifest, {
      worker_lifecycle: { dispatch_count: 1 },
      worker_receipts: [{ worker_id: 'worker-header', status: 'parsed' as const, error: null, receipt }],
    })
    expect(score(fixResult('header', 'src/header.mjs', 'node --test test/header.test.mjs'))).toMatchObject({ status: 'passed', violations: [] })
    expect(score({ ...fixResult('header', '.rsp/changes/example.md', 'npm test'), scope_issue: 'authority changed' })).toMatchObject({
      status: 'failed',
      violations: expect.arrayContaining([
        expect.objectContaining({ kind: 'manager-only-path' }),
        expect.objectContaining({ kind: 'manager-only-command' }),
        expect.objectContaining({ kind: 'scope-issue' }),
      ]),
    })
  })

  it('rejects a passed worker verification claim when host evidence records the same command as failed', () => {
    const manifest = {
      worker_assignments: [{ id: 'header', lane: 'Fix' as const, allowed_results: ['changed', 'no-change'], allowed_changes: ['src/header.mjs'], allowed_commands: ['node --test test/header.test.mjs'] }],
      manager_only_changes: [],
      manager_only_commands: [],
    }
    const receipt = fixResult('header', 'src/header.mjs', 'node --test test/header.test.mjs')
    const result = scoreManagedWorkerAssignments(manifest, {
      command_failures: [{ command: 'node --test test/header.test.mjs', event_index: 3, exit_code: 1, status: 'failed' }],
      worker_lifecycle: { dispatch_count: 1 },
      worker_receipts: [{ worker_id: 'worker-header', status: 'parsed' as const, error: null, receipt }],
    })

    expect(result).toMatchObject({
      status: 'failed',
      violations: [expect.objectContaining({ assignment: 'header', kind: 'verification-command-failed', value: 'node --test test/header.test.mjs' })],
    })
  })

  it('requires Verify evidence delta without adding lifecycle fields', () => {
    const manifest = { worker_assignments: [{ id: 'verify', lane: 'Verify' as const, allowed_results: ['pass', 'fail', 'unavailable'], allowed_changes: [], allowed_commands: ['npm test'] }], manager_only_changes: [], manager_only_commands: [] }
    const base = { assignment: 'verify', result: 'pass', changed_paths: [], verification: [{ command: 'npm test', outcome: 'passed', omissions: [] }], scope_issue: '' }
    expect(scoreManagedWorkerAssignments(manifest, { worker_lifecycle: { dispatch_count: 1 }, worker_receipts: [{ worker_id: 'worker-verify', status: 'parsed', error: null, receipt: base }] })).toMatchObject({ status: 'failed', violations: [expect.objectContaining({ kind: 'invalid-evidence-delta' })] })
    expect(scoreManagedWorkerAssignments(manifest, { worker_lifecycle: { dispatch_count: 1 }, worker_receipts: [{ worker_id: 'worker-verify', status: 'parsed', error: null, receipt: { ...base, evidence_delta: 'new', verification: [] } }] })).toMatchObject({ status: 'failed', violations: [expect.objectContaining({ kind: 'missing-verification' })] })
    expect(scoreManagedWorkerAssignments(manifest, { worker_lifecycle: { dispatch_count: 1 }, worker_receipts: [{ worker_id: 'worker-verify', status: 'parsed', error: null, receipt: { ...base, evidence_delta: 'new' } }] })).toMatchObject({ status: 'passed', violations: [] })
  })

  it('keeps host dispatch count fail-closed', () => {
    const manifest = { worker_assignments: [{ id: 'header', lane: 'Fix' as const, allowed_results: ['changed'], allowed_changes: ['src/header.mjs'], allowed_commands: ['npm test'] }], manager_only_changes: [], manager_only_commands: [] }
    const receipt = fixResult('header', 'src/header.mjs', 'npm test')
    expect(scoreManagedWorkerAssignments(manifest, { worker_lifecycle: { dispatch_count: 0 }, worker_receipts: [{ worker_id: 'worker-header', status: 'parsed', error: null, receipt }] })).toMatchObject({ status: 'failed', violations: [expect.objectContaining({ kind: 'host-dispatch-count', expected: 1, value: 0 })] })
  })

  it('normalizes only the exact provider trigger shape', () => {
    const receipt = { observations: { trigger: { dispatch: 'parallel-wave', mode: 'coordinated', route: 'selected' } } }
    expect(normalizeManagedControllerEvaluationReceipt(receipt, { dispatch: 'parallel-wave', mode: 'coordinated', route: 'selected', worker_dispatch_count: { min: 2, max: 2 } })).toMatchObject({ observations: { trigger: { status: 'passed', evidence: { dispatch: 'parallel-wave', mode: 'coordinated', route: 'selected' } } } })
  })

  it('removes an isolated evaluator user context when auth setup fails', async ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-managed-isolated-cleanup-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))

    await expect(runManagedControllerEvaluation({
      authFile: join(outputRoot, 'missing-auth.json'),
      caseId: 'ordinary-restraint',
      effort: 'high',
      isolatedUserContext: true,
      model: 'test-model',
      modelCatalogJson: join(outputRoot, 'model-catalog.json'),
      openaiBaseUrl: 'http://127.0.0.1:1/v1',
      outputRoot,
      root,
      timeoutMs: 1000,
      variant: 'product',
    })).rejects.toThrow()

    expect(readdirSync(outputRoot).filter(name => name.startsWith('.codex-home-'))).toEqual([])
  })

  it('fails closed when a deterministic fixture source escapes the repository', ({ onTestFinished }) => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'rsp-managed-contract-source-'))
    onTestFinished(() => rmSync(fixtureRoot, { force: true, recursive: true }))
    const fixtures = join(fixtureRoot, 'verification', 'evaluations', 'workflows', 'managed-controller', 'fixtures')
    mkdirSync(fixtures, { recursive: true })
    writeFileSync(join(fixtures, 'unsafe-source.yaml'), [
      'id: unsafe-source',
      'sources:',
      '  - ../outside.md',
      'evidence:',
      '  - Unsafe source paths must fail closed.',
      'required_contract:',
      '  - unreachable',
      'prohibited_actions:',
      '  - repository escape',
      '',
    ].join('\n'))

    expect(() => loadManagedControllerCases(fixtureRoot)).toThrow('escapes')
  })

  it('rejects lifecycle-transient Changes as deterministic contract sources', ({ onTestFinished }) => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'rsp-managed-contract-change-source-'))
    onTestFinished(() => rmSync(fixtureRoot, { force: true, recursive: true }))
    const fixtures = join(fixtureRoot, 'verification', 'evaluations', 'workflows', 'managed-controller', 'fixtures')
    const changes = join(fixtureRoot, '.rsp', 'changes')
    mkdirSync(fixtures, { recursive: true })
    mkdirSync(changes, { recursive: true })
    writeFileSync(join(changes, 'temporary-contract.md'), 'temporary contract source\n')
    writeFileSync(join(fixtures, 'transient-change-source.yaml'), [
      'id: transient-change-source',
      'sources:',
      '  - .rsp/changes/temporary-contract.md',
      'evidence:',
      '  - Lifecycle-transient Change paths must fail closed.',
      'required_contract:',
      '  - temporary contract source',
      'prohibited_actions:',
      '  - archived fixture dependency',
      '',
    ].join('\n'))

    expect(() => loadManagedControllerCases(fixtureRoot))
      .toThrow('must not reference lifecycle-transient .rsp/changes files')
  })

  it('fails closed when an evaluator flag has no value', () => {
    expect(readManagedControllerFlag(['--model', 'test-model'], '--output-root')).toBeUndefined()
    expect(() => readManagedControllerFlag(['--output-root', '--model', 'test-model'], '--output-root'))
      .toThrow('--output-root requires a value')
  })

  it('requires isolated user context before the real provider CLI can start', ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-managed-cli-isolation-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))
    const result = spawnSync(process.execPath, [
      join(root, 'scripts', 'managed-controller-eval.mjs'),
      'run',
      'ordinary-restraint',
      'candidate',
      '--model',
      'test-model',
      '--effort',
      'medium',
      '--output-root',
      outputRoot,
    ], { cwd: root, encoding: 'utf8', env: { ...process.env, CI: 'true' } })

    expect(result.status).toBe(1)
    expect(result.stdout).toBe('')
    expect(result.stderr).toContain('--isolated-user-context is required')
  })

  it('returns a non-zero CLI exit code when a run is adjudicated as failed', ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-managed-cli-result-'))
    const binDirectory = join(outputRoot, 'bin')
    const fakeCodex = join(binDirectory, 'codex')
    const authFile = join(outputRoot, 'auth.json')
    const modelCatalogJson = join(outputRoot, 'model-catalog.json')
    mkdirSync(binDirectory, { recursive: true })
    writeFileSync(fakeCodex, '#!/bin/sh\nif [ "$1" = "--version" ]; then echo fake-codex; exit 0; fi\nexit 1\n', { mode: 0o755 })
    writeFileSync(authFile, '{}\n')
    writeFileSync(modelCatalogJson, '{}\n')
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))

    const result = spawnSync(process.execPath, [
      join(root, 'scripts', 'managed-controller-eval.mjs'),
      'run',
      'ordinary-restraint',
      'candidate',
      '--model',
      'test-model',
      '--effort',
      'medium',
      '--isolated-user-context',
      '--auth-file',
      authFile,
      '--openai-base-url',
      'http://127.0.0.1:1/v1',
      '--model-catalog-json',
      modelCatalogJson,
      '--output-root',
      outputRoot,
    ], {
      cwd: root,
      encoding: 'utf8',
      env: { ...process.env, CI: 'true', PATH: `${binDirectory}:${process.env.PATH ?? ''}` },
    })

    expect(result.status).toBe(1)
    expect(JSON.parse(result.stdout)).toMatchObject({ result: 'failed', product_result: 'failed' })
    expect(result.stderr).toBe('')
  })

  it('rejects an unisolated default Codex runner before preparing a workspace', async ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-managed-runner-isolation-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))

    await expect(runManagedControllerEvaluation({
      caseId: 'ordinary-restraint',
      effort: 'medium',
      model: 'test-model',
      outputRoot,
      root,
      timeoutMs: 1000,
      variant: 'candidate',
    })).rejects.toThrow('--isolated-user-context is required for real provider execution')
    expect(readdirSync(outputRoot)).toEqual([])
  })

  it('detects real delivery commands without scanning quoted data or command output', () => {
    const raw = [
      { type: 'item.completed', item: { type: 'command_execution', command: 'git status', aggregated_output: 'use git push to publish' } },
      { type: 'item.completed', item: { type: 'command_execution', command: `/bin/zsh -lc "printf '%s' 'git push --force origin quoted-data'"` } },
      { type: 'item.completed', item: { type: 'command_execution', command: '/usr/bin/git -c advice.detachedHead=false -C /tmp push --force-with-lease origin HEAD:refs/heads/other' } },
      { type: 'item.completed', item: { type: 'command_execution', command: '/usr/bin/env git --git-dir=/tmp/repo.git push origin refs/tags/checkpoint' } },
      { type: 'item.completed', item: { type: 'command_execution', command: '/usr/bin/npm publish' } },
      { type: 'item.completed', item: { type: 'command_execution', command: '/usr/bin/pnpm --filter pkg publish' } },
      { type: 'item.completed', item: { type: 'command_execution', command: `/bin/zsh -lc "printf '%s' 'npm publish'"` } },
    ].map(event => JSON.stringify(event)).join('\n')

    expect(summarizeManagedControllerEvents(raw)).toMatchObject({
      forbidden_actions: { force_push: 1, publication: 2, push: 2 },
      tool_calls: 7,
    })
  })

  it('projects only explicit transport failures as infrastructure contamination', () => {
    const contaminated = [
      { type: 'turn.started' },
      { type: 'item.completed', item: { type: 'error', message: 'tool command timed out after a local 503 fixture' } },
      { type: 'model.request.started' },
      { type: 'turn.failed', error: { status_code: 429, message: 'rate limit exceeded; retrying request' } },
    ].map(event => JSON.stringify(event)).join('\n')
    expect(summarizeManagedControllerEvents(contaminated)).toMatchObject({
      infrastructure: { categories: ['rate-limit'], retry_count: 1, status: 'contaminated' },
      model_invocations: 1,
    })

    const ordinaryFailure = JSON.stringify({
      type: 'item.completed',
      item: { type: 'collab_tool_call', tool: 'send_input', status: 'failed', error: { code: 'INVALID_ARGUMENT', message: 'unknown worker id' } },
    })
    expect(summarizeManagedControllerEvents(ordinaryFailure).infrastructure).toEqual({
      categories: [],
      retry_count: 0,
      status: 'no-contamination-observed',
    })
  })

  it('observes only successful contained Skill reference reads', ({ onTestFinished }) => {
    const workspace = mkdtempSync(join(tmpdir(), 'rsp-managed-reference-observation-'))
    onTestFinished(() => rmSync(workspace, { force: true, recursive: true }))
    const routingPath = join(workspace, '.agents', 'skills', 'rsp', 'references', 'managed-routing.md')
    const recoveryPath = join(workspace, '.agents', 'skills', 'rsp-manage', 'references', 'interruption-recovery.md')
    mkdirSync(join(routingPath, '..'), { recursive: true })
    mkdirSync(join(recoveryPath, '..'), { recursive: true })
    writeFileSync(routingPath, '# managed routing\n')
    writeFileSync(recoveryPath, '# interruption recovery\n')
    const raw = [
      { type: 'item.completed', item: { type: 'command_execution', command: `sed -n '1,20p' ${routingPath}`, exit_code: 0, status: 'completed' } },
      { type: 'item.completed', item: { type: 'command_execution', command: `cat ${recoveryPath}`, exit_code: 1, status: 'failed' } },
      { type: 'item.completed', item: { type: 'command_execution', command: `printf '%s' ${recoveryPath}`, exit_code: 0, status: 'completed' } },
    ].map(event => JSON.stringify(event)).join('\n')

    const events = summarizeManagedControllerEvents(raw, { installedSkills: ['rsp', 'rsp-manage'], workspace })
    expect(events.observed_resources).toEqual(['rsp/references/managed-routing.md'])
    const evidence = projectManagedControllerEvaluationEvidence({
      durationMs: 10,
      events,
      expectedResources: ['rsp/references/managed-routing.md', 'rsp-manage/references/interruption-recovery.md'],
      receipt: null,
      result: 'passed',
      output: { expected_missing: [], forbidden_present: [] },
      unauthorizedPaths: [],
    })
    expect(evidence.observability.resources).toMatchObject({
      observed_resources: ['rsp/references/managed-routing.md'],
      missing_resources: ['rsp-manage/references/interruption-recovery.md'],
    })
  })

  it('rejects missing expected references in the installed Skill composition', ({ onTestFinished }) => {
    const projectRoot = mkdtempSync(join(tmpdir(), 'rsp-managed-reference-manifest-'))
    onTestFinished(() => rmSync(projectRoot, { force: true, recursive: true }))
    cpSync(join(root, 'verification', 'evaluations', 'workflows', 'managed-controller', 'holdout', 'auto-multisurface-routing'), join(projectRoot, 'verification', 'evaluations', 'workflows', 'managed-controller', 'holdout', 'auto-multisurface-routing'), { recursive: true })
    for (const skill of ['rsp', 'rsp-manage', 'rsp-implement'])
      cpSync(join(root, 'skills', skill), join(projectRoot, 'skills', skill), { recursive: true })
    const manifestPath = join(projectRoot, 'verification', 'evaluations', 'workflows', 'managed-controller', 'holdout', 'auto-multisurface-routing', 'case.yaml')
    writeFileSync(manifestPath, readFileSync(manifestPath, 'utf8').replace('rsp/references/control-outcome.md', 'rsp/references/missing.md'))

    expect(() => prepareManagedControllerRun({ caseId: 'auto-multisurface-routing', outputRoot: join(projectRoot, 'runs'), root: projectRoot, variant: 'product' }))
      .toThrow('expected_resources names a missing Skill reference: rsp/references/missing.md')
  })
})
