import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { evaluateManagedController, hashManagedControllerComposition, loadManagedControllerCases, observeManagedControllerGit, prepareManagedControllerRun, readManagedControllerFlag, scoreManagedControllerObservation, scoreManagedControllerOutput, summarizeManagedControllerEvents } from '../scripts/managed-controller-eval.mjs'

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
  it('is compact, portable, policy-selectable, and distinct from retained research', () => {
    const { body, frontmatter } = readSkill(product)

    expect(frontmatter).toMatchObject({
      name: 'rsp-manage',
      license: 'MIT',
      metadata: { author: 'oevery', version: expect.stringMatching(/^\d{4}\.\d{2}\.\d{2}(?:\.\d+)?$/) },
    })
    expect(body.trim().split(/\s+/).length).toBeLessThanOrEqual(800)
    expect(lstatSync(join(product, 'SKILL.md')).isSymbolicLink()).toBe(false)
    expect(body).toContain('explicit managed request or effective `manage.activation: auto` policy')
    expect(body).toContain('automatic activation grants selection only')
    expect(body).toContain('one selected ready Change or shallow Change Group')
    expect(body).toContain('Keep RSP artifacts as durable truth and process data transient')
    expect(readFileSync(join(candidate, 'SKILL.md'), 'utf8')).not.toBe(readFileSync(join(product, 'SKILL.md'), 'utf8'))
  })

  it('declines ordinary work without controller overhead', () => {
    const { body } = readSkill(product)

    expect(body).toContain('Small, coupled, or worker-only work is ineligible')
    expect(body).toContain('Decline without mutation/controller artifact')
    expect(body).toContain('return Core/Discipline action')
  })

  it('applies bounded closeout presets without inferring remote authority', () => {
    const { body } = readSkill(product)

    expect(body).toContain('`manual` grants neither automatic archive nor commit')
    expect(body).toContain('`lifecycle` grants lifecycle closeout after Core durable review but no Git action')
    expect(body).toContain('`local` grants lifecycle closeout plus the existing exact-path local checkpoint or terminal-commit eligibility')
    expect(body).toContain('Missing configuration preserves `explicit` activation with `local` closeout compatibility')
    expect(body).toContain('invalid configuration fails closed as `explicit` plus `manual`')
    expect(body).toContain('Push is opt-in only when user explicitly mentions push')
    expect(body).toContain('Never force-push')
  })

  it('bounds authority reads, dispatch, correction, and verification', () => {
    const { body } = readSkill(product)

    expect(body).toContain('read each qualified WorkRef—including successors')
    expect(body).toContain('complete Change or Brief/children')
    expect(body).toContain('Specs/Decisions')
    expect(body).toContain('`rsp status --json`, and worktree')
    expect(body).toContain('Send a compact envelope')
    expect(body).toContain('four worker dispatches and one worker corrective retry')
    expect(body).toContain('across the whole managed run; owner transitions do not reset them')
    expect(body).toContain('Choose the cheapest decisive check')
    expect(body).toContain('one integration gate at most')
    expect(body).toContain('Inspect diff and verification before accepting')
    expect(body).toContain('During recovery, reread authority and evidence')
  })

  it('converges managed review separately without redundant user continuation', () => {
    const { body } = readSkill(product)

    expect(body).toContain('## Converge managed review')
    expect(body).toContain('without asking the user to continue')
    expect(body).toContain('Address Review never self-loops')
    expect(body).toContain('at most three Address Review passes per Change')
    expect(body).toContain('separate from worker retry')
    expect(body).toContain('same Finding remains after two completed corrections')
    expect(body).toContain('`correction-needed`, not an external blocker')
    expect(body).toContain('additional real-host/provider/network run outside existing verification authority')
    expect(body).toContain('failed/unavailable decisive verification')
    expect(body).toContain('Keep counts and correction chronology transient')
  })

  it('preserves child owners and follows derived Group waves', () => {
    const { body } = readSkill(product)

    expect(body).toContain('each qualified WorkRef—including successors')
    expect(body).toContain('Group needs two ready children')
    expect(body).toContain('dispatch child WorkRefs only in the derived `plan.waves` wave')
    expect(body).toContain('rerun `rsp status --json`')
    expect(body).toContain('restrict it to declared children')
    expect(body).toContain('shared paths, lockfiles, generated artifacts, and integration outputs overlap')
    expect(body).toContain('unless an authorized isolated workspace exists')
    expect(body).toContain('Keep blockers, later waves, overlaps, and dependent verification sequential')
    expect(body).toContain('Workers receive no implied focus')
  })

  it('continues a bounded goal across derived owners and stops at real boundaries', () => {
    const { body } = readSkill(product)

    expect(body).toContain('requested goal defines the authority envelope')
    expect(body).toContain('automatic activation grants selection only, not mutation authority')
    expect(body).toContain('At owner boundaries, Core re-derives from goal')
    expect(body).toContain('Continue a clear in-scope ready successor')
    expect(body).toContain('Stop only when neither a ready successor nor clearly missing ownership remains')
    expect(body).toContain('suspend dispatch and return evidence to Core')
    expect(body).toContain('Core routes Shape and requalifies')
    expect(body).toContain('Manage neither classifies discovery nor changes topology')
    expect(body).toContain('without another authorization round')
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

  it('replays retained rsp-commit message quality and remote-safety evidence against the current composition', () => {
    const retained = join(root, 'research', 'evaluations', 'rsp-commit', '2026-07-27-product-commit-message-quality')
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
    expect(composition).toEqual({ hash: metadata.composition.hash, skills: metadata.composition.skills })
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

    expect(prepared.manifest.installed_skills).toEqual(['rsp', 'rsp-manage', 'rsp-address-review', 'rsp-review', 'rsp-implement'])
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
    const prepared = prepareManagedControllerRun({ caseId: 'auto-lifecycle', outputRoot, root, variant: 'product' })
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
    expect(status.manage).toEqual({ activation: 'auto', closeout: 'lifecycle' })
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
      path: join(root, 'skills', name),
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
    expect(body).toContain('commit one reviewable Change or integration-coupled wave')
    expect(body).toContain('stage exact owned paths')
    expect(body).toContain('inspect cached boundary')
  })

  it('keeps process chronology transient and returns only outcome evidence', () => {
    const { body } = readSkill(product)

    expect(body).toContain('Keep dispatch chronology out of Changes, Group Briefs, Specs, Decision Records')
    expect(body).toContain('Return WorkRefs, verification, omissions, boundary owner, and next action')
    expect(body).toContain('Do not expose retry chronology')
    expect(body).toContain('Archive grants no Git or publication authority')
  })

  it('closes an allowed lifecycle even when commit is denied', () => {
    const { body } = readSkill(product)

    expect(body).toContain('`lifecycle` grants lifecycle closeout after Core durable review but no Git action')
    expect(body).toContain('When granted, close lifecycle before any commit')
    expect(body).toContain('after Core durable review run `rsp archive <change-work-ref>`')
    expect(body).toContain('inspect the complete lifecycle diff')
    expect(body).toContain('Decide commit separately')
    expect(body).toContain('narrowed by nearer restrictions and host enforcement')
  })

  it('closes a terminal final owner while keeping small work uncommitted', () => {
    const { body } = readSkill(product)

    expect(body).toContain('This includes terminal owners')
    expect(body).toContain('Terminal small owners default to no commit')
    expect(body).toContain('Without clean exact boundary, return without staging')
  })

  it('closes a terminal shallow Group through child and brief commands before commit', () => {
    const { body } = readSkill(product)
    const archiveChild = body.indexOf('durable-review/archive each child independently')
    const rederive = body.indexOf('rederive completion')
    const closeGroup = body.indexOf('run `rsp group close <group>`')
    const commitDecision = body.indexOf('Decide commit separately')

    expect(body).toContain('For shallow Group')
    expect(archiveChild).toBeGreaterThanOrEqual(0)
    expect(rederive).toBeGreaterThan(archiveChild)
    expect(body).toContain('all children plus Group gate pass')
    expect(closeGroup).toBeGreaterThan(rederive)
    expect(body).toContain('inspect the complete lifecycle diff after each mutation')
    expect(commitDecision).toBeGreaterThan(closeGroup)
  })

  it('commits terminal non-small work only with separate justification', () => {
    const { body } = readSkill(product)

    expect(body).toContain('A terminal non-small owner commits only for explicit delivery or evidenced recovery value when nearer rules allow')
    expect(body).toContain('Under `local` or explicit commit authority, downstream work may justify one recovery checkpoint')
    expect(body).toContain('then derive status')
    expect(body).toContain('Return to Core before a separate release operation and dedicated release commit')
  })

  it('keeps push explicit, milestone-bound, non-force, and failure-safe', () => {
    const { body } = readSkill(product)

    expect(body).toContain('Push is opt-in only when user explicitly mentions push')
    expect(body).toContain('remote, branch, and Group or goal milestone are unambiguous or accepted')
    expect(body).toContain('required remote CI, recovery, or collaboration')
    expect(body).toContain('Never force-push')
    expect(body).toContain('infer push from commit authority')
    expect(body).toContain('protected or ambiguous branch')
    expect(body).toContain('Failure preserves local commits and stops at remote boundary')
  })
})
