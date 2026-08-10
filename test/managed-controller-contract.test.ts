import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { evaluateManagedController, hashManagedControllerArtifact, hashManagedControllerComposition, loadManagedControllerCases, observeManagedControllerGit, prepareManagedControllerRun, readManagedControllerFlag, rescoreManagedControllerArtifact, scoreManagedControllerObservation, scoreManagedControllerOutput, scoreManagedRecoveryOutput, summarizeManagedControllerEvents } from '../scripts/managed-controller-eval.mjs'
import { canonicalEnum, findSemanticUnit, inlineCodeValues, inlineCodeValuesInUnit, markdownListItem, markdownSection, orderedMarkers } from './helpers/markdown-contract'

const root = fileURLToPath(new URL('..', import.meta.url))
const candidate = join(root, 'research', 'candidates', 'skills', 'rsp-manage')
const product = join(root, 'skills', 'rsp-manage')
const managedRouting = readFileSync(join(root, 'skills', 'rsp', 'references', 'managed-routing.md'), 'utf8')
const durableReview = readFileSync(join(root, 'skills', 'rsp', 'references', 'durable-review.md'), 'utf8')
const coreSkill = readFileSync(join(root, 'skills', 'rsp', 'SKILL.md'), 'utf8')
const reviewConvergence = readFileSync(join(product, 'references', 'review-convergence.md'), 'utf8')
const closeout = readFileSync(join(product, 'references', 'closeout.md'), 'utf8')

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
      'blocker-continuation',
      'dispatch-envelope',
      'drift-safe-resume',
      'drift-stop',
      'explicit-eligibility',
      'explicit-pause',
      'fresh-return',
      'frontier-precedence-stop',
      'owner-preflight-routing',
      'interruption-recovery',
      'lane-boundaries',
      'ordinary-restraint',
      'owner-release',
      'progress-continues',
      'required-worker-closeout',
      'runtime-observability',
      'runtime-resume-hydration',
      'shape-requalification',
      'control-route-transitions',
      'transient-execution-bounds',
    ].sort())
    expect(cases.find(item => item.id === 'owner-preflight-routing')?.sources).toEqual([
      'skills/rsp/SKILL.md',
      '.rsp/specs/skill-control-model.md',
      'skills/rsp-manage/SKILL.md',
      'skills/rsp/references/managed-routing.md',
    ])
    expect(evaluateManagedController(root)).toEqual(cases.map(item => ({ id: item.id, missing: [], passed: true })))
  })

  it('fails closed when a contract fixture source escapes the repository root', ({ onTestFinished }) => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-contract-source-'))
    onTestFinished(() => rmSync(fixtureRoot, { force: true, recursive: true }))
    const fixtures = join(fixtureRoot, 'test', 'managed-controller', 'fixtures')
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

  it('prepares an unseen automatic multi-surface holdout that selects sequential Manage', ({ onTestFinished }) => {
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
    expect(prepared.manifest.expected_output).toEqual(expect.arrayContaining(['selected', 'sequential', 'npm test']))
    expect(prepared.manifest.forbidden_output).toEqual(expect.arrayContaining(['RouteDisposition: direct', 'declined']))
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

  it('prepares and deterministically scores static runtime-available and runtime-absent prompt holdouts', ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-runtime-holdouts-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))

    const available = prepareManagedControllerRun({
      caseId: 'runtime-observability-available',
      outputRoot,
      root,
      variant: 'product',
    })
    expect(available.manifest.runtime_observability).toEqual({
      state: 'available',
      capability: 'rsp.manage-runtime@1.0',
      run_id: 'run-runtime-observability',
      dispatches: [{
        dispatch_id: 'dispatch-fixture-implement',
        worker_id: 'worker-fixture-implement',
      }],
    })
    expect(available.prompt).toContain('Only these fixture-supplied host-confirmed dispatch identities may be correlated after simulated creation')
    expect(available.prompt).toContain('This holdout proves only deterministic prompt-contract behavior, not real-host execution')
    expect(available.prompt).toContain('`dispatch-fixture-implement` -> `worker-fixture-implement`')
    expect(scoreManagedControllerOutput(
      available.manifest,
      [
        'Route selected; dispatch sequential; npm test passed.',
        'Optional rsp.manage-runtime@1.0 correlation: run-runtime-observability,',
        'dispatch-fixture-implement, worker-fixture-implement.',
        'The runtime projection remains non-authoritative.',
      ].join(' '),
    )).toEqual({ expected_missing: [], forbidden_present: [] })

    const absent = prepareManagedControllerRun({
      caseId: 'runtime-observability-absent',
      outputRoot,
      root,
      variant: 'product',
    })
    expect(absent.manifest.runtime_observability).toEqual({
      state: 'absent',
      diagnostic: 'manage_runtime_broker_absent',
    })
    expect(absent.prompt).toContain('Continue through the unchanged no-runtime control path')
    expect(scoreManagedControllerOutput(
      absent.manifest,
      'Route selected; dispatch sequential; npm test passed. manage_runtime_broker_absent; no-runtime behavior was preserved.',
    )).toEqual({ expected_missing: [], forbidden_present: [] })
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
    const manifest = parseYaml(readFileSync(join(root, 'test', 'managed-controller', 'holdout', 'pause-resume', 'case.yaml'), 'utf8')) as any

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
    const manifest = parseYaml(readFileSync(join(root, 'test', 'managed-controller', 'holdout', 'pause-resume', 'case.yaml'), 'utf8')) as any

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

    expect(findSemanticUnit(qualify, ['independent path', 'independent slices', 'interruption recovery', 'prospective execution signals'])).toBeDefined()
    expect(findSemanticUnit(qualify, ['implementation', 'integration verification', 'managed review', 'lifecycle work'])).toBeDefined()
    expect(findSemanticUnit(qualify, ['cross-module', 'real-host', 'bounded finding convergence', 'ready successor'])).toBeDefined()
    expect(findSemanticUnit(qualify, ['elapsed wall-clock minutes', 'never qualification evidence'])).toBeDefined()
    expect(findSemanticUnit(qualify, ['automatic activation', 'non-small', 'Manage'])).toBeDefined()
    expect(findSemanticUnit(qualify, ['Specs', 'product presentation', 'public documentation', 'verification surfaces', 'sequential'])).toBeDefined()
    expect(findSemanticUnit(qualify, ['one owner', 'one local seam', 'one mutation pass', 'one decisive check', 'no managed lifecycle coordination', 'no ready successor'])).toBeDefined()
    expect(findSemanticUnit(qualify, ['fails any one', 'non-small', 'middle case'])).toBeDefined()
    expect(findSemanticUnit(entry, ['Core', 'solely own', 'initial Manage qualification'])).toBeDefined()
    expect(findSemanticUnit(entry, ['Manage', 'never repeats', 'direct-versus-managed eligibility'])).toBeDefined()
    expect(findSemanticUnit(entry, [/validate only handoff completeness/i, 'owner and topology', 'authority envelope', 'owned paths', 'qualification evidence'])).toBeDefined()
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
    expect(findSemanticUnit(frontier, ['applicable stop', 'instead of selecting Fix'])).toBeDefined()
    expect(findSemanticUnit(frontier, ['`ready-to-execute`', 'canonical `executable`'])).toBeDefined()
    expect(findSemanticUnit(frontier, ['`StopDisposition: return-to-shape`', 'Core', 'Only Core', 'Shape'])).toBeDefined()
    expect(body).not.toContain('return `StopDisposition: return-to-shape` to Core/Shape')
    expect(findSemanticUnit(frontier, ['halt the current managed control phase', 'Do not continue', 'dispatch another worker', 'mutate product state'])).toBeDefined()
    expect(body).not.toContain('unless an independently ready owned slice can continue')
    expect(findSemanticUnit(frontier, ['Resume only after', 'Shape', 'ready owner', 'Core', 'rederives the route'])).toBeDefined()
  })

  it('defines one complete token-independent WorkerEnvelope and exact lane receipt schemas', () => {
    const { body } = readSkill(product)
    const lanes = markdownSection(body, 'Resolve the execution frontier')

    expect(inlineCodeValuesInUnit(lanes, ['Every lane', '`WorkerEnvelope`', 'common fields'])).toEqual([
      'WorkerEnvelope',
      'WorkRef',
      'lane',
      'objective',
      'current hypothesis',
      'known evidence',
      'allowed paths',
      'allowed actions and commands',
      'prohibited actions',
      'comparison baseline',
      'expected result schema',
      'response language',
      'localized control-narration rule',
      'stop conditions',
      'runtime correlation',
    ])
    expect(inlineCodeValuesInUnit(lanes, ['Every receipt', 'common fields'])).toEqual([
      'WorkRef',
      'lane objective',
      'effective authority',
      'result',
      'decisive evidence',
      'stop boundary',
      'runtime correlation',
    ])
    expect(findSemanticUnit(lanes, ['Diagnose', '`rsp-diagnose`', 'read-only', 'no-cause result'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['Inspect', 'private Manager-only', 'read-only lane'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['Fix', '`rsp-implement`', 'sole product writer'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['Verify', 'delegates', 'rsp-verify', 'read-only', 'Change-declared risk', 'failed correction'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['Fixed-scope review', '`rsp-review`'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['human-facing receipt prose', 'response language', 'Inspect', 'Verify'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['localize', 'primary result explanation', 'exact result', 'secondary'])).toBeDefined()
    expect(inlineCodeValues(markdownListItem(lanes, 'Diagnose'))).toEqual([
      'rsp-diagnose',
      'confirmed-same-scope',
      'unresolved-same-scope',
      'boundary-changed',
    ])
    expect(inlineCodeValues(markdownListItem(lanes, 'Inspect'))).toEqual(['confirmed-same-scope', 'unresolved-same-scope', 'boundary-changed'])
    expect(inlineCodeValues(markdownListItem(lanes, 'Fix'))).toEqual(['rsp-implement', 'changed-same-scope', 'no-change', 'boundary-changed', 'worker identity'])
    expect(inlineCodeValues(markdownListItem(lanes, 'Verify'))).toEqual(['rsp-verify', 'worker identity', 'independence: established | unavailable', 'rsp-review'])
    expect(body).not.toMatch(/token\s+(?:budget|limit)|(?:budget|limit)[^\n.]*token/i)
    expect(body).not.toMatch(/token[^\n.]*rout|rout[^\n.]*token/i)
    expect(existsSync(join(root, 'skills', 'rsp-inspect'))).toBe(false)
    expect(existsSync(join(root, 'skills', 'rsp-verify'))).toBe(true)
    expect(readFileSync(join(root, 'skills', 'rsp-verify', 'SKILL.md'), 'utf8')).toContain('Run one bounded, read-only verification pass')
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

  it('protects required Fix and Verify capacity without fixed lane allocations', () => {
    const { body } = readSkill(product)
    const capacity = body.match(/Before starting an optional Diagnose or Inspect dispatch,[^\n]+/)?.[0] ?? ''

    expect(body).toContain('may run alongside another read-only lane only when paths and verification resources are demonstrably isolated')
    expect(body).toContain('otherwise keep it sequential')
    expect(body).toContain('Separate Group child mutation boundaries may overlap only under the existing isolated workspace and verification rule')
    expect(body).toContain('Total worker dispatch remains at most four')
    expect(capacity).toContain('count one Fix when accepted mutation is still required')
    expect(capacity).toContain('count one Verify when the declared acceptance risk or a failed correction still requires worker verification')
    expect(capacity).toContain('remaining dispatch capacity covers that dispatch plus every known required obligation')
    expect(capacity).toContain('otherwise skip it and preserve the completion path')
    expect(body).toContain('dynamic capacity protection, not a fixed per-lane allocation')
    expect(body).toContain('at most one corrective retry')
    expect(body).toContain('new evidence makes another correction discriminating')
    expect(body).toContain('remaining dispatch capacity still covers the retry and every then-required Verify dispatch')
    expect(body).toContain('can still produce decisive acceptance evidence')
    expect(body).toContain('A failure without new evidence, or a retry that cannot still be decisively verified, stops dispatch')
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

    expect(canonicalEnum(lanes, 'AcceptanceDisposition')).toEqual(['incomplete', 'evidence-complete', 'review-clean'])
    expect(findSemanticUnit(lanes, ['required worker', 'not created', 'valid required receipt', '`unavailable`', '`boundary-changed`', '`incomplete`'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['Implementation verification', 'fixed-scope change review', 'durable writeback decision', 'separate gates'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['Accepted required receipts', 'fresh declared verification', '`evidence-complete`', 'implementation verification'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['clean fixed-scope change review', '`review-clean`'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['execution receipt', 'verification receipt', 'never derives', '`review-clean`'])).toBeDefined()
    expect(findSemanticUnit(lanes, ['durable writeback decision', 'cannot substitute', 'fixed-scope change review'])).toBeDefined()
    expect(findSemanticUnit(body, ['required worker obligation', '`StopDisposition: capability-unavailable`', '`incomplete`', 'stop'])).toBeDefined()
    expect(findSemanticUnit(body, ['Absence of a dispatch event or receipt', 'never success', 'controller claiming'])).toBeDefined()

    expect(canonicalEnum(boundaries, 'CloseoutEligibility')).toEqual(['not-eligible', 'lifecycle-ready', 'local-commit-ready'])
    expect(findSemanticUnit(boundaries, ['`completionGate: pass`', '`archiveReady: yes`', '`AcceptanceDisposition: review-clean`', 'fresh owner', 'authority', 'exact diff', 'decisive Required verification evidence', 'ready value'])).toBeDefined()
    expect(findSemanticUnit(boundaries, ['Any other acceptance state', '`CloseoutEligibility: not-eligible`'])).toBeDefined()
    expect(body.match(/A required worker that was not created, did not return a valid required receipt, returned `unavailable` or `boundary-changed`/g)).toHaveLength(1)
    expect(findSemanticUnit(boundaries, ['neither archive nor commit runs'])).toBeDefined()
  })

  it('fails semantic controller contracts when enums or qualification ownership are removed', () => {
    const { body } = readSkill(product)
    const lanes = markdownSection(body, 'Resolve the execution frontier')
    const entry = `${markdownSection(body, 'Selected-goal entry')}\n${markdownSection(body, 'Validate the selected handoff before mutation')}`
    const withoutReviewClean = lanes.replace(', or `review-clean`', '')
    const reassignedQualification = entry.replace(
      'Core and its managed-routing reference solely own initial Manage qualification',
      'Manage owns initial Manage qualification',
    )
    const reassignedFixOwner = lanes
      .replace('and is the sole product writer at its mutation boundary', 'at its mutation boundary')
      .replace('Verify delegates its read-only result and evidence contract to `rsp-verify`', 'Verify is the sole product writer and delegates its read-only result and evidence contract to `rsp-verify`')

    expect(canonicalEnum(withoutReviewClean, 'AcceptanceDisposition')).not.toEqual(['incomplete', 'evidence-complete', 'review-clean'])
    expect(findSemanticUnit(reassignedQualification, ['Core', 'solely own', 'initial Manage qualification'])).toBeUndefined()
    expect(findSemanticUnit(reassignedFixOwner, ['Fix', '`rsp-implement`', 'sole product writer'])).toBeUndefined()
  })

  it('revalidates selected-goal evidence and keeps all controller execution state transient', () => {
    const { body } = readSkill(product)

    expect(body).toContain('Inspect the actual diff and fresh verification before acceptance')
    expect(body).toContain('After every ordinary same-goal Fix, Verify, Review, or Resolve Findings receipt')
    expect(body).toContain('Do not return to Core merely to repeat route selection or qualification')
    expect(body).toContain('frontier classification, lane choice, envelopes, receipts, dispatch and retry counts, concurrency reasoning, and resume chronology response-only')
    expect(body).toContain('Converged requirements and design belong in the selected Change')
    expect(body).toContain('real dependencies in `Blockers`')
    expect(body).toContain('durable facts or rationale in the durable writeback decision')
    expect(body).toContain('Create no frontier file, ticket map, ledger, registry, ambient hook, or numeric routing score')
  })

  it('requires one implementation worker without forcing parallelism and reports the route', () => {
    const { body } = readSkill(product)

    expect(body).toContain('When the host supports workers and authorized implementation remains, dispatch at least one implementation worker')
    expect(body).toContain('sequential execution does not permit the controller to absorb the whole implementation')
    expect(body).toContain('The controller retains worker-result acceptance, integration verification, review convergence, lifecycle decisions, and commit eligibility and orchestration')
    expect(body).toContain('It does not absorb Commit\'s exact Git procedure')
    expect(body).toContain('real hosts, provider sessions, and hardware resources overlap')
    expect(body).toContain('unless an authorized isolated workspace and verification boundary exist')
    expect(body).toContain('Dispatch in parallel only for isolated mutation paths and verification resources')
    expect(body).toContain('delegation never implies concurrency')
    expect(body).toContain('concrete reason for sequential or parallel execution')
    expect(managedRouting).toContain('Make the route observable')
    expect(managedRouting).toContain('report `selected` with the decisive qualification signal')
    expect(managedRouting).toContain('`declined` with the complete direct-work exclusion')
    expect(managedRouting).toContain('reasoning remain transient and create no controller state')
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
    expect(coreSkill).toContain('Detailed Manage closeout, local Commit, Workspace, Land, conflict, and recovery rules remain in their owning Skills or conditional references')
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
    expect(body).toContain('`rsp status --json`, and the current worktree')
    expect(body).toContain('Send a compact envelope that identifies the WorkRef, objective, authority, decisive evidence, and stop boundary')
    expect(body).toContain('four worker dispatches and one worker corrective retry')
    expect(body).toContain('across the whole managed run')
    expect(body).toContain('Owner transitions do not reset either limit')
    expect(body).toContain('Choose the cheapest decisive check')
    expect(body).toContain('at most one integration gate')
    expect(body).toContain('Inspect diff and verification before accepting')
    expect(body).toContain('During recovery, reread authority and evidence')
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
    expect(body).toContain('dispatch child WorkRefs only in the current derived `plan.waves` wave')
    expect(body).toContain('rerun `rsp status --json`')
    expect(body).toContain('restrict it to declared children')
    expect(body).toContain('shared paths, lockfiles, generated artifacts, integration state, real hosts, provider sessions, and hardware resources overlap')
    expect(body).toContain('unless an authorized isolated workspace and verification boundary exist')
    expect(body).toContain('Keep blockers, later waves, overlaps, and dependent verification sequential')
    expect(body).toContain('Workers receive no implied focus')
  })

  it('continues a bounded goal across derived owners and stops at real boundaries', () => {
    const { body } = readSkill(product)

    expect(body).toContain('The goal defines authority')
    expect(body).toContain('automatic activation grants selection, not mutation')
    expect(body).toContain('Continue a clear in-scope ready successor while the goal')
    expect(body).toContain('Return to Core only when owner identity, topology, requested route, behavior, acceptance, public interface, scope, mutation authority, or external-action authority changes')
    expect(body).toContain('suspend mutation, return decisive evidence')
    expect(body).toContain('only Core may route authorized Shape')
    expect(body).toContain('never classify discovery or change topology')
    expect(body).toContain('Stop when discovery changes behavior')
    expect(body).toContain('Never persist the goal envelope, WorkSet, waves, or discovery classification')
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
    const manifestPath = join(root, 'test', 'managed-controller', 'holdout', 'commit-message-quality', 'case.yaml')
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
    const manifest = parseYaml(readFileSync(join(root, 'test', 'managed-controller', 'holdout', 'long-goal', 'case.yaml'), 'utf8')) as any
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

  it('replays retained product long-goal Git, lifecycle, and forbidden-action evidence', () => {
    const retained = join(root, 'research', 'evaluations', 'rsp-manage', '2026-07-25-product-long-goal')
    const metadata = JSON.parse(readFileSync(join(retained, 'metadata.json'), 'utf8')) as any
    const observations = JSON.parse(readFileSync(join(retained, 'observations.json'), 'utf8')) as any
    const final = readFileSync(join(retained, 'final.md'), 'utf8')
    const manifestPath = join(root, 'test', 'managed-controller', 'holdout', 'long-goal', 'case.yaml')
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
    const manifestPath = join(root, 'test', 'managed-controller', 'holdout', 'long-goal', 'case.yaml')
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
    const manifestPath = join(root, 'test', 'managed-controller', 'holdout', 'auto-lifecycle', 'case.yaml')
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

    expect(body).toContain('out of Changes, Group Briefs, Specs, Decision Records')
    expect(body).toContain('Changes retain converged requirements')
    expect(body).toContain('Briefs retain shared completion without copied child state')
    expect(closeout).toContain('give `rsp-commit` the WorkOwner, paths, evidence, lifecycle state, and authority')
    expect(closeout).toContain('routes exactly once to `rsp-commit`')
  })

  it('keeps process chronology transient and returns only outcome evidence', () => {
    const { body } = readSkill(product)

    expect(body).toContain('Keep dispatch chronology out of Changes, Group Briefs, Specs, Decision Records')
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
