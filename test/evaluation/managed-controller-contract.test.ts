import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { evaluateManagedController, hashManagedControllerArtifact, hashManagedControllerComposition, loadManagedControllerCases, normalizeManagedControllerEvaluationReceipt, observeManagedControllerGit, prepareManagedControllerRun, projectManagedControllerEvaluationEvidence, readManagedControllerFlag, rescoreManagedControllerArtifact, runManagedControllerEvaluation, scoreManagedControllerObservation, scoreManagedControllerOutput, scoreManagedRecoveryOutput, summarizeManagedControllerEvents } from '../../scripts/managed-controller-eval.mjs'
import { canonicalEnum, findSemanticUnit, markdownSection, orderedMarkers } from '../support/markdown-contract'

const root = fileURLToPath(new URL('../..', import.meta.url))
const candidate = join(root, 'research', 'candidates', 'skills', 'rsp-manage')
const product = join(root, 'skills', 'rsp-manage')
const managedRouting = readFileSync(join(root, 'skills', 'rsp', 'references', 'managed-routing.md'), 'utf8')
const durableReview = readFileSync(join(root, 'skills', 'rsp', 'references', 'durable-review.md'), 'utf8')
const coreSkill = readFileSync(join(root, 'skills', 'rsp', 'SKILL.md'), 'utf8')
const commitSkill = readFileSync(join(root, 'skills', 'rsp-commit', 'SKILL.md'), 'utf8')
const releaseDocsSkill = readFileSync(join(root, 'skills', 'rsp-release-docs', 'SKILL.md'), 'utf8')
const reviewConvergence = readFileSync(join(product, 'references', 'review-convergence.md'), 'utf8')
const closeout = readFileSync(join(product, 'references', 'closeout.md'), 'utf8')
const managedExchange = readFileSync(join(product, 'references', 'managed-exchange.md'), 'utf8')
const hostWorkerLifecycle = readFileSync(join(product, 'references', 'host-worker-lifecycle.md'), 'utf8')

function readSkill(directory = candidate): { body: string, frontmatter: Record<string, any> } {
  const content = readFileSync(join(directory, 'SKILL.md'), 'utf8')
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  expect(match).not.toBeNull()
  return { body: match![2]!, frontmatter: parseYaml(match![1]!) as Record<string, any> }
}

