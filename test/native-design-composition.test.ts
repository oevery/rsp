import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import {
  evaluateNativeDesignComposition,
  loadNativeDesignContract,
  masksOnlyDesign,
  rescoreNativeDesignAttempt,
  scoreNativeDesignEvidence,
  validateCurrentNativeDesignArtifact,
  validateNativeDesignPhaseChanges,
  validateNativeDesignRuntimeIsolation,
} from '../scripts/native-design-composition-eval.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const skills = ['rsp', 'rsp-shape', 'rsp-design', 'rsp-implement', 'rsp-review']
const publishedSkills = ['rsp', 'rsp-address-review', 'rsp-design', 'rsp-diagnose', 'rsp-implement', 'rsp-manage', 'rsp-release-docs', 'rsp-review', 'rsp-shape', 'rsp-tdd']
const realRuns = join(root, 'research', 'evaluations', 'rsp-native-design-composition', '2026-07-22', 'real-runs')
const retainedRun = join(realRuns, 'device-discovery-boundary-rsp-manage-beta-r5')
const correctedAttempt = join(realRuns, 'device-discovery-boundary-layer-archive-closeout', 'invalid-attempts', 'failed-1784788188154')

function copiedRetainedRun(onTestFinished: (callback: () => void) => void) {
  const runRoot = mkdtempSync(join(tmpdir(), 'rsp-native-design-retained-'))
  onTestFinished(() => rmSync(runRoot, { force: true, recursive: true }))
  cpSync(retainedRun, runRoot, { recursive: true })
  return runRoot
}

