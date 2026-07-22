import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import {
  evaluateNativeDesignComposition,
  loadNativeDesignContract,
  masksOnlyDesign,
  scoreNativeDesignEvidence,
  validateCurrentNativeDesignArtifact,
  validateNativeDesignPhaseChanges,
  validateNativeDesignRuntimeIsolation,
} from '../scripts/native-design-composition-eval.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const skills = ['rsp', 'rsp-shape', 'rsp-design', 'rsp-implement', 'rsp-review']
const publishedSkills = ['rsp', 'rsp-address-review', 'rsp-design', 'rsp-diagnose', 'rsp-implement', 'rsp-review', 'rsp-shape', 'rsp-tdd']
const retainedRun = join(root, 'research', 'evaluations', 'rsp-native-design-composition', '2026-07-22', 'real-runs', 'device-discovery-boundary')

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

  it('binds retained execution evidence to all current published Skills', () => {
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
      command: `sed -n '1,120p' ${skills.map(name => `.agents/skills/${name}/SKILL.md`).join(' ')} && npx --no-install rsp check --focused`,
      kind: 'command',
    }] }])
    const rejected = validateNativeDesignRuntimeIsolation([{ observations: [
      { command: 'npx -y @oevery/rsp check --focused', kind: 'command' },
      { command: 'sed -n 1,80p /Users/person/.agents/skills/rsp-design/SKILL.md', kind: 'command' },
      { command: 'rg device /Users/person/.codex/memories/MEMORY.md', kind: 'command' },
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

    expect(score.passed).toBe(true)
    expect(score.blockers).toEqual([])
    expect(contradictory.passed).toBe(false)
    expect(contradictory.blockers).toContain('durable_current_fact')
  })

  it('does not retain fabricated metadata, finals, events, or scores', () => {
    const evaluationRoot = join(root, 'research', 'evaluations', 'rsp-native-design-composition', '2026-07-22')
    const readme = readFileSync(join(evaluationRoot, 'README.md'), 'utf8')

    expect(readme).toContain('No synthetic or reconstructed real-run output is committed')
    expect(readme).toContain('--run-real')
  })
})