function scoreLocalizedReceiptResult(output: string, exactResult: string) {
  const resultLine = output.split(/\r?\n/).find(line => /^结果[:：]/u.test(line.trim()))
  const value = resultLine?.replace(/^结果[:：]\s*/u, '') ?? ''
  const tokenIndex = value.indexOf(exactResult)
  const primaryNarration = tokenIndex > 0 ? value.slice(0, tokenIndex) : ''

  return {
    exact_result_preserved: tokenIndex >= 0,
    localized_primary_narration: /\p{Script=Han}/u.test(primaryNarration),
    exact_result_is_secondary: tokenIndex > 0 && /[（(`]\s*$/u.test(primaryNarration),
  }
}

describe('rsp-manage research candidate', () => {
  it('removes an isolated user context when auth setup fails', async ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-isolated-cleanup-'))
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

  it('stays explicit-only, host-neutral, and outside the stable suite', () => {
    const { body, frontmatter } = readSkill()

    expect(frontmatter.name).toBe(basename(candidate))
    expect(frontmatter.description).toEqual(expect.any(String))
    expect(frontmatter['disable-model-invocation']).toBeUndefined()
    expect(frontmatter.license).toBe('MIT')
    expect(frontmatter.metadata).toMatchObject({ author: 'oevery', version: expect.stringMatching(/^\d{4}\.\d{2}\.\d{2}(?:\.\d+)?$/) })
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
      'assignment-post-admission-cancellation',
      'assignment-pre-admission-cancellation',
      'blocker-continuation',
      'dispatch-envelope',
      'drift-safe-resume',
      'drift-stop',
      'explicit-eligibility',
      'explicit-pause',
      'execution-topology',
      'focus-capsule-portability',
      'fresh-return',
      'frontier-precedence-stop',
      'host-capability-downgrade',
      'host-settlement-release',
      'owner-preflight-routing',
      'interruption-recovery',
      'lane-boundaries',
      'managed-critical-path-solo',
      'nested-delegation-requires-authority',
      'ordinary-restraint',
      'owned-background-work-settlement',
      'owner-release',
      'progress-continues',
      'provenance-does-not-grant-authority',
      'required-worker-closeout',
      'same-shape-assignment-batching',
      'settlement-without-receipt',
      'shape-requalification',
      'control-route-transitions',
      'transient-execution-bounds',
      'worker-receipt-accepted-evidence',
      'worker-session-invocation',
    ].sort())
    expect(cases.find(item => item.id === 'owner-preflight-routing')?.sources).toEqual([
      'skills/rsp/SKILL.md',
      '.rsp/specs/skill-control-model.md',
      'skills/rsp-manage/SKILL.md',
      'skills/rsp/references/managed-routing.md',
    ])
    expect(evaluateManagedController(root)).toEqual(cases.map(item => ({ id: item.id, missing: [], passed: true })))
  })

  it('keeps release identity out of ordinary execution frames and in release owners', () => {
    const { body } = readSkill(product)
    const executionFrame = findSemanticUnit(body, [
      'ExecutionFrame',
      'current goal',
      'acceptance surfaces',
    ])

    expect(executionFrame).toBeDefined()
    expect(executionFrame).toContain('never require or invent a release identity for a non-release managed goal')
    expect(releaseDocsSkill).toContain('A release identity is confirmed only by explicit user instruction or authoritative repository release configuration')
    expect(commitSkill).toContain('one confirmed release identity and release-boundary evidence')
  })

  it('fails closed when a contract fixture source escapes the repository root', ({ onTestFinished }) => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-contract-source-'))
    onTestFinished(() => rmSync(fixtureRoot, { force: true, recursive: true }))
    const fixtures = join(fixtureRoot, 'evaluation', 'managed-controller', 'fixtures')
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

  it('fails closed when a contract fixture depends on a lifecycle-transient Change', ({ onTestFinished }) => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-contract-change-source-'))
    onTestFinished(() => rmSync(fixtureRoot, { force: true, recursive: true }))
    const fixtures = join(fixtureRoot, 'evaluation', 'managed-controller', 'fixtures')
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

  it('prepares an unseen automatic multi-surface holdout with a real acceptance phase', ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-auto-multisurface-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))

    const prepared = prepareManagedControllerRun({
      caseId: 'auto-multisurface-routing',
      outputRoot,
      root,
      variant: 'product',
    })

    expect(prepared.manifest.automatic_activation).toBe(true)
    expect(prepared.manifest.expected_mode).toBe('execute')
    expect(prepared.manifest.installed_skills).toEqual(['rsp', 'rsp-manage', 'rsp-implement'])
    expect(prepared.manifest.required_changes).toEqual([
      '.rsp/changes/refresh-status-guidance.md',
      '.rsp/specs/status-presentation.md',
      'src/status-card.mjs',
      'docs/en/status.md',
      'docs/zh-CN/status.md',
    ])
    expect(prepared.prompt).toContain('project-installed skills and project workflow')
    expect(prepared.manifest.expected_output).toEqual(expect.arrayContaining(['selected', 'coordinated', 'independent-verify', 'npm test']))
    expect(prepared.manifest.forbidden_output).toEqual(expect.arrayContaining(['RouteDisposition: direct', 'declined']))
  })

  it('prepares a hard automatic near-miss that stays direct despite multiple surfaces', ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-auto-integrated-direct-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))

    const prepared = prepareManagedControllerRun({
      caseId: 'auto-integrated-direct',
      outputRoot,
      root,
      variant: 'product',
    })

    expect(prepared.manifest).toMatchObject({
      automatic_activation: true,
      base_case: 'auto-multisurface-routing',
      expected_mode: 'execute',
    })
    expect(prepared.manifest.expected_output).toEqual(expect.arrayContaining(['RouteDisposition: direct', 'integrated check', 'npm test']))
    expect(prepared.manifest.forbidden_output).toEqual(expect.arrayContaining(['RouteDisposition: managed', 'Managed dispatch: sequential']))
  })

  it('does not require coordinated workers to rewrite already-decisive focused tests', ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-coordinated-required-changes-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))

    for (const caseId of ['managed-coordinated-sequential', 'managed-coordinated-parallel']) {
      const prepared = prepareManagedControllerRun({ caseId, outputRoot, root, variant: 'product' })
      expect(prepared.manifest.allowed_changes).toEqual(expect.arrayContaining([
        'test/header.test.mjs',
        'test/retry.test.mjs',
      ]))
      expect(prepared.manifest.required_changes).toEqual([
        '.rsp/changes/normalize-transport-inputs.md',
        'src/header.mjs',
        'src/retry.mjs',
      ])
    }
  })

  it('prepares the exact-package pause and resume recovery holdout', ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-pause-resume-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))

    const prepared = prepareManagedControllerRun({
      caseId: 'pause-resume',
      outputRoot,
      root,
      variant: 'product',
    })

    expect(prepared.manifest.installed_skills).toEqual(['rsp', 'rsp-manage', 'rsp-implement'])
    expect(prepared.manifest.allowed_changes).not.toContain('.rsp/focus.d/normalize-checkpoint')
    expect(prepared.prompt).toContain('preserve focus')
    expect(prepared.manifest.continuation_contract?.ordered_fields).toEqual([
      'WorkRef',
      'Authority',
      'Current state',
      'Changed artifacts',
      'Fresh verification',
      'Blockers',
      'Next action',
    ])
    expect(prepared.prompt).toContain('handoff-pointer')
    expect(readFileSync(join(prepared.workspace, '.rsp', 'focus.d', 'normalize-checkpoint'), 'utf8').trim()).toBe('')
  })

  it('prepares representative execution-model holdouts', ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-execution-model-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))

    const longitudinal = prepareManagedControllerRun({ caseId: 'longitudinal-worker-reuse', outputRoot, root, variant: 'product' })
    expect(longitudinal.manifest).toMatchObject({ automatic_activation: true, base_case: 'auto-multisurface-routing' })
    expect(longitudinal.manifest.expected_output).toEqual(expect.arrayContaining(['mode: delegated', 'longitudinal', 'same WorkerSession', 'AssignmentDelta']))
    expect(longitudinal.prompt).toContain('reuse the same primary WorkerSession')
    expect(longitudinal.prompt).toContain('complete initial Assignment and then AssignmentDelta continuations')

    const fresh = prepareManagedControllerRun({ caseId: 'fresh-strategy-reset', outputRoot, root, variant: 'product' })
    expect(fresh.manifest.base_case).toBe('multi-slice')
    expect(fresh.manifest.expected_output).toEqual(expect.arrayContaining(['fresh WorkerSession', 'shared test runner serialized']))
    expect(fresh.prompt).toContain('strategy is now rejected')

    const recovery = prepareManagedControllerRun({ caseId: 'cross-session-reverify', outputRoot, root, variant: 'product' })
    expect(recovery.manifest.installed_skills).toEqual(['rsp', 'rsp-manage', 'rsp-implement', 'rsp-verify'])
    expect(recovery.manifest.expected_output).toEqual(expect.arrayContaining(['inspect-before-repeat', 'fresh Verify', 'independence']))
    expect(recovery.prompt).toContain('previous worker identity cannot be established')

    const masked = prepareManagedControllerRun({ caseId: 'capability-masked-host', outputRoot, root, variant: 'product' })
    expect(masked.manifest).toMatchObject({
      allowed_changes: [],
      sandbox: 'workspace-write',
    })
    expect(masked.prompt).toContain('no resume, cancel, worker-identity, heartbeat')
    expect(scoreManagedControllerOutput(masked.manifest, [
      'StopDisposition: capability-unavailable.',
      'The ResourceLease remains claimed and no conflicting Assignment starts.',
      'Worker identity is absent, so independence: unavailable; ordinary Verify cannot establish independence.',
      'Heartbeat unavailable; elapsed time is not failure evidence.',
    ].join('\n'))).toEqual({ expected_missing: [], forbidden_present: [] })
  })

  it('scores ordered continuation fields and selected-goal resume evidence', () => {
    const manifest = {
      continuation_contract: {
        ordered_fields: ['WorkRef', 'Authority', 'Current state', 'Changed artifacts', 'Fresh verification', 'Blockers', 'Next action'],
        recovery_evidence: ['handoff-pointer', 'authority-reread', 'selected-handoff-validated'],
      },
    }
    const passing = [
      '- WorkRef: normalize-checkpoint',
      '- Authority: source and Change',
      '- Current state: blocked',
      '- Changed artifacts: src/checkpoint.mjs',
      '- Fresh verification: npm test passed',
      '- Blockers: receiver unavailable',
      '- Next action: run receiver acceptance',
      '- Recovery evidence: handoff-pointer authority-reread selected-handoff-validated',
    ].join('\n')

    expect(scoreManagedRecoveryOutput(manifest, passing)).toEqual({
      duplicate_fields: [],
      missing_fields: [],
      missing_recovery_evidence: [],
      ordered_fields: true,
      passed: true,
      recovery_evidence_line: true,
    })
    expect(scoreManagedRecoveryOutput(manifest, passing.replace('- Authority:', '- Zuthority:').replace('- Next action:', '- Authority:'))).toMatchObject({
      ordered_fields: false,
      passed: false,
    })
  })

  it('hashes and resurcores immutable pause-resume evidence against the current contract', () => {
    const retained = join(root, 'research', 'evaluations', 'rsp-manage', '2026-07-29-product-pause-resume')
    const metadata = JSON.parse(readFileSync(join(retained, 'metadata.json'), 'utf8')) as any
    const final = readFileSync(join(retained, 'final.md'), 'utf8')
    const manifest = parseYaml(readFileSync(join(root, 'evaluation', 'managed-controller', 'holdout', 'pause-resume', 'case.yaml'), 'utf8')) as any

    expect(hashManagedControllerArtifact(final)).toBe(metadata.final_hash)
    expect(rescoreManagedControllerArtifact(manifest, metadata, final)).toMatchObject({
      hash_matches: true,
      recovery: {
        duplicate_fields: [],
        missing_fields: [],
        missing_recovery_evidence: manifest.continuation_contract.recovery_evidence,
        ordered_fields: true,
        passed: false,
        recovery_evidence_line: false,
      },
      result: 'failed',
    })
  })

  it('rescores the structured pause-resume evidence against the current contract', () => {
    const retained = join(root, 'research', 'evaluations', 'rsp-manage', '2026-07-29-product-pause-resume-structured')
    const metadata = JSON.parse(readFileSync(join(retained, 'metadata.json'), 'utf8')) as any
    const final = readFileSync(join(retained, 'final.md'), 'utf8')
    const manifest = parseYaml(readFileSync(join(root, 'evaluation', 'managed-controller', 'holdout', 'pause-resume', 'case.yaml'), 'utf8')) as any

    expect(hashManagedControllerArtifact(final)).toBe(metadata.final_hash)
    expect(rescoreManagedControllerArtifact(manifest, metadata, final)).toMatchObject({
      hash_matches: true,
      output: { expected_missing: [], forbidden_present: [] },
      recovery: {
        duplicate_fields: [],
        missing_fields: [],
        missing_recovery_evidence: ['selected-handoff-validated'],
        ordered_fields: true,
        passed: false,
        recovery_evidence_line: true,
      },
      result: 'failed',
    })
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

  it('scores canonical field values rendered as Markdown inline code', () => {
    const manifest = {
      expected_output: ['RouteDisposition: direct'],
      forbidden_output: ['RouteDisposition: managed'],
    }

    expect(scoreManagedControllerOutput(manifest, 'RouteDisposition: `direct`')).toEqual({
      expected_missing: [],
      forbidden_present: [],
    })
    expect(scoreManagedControllerOutput(manifest, 'RouteDisposition: `managed`')).toEqual({
      expected_missing: ['RouteDisposition: direct'],
      forbidden_present: ['RouteDisposition: managed'],
    })
  })

  it('does not treat a bounded No-list as evidence that a forbidden action occurred', () => {
    const manifest = {
      expected_output: [],
      forbidden_output: ['controller state created'],
    }

    expect(scoreManagedControllerOutput(
      manifest,
      '- No archive, stage, commit, push, publish, or controller state created.',
    ).forbidden_present).toEqual([])
    expect(scoreManagedControllerOutput(
      manifest,
      'Controller state created.',
    ).forbidden_present).toEqual(['controller state created'])
    expect(scoreManagedControllerOutput(
      manifest,
      'No archive was created; controller state created.',
    ).forbidden_present).toEqual(['controller state created'])
  })

  it('accepts a bounded archive-date token without broadening unrelated paths', () => {
    const manifest = {
      id: 'archive-date-token',
      allowed_changes: ['.rsp/archives/{date}_normalize-label.md'],
      required_changes: ['.rsp/archives/{date}_normalize-label.md'],
      expected_output: [],
      forbidden_output: [],
      expected_mode: 'execute' as const,
      request: 'archive the selected Change',
      verification: ['npm', 'test'],
    }
    const base = {
      exit_code: 0,
      final: '',
      forbidden_actions: { force_push: 0, publication: 0, push: 0 },
      remote_refs_unchanged: true,
      source_stable: true,
      timed_out: false,
      verification_passed: true,
    }

    expect(scoreManagedControllerObservation(manifest, {
      ...base,
      changed_paths: ['.rsp/archives/2026-07-26_normalize-label.md'],
    })).toMatchObject({ result: 'passed', unauthorized_paths: [], missing_required_paths: [] })
    expect(scoreManagedControllerObservation(manifest, {
      ...base,
      changed_paths: ['.rsp/archives/nested/2026-07-26_normalize-label.md'],
    })).toMatchObject({ result: 'failed' })
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
  it('keeps status, pause, release, blockers, and resume as distinct recovery behaviors', () => {
    const results = evaluateManagedController(root)
      .filter(result => ['blocker-continuation', 'drift-safe-resume', 'explicit-pause', 'owner-release', 'progress-continues'].includes(result.id))

    expect(results).toHaveLength(5)
    expect(results).toEqual(results.map(result => ({ ...result, missing: [], passed: true })))
  })

  it('is portable, policy-selectable, and distinct from retained research', () => {
    const { body, frontmatter } = readSkill(product)

    expect(frontmatter).toMatchObject({
      name: 'rsp-manage',
      license: 'MIT',
      metadata: { author: 'oevery', version: expect.stringMatching(/^\d{4}\.\d{2}\.\d{2}(?:\.\d+)?$/) },
    })
    expect(lstatSync(join(product, 'SKILL.md')).isSymbolicLink()).toBe(false)
    expect(body).toContain('explicit request or effective `manage.activation: auto`')
    expect(body).toContain('automatic activation grants selection, not mutation')
    expect(body).toContain('one selected shape-ready Change or shallow Group')
    expect(body).toContain('Keep artifacts durable and process data transient')
    expect(readFileSync(join(candidate, 'SKILL.md'), 'utf8')).not.toBe(readFileSync(join(product, 'SKILL.md'), 'utf8'))
  })

  it('keeps initial qualification in Core and validates only the selected handoff in Manage', () => {
    const { body } = readSkill(product)
    const qualify = markdownSection(managedRouting, 'QUALIFY — select or decline Manage')
    const entry = `${markdownSection(body, 'Selected-goal entry')}\n${markdownSection(body, 'Validate the selected handoff before mutation')}`

    expect(findSemanticUnit(qualify, ['independent path', 'independent slices', 'interruption recovery', 'authority surface'])).toBeDefined()
    expect(findSemanticUnit(qualify, ['elapsed wall-clock minutes', 'never qualification evidence'])).toBeDefined()
    expect(findSemanticUnit(qualify, ['distinct execution and acceptance owners', 'real-host', 'provider', 'hardware'])).toBeDefined()
    expect(findSemanticUnit(qualify, ['Multiple files', 'do not by themselves qualify Manage'])).toBeDefined()
    expect(findSemanticUnit(qualify, ['one owner', 'one writer', 'one execution phase', 'one integrated check', 'no recovery', 'no independent acceptance obligation', 'no ready successor'])).toBeDefined()
    expect(findSemanticUnit(qualify, ['Substantial sequential work remains selected', 'multi-phase', 'authority obligation'])).toBeDefined()
    expect(findSemanticUnit(entry, ['Core', 'solely own', 'initial Manage qualification'])).toBeDefined()
    expect(findSemanticUnit(entry, ['Manage', 'never repeats', 'direct-versus-managed eligibility'])).toBeDefined()
    expect(findSemanticUnit(entry, [/validate only handoff completeness/i, 'owner and WorkRef topology', 'authority envelope', 'owned paths', 'qualification evidence'])).toBeDefined()
    expect(findSemanticUnit(entry, ['continue the selected managed goal', 'without repeating qualification'])).toBeDefined()
    expect(body).not.toContain('## Qualify before mutation')
    expect(body).not.toContain('Decline Manage without any mutation')
  })

  it('classifies the execution frontier in fail-closed order before dispatch or mutation', () => {
    const { body } = readSkill(product)
    const frontier = markdownSection(body, 'Resolve the execution frontier')

    expect(orderedMarkers(frontier, ['`out-of-goal` →', '`owner-decision` →', '`fog` →', '`evidence-needed` →', '`ready-to-execute`'])).toBe(true)
    expect(canonicalEnum(frontier, 'FrontierDisposition')).toEqual(['out-of-goal', 'owner-decision', 'fog', 'evidence-needed', 'executable'])
    expect(findSemanticUnit(frontier, ['`out-of-goal`', 'topology or authority resolution'])).toBeDefined()
    expect(findSemanticUnit(frontier, ['`owner-decision`', 'highest-impact question', '`DecisionOwner`'])).toBeDefined()
    expect(findSemanticUnit(frontier, ['`fog`', 'not yet a precise question', 'no synthetic Task', 'worker dispatch'])).toBeDefined()
    expect(findSemanticUnit(frontier, ['`evidence-needed`', 'precise factual question'])).toBeDefined()
    expect(findSemanticUnit(frontier, ['earlier boundary', 'instead of selecting Fix'])).toBeDefined()
    expect(findSemanticUnit(frontier, ['`ready-to-execute`', '`executable`'])).toBeDefined()
    expect(frontier).toContain('`fog`: This is not yet a precise question.')
    expect(frontier).toContain('Stop `return-to-shape`. Resume after Shape returns a ready owner')
    expect(body).not.toContain('return `StopDisposition: return-to-shape` to Core/Shape')
    expect(findSemanticUnit(frontier, ['`fog`', 'Halt this phase', 'worker dispatch', 'product mutation'])).toBeDefined()
    expect(body).not.toContain('unless an independently ready owned slice can continue')
    expect(findSemanticUnit(frontier, ['Resume after', 'Shape', 'ready owner', 'Core', 'rederives the route'])).toBeDefined()
  })

  it('defines one minimal token-independent Assignment and Receipt schema', () => {
    const { body } = readSkill(product)
    const lanes = markdownSection(body, 'Resolve the execution frontier')

    expect(body).toContain('[managed exchange](references/managed-exchange.md)')
    expect(managedExchange).toContain('Every fresh WorkerSession receives one complete `Assignment`')
    for (const field of ['Assignment', 'Work', 'Lane', 'Objective', 'Authority', 'Read', 'Write', 'Verify', 'Known facts', 'Allowed actions', 'Prohibited actions', 'Stop conditions', 'Replay safety'])
      expect(managedExchange).toContain(`${field}:`)
    expect(findSemanticUnit(managedExchange, ['Manager issues', 'distinct transient Assignment identity', 'worker echoes', 'WorkerReceipt'])).toBeDefined()
    expect(findSemanticUnit(managedExchange, ['AssignmentDelta', 'new Assignment identity', 'repeats `workRef`'])).toBeDefined()
    expect(findSemanticUnit(managedExchange, ['observed resumed compatible WorkerSession', '`AssignmentDelta`', 'immediately accepted Assignment or AssignmentDelta'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['Session loss', 'fresh WorkerSession', 'complete Assignment'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['Token or context cost', 'otherwise equally safe and authorized strategies'])).toBeDefined()
    for (const field of ['Assignment', 'Result', 'Changed paths', 'Verification', 'Boundary', 'Evidence status', 'Release claim'])
      expect(managedExchange).toContain(`${field}:`)
    expect(managedExchange).toContain('Authority: <exact owner sections or paths>')
    expect(findSemanticUnit(managedExchange, ['WorkerInvocation', 'WorkerReceipt', 'conversational execution diary'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['Diagnose', '`rsp-diagnose`', 'read-only', 'no-cause result'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['Inspect', 'Manager-only', 'read-only'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['Fix', '`rsp-implement`', 'sole product writer'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['Verify', '`rsp-verify`', 'read-only', 'declared risk', 'failed correction'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['Fixed-scope review', '`rsp-review`'])).toBeDefined()
    expect(findSemanticUnit(managedExchange, ['Human-facing narration', 'response language', 'exact canonical result', 'secondarily'])).toBeDefined()
    expect(findSemanticUnit(managedExchange, ['localized labeled natural language', 'default', 'human-visible session'])).toBeDefined()
    expect(findSemanticUnit(managedExchange, ['JSON', 'explicitly identified', 'machine consumer', 'secondary transport'])).toBeDefined()
    expect(managedExchange).toContain('Do not emit both natural-language and JSON renderings by default')
    expect(findSemanticUnit(managedExchange, ['`EvaluationReceipt`', 'separate evaluation-harness protocol', 'never', '`WorkerReceipt` encoding'])).toBeDefined()
    expect(findSemanticUnit(managedExchange, ['release claim', 'worker-authored', 'never substitutes', 'host\'s release observation'])).toBeDefined()
    expect(lanes).toContain('**Diagnose:** `rsp-diagnose`; read-only until a cause or explicit no-cause result. Return `confirmed-same-scope`, `unresolved-same-scope`, or `boundary-changed`')
    expect(lanes).toContain('**Inspect:** Manager-only and read-only; parallel only with isolated paths and verification resources. Return `confirmed-same-scope`, `unresolved-same-scope`, or `boundary-changed`')
    expect(lanes).toContain('**Fix:** `rsp-implement`; sole product writer with explicit in-scope mutation authority. Return `changed-same-scope`, `no-change`, or `boundary-changed`')
    expect(lanes).toContain('**Verify:** `rsp-verify`; read-only for declared risk or failed correction. Return the Verify-owned result with observed worker identity and independence status')
    expect(lanes).toContain('Verify receipts append observed worker identity and `independence: established | unavailable`')
    expect(body).not.toMatch(/token\s+(?:budget|limit)|(?:budget|limit)[^\n.]*token/i)
    expect(body).not.toMatch(/token[^\n.]*rout|rout[^\n.]*token/i)
    expect(existsSync(join(root, 'skills', 'rsp-inspect'))).toBe(false)
    expect(existsSync(join(root, 'skills', 'rsp-verify'))).toBe(true)
    expect(readFileSync(join(root, 'skills', 'rsp-verify', 'SKILL.md'), 'utf8')).toContain('Run one bounded, read-only verification pass')
  })

  it('separates Assignment admission, cancellation ownership, settlement, Receipt, and provenance', () => {
    const { body } = readSkill(product)
    const interruption = readFileSync(join(product, 'references', 'interruption-recovery.md'), 'utf8')
    const controlModel = readFileSync(join(root, '.rsp', 'specs', 'skill-control-model.md'), 'utf8')

    expect(findSemanticUnit(body, ['Host-confirmed Assignment admission', 'cancellation-ownership boundary'])).toBeDefined()
    expect(findSemanticUnit(body, ['creation or resume alone', 'does not prove admission'])).toBeDefined()
    expect(findSemanticUnit(body, ['WorkerInvocation', 'cancellation-ownership boundary'])).toBeDefined()
    expect(findSemanticUnit(managedExchange, ['Host observations', 'producer claims', 'separate inputs'])).toBeDefined()
    expect(findSemanticUnit(hostWorkerLifecycle, ['Settlement closes liveness', 'not acceptance'])).toBeDefined()
    expect(findSemanticUnit(body, ['Identity and continuity grant no authority'])).toBeDefined()
    expect(findSemanticUnit(interruption, ['cancelling the caller\'s own wait', 'does not retract accepted work'])).toBeDefined()
    expect(findSemanticUnit(interruption, ['terminal message or partial output', 'does not release resources', 'owned work remains live'])).toBeDefined()
    expect(findSemanticUnit(controlModel, ['Assignment admission transfers cancellation ownership', 'pre-admission failure creates no dispatch', 'post-admission work requires explicit cancellation'])).toBeDefined()
    expect(findSemanticUnit(controlModel, ['Runtime settlement and provenance', 'never substitute', 'schema-valid WorkerReceipt', 'Manager-derived AcceptedLaneEvidence'])).toBeDefined()
  })

  it('scores localized Chinese receipt narration without a fixed result translation table', () => {
    expect(scoreLocalizedReceiptResult('结果：changed-same-scope', 'changed-same-scope')).toEqual({
      exact_result_preserved: true,
      localized_primary_narration: false,
      exact_result_is_secondary: false,
    })
    expect(scoreLocalizedReceiptResult('结果：同范围已修改（changed-same-scope）', 'changed-same-scope')).toEqual({
      exact_result_preserved: true,
      localized_primary_narration: true,
      exact_result_is_secondary: true,
    })
    expect(scoreLocalizedReceiptResult('结果：验证通过（pass）', 'pass')).toEqual({
      exact_result_preserved: true,
      localized_primary_narration: true,
      exact_result_is_secondary: true,
    })
  })

  it('bounds Assignments and correction while preserving independent Verify', () => {
    const { body } = readSkill(product)

    expect(body).toContain('**Inspect:** Manager-only and read-only; parallel only with isolated paths and verification resources')
    expect(body).toContain('Keep blockers, later waves, shared seams, conflicting leases, and dependent verification sequential')
    expect(body).toContain('Parallel work requires independent mutation paths and evidenced distinct resources')
    expect(body).toContain('Do not impose one fixed dispatch ceiling across the whole managed run')
    expect(body).toContain('Every dispatch requires one necessary bounded Assignment')
    expect(body).toContain('at most three correction passes by default')
    expect(body).toContain('new evidence makes it discriminating')
    expect(body).toContain('stops earlier when the same failure repeats without new evidence')
    expect(body).toContain('Independent Verify is a separate required acceptance obligation and does not consume the Fix correction allowance')
    expect(reviewConvergence).toContain('Allow at most three Resolve Findings passes per Change')
  })

  it('establishes independent Verify by worker identity and downgrades truthfully', () => {
    const { body } = readSkill(product)

    expect(body).toContain('Independent Verify is established only when its worker identity and the accepted Fix worker identity are both available and different')
    expect(body).toContain('If the host cannot establish that identity boundary, record `independence: unavailable`')
    expect(body).toContain('ordinary read-only Verify may still run')
    expect(body).toContain('must not claim independent verification')
    expect(body).toContain('`independence: established | unavailable`')
  })

  it('keeps missing required worker evidence incomplete and outside closeout', () => {
    const { body } = readSkill(product)
    const lanes = markdownSection(body, 'Resolve the execution frontier')
    const boundaries = markdownSection(body, 'Preserve boundaries')

    expect(lanes).toContain('accepted required receipts + fresh declared verification → evidence-complete')
    expect(lanes).toContain('evidence-complete + clean fixed-scope review              → review-clean')
    expect(findSemanticUnit(lanes, ['required worker', 'not created', 'valid receipt', '`unavailable`', '`boundary-changed`', '`incomplete`'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['Implementation verification', 'fixed-scope change review', 'durable writeback decision', 'separate gates'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['first transition', 'implementation verification'])).toBeDefined()
    expect(lanes).toContain('evidence-complete + clean fixed-scope review              → review-clean')
    expect(findSemanticUnit(lanes, ['Execution and verification receipts', 'never derive', '`review-clean`'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['durable writeback decision', 'never substitutes', 'review'])).toBeDefined()
    expect(findSemanticUnit(body, ['required worker obligation', '`StopDisposition: capability-unavailable`', '`incomplete`', 'stop'])).toBeDefined()
    expect(findSemanticUnit(body, ['Absence of a confirmed WorkerInvocation or WorkerReceipt', 'never success', 'controller claiming'])).toBeDefined()

    expect(findSemanticUnit(boundaries, ['closeout begins', 'lifecycle and delivery closeout', 'derive `CloseoutEligibility`'])).toBeDefined()
    expect(canonicalEnum(closeout, 'CloseoutEligibility')).toEqual(['not-eligible', 'lifecycle-ready', 'local-commit-ready'])
    expect(findSemanticUnit(closeout, ['`completionGate: pass`', '`archiveReady: yes`', '`AcceptanceDisposition: review-clean`', 'fresh owner', 'authority', 'exact diff', 'decisive Required verification evidence', 'ready value'])).toBeDefined()
    expect(findSemanticUnit(closeout, ['Any other acceptance state', '`CloseoutEligibility: not-eligible`'])).toBeDefined()
    expect(body.match(/required worker that was not created, returned no valid receipt, reported `unavailable` or `boundary-changed`/g)).toHaveLength(1)
    expect(findSemanticUnit(closeout, ['neither archive nor commit runs'])).toBeDefined()
  })

  it('fails semantic controller contracts when enums or qualification ownership are removed', () => {
    const { body } = readSkill(product)
    const lanes = markdownSection(body, 'Resolve the execution frontier')
    const entry = `${markdownSection(body, 'Selected-goal entry')}\n${markdownSection(body, 'Validate the selected handoff before mutation')}`
    const withoutReviewClean = lanes.replace('evidence-complete + clean fixed-scope review              → review-clean', '')
    const reassignedQualification = entry.replace(
      'Core and its managed-routing reference solely own initial Manage qualification',
      'Manage owns initial Manage qualification',
    )
    const reassignedFixOwner = lanes
      .replace('sole product writer with explicit in-scope mutation authority', 'explicit in-scope mutation authority')

    expect(withoutReviewClean).not.toContain('evidence-complete + clean fixed-scope review              → review-clean')
    expect(findSemanticUnit(reassignedQualification, ['Core', 'solely own', 'initial Manage qualification'])).toBeUndefined()
    expect(findSemanticUnit(reassignedFixOwner, ['Fix', '`rsp-implement`', 'sole product writer'])).toBeUndefined()
  })

  it('revalidates selected-goal evidence and keeps all controller execution state transient', () => {
    const { body } = readSkill(product)

    expect(managedExchange).toContain('actual paths and local diff')
    expect(managedExchange).toContain('Reread the complete owner, status, authority, blockers, and decisive evidence only after')
    expect(managedExchange).toContain('cross-session resume, or closeout')
    expect(managedExchange).toContain('unchanged same-scope work never returns to Core merely to repeat qualification')
    expect(body).toContain('Keep transient control, execution, receipt, resource, topology, and chronology data response-only')
    expect(body).toContain('write only accepted outcomes to Tasks')
    expect(body).toContain('real unresolved dependencies or risks to Blockers')
    expect(body).toContain('Durable facts or rationale remain owned by the durable writeback decision')
    expect(body).toContain('Create no frontier file, ticket map, ledger, registry, graph, hook, numeric routing score, run directory, or receipt/worker/verification registry')
  })

  it('keeps a normal Fix within declared acceptance on the bounded receipt path', () => {
    const { body } = readSkill(product)
    expect(managedExchange).toContain('A normal Fix that implements declared behavior remains same-scope')
    expect(body).toContain('Implementing declared acceptance does not return to Core')
  })

  it('widens rereads when discovery changes the declared behavior or acceptance', () => {
    expect(managedExchange).toContain('changed behavior/acceptance/interface')
  })

  it('returns to Core for a new request that changes a public-interface boundary', () => {
    const { body } = readSkill(product)
    expect(body).toContain('Return to Core only when owner identity, topology, requested route, declared behavior, acceptance, public-interface boundary, scope, mutation authority, or external-action authority changes')
  })

  it('does not treat implementation behavior changes as declared-boundary changes', () => {
    const { body } = readSkill(product)
    expect(body).toContain('do not stop merely because a normal Fix changes implementation behavior to satisfy the declared acceptance')
  })

  it('derives dispatch independently from managed selection and reports the route', () => {
    const { body } = readSkill(product)

    expect(body).toContain('Derive `DispatchDisposition` independently after selection')
    expect(body).toContain('| `none` | The bounded action has no useful or required worker seam.')
    expect(body).toContain('Invoke the local Discipline; Manage retains orchestration and acceptance')
    expect(body).toContain('Stop `capability-unavailable`; acceptance remains `incomplete`')
    expect(body).toContain('Manage qualification, distinct execution/acceptance phases, and separate owners never manufacture a worker obligation')
    expect(body).toContain('Manage retains receipt validation, accepted-evidence derivation, convergence, lifecycle, and commit orchestration')
    expect(body).toContain('Commit retains the exact Git procedure')
    expect(body).toContain('provider sessions, or hardware/classroom sessions as exclusive ResourceLease candidates')
    expect(body).toContain('Parallel work requires independent mutation paths and evidenced distinct resources')
    expect(body).toContain('delegation never implies concurrency or isolation')
    expect(body).toContain('Run lane-local checks first')
    expect(body).toContain('at most one affected or integration gate for shared risk')
    expect(body).toContain('Closeout reruns required evidence fresh')
    expect(managedRouting).toContain('Make the route observable')
    expect(managedRouting).toContain('report `selected` with the decisive qualification signal')
    expect(managedRouting).toContain('Selection transfers current-phase control from Core to Manage; it does not imply worker delegation')
    expect(managedRouting).toContain('Manage independently derives `DispatchDisposition: none | preferred | required` after selection')
    expect(managedRouting).toContain('`declined` with the complete direct-work exclusion')
    expect(managedRouting).toContain('reasoning remain transient and create no controller state')
  })

  it('keeps Focus Capsules sparse, Manager-owned, and non-authoritative', () => {
    const { body } = readSkill(product)
    const boundaries = markdownSection(body, 'Preserve boundaries')

    expect(findSemanticUnit(boundaries, ['Before using capsule content', 'interruption and recovery'])).toBeDefined()
    expect(findSemanticUnit(boundaries, ['focus marker path', 'sole selection truth', 'prose grants no authority'])).toBeDefined()
    expect(findSemanticUnit(readFileSync(join(product, 'references', 'interruption-recovery.md'), 'utf8'), ['short optional Markdown Focus Capsule', 'owned only by Manager'])).toBeDefined()
    expect(findSemanticUnit(readFileSync(join(product, 'references', 'interruption-recovery.md'), 'utf8'), ['Workers communicate through messages', 'rather than the capsule'])).toBeDefined()
    expect(findSemanticUnit(readFileSync(join(product, 'references', 'interruption-recovery.md'), 'utf8'), ['Manager-accepted meaningful checkpoint', 'never after each tool call or worker message'])).toBeDefined()
  })

  it('applies bounded closeout presets without inferring remote authority', () => {
    expect(closeout).toContain('`manual` grants neither automatic archive nor commit')
    expect(closeout).toContain('`lifecycle` grants lifecycle closeout after Manage-owned clean fixed-scope change review and a complete durable writeback decision but no Git action')
    expect(closeout).toContain('`local` automatically grants lifecycle closeout')
    expect(managedRouting).toContain('Missing configuration preserves `explicit` activation with `local` closeout compatibility')
    expect(managedRouting).toContain('Invalid configuration fails closed as `explicit` plus `manual`')
    expect(closeout).toContain('Push is opt-in only when user explicitly mentions push')
    expect(closeout).toContain('Never force-push')
  })

  it('keeps closeout presets dormant until the selected qualified handoff remains valid', () => {
    const { body } = readSkill(product)

    expect(managedRouting).toContain('If Manage was declined, unavailable, or unselected, every `manage.closeout` preset is dormant')
    expect(managedRouting).toContain('configuration executes neither archive nor commit')
    expect(managedRouting).toContain('After selection, stop using this reference for execution detail')
    expect(managedRouting).toContain('`rsp-manage` solely owns same-goal revalidation, interruption and resume, review convergence, acceptance, lifecycle closeout, commit eligibility and orchestration')
    expect(managedRouting).toContain('Exact staging, message construction, local commit execution, and post-commit observation remain owned by `rsp-commit`')
    expect(durableReview).toContain('A `manage.closeout` preset applies only when Core selected and qualified Manage for the current continuation')
    expect(coreSkill).toContain('Detailed Manage closeout, local Commit, conflict, and recovery rules remain in their owning Skills or conditional references')
    expect(body).toContain('Closeout requires a Core-selected and qualified handoff that remains valid under current evidence')
    expect(body).toContain('For declined, unavailable, unselected, incomplete, or drifted handoffs, every `manage.closeout` preset is dormant')
    expect(body).toContain('Earlier qualification does not carry forward across a new continuation')
    expect(closeout).toContain('Valid selected handoff only: effective `manage.closeout` is an automatic grant ceiling')
  })

  it('bounds authority reads, dispatch, correction, and verification', () => {
    const { body } = readSkill(product)

    expect(body).toContain('every selected WorkRef, including clear in-scope successors')
    expect(body).toContain('the complete owning Change, or the Group Brief and its children')
    expect(body).toContain('relevant Specs and Decisions')
    expect(body).toContain('`rsp status --json`, and the current checkout')
    expect(managedExchange).toContain('Every fresh WorkerSession receives one complete `Assignment`')
    expect(managedExchange).toContain('Only an observed resumed compatible WorkerSession may receive an `AssignmentDelta`')
    expect(body).toContain('Do not impose one fixed dispatch ceiling across the whole managed run')
    expect(body).toContain('at most three correction passes by default')
    expect(body).toContain('Independent Verify is a separate required acceptance obligation')
    expect(body).toContain('Run lane-local checks first')
    expect(body).toContain('at most one affected or integration gate')
    expect(body).toContain('Inspect changed paths, local diff, and declared verification before accepting results')
    expect(readFileSync(join(product, 'references', 'interruption-recovery.md'), 'utf8')).toContain('On cross-session or cross-device resume, session loss, or invalidated continuity, require a fresh WorkerSession and complete Assignment')
  })

  it('keeps dirty product and durable-truth paths with an explicit owner across transitions', () => {
    expect(managedRouting).toContain('Before focusing, dispatching, or mutating a different WorkRef')
    expect(managedRouting).toContain('prior owner\'s declared and observed product or durable-truth paths')
    expect(managedRouting).toContain('Overlap never changes owner implicitly')
    expect(managedRouting).toContain('continue the same open WorkRef')
    expect(managedRouting).toContain('explicitly reopen its archived acceptance')
    expect(managedRouting).toContain('explicitly authorized integration owner')
    expect(managedRouting).toContain('Disjoint authorized work may proceed without staging or a forced commit')
    expect(managedRouting).toContain('insufficient ownership evidence stops the transition')
  })

  it('converges managed review separately without redundant user continuation', () => {
    expect(reviewConvergence).toContain('# Managed review convergence')
    expect(reviewConvergence).toContain('without asking the user to continue')
    expect(reviewConvergence).toContain('Resolve Findings never self-loops')
    expect(reviewConvergence).toContain('at most three Resolve Findings passes per Change')
    expect(reviewConvergence).toContain('separate from the worker retry limit')
    expect(reviewConvergence).toContain('same Finding remains after two completed corrections')
    expect(reviewConvergence).toContain('`correction-needed`, not an external blocker')
    expect(reviewConvergence).toContain('additional real-host, provider, or network run outside existing verification authority')
    expect(reviewConvergence).toContain('failed or unavailable decisive verification')
    expect(reviewConvergence).toContain('Keep counts and correction chronology transient')
  })

  it('preserves child owners and follows derived Group waves', () => {
    const { body } = readSkill(product)

    expect(body).toContain('every selected WorkRef, including clear in-scope successors')
    expect(managedRouting).toContain('A Group qualifies when it has at least two ready children')
    expect(body).toContain('Dispatch only children in the current `plan.waves` wave')
    expect(body).toContain('rerun `rsp status --json`')
    expect(body).toContain('restrict it to declared children')
    expect(body).toContain('writers, the RSP control plane, test runners, generated artifacts, browsers, Brokers, provider sessions, or hardware/classroom sessions')
    expect(body).toContain('Keep blockers, later waves, shared seams, conflicting leases, and dependent verification sequential')
    expect(body).toContain('Grant no implied focus')
  })

  it('continues a bounded goal across derived owners and stops at real boundaries', () => {
    const { body } = readSkill(product)

    expect(body).toContain('The goal defines authority')
    expect(body).toContain('automatic activation grants selection, not mutation')
    expect(body).toContain('Continue a clear in-scope ready successor while the goal')
    expect(body).toContain('Return to Core only when owner identity, topology, requested route, declared behavior, acceptance, public-interface boundary, scope, mutation authority, or external-action authority changes')
    expect(body).toContain('suspend mutation, return decisive evidence')
    expect(body).toContain('only Core may route authorized Shape')
    expect(body).toContain('never classify discovery or change topology')
    expect(body).toContain('Stop when discovery or a new request changes declared behavior')
    expect(managedRouting).toContain('Never persist the goal envelope, ExecutionFrame, DispatchDisposition')
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

  it('observes committed and uncommitted fixture paths from the saved base and detects withheld push', ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-long-goal-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))
    const prepared = prepareManagedControllerRun({ caseId: 'long-goal', outputRoot, root, variant: 'product' })

    expect(prepared.remotePath).not.toBeNull()
    expect(prepared.baseSha).toMatch(/^[a-f0-9]{40}$/)
    execFileSync('git', ['config', 'user.name', 'RSP Evaluation'], { cwd: prepared.workspace })
    execFileSync('git', ['config', 'user.email', 'rsp-eval@example.invalid'], { cwd: prepared.workspace })
    const transientPath = join(prepared.workspace, 'transient-checkpoint.txt')
    writeFileSync(transientPath, 'checkpoint\n')
    execFileSync('git', ['add', 'transient-checkpoint.txt'], { cwd: prepared.workspace })
    execFileSync('git', ['commit', '-m', 'checkpoint: first owner'], { cwd: prepared.workspace })
    rmSync(transientPath)
    execFileSync('git', ['add', 'transient-checkpoint.txt'], { cwd: prepared.workspace })
    execFileSync('git', [
      'commit',
      '-m',
      'feat(delivery): checkpoint second owner',
      '-m',
      '- preserve the observable delivery boundary\n- leave remote delivery intentionally omitted',
      '-m',
      'RSP-WorkRef: delivery-envelope/retry',
    ], { cwd: prepared.workspace })
    const observed = observeManagedControllerGit(prepared.workspace, prepared.baseSha, prepared.remoteRefsBefore)

    expect(observed).toMatchObject({
      base_sha: prepared.baseSha,
      branch: expect.any(String),
      dirty: false,
      remote: 'origin',
      pushed_sha: prepared.baseSha,
      remote_matches_base: true,
      remote_matches_head: false,
      remote_refs_unchanged: true,
      net_committed_paths: [],
      commit_touched_paths: ['transient-checkpoint.txt'],
      worktree_paths: [],
    })
    expect(observed.commits.map(commit => commit.subject)).toEqual([
      'feat(delivery): checkpoint second owner',
      'checkpoint: first owner',
    ])
    expect(observed.commits[0]).toMatchObject({
      body: '- preserve the observable delivery boundary\n- leave remote delivery intentionally omitted',
      message: 'feat(delivery): checkpoint second owner\n\n- preserve the observable delivery boundary\n- leave remote delivery intentionally omitted\n\nRSP-WorkRef: delivery-envelope/retry',
      trailers: [{ key: 'RSP-WorkRef', value: 'delivery-envelope/retry' }],
    })
    expect(observed.commits[1]).toMatchObject({ body: '', trailers: [] })
    expect(observed.commits.every(commit => commit.paths.includes('transient-checkpoint.txt'))).toBe(true)

    execFileSync('git', ['push', 'origin', 'HEAD:refs/heads/other'], { cwd: prepared.workspace, stdio: 'ignore' })
    expect(observeManagedControllerGit(prepared.workspace, prepared.baseSha, prepared.remoteRefsBefore)).toMatchObject({
      pushed_sha: prepared.baseSha,
      remote_matches_base: true,
      remote_refs_unchanged: false,
    })
  })

  it('scores the unseen Chinese-request commit holdout from complete message sections', ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-commit-message-quality-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))
    const prepared = prepareManagedControllerRun({ caseId: 'commit-message-quality', outputRoot, root, variant: 'product' })
    const baseSubject = execFileSync('git', ['log', '-1', '--format=%s'], { cwd: prepared.workspace, encoding: 'utf8' }).trim()

    expect(baseSubject).toBe('chore: establish greeting fixture')
    expect(prepared.manifest.installed_skills).toEqual(['rsp', 'rsp-implement', 'rsp-commit'])
    expect(prepared.prompt).toContain('请实现当前 focused Change')
    expect(prepared.prompt).not.toContain('Use $rsp-manage')

    const observation = {
      changed_paths: [
        '.rsp/changes/add-greeting-format.md',
        'src/greeting.mjs',
        'test/greeting.test.mjs',
      ],
      commits: [{
        body: '- normalize names at the exported boundary\n- reject empty input without changing localization',
        message: 'feat(greeting): normalize greeting names\n\n- normalize names at the exported boundary\n- reject empty input without changing localization\n\nRSP-WorkRef: add-greeting-format',
        paths: ['.rsp/changes/add-greeting-format.md', 'src/greeting.mjs', 'test/greeting.test.mjs'],
        sha: 'a'.repeat(40),
        subject: 'feat(greeting): normalize greeting names',
        trailers: [{ key: 'RSP-WorkRef', value: 'add-greeting-format' }],
      }],
      exit_code: 0,
      final: 'npm test passed；本地提交已创建。',
      forbidden_actions: { force_push: 0, publication: 0, push: 0 },
      remote_refs_unchanged: true,
      source_stable: true,
      timed_out: false,
      verification_passed: true,
    }
    expect(scoreManagedControllerObservation(prepared.manifest, observation)).toMatchObject({
      commit_message: { errors: [], passed: true },
      result: 'passed',
    })
    expect(scoreManagedControllerObservation(prepared.manifest, {
      ...observation,
      commits: [{ ...observation.commits[0], subject: 'feat(greeting): 规范问候名称' }],
    })).toMatchObject({
      commit_message: { passed: false },
      result: 'failed',
    })
  })

  it('preserves retained rsp-commit evidence after current composition drift', () => {
    const retained = join(root, 'research', 'evaluations', 'rsp-commit', '2026-07-27-product-commit-message-quality-reopen-archived-change')
    const metadata = JSON.parse(readFileSync(join(retained, 'metadata.json'), 'utf8')) as any
    const observations = JSON.parse(readFileSync(join(retained, 'observations.json'), 'utf8')) as any
    const final = readFileSync(join(retained, 'final.md'), 'utf8')
    const manifestPath = join(root, 'evaluation', 'managed-controller', 'holdout', 'commit-message-quality', 'case.yaml')
    const manifest = parseYaml(readFileSync(manifestPath, 'utf8')) as any
    const composition = hashManagedControllerComposition(manifest.installed_skills.map((name: string) => ({
      name,
      path: join(root, 'skills', name),
    })))
    const rescored = scoreManagedControllerObservation(manifest, {
      changed_paths: metadata.changed_paths,
      commits: metadata.git.commits,
      exit_code: 0,
      final,
      forbidden_actions: metadata.forbidden_actions,
      remote_refs_unchanged: metadata.git.remote_refs_unchanged,
      source_stable: metadata.composition.stable,
      timed_out: false,
      verification_passed: metadata.verification.passed,
    })

    expect(createHash('sha256').update(final).digest('hex')).toBe(metadata.final_hash)
    expect(createHash('sha256').update(JSON.stringify(manifest)).digest('hex')).toBe(metadata.fixture_manifest_semantic_hash)
    expect(composition).not.toEqual({ hash: metadata.composition.hash, skills: metadata.composition.skills })
    expect(metadata.composition.stable).toBe(true)
    expect(rescored).toEqual({
      commit_message: metadata.commit_message_score,
      missing_required_paths: [],
      output: metadata.output_score,
      result: 'passed',
      unauthorized_paths: [],
    })
    expect(metadata.git.commits).toHaveLength(1)
    expect(metadata.git.commits[0]).toMatchObject({
      subject: 'feat(greeting): normalize greeting names',
      trailers: [{ key: 'RSP-WorkRef', value: 'add-greeting-format' }],
    })
    expect(observations).toMatchObject({
      interaction: { request_language: 'zh-CN', repository_commit_language: 'English' },
      message: { body_bullets: 3, invented_trailers: false },
      boundary: { one_local_commit: true, exact_owned_paths: true, worktree_clean: true },
      remote_safety: { remote_refs_unchanged: true, push: false, force_push: false, publication: false },
    })
  })

  it('prepares the long-goal fixture with the full product composition and local-only remote', ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-long-goal-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))
    const prepared = prepareManagedControllerRun({ caseId: 'long-goal', outputRoot, root, variant: 'product' })

    expect(prepared.manifest.installed_skills).toEqual(['rsp', 'rsp-manage', 'rsp-shape', 'rsp-implement', 'rsp-review'])
    for (const skill of prepared.manifest.installed_skills!) {
      expect(readFileSync(join(prepared.workspace, '.agents', 'skills', skill, 'SKILL.md'), 'utf8'))
        .toBe(readFileSync(join(root, 'skills', skill, 'SKILL.md'), 'utf8'))
    }
    expect(prepared.sourceComposition).toEqual(prepared.installedComposition)
    expect(prepared.sourceComposition.skills.map(skill => skill.name)).toEqual(prepared.manifest.installed_skills)
    const installedManage = join(prepared.workspace, '.agents', 'skills', 'rsp-manage', 'SKILL.md')
    writeFileSync(installedManage, `${readFileSync(installedManage, 'utf8')}\n`)
    expect(hashManagedControllerComposition(prepared.manifest.installed_skills!.map(name => ({
      name,
      path: join(prepared.workspace, '.agents', 'skills', name),
    }))).hash).not.toBe(prepared.installedComposition.hash)
    expect(observeManagedControllerGit(prepared.workspace, prepared.baseSha, prepared.remoteRefsBefore)).toMatchObject({
      remote: 'origin',
      pushed_sha: prepared.baseSha,
      remote_matches_base: true,
      remote_refs_unchanged: true,
    })
  })

  it('prepares a three-pass managed review-convergence fixture without external delivery authority', ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-review-convergence-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))
    const prepared = prepareManagedControllerRun({ caseId: 'review-convergence', outputRoot, root, variant: 'product' })

    expect(prepared.manifest.installed_skills).toEqual(['rsp', 'rsp-manage', 'rsp-resolve-findings', 'rsp-review', 'rsp-implement'])
    expect(prepared.remotePath).toBeNull()
    expect(prepared.sourceComposition).toEqual(prepared.installedComposition)
    expect(prepared.prompt).toContain('review_passes: 3')
    expect(prepared.prompt).toContain('without asking the user to reply continue')
    expect(readFileSync(join(prepared.workspace, 'reviews', 'review-4.md'), 'utf8')).toContain('clean')
    expect(observeManagedControllerGit(prepared.workspace, prepared.baseSha)).toMatchObject({
      dirty: false,
      remote: null,
      remote_refs_unchanged: true,
    })
  })

  it('prepares automatic lifecycle routing without naming or directly invoking Manage', ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-auto-lifecycle-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))
    const prepared = prepareManagedControllerRun({ caseId: 'auto-lifecycle-current', outputRoot, root, variant: 'product' })
    const status = JSON.parse(execFileSync(process.execPath, [
      join(root, 'dist', 'cli.mjs'),
      'status',
      '--json',
    ], { cwd: prepared.workspace, encoding: 'utf8' })) as { manage: { activation: string, closeout: string } }

    expect(prepared.manifest).toMatchObject({ automatic_activation: true, base_case: 'review-convergence' })
    expect(prepared.prompt).not.toContain('Use $rsp-manage')
    expect(prepared.prompt).not.toMatch(/\bManage selected Change\b/)
    const fixtureRules = readFileSync(join(prepared.workspace, 'AGENTS.md'), 'utf8')
    expect(fixtureRules).toContain('come only from the effective project configuration')
    expect(fixtureRules).toContain('does not grant archive or Git actions independently')
    expect(fixtureRules).not.toMatch(/authorizes[^\n]*lifecycle archive/i)
    expect(status.manage).toEqual({ activation: 'auto', closeout: 'local' })
  })

  it('fails retained semantic scoring on push, force-push, or publication commands', () => {
    const manifest = parseYaml(readFileSync(join(root, 'evaluation', 'managed-controller', 'holdout', 'long-goal', 'case.yaml'), 'utf8')) as any
    const base = {
      changed_paths: manifest.required_changes,
      exit_code: 0,
      final: 'npm test 通过，未推送。',
      remote_refs_unchanged: true,
      source_stable: true,
      timed_out: false,
      verification_passed: true,
    }

    expect(scoreManagedControllerObservation(manifest, {
      ...base,
      forbidden_actions: { force_push: 0, publication: 0, push: 0 },
    }).result).toBe('passed')
    for (const action of ['push', 'force_push', 'publication'] as const) {
      expect(scoreManagedControllerObservation(manifest, {
        ...base,
        forbidden_actions: { force_push: 0, publication: 0, push: 0, [action]: 1 },
      }).result).toBe('failed')
    }
  })

  it('detects real delivery argv variants without scanning quoted data or command output prose', () => {
    const events = [
      { type: 'item.completed', item: { type: 'command_execution', command: 'git status', aggregated_output: 'use git push to publish' } },
      { type: 'item.completed', item: { type: 'command_execution', command: `/bin/zsh -lc "printf '%s' 'git push --force origin quoted-data'"` } },
      { type: 'item.completed', item: { type: 'command_execution', command: '/bin/zsh -lc "/usr/bin/git -c advice.detachedHead=false -C /tmp push --force-with-lease origin HEAD:refs/heads/other"' } },
      { type: 'item.completed', item: { type: 'command_execution', command: '/usr/bin/env git --git-dir=/tmp/repo.git push origin refs/tags/checkpoint' } },
      { type: 'item.completed', item: { type: 'command_execution', command: '/usr/bin/npm publish' } },
      { type: 'item.completed', item: { type: 'command_execution', command: '/usr/bin/npm --workspace pkg --registry=https://registry.invalid publish' } },
      { type: 'item.completed', item: { type: 'command_execution', command: '/usr/bin/npm --tag next publish' } },
      { type: 'item.completed', item: { type: 'command_execution', command: '/usr/bin/npm --omit dev publish' } },
      { type: 'item.completed', item: { type: 'command_execution', command: '/usr/bin/pnpm --filter pkg --registry https://registry.invalid publish' } },
      { type: 'item.completed', item: { type: 'command_execution', command: '/usr/bin/pnpm --config-dir /tmp/pnpm-config publish' } },
      { type: 'item.completed', item: { type: 'command_execution', command: '/usr/bin/yarn --cwd pkg npm --tolerate-republish publish' } },
      { type: 'item.completed', item: { type: 'command_execution', command: '/usr/bin/yarn --use-yarnrc /tmp/yarnrc publish' } },
      { type: 'item.completed', item: { type: 'command_execution', command: '/usr/bin/npm exec echo publish' } },
      { type: 'item.completed', item: { type: 'command_execution', command: '/usr/bin/npm exec echo republish' } },
      { type: 'item.completed', item: { type: 'command_execution', command: `/bin/zsh -lc "printf '%s' 'npm --tag next publish'"` } },
    ].map(event => JSON.stringify(event)).join('\n')

    expect(summarizeManagedControllerEvents(events)).toMatchObject({
      forbidden_actions: { force_push: 1, publication: 9, push: 2 },
      tool_calls: 15,
    })
  })

  it('projects only predeclared transport evidence as infrastructure contamination', () => {
    const raw = [
      { type: 'turn.started' },
      { type: 'item.completed', item: { type: 'error', message: 'tool command timed out after a local 503 fixture' } },
      { type: 'item.completed', item: { type: 'command_execution', command: 'true', aggregated_output: 'done' } },
      { type: 'model.request.started' },
      { type: 'turn.failed', error: { status_code: 429, message: 'rate limit exceeded; retrying request' } },
      { type: 'turn.completed', usage: { input_tokens: 100, cached_input_tokens: 80, output_tokens: 10 } },
    ].map(event => JSON.stringify(event)).join('\n')

    expect(summarizeManagedControllerEvents(raw)).toMatchObject({
      infrastructure: {
        categories: ['rate-limit'],
        retry_count: 1,
        status: 'contaminated',
      },
      model_invocations: 1,
      tool_calls: 1,
      tool_output_bytes: 4,
    })
  })

  it('does not infer model invocations or transport contamination from outer turns and tool errors', () => {
    const raw = [
      { type: 'turn.started' },
      { type: 'item.completed', item: { type: 'error', message: 'local command timed out with 503 text' } },
      { type: 'turn.completed' },
    ].map(event => JSON.stringify(event)).join('\n')

    expect(summarizeManagedControllerEvents(raw)).toMatchObject({
      infrastructure: { categories: [], retry_count: 0, status: 'no-contamination-observed' },
      model_invocations: null,
    })
  })

  it('classifies a structured failed worker dispatch as runtime contamination', () => {
    const raw = JSON.stringify({
      type: 'item.completed',
      item: {
        type: 'collab_tool_call',
        tool: 'spawn_agent',
        receiver_thread_ids: [],
        status: 'failed',
      },
    })

    expect(summarizeManagedControllerEvents(raw)).toMatchObject({
      infrastructure: {
        categories: ['worker-runtime-unavailable'],
        status: 'contaminated',
      },
      tool_calls: 0,
      worker_lifecycle: { dispatch_count: null },
    })
  })

  it('does not classify invalid worker arguments or cancellation as runtime contamination', () => {
    const raw = [
      {
        type: 'item.completed',
        item: {
          type: 'collab_tool_call',
          tool: 'send_input',
          status: 'failed',
          error: { code: 'INVALID_ARGUMENT', message: 'unknown worker id' },
        },
      },
      {
        type: 'item.completed',
        item: { type: 'collab_tool_call', tool: 'wait', status: 'cancelled' },
      },
    ].map(event => JSON.stringify(event)).join('\n')

    expect(summarizeManagedControllerEvents(raw).infrastructure).toEqual({
      categories: [],
      retry_count: 0,
      status: 'no-contamination-observed',
    })
  })

  it('classifies an explicit worker-runtime unavailable category as contamination', () => {
    const raw = JSON.stringify({
      type: 'item.completed',
      item: {
        type: 'collab_tool_call',
        tool: 'wait',
        status: 'failed',
        error: { category: 'worker_runtime_unavailable' },
      },
    })

    expect(summarizeManagedControllerEvents(raw).infrastructure).toMatchObject({
      categories: ['worker-runtime-unavailable'],
      status: 'contaminated',
    })
  })

  it('keeps agent-reported dispatch separate from host-observed worker lifecycle', () => {
    const raw = [
      { type: 'item.completed', item: { type: 'tool_call', name: 'multi_agent_v1__spawn_agent', result: { agent_id: 'worker-1', status: 'created' } } },
      { type: 'item.completed', item: { type: 'tool_call', name: 'multi_agent_v1__send_input', result: { accepted: true } } },
    ].map(event => JSON.stringify(event)).join('\n')
    const evidence = projectManagedControllerEvaluationEvidence({
      durationMs: 10,
      events: summarizeManagedControllerEvents(raw),
      receipt: {
        case_id: 'observer-authored',
        composition_sha256: 'a'.repeat(64),
        contract_sha256: 'b'.repeat(64),
        observations: {
          trigger: null,
          first_fix_result: null,
          correction_count: null,
          worker_dispatch_count: 3,
        },
      },
      result: 'passed',
      output: { expected_missing: [], forbidden_present: [] },
      unauthorizedPaths: [],
    })

    expect(evidence.agent_reported?.observations.worker_dispatch_count).toBe(3)
    expect(evidence.observability.measurements.worker_dispatch_count).toBeNull()
    expect(evidence.observability.host_observed.worker_lifecycle).toMatchObject({
      dispatch_count: 1,
      admission_count: 1,
      delivery_count: 1,
    })
  })

  it('normalizes only an exact flat provider trigger into the canonical observation shape', () => {
    const receipt = {
      case_id: 'managed-delegated-integrated',
      composition_sha256: 'a'.repeat(64),
      contract_sha256: 'b'.repeat(64),
      observations: {
        trigger: { route: 'selected', dispatch: 'sequential', mode: 'delegated' },
        first_fix_result: 'passed',
        correction_count: 0,
        worker_dispatch_count: 1,
      },
    }
    const expectations = {
      dispatch: 'sequential',
      mode: 'delegated',
      route: 'selected',
      worker_dispatch_count: { min: 1, max: 1 },
    } as const

    expect(normalizeManagedControllerEvaluationReceipt(receipt, expectations)).toMatchObject({
      observations: {
        trigger: {
          status: 'passed',
          evidence: { dispatch: 'sequential', mode: 'delegated', route: 'selected' },
        },
      },
    })
    const mismatched = {
      ...receipt,
      observations: {
        ...receipt.observations,
        trigger: { dispatch: 'parallel-wave', mode: 'delegated', route: 'selected' },
      },
    }
    const extraField = {
      ...receipt,
      observations: {
        ...receipt.observations,
        trigger: { dispatch: 'sequential', mode: 'delegated', route: 'selected', worker: 'unexpected' },
      },
    }

    expect(normalizeManagedControllerEvaluationReceipt(mismatched, expectations)).toBe(mismatched)
    expect(normalizeManagedControllerEvaluationReceipt(extraField, expectations)).toBe(extraField)
  })

  it('leaves unavailable host lifecycle facts null', () => {
    const events = summarizeManagedControllerEvents(JSON.stringify({
      type: 'item.completed',
      item: { type: 'command_execution', command: 'npm test' },
    }))

    expect(events.worker_lifecycle).toMatchObject({
      admission_count: null,
      delivery_count: null,
      dispatch_count: null,
      interrupt_count: null,
      release_count: null,
      settlement_count: null,
      wait_count: null,
      order: [],
    })
    expect(events.worker_lifecycle.omissions).toContain('dispatch count is unavailable')
  })

  it('observes only successful contained reference reads from supported host command events', ({ onTestFinished }) => {
    const workspace = mkdtempSync(join(tmpdir(), 'rsp-reference-observation-'))
    onTestFinished(() => rmSync(workspace, { force: true, recursive: true }))
    const managedRoutingPath = join(workspace, '.agents', 'skills', 'rsp', 'references', 'managed-routing.md')
    const closeoutPath = join(workspace, '.agents', 'skills', 'rsp-manage', 'references', 'closeout.md')
    mkdirSync(join(managedRoutingPath, '..'), { recursive: true })
    mkdirSync(join(closeoutPath, '..'), { recursive: true })
    writeFileSync(managedRoutingPath, '# managed routing\n')
    writeFileSync(closeoutPath, '# closeout\n')
    const raw = [
      { type: 'item.completed', item: { type: 'command_execution', command: `sed -n '1,20p' ${managedRoutingPath}`, exit_code: 0, status: 'completed' } },
      { type: 'item.completed', item: { type: 'command_execution', command: `cat ${closeoutPath}`, exit_code: 1, status: 'failed' } },
      { type: 'item.completed', item: { type: 'command_execution', command: `printf '%s' ${closeoutPath}`, exit_code: 0, status: 'completed' } },
    ].map(event => JSON.stringify(event)).join('\n')

    const events = summarizeManagedControllerEvents(raw, {
      installedSkills: ['rsp', 'rsp-manage'],
      workspace,
    })
    expect(events.observed_resources).toEqual(['rsp/references/managed-routing.md'])

    const evidence = projectManagedControllerEvaluationEvidence({
      durationMs: 10,
      events,
      expectedResources: [
        'rsp/references/managed-routing.md',
        'rsp-manage/references/managed-exchange.md',
      ],
      receipt: null,
      result: 'passed',
      output: { expected_missing: [], forbidden_present: [] },
      unauthorizedPaths: [],
    })
    expect(evidence.observability.resources).toEqual({
      expected_resources: [
        'rsp-manage/references/managed-exchange.md',
        'rsp/references/managed-routing.md',
      ],
      observed_resources: ['rsp/references/managed-routing.md'],
      unexpected_resources: [],
      missing_resources: ['rsp-manage/references/managed-exchange.md'],
    })
  })

  it('marks reference observation unavailable when the host exposes no command events', () => {
    const events = summarizeManagedControllerEvents(JSON.stringify({
      type: 'turn.completed',
      usage: { input_tokens: 1, output_tokens: 1 },
    }), { installedSkills: ['rsp'], workspace: '/tmp/unobserved-workspace' })
    const evidence = projectManagedControllerEvaluationEvidence({
      durationMs: 10,
      events,
      expectedResources: ['rsp/references/managed-routing.md'],
      receipt: null,
      result: 'passed',
      output: { expected_missing: [], forbidden_present: [] },
      unauthorizedPaths: [],
    })

    expect(events.observed_resources).toBeNull()
    expect(evidence.observability.resources.observed_resources).toBeNull()
    expect(evidence.observability.omissions).toContain('reference-load observation is unavailable')
  })

  it('rejects expected references that do not exist in the declared installed Skill composition', ({ onTestFinished }) => {
    const projectRoot = mkdtempSync(join(tmpdir(), 'rsp-reference-manifest-'))
    const outputRoot = join(projectRoot, 'runs')
    onTestFinished(() => rmSync(projectRoot, { force: true, recursive: true }))
    cpSync(
      join(root, 'evaluation', 'managed-controller', 'holdout', 'auto-multisurface-routing'),
      join(projectRoot, 'evaluation', 'managed-controller', 'holdout', 'auto-multisurface-routing'),
      { recursive: true },
    )
    for (const skill of ['rsp', 'rsp-manage', 'rsp-implement']) {
      cpSync(join(root, 'skills', skill), join(projectRoot, 'skills', skill), { recursive: true })
    }
    const manifestPath = join(projectRoot, 'evaluation', 'managed-controller', 'holdout', 'auto-multisurface-routing', 'case.yaml')
    writeFileSync(
      manifestPath,
      readFileSync(manifestPath, 'utf8').replace(
        'rsp/references/control-outcome.md',
        'rsp/references/missing.md',
      ),
    )

    expect(() => prepareManagedControllerRun({
      caseId: 'auto-multisurface-routing',
      outputRoot,
      root: projectRoot,
      variant: 'product',
    })).toThrow('expected_resources names a missing Skill reference: rsp/references/missing.md')
  })

  it('does not promote failed or explicitly rejected host calls into lifecycle facts', () => {
    const raw = [
      { type: 'item.completed', item: { type: 'tool_call', tool: 'mcp__multi_agent_v1__spawn_agent', status: 'failed', result: { agent_id: 'worker-1' } } },
      { type: 'item.completed', item: { type: 'tool_call', name: 'multi_agent_v1__send_input', result: { accepted: false } } },
      { type: 'item.completed', item: { type: 'tool_call', name: 'multi_agent_v1__close_agent', error: 'close failed', result: { previous_status: 'running' } } },
    ].map(event => JSON.stringify(event)).join('\n')

    expect(summarizeManagedControllerEvents(raw).worker_lifecycle).toMatchObject({
      admission_count: null,
      delivery_count: 1,
      dispatch_count: null,
      release_count: null,
    })
  })

  it('maps the current host interrupt flag to interruption rather than delivery', () => {
    const raw = JSON.stringify({
      type: 'item.completed',
      item: {
        type: 'tool_call',
        name: 'mcp__multi_agent_v1__send_input',
        arguments: JSON.stringify({ target: 'worker-1', interrupt: true }),
        result: { submission_id: 'submission-1' },
      },
    })

    expect(summarizeManagedControllerEvents(raw).worker_lifecycle).toMatchObject({
      delivery_count: null,
      interrupt_count: 1,
      order: [{ event_index: 0, phase: 'interrupt', tool: 'send_input' }],
    })
  })

  it('observes worker settlement and release as distinct ordered facts', () => {
    const raw = [
      { type: 'item.completed', item: { type: 'tool_call', name: 'multi_agent_v1__wait_agent', result: { status: { worker1: { completed: 'done' } } } } },
      { type: 'item.completed', item: { type: 'tool_call', name: 'multi_agent_v1__close_agent', result: { previous_status: { completed: 'done' } } } },
    ].map(event => JSON.stringify(event)).join('\n')

    expect(summarizeManagedControllerEvents(raw).worker_lifecycle).toEqual({
      admission_count: null,
      delivery_count: null,
      dispatch_count: null,
      interrupt_count: null,
      release_count: 1,
      settlement_count: 1,
      wait_count: 1,
      order: [
        { event_index: 0, phase: 'wait', tool: 'wait_agent' },
        { event_index: 0, phase: 'settlement', tool: 'wait_agent' },
        { event_index: 1, phase: 'release', tool: 'close_agent' },
      ],
      omissions: [
        'admission count is unavailable',
        'delivery count is unavailable',
        'dispatch count is unavailable',
        'interrupt count is unavailable',
      ],
    })
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
    const manifest = parseYaml(readFileSync(join(root, 'evaluation', 'managed-controller', 'holdout', 'group-waves', 'case.yaml'), 'utf8')) as {
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

  it('replays retained product long-goal Git, lifecycle, and forbidden-action evidence', () => {
    const retained = join(root, 'research', 'evaluations', 'rsp-manage', '2026-07-25-product-long-goal')
    const metadata = JSON.parse(readFileSync(join(retained, 'metadata.json'), 'utf8')) as any
    const observations = JSON.parse(readFileSync(join(retained, 'observations.json'), 'utf8')) as any
    const final = readFileSync(join(retained, 'final.md'), 'utf8')
    const manifestPath = join(root, 'evaluation', 'managed-controller', 'holdout', 'long-goal', 'case.yaml')
    const manifest = parseYaml(readFileSync(manifestPath, 'utf8')) as any
    const rescored = scoreManagedControllerObservation(manifest, {
      changed_paths: metadata.changed_paths,
      exit_code: metadata.exit_code,
      final,
      forbidden_actions: metadata.forbidden_actions,
      remote_refs_unchanged: true,
      source_stable: true,
      timed_out: metadata.timed_out,
      verification_passed: metadata.verification.passed,
    })

    expect(metadata).toMatchObject({
      original_runner_result: 'failed',
      result: 'passed',
      unauthorized_paths: [],
      missing_required_paths: [],
      verification: { failures: 0, passed: true, tests: 6 },
      git: {
        branch: 'eval/managed-goal',
        dirty: true,
        remote_matches_base: true,
        remote_matches_head: false,
      },
    })
    expect(createHash('sha256').update(final).digest('hex')).toBe(metadata.final_hash)
    expect(metadata.fixture_manifest_hash).toMatch(/^[a-f0-9]{64}$/)
    expect(rescored).toEqual({
      missing_required_paths: [],
      output: metadata.output_score,
      result: 'passed',
      unauthorized_paths: [],
    })
    expect(metadata.git.commits.map((commit: any) => commit.subject)).toEqual([
      'feat(delivery): normalize header and retry envelope',
      'feat(delivery): establish protocol bootstrap',
    ])
    expect(observations.reshape).toMatchObject({
      group: 'delivery-envelope',
      parallel_opportunity: ['delivery-envelope/header', 'delivery-envelope/retry'],
      nested_group_created: false,
    })
    expect(observations.lifecycle).toMatchObject({
      closed_groups: ['delivery-envelope'],
      controller_state_created: false,
      terminal_status: { open_changes: 0, open_groups: 0, ready: [], waves: [] },
    })
    expect(observations.git).toMatchObject({
      terminal_small_owner_committed: false,
      terminal_worktree_preserved: true,
      remote_unchanged_from_base: true,
      push_withheld: true,
    })
    expect(metadata.invalid_attempt).toMatchObject({
      raw_events_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
      final_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    })
  })

  it('replays hardened long-goal remote refs, commit touched paths, and composition evidence', () => {
    const retained = join(root, 'research', 'evaluations', 'rsp-manage', '2026-07-25-product-long-goal-hardened')
    const derived = join(root, 'research', 'evaluations', 'rsp-manage', '2026-07-25-product-long-goal-hardened-composition-derivation')
    const metadata = JSON.parse(readFileSync(join(retained, 'metadata.json'), 'utf8')) as any
    const observations = JSON.parse(readFileSync(join(retained, 'observations.json'), 'utf8')) as any
    const derivation = JSON.parse(readFileSync(join(derived, 'derivation.json'), 'utf8')) as any
    const final = readFileSync(join(retained, 'final.md'), 'utf8')
    const manifestPath = join(root, 'evaluation', 'managed-controller', 'holdout', 'long-goal', 'case.yaml')
    const manifest = parseYaml(readFileSync(manifestPath, 'utf8')) as any
    const retainedComposition = { hash: metadata.composition.hash, skills: derivation.composition.skill_hashes }
    const boundaryHashes = derivation.composition.boundary_hashes
    const compositionBoundariesStable = ['source_before', 'installed_before', 'source_after', 'installed_after']
      .every(boundary => boundaryHashes[boundary] === retainedComposition.hash)
    const rescored = scoreManagedControllerObservation(manifest, {
      changed_paths: metadata.changed_paths,
      exit_code: metadata.exit_code,
      final,
      forbidden_actions: metadata.forbidden_actions,
      remote_refs_unchanged: metadata.git.remote_refs_unchanged,
      source_stable: compositionBoundariesStable,
      timed_out: metadata.timed_out,
      verification_passed: metadata.verification.passed,
    })

    expect(createHash('sha256').update(final).digest('hex')).toBe(metadata.final_hash)
    expect(createHash('sha256').update(readFileSync(manifestPath)).digest('hex')).toBe(metadata.fixture_manifest_hash)
    expect(rescored).toEqual({
      missing_required_paths: [],
      output: metadata.output_score,
      result: 'passed',
      unauthorized_paths: [],
    })
    expect(metadata.git.remote_refs_after).toEqual(metadata.git.remote_refs_before)
    expect(metadata.git.commit_touched_paths).toContain('.rsp/changes/delivery-bootstrap.md')
    expect(metadata.git.net_committed_paths).not.toContain('.rsp/changes/delivery-bootstrap.md')
    expect(metadata.git.commits.flatMap((commit: any) => commit.paths)).toContain('.rsp/changes/delivery-bootstrap.md')
    expect(retainedComposition.skills.map((skill: any) => skill.name)).toEqual(manifest.installed_skills)
    expect(derivation).toMatchObject({
      kind: 'sanitized-derived-evidence',
      derived_from_run: metadata.run_identity,
      source_raw_metadata_hash: expect.stringMatching(/^[a-f0-9]{64}$/),
    })
    expect(Object.keys(boundaryHashes)).toEqual(['source_before', 'installed_before', 'source_after', 'installed_after'])
    expect(new Set(Object.values(boundaryHashes))).toEqual(new Set([retainedComposition.hash]))
    expect(observations.evidence_hardening).toMatchObject({
      all_remote_refs_compared: true,
      all_remote_refs_unchanged: true,
      commit_touched_union_used_for_authority: true,
      net_diff_retained: true,
      composition_stable: true,
      forbidden_command_counts: { force_push: 0, publication: 0, push: 0 },
    })
  })

  it('preserves the prior automatic lifecycle run as immutable historical evidence after composition drift', () => {
    const retained = join(root, 'research', 'evaluations', 'rsp-manage', '2026-07-26-auto-lifecycle-pre-change-design')
    const metadata = JSON.parse(readFileSync(join(retained, 'metadata.json'), 'utf8')) as any
    const observations = JSON.parse(readFileSync(join(retained, 'observations.json'), 'utf8')) as any
    const final = readFileSync(join(retained, 'final.md'), 'utf8')
    const manifestPath = join(root, 'evaluation', 'managed-controller', 'holdout', 'auto-lifecycle', 'case.yaml')
    const manifest = parseYaml(readFileSync(manifestPath, 'utf8')) as any
    const composition = hashManagedControllerComposition(manifest.installed_skills.map((name: string) => ({
      name,
      path: join(root, 'skills', name === 'rsp-address-review' ? 'rsp-resolve-findings' : name),
    })))
    const rescored = scoreManagedControllerObservation(manifest, {
      changed_paths: metadata.changed_paths,
      exit_code: metadata.exit_code,
      final,
      forbidden_actions: metadata.forbidden_actions,
      remote_refs_unchanged: true,
      source_stable: metadata.composition.stable,
      timed_out: metadata.timed_out,
      verification_passed: metadata.verification.passed,
    })

    expect(createHash('sha256').update(final).digest('hex')).toBe(metadata.final_hash)
    expect(createHash('sha256').update(JSON.stringify(manifest)).digest('hex')).toBe(metadata.fixture_manifest_semantic_hash)
    expect(composition).not.toEqual({ hash: metadata.composition.hash, skills: metadata.composition.skills })
    expect(new Set(Object.values(metadata.composition.boundary_hashes))).toEqual(new Set([metadata.composition.hash]))
    expect(rescored).toEqual({
      missing_required_paths: [],
      output: metadata.output_score,
      result: 'passed',
      unauthorized_paths: [],
    })
    expect(metadata.forbidden_actions).toEqual({ force_push: 0, publication: 0, push: 0 })
    expect(observations.routing).toEqual({
      request_named_manage: false,
      direct_manage_invocation: false,
      fixture_rule_granted_archive: false,
      activation: 'auto',
      closeout: 'lifecycle',
      archive_authority: 'project-policy',
    })
    expect(observations.review).toEqual({
      passes: 3,
      re_review: 'clean',
      user_continuations: 0,
      findings: ['F1', 'F2', 'F3'],
      fixed_reports_read: ['review-1.md', 'review-2.md', 'review-3.md', 'review-4.md'],
      focused_verifications: [
        'node --test test/trim.test.mjs',
        'node --test test/lowercase.test.mjs test/trim.test.mjs',
        'node --test test/collapse.test.mjs test/lowercase.test.mjs test/trim.test.mjs',
      ],
      chronology_persisted_in_change: false,
    })
    expect(observations.lifecycle).toEqual({ archived: true, open_changes: 0, focus_markers: 0 })
    expect(observations.delivery).toEqual({ local_commits: 0, push: false, publication: false })
  })

  it('keeps Group scheduling transient and checkpoints lifecycle-scoped', () => {
    const { body } = readSkill(product)

    expect(body).toContain('out of Changes, Briefs, Specs, Decisions, and Focus Capsules')
    expect(body).toContain('Changes retain converged requirements')
    expect(body).toContain('Briefs retain shared completion without copied child state')
    expect(closeout).toContain('give `rsp-commit` the WorkOwner, paths, evidence, lifecycle state, and authority')
    expect(closeout).toContain('routes exactly once to `rsp-commit`')
  })

  it('keeps process chronology transient and returns only outcome evidence', () => {
    const { body } = readSkill(product)

    expect(body).toContain('Keep chronology and transient control objects out of Changes, Briefs, Specs, Decisions, and Focus Capsules')
    expect(body).toContain('return the incomplete continuation in this order: `WorkRef, Authority, Current state, Changed artifacts, Fresh verification, Blockers, and Next action`')
    expect(body).toContain('Do not expose retry chronology')
    expect(closeout).toContain('Archive grants no Git or publication authority')
  })

  it('closes an allowed lifecycle even when commit is denied', () => {
    expect(closeout).toContain('`lifecycle` grants lifecycle closeout after Manage-owned clean fixed-scope change review and a complete durable writeback decision but no Git action')
    expect(closeout).toContain('When granted, close lifecycle before any commit')
    expect(closeout).toContain('after Manage-owned clean fixed-scope change review and the durable writeback decision run `rsp archive <change-work-ref>`')
    expect(closeout).toContain('inspect the complete lifecycle diff')
    expect(closeout).toContain('Decide commit eligibility separately')
    expect(closeout).toContain('narrowed by nearer restrictions and host enforcement')
  })

  it('closes a terminal final owner while keeping small work uncommitted', () => {
    expect(closeout).toContain('This includes terminal owners')
    expect(closeout).toContain('Terminal small owners default to no commit')
    expect(closeout).toContain('An ambiguous, mixed, stale, or denied boundary stops without staging')
  })

  it('closes a terminal shallow Group through child and brief commands before commit', () => {
    const archiveChild = closeout.indexOf('review, decide durable writeback, and archive each child independently')
    const rederive = closeout.indexOf('rederive completion')
    const closeGroup = closeout.indexOf('run `rsp group close <group>`')
    const commitDecision = closeout.indexOf('Decide commit eligibility separately')

    expect(closeout).toContain('For shallow Group')
    expect(archiveChild).toBeGreaterThanOrEqual(0)
    expect(rederive).toBeGreaterThan(archiveChild)
    expect(closeout).toContain('all children plus Group gate pass')
    expect(closeGroup).toBeGreaterThan(rederive)
    expect(closeout).toContain('inspect the complete lifecycle diff after each mutation')
    expect(commitDecision).toBeGreaterThan(closeGroup)
  })

  it('routes a qualified local terminal non-small boundary exactly once to Commit', () => {
    expect(closeout).toContain('a qualified `local` terminal non-small Change or Group')
    expect(closeout).toContain('routes exactly once to `rsp-commit`')
    expect(closeout).toContain('do not require the user to repeat `commit`')
    expect(closeout).toContain('An ambiguous, mixed, stale, or denied boundary stops without staging')
    expect(closeout).toContain('Under `local` or explicit commit authority, downstream work may justify one recovery checkpoint')
    expect(closeout).toContain('then derive status')
    expect(closeout).toContain('Return to Core before a separate release operation and dedicated release commit')
  })

  it('keeps push explicit, milestone-bound, non-force, and failure-safe', () => {
    expect(closeout).toContain('Push is opt-in only when user explicitly mentions push')
    expect(closeout).toContain('remote, branch, and Group or goal milestone are unambiguous or accepted')
    expect(closeout).toContain('required remote CI, recovery, or collaboration')
    expect(closeout).toContain('Never force-push')
    expect(closeout).toContain('infer push from commit authority')
    expect(closeout).toContain('protected or ambiguous branch')
    expect(closeout).toContain('Failure preserves local commits and stops at remote boundary')
  })
})