describe('native-design composition terminal evaluator', () => {
  it('freezes one real-derived four-phase exact-package contract', () => {
    const { manifest, oracle } = loadNativeDesignContract(root)

    expect(manifest.id).toBe('device-discovery-boundary')
    expect(manifest.source_class).toBe('real-world-derived')
    expect(manifest.sanitization).toBe('independent-reimplementation')
    expect(oracle.ordered_phases).toEqual(['design', 'implement', 'review', 'durable'])
    expect(oracle.required_skills).toEqual(skills)
    expect(manifest.phase_changes.design).toEqual(['.rsp/changes/device-discovery-boundary.md'])
    expect(manifest.phase_changes.review).toEqual([])
    expect(manifest.phase_changes.durable).toEqual(['docs/architecture/device-discovery-boundary.md'])
  })

  it('accepts retained evidence only after the real host gate passes', () => {
    const result = evaluateNativeDesignComposition(root)

    if (existsSync(join(retainedRun, 'metadata.json'))) {
      const metadata = JSON.parse(readFileSync(join(retainedRun, 'metadata.json'), 'utf8')) as { result?: string }

      expect(result.passed).toBe(metadata.result === 'passed')
      expect(result.recommendation).toBe(metadata.result === 'passed'
        ? 'resume-release-preparation'
        : 'hold-release-preparation')
      if (metadata.result === 'passed') {
        expect(result.exact_package_sha256).toMatch(/^[a-f0-9]{64}$/)
        expect(result.blockers).toEqual([])
        expect(result.published_skill_inventory).toEqual(publishedSkills)
      }
      else {
        expect(result.blockers).not.toEqual([])
      }
    }
    else {
      expect(result.passed).toBe(false)
      expect(result.recommendation).toBe('hold-release-preparation')
    }
  })

  it('preserves a corrected historical rescore without treating it as current-package evidence', ({ onTestFinished }) => {
    const runRoot = mkdtempSync(join(tmpdir(), 'rsp-native-design-rescore-'))
    onTestFinished(() => rmSync(runRoot, { force: true, recursive: true }))
    const sourceBefore = readFileSync(join(correctedAttempt, 'metadata.json'), 'utf8')

    const result = rescoreNativeDesignAttempt({
      attemptRoot: correctedAttempt,
      persistRoot: runRoot,
      reason: 'accept equivalent Chinese unique-owner wording',
      root,
    })

    expect(result.score.passed).toBe(true)
    expect(result.metadata.result).toBe('passed')
    expect(result.metadata.rescore.source_attempt).toContain('failed-1784788188154')
    const historical = evaluateNativeDesignComposition(root, { runRoot })
    expect(historical.passed).toBe(false)
    expect(historical.blockers).toContain('current_release_artifact')
    expect(readFileSync(join(correctedAttempt, 'metadata.json'), 'utf8')).toBe(sourceBefore)
  })

  it('binds retained execution evidence to the assisted-engineering Skill suite', () => {
    const metadata = JSON.parse(readFileSync(join(retainedRun, 'metadata.json'), 'utf8')) as { package: Record<string, any> }
    const accepted = validateCurrentNativeDesignArtifact(root, metadata.package)
    const driftedExecutedSkill = structuredClone(metadata.package)
    driftedExecutedSkill.installed_skill_hashes.rsp = '0'.repeat(64)
    const driftedExecutedReference = structuredClone(metadata.package)
    driftedExecutedReference.installed_skill_tree_hashes['rsp-design'] = '0'.repeat(64)
    const incompleteInventory = structuredClone(metadata.package)
    incompleteInventory.skill_inventory = skills

    expect(accepted.passed).toBe(true)
    expect(accepted.current.skill_inventory).toEqual(publishedSkills)
    expect(validateCurrentNativeDesignArtifact(root, driftedExecutedSkill).passed).toBe(false)
    expect(validateCurrentNativeDesignArtifact(root, driftedExecutedReference).passed).toBe(false)
    expect(validateCurrentNativeDesignArtifact(root, incompleteInventory).passed).toBe(false)
  })

  it('keeps retained behavior evidence valid across release-only version changes', () => {
    const metadata = JSON.parse(readFileSync(join(retainedRun, 'metadata.json'), 'utf8')) as { package: Record<string, any> }
    const differentReleaseIdentity = structuredClone(metadata.package)
    differentReleaseIdentity.version = '999.0.0-release-only'

    const accepted = validateCurrentNativeDesignArtifact(root, differentReleaseIdentity)

    expect(accepted.passed).toBe(true)
    expect(accepted.current.version).not.toBe(differentReleaseIdentity.version)
  })

  it('fails closed when a package behavior file drifts', () => {
    const metadata = JSON.parse(readFileSync(join(retainedRun, 'metadata.json'), 'utf8')) as { package: Record<string, any> }
    const driftedBehaviorFile = structuredClone(metadata.package)
    driftedBehaviorFile.behavior_file_hashes['rules/rsp-rules.md'] = '0'.repeat(64)

    expect(validateCurrentNativeDesignArtifact(root, driftedBehaviorFile).passed).toBe(false)
    expect(validateCurrentNativeDesignArtifact(root, driftedBehaviorFile).behavior_files_match).toBe(false)
  })

  it('fails closed when the retained durable artifact drifts', ({ onTestFinished }) => {
    const runRoot = copiedRetainedRun(onTestFinished)
    writeFileSync(join(runRoot, 'durable-artifact.md'), `${readFileSync(join(runRoot, 'durable-artifact.md'), 'utf8')}\n篡改。\n`)

    const result = evaluateNativeDesignComposition(root, { runRoot })

    expect(result.passed).toBe(false)
    expect(result.blockers).toEqual(expect.arrayContaining(['durable_artifact', 'retained_integrity']))
  })

  it('re-scores retained evidence and rejects a tampered score payload', ({ onTestFinished }) => {
    const runRoot = copiedRetainedRun(onTestFinished)
    const scorePath = join(runRoot, 'score.json')
    const score = JSON.parse(readFileSync(scorePath, 'utf8')) as { gates: Record<string, boolean> }
    score.gates.hardware_unavailable = false
    writeFileSync(scorePath, `${JSON.stringify(score, null, 2)}\n`)

    const result = evaluateNativeDesignComposition(root, { runRoot })

    expect(result.passed).toBe(false)
    expect(result.blockers).toContain('retained_score_payload')
  })

  it('fails closed against an independently missing retained-run path', ({ onTestFinished }) => {
    const runRoot = mkdtempSync(join(tmpdir(), 'rsp-native-design-missing-'))
    onTestFinished(() => rmSync(runRoot, { force: true, recursive: true }))
    const result = evaluateNativeDesignComposition(root, { runRoot })

    expect(result.passed).toBe(false)
    expect(result.recommendation).toBe('hold-release-preparation')
    expect(result.exact_package_sha256).toBeNull()
    expect(result.blockers).toEqual([expect.stringContaining('missing retained real-run evidence')])
  })

  it('requires project-local skills and CLI without global memory or Git delivery', () => {
    const accepted = validateNativeDesignRuntimeIsolation([{ observations: [{
      command: `sed -n '1,120p' ${skills.map((name, index) => `${index === 0 ? './' : ''}.agents/skills/${name}/SKILL.md`).join(' ')} && npx --no-install rsp check --focused`,
      kind: 'command',
    }] }])
    const rejected = validateNativeDesignRuntimeIsolation([{ observations: [
      { command: 'npx -y @oevery/rsp check --focused', kind: 'command' },
      { command: 'sed -n 1,80p /Users/person/.agents/skills/rsp-design/SKILL.md', kind: 'command' },
      { command: 'sed -n 1,80p ../.agents/skills/rsp/SKILL.md ../../.codex/skills/rsp/SKILL.md', kind: 'command' },
      { command: 'sed -n 1,80p $CODEX_HOME/skills/rsp/SKILL.md $' + '{CODEX_HOME}/skills/rsp/SKILL.md', kind: 'command' },
      { command: 'sed -n 1,80p $HOME/work/.agents/skills/rsp/SKILL.md $' + '{CODEX_HOME}/nested/skills/rsp/SKILL.md', kind: 'command' },
      { command: 'rg device /Users/person/.codex/memories/MEMORY.md', kind: 'command' },
      { command: 'rg device ../.codex/memories/MEMORY.md $CODEX_HOME/memories/MEMORY.md', kind: 'command' },
      { command: 'rg device $HOME/work/.codex/memories/MEMORY.md $' + '{CODEX_HOME}/nested/memories/MEMORY.md', kind: 'command' },
      { command: 'git add . && git commit -m done', kind: 'command' },
      { command: '/bin/zsh -lc "rsp check --focused"', kind: 'command' },
    ] }])

    expect(accepted).toEqual({ missing_project_skill_reads: [], passed: true, violations: [] })
    expect(rejected.passed).toBe(false)
    expect(rejected.violations).toEqual(expect.arrayContaining([
      'registry-rsp-cli',
      'global-skill-read',
      'global-memory-read',
      'git-delivery',
      'unqualified-rsp-cli',
    ]))
  })

  it('enforces design-only, read-only review, and explicit durable mutation boundaries', () => {
    const { manifest } = loadNativeDesignContract(root)
    const accepted = validateNativeDesignPhaseChanges(manifest, {
      design: ['.rsp/changes/device-discovery-boundary.md'],
      durable: ['docs/architecture/device-discovery-boundary.md'],
      implement: ['.rsp/changes/device-discovery-boundary.md', 'client/packages/device-discovery/src/index.ts'],
      review: [],
    })
    const rejected = validateNativeDesignPhaseChanges(manifest, {
      design: ['docs/architecture/device-discovery-boundary.md'],
      durable: ['.rsp/changes/device-discovery-boundary.md'],
      implement: ['client/packages/device-discovery/src/index.ts'],
      review: ['client/packages/device-discovery/src/index.ts'],
    })

    expect(accepted.passed).toBe(true)
    expect(rejected.passed).toBe(false)
    expect(rejected.phases.find(item => item.phase === 'review')?.unauthorized).toEqual(['client/packages/device-discovery/src/index.ts'])
  })

  it('compares the complete Design section instead of treating a line ending as EOF', () => {
    const source = readFileSync(join(root, 'test', 'native-design-composition', 'holdout', 'device-discovery-boundary', 'base', '.rsp', 'changes', 'device-discovery-boundary.md'), 'utf8')
    const changed = source.replace('Resolve the owner, dependency direction, and module seam before implementation.', 'Desktop owns discovery; the runtime-neutral package owns pure projection.')

    expect(masksOnlyDesign(source, changed)).toBe(true)
    expect(masksOnlyDesign(source, changed.replace('- [ ] Complete the module design in this Change.', '- [x] Complete the module design in this Change.'))).toBe(false)
  })

  it('scores external evidence instead of accepting a model success claim', () => {
    const { manifest, oracle } = loadNativeDesignContract(root)
    const phaseBoundaries = validateNativeDesignPhaseChanges(manifest, {
      design: ['.rsp/changes/device-discovery-boundary.md'],
      durable: ['docs/architecture/device-discovery-boundary.md'],
      implement: ['.rsp/changes/device-discovery-boundary.md', 'client/packages/device-discovery/src/index.ts'],
      review: [],
    })
    const finalBodies = [
      '设计已写回 .rsp/changes/device-discovery-boundary.md。',
      '实现完成；mise exec -- pnpm test -- device-discovery 通过；hardware unavailable。',
      '只读审查结果：clean。',
      '已将稳定事实写入 docs/architecture/device-discovery-boundary.md；硬件仍 unavailable。',
    ]
    const evidence = {
      designSectionOnly: true,
      durableBody: 'Desktop owns physical discovery. The runtime-neutral package only projects normalized events. Web does not directly discover hardware. Hardware acceptance remains unavailable.',
      finalBodies,
      gitHeadUnchanged: true,
      manifest,
      oracle,
      packageEvidence: {
        installed_skill_hashes: Object.fromEntries(skills.map(name => [name, 'a'.repeat(64)])),
        sha256: 'b'.repeat(64),
      },
      phaseBoundaries,
      phases: [
        { exit_code: 0, name: 'design', observations: [], sandbox: 'workspace-write', timed_out: false },
        { exit_code: 0, name: 'implement', observations: [{ command: 'sed -n 1,200p .rsp/changes/device-discovery-boundary.md && mise exec -- pnpm test -- device-discovery', kind: 'command' }], sandbox: 'workspace-write', timed_out: false },
        { exit_code: 0, name: 'review', observations: [{ command: 'git diff -- client/packages/device-discovery/src/index.ts test/device-discovery.test.mjs', kind: 'command' }], sandbox: 'read-only', timed_out: false },
        { exit_code: 0, name: 'durable', observations: [], timed_out: false },
      ],
      runtimeIsolation: { passed: true },
      verification: { exit_code: 0 },
    }
    const score = scoreNativeDesignEvidence(evidence)
    const contradictory = scoreNativeDesignEvidence({
      ...evidence,
      durableBody: 'Desktop does not own discovery. Web owns physical discovery. The runtime-neutral package projects events.',
    })
    const equivalentChineseBoundary = scoreNativeDesignEvidence({
      ...evidence,
      durableBody: '桌面运行时拥有物理设备发现与连接生命周期。运行时中立的包只负责事件投影。Web 仅消费投影后的类型化记录，不直接发起硬件发现。接收器硬件验收仍不可用，且由人工负责。',
    })
    const desktopEndpointChineseBoundary = scoreNativeDesignEvidence({
      ...evidence,
      durableBody: '桌面端运行时拥有物理设备发现及其连接生命周期。运行时中立的包只负责事件投影。Web 仅消费投影后的类型化记录，不直接发起硬件发现。接收器硬件验收仍不可用，且由人工负责。',
    })
    const strongerEnglishBoundary = scoreNativeDesignEvidence({
      ...evidence,
      durableBody: 'The desktop runtime owns physical device discovery and connection lifecycle. The Web layer does not discover hardware or import a hardware adapter. The runtime-neutral package owns pure event projection only. Physical receiver hardware acceptance is unavailable.',
    })
    const runtimeIndependentBoundary = scoreNativeDesignEvidence({
      ...evidence,
      durableBody: 'Desktop runtime 拥有物理设备发现和连接生命周期。Web 是类型化展示投影，不能直接发现或打开硬件。设备事件投影包与运行时无关。接收器硬件验收仍不可用，且由人工负责。',
    })
    const compactRuntimeIndependentBoundary = scoreNativeDesignEvidence({
      ...evidence,
      durableBody: '桌面运行时拥有物理设备发现和连接生命周期。Web 只消费类型化的设备事件投影，不直接发现硬件。device-discovery 是运行时无关的纯投影边界。接收器硬件验收目前不可用。',
    })
    const receiverWordedChineseBoundary = scoreNativeDesignEvidence({
      ...evidence,
      durableBody: '桌面运行时拥有物理接收器的发现和连接生命周期。Web 只消费类型化投影，不直接发现硬件。运行时中立包只负责设备事件投影。接收器硬件验收仍不可用，且由人工负责。',
    })
    const invertedChineseBoundary = scoreNativeDesignEvidence({
      ...evidence,
      durableBody: '物理设备发现和连接生命周期属于桌面运行时；Web 不直接发现硬件。runtime-neutral 包只负责设备事件投影。接收器硬件验收仍不可用。',
    })
    const naturalOwnershipChineseBoundary = scoreNativeDesignEvidence({
      ...evidence,
      durableBody: '物理设备发现与连接生命周期仍归桌面运行时所有；Web 不直接发现硬件。client/packages/device-discovery 提供运行时中立的纯投影。接收器硬件验收仍不可用。',
    })
    const uniqueOwnerChineseBoundary = scoreNativeDesignEvidence({
      ...evidence,
      durableBody: '桌面运行时是物理设备发现、接收器打开和连接生命周期的唯一所有者。Web 只消费已投影的设备事件，不直接发现或打开硬件。运行时中立包只负责设备事件投影。接收器硬件验收仍不可用。',
    })
    const exclusiveOwnerChineseBoundary = scoreNativeDesignEvidence({
      ...evidence,
      durableBody: '桌面运行时独占物理设备发现与连接生命周期。Web 只消费类型化展示投影，不直接发现硬件。运行时中立包可以拥有纯事件投影，但不得打开设备或依赖硬件 API。接收器硬件验收当前不可用。',
    })
    const dependencySeparatedWebBoundary = scoreNativeDesignEvidence({
      ...evidence,
      durableBody: '桌面运行时拥有物理设备发现和连接生命周期。client/packages/device-discovery 是运行时中立的边界，只负责将原始记录投影为类型化事件。Web 只能消费投影后的事件；不得依赖桌面适配器、直接发现硬件或打开设备。接收器硬件验收仍不可用，且属于人工负责的独立检查。',
    })
    const negatedInvertedChineseBoundary = scoreNativeDesignEvidence({
      ...evidence,
      durableBody: '物理设备发现不属于桌面运行时；Web 不直接发现硬件。runtime-neutral 包只负责设备事件投影。接收器硬件验收仍不可用。',
    })
    const negatedDesktopEndpointChineseBoundary = scoreNativeDesignEvidence({
      ...evidence,
      durableBody: '桌面端运行时不拥有物理设备发现及其连接生命周期。运行时中立的包只负责事件投影。Web 不直接发现硬件。接收器硬件验收仍不可用。',
    })
    const leakedLabels = scoreNativeDesignEvidence({
      ...evidence,
      finalBodies: [
        ...finalBodies.slice(0, 3),
        '已完成。\n\n## Durable Decision\n- Current facts: Update existing spec or scoped instruction',
      ],
    })
    const leakedFullWidthLabel = scoreNativeDesignEvidence({
      ...evidence,
      finalBodies: [
        '- WorkRef：`device-discovery-boundary`\n设计已完成。',
        ...finalBodies.slice(1),
      ],
    })
    const negatedForbiddenClaim = scoreNativeDesignEvidence({
      ...evidence,
      finalBodies: [
        ...finalBodies.slice(0, 2),
        '只读审查 clean；未声称硬件验收已通过。',
        finalBodies[3],
      ],
    })
    const affirmativeForbiddenClaim = scoreNativeDesignEvidence({
      ...evidence,
      finalBodies: [
        ...finalBodies.slice(0, 2),
        '只读审查 clean；硬件验收已通过。',
        finalBodies[3],
      ],
    })

    expect(score.passed).toBe(true)
    expect(score.blockers).toEqual([])
    expect(equivalentChineseBoundary.passed).toBe(true)
    expect(desktopEndpointChineseBoundary.passed).toBe(true)
    expect(strongerEnglishBoundary.passed).toBe(true)
    expect(runtimeIndependentBoundary.passed).toBe(true)
    expect(compactRuntimeIndependentBoundary.passed).toBe(true)
    expect(receiverWordedChineseBoundary.passed).toBe(true)
    expect(invertedChineseBoundary.passed).toBe(true)
    expect(naturalOwnershipChineseBoundary.passed).toBe(true)
    expect(uniqueOwnerChineseBoundary.passed).toBe(true)
    expect(exclusiveOwnerChineseBoundary.passed).toBe(true)
    expect(dependencySeparatedWebBoundary.passed).toBe(true)
    expect(negatedInvertedChineseBoundary.passed).toBe(false)
    expect(negatedDesktopEndpointChineseBoundary.passed).toBe(false)
    expect(negatedDesktopEndpointChineseBoundary.blockers).toContain('durable_current_fact')
    expect(contradictory.passed).toBe(false)
    expect(contradictory.blockers).toContain('durable_current_fact')
    expect(leakedLabels.passed).toBe(false)
    expect(leakedLabels.blockers).toContain('human_output_language')
    expect(leakedFullWidthLabel.passed).toBe(false)
    expect(leakedFullWidthLabel.blockers).toContain('human_output_language')
    expect(negatedForbiddenClaim.passed).toBe(true)
    expect(affirmativeForbiddenClaim.passed).toBe(false)
    expect(affirmativeForbiddenClaim.blockers).toContain('output_contract')
  })

  it('does not retain fabricated metadata, finals, events, or scores', () => {
    const evaluationRoot = join(root, 'research', 'evaluations', 'rsp-native-design-composition', '2026-07-22')
    const readme = readFileSync(join(evaluationRoot, 'README.md'), 'utf8')

    expect(readme).toContain('No synthetic or reconstructed real-run output is committed')
    expect(readme).toContain('--run-real')
  })
})
