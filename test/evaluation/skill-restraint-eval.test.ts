import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import {
  bindSkillRestraintAdjudication,
  listSkillRestraintCases,
  prepareSkillRestraintCase,
  scoreSkillRestraintCase,
} from '../../scripts/skill-restraint-eval.mjs'

const root = fileURLToPath(new URL('../..', import.meta.url))
const temporaryRoots: string[] = []

afterEach(() => {
  for (const path of temporaryRoots.splice(0))
    rmSync(path, { force: true, recursive: true })
})

function prepare(caseId: string, variant: string) {
  const outputRoot = join(tmpdir(), `rsp-restraint-test-${caseId}-${variant}-${Date.now()}`)
  temporaryRoots.push(outputRoot)
  return prepareSkillRestraintCase({ caseId, outputRoot, root, variant })
}

function acceptedVerdict(prepared: ReturnType<typeof prepareSkillRestraintCase>) {
  return prepared.case.acceptance.adjudication
}

function score(prepared: ReturnType<typeof prepareSkillRestraintCase>, finalOutput: string) {
  const adjudication = bindSkillRestraintAdjudication({
    caseId: prepared.case_id,
    contractSha256: prepared.contract_sha256,
    finalOutput,
    variant: prepared.variant,
    verdict: acceptedVerdict(prepared),
  })
  return scoreSkillRestraintCase({ adjudication, finalOutput, prepared })
}

describe('real-project-derived Skill restraint evaluation', () => {
  it('retains the fixed independently reimplemented boats-cloud restraint taxonomy', () => {
    const cases = listSkillRestraintCases(root)

    expect(cases.map(item => item.id)).toEqual([
      'deep-interface-test-pruning',
      'imagined-state-fallback',
      'independent-desktop-consequences',
      'page-private-wrapper',
      'shared-channel-forwarding-tests',
      'source-string-architecture-test',
    ])
    expect(cases.every(item => item.source.class === 'real-world-derived')).toBe(true)
    expect(cases.every(item => item.source.project === 'boats-cloud')).toBe(true)
    expect(cases.every(item => item.source.sanitization === 'independent-reimplementation')).toBe(true)
    expect(cases.map(item => item.source.pattern).sort()).toEqual([
      'duplicate-forwarding',
      'imagined-state',
      'independent-consequences',
      'shared-constant-forwarding',
      'source-string',
      'speculative-wrapper',
    ])
  })

  it('rejects a speculative page wrapper and wrapper-only test while accepting the page-owned edit', () => {
    const overbuilt = score(prepare('page-private-wrapper', 'overbuilt'), 'Implemented the requested page action.')
    const restrained = score(prepare('page-private-wrapper', 'restrained'), 'Implemented the requested page action.')

    expect(overbuilt.result).toBe('failed')
    expect(overbuilt.observation.dimensions.compliance.status).toBe('failed')
    expect(overbuilt.observation.dimensions.boundary.status).toBe('failed')
    expect(overbuilt.observation.dimensions.task_result.status).toBe('passed')
    expect(overbuilt.workspace.issues).toEqual(expect.arrayContaining([
      'forbidden path present: src/use-dialog-state.mjs',
      'forbidden path present: test/use-dialog-state.test.mjs',
    ]))
    expect(restrained.result).toBe('passed')
    expect(restrained.workspace.actual_changed_paths).toEqual(['src/page.mjs'])
  })

  it('requires redundant forwarding code and its shallow test to be deleted after interface deepening', () => {
    const overbuilt = score(prepare('deep-interface-test-pruning', 'overbuilt'), 'The public behavior remains green.')
    const restrained = score(prepare('deep-interface-test-pruning', 'restrained'), 'The public behavior remains green.')

    expect(overbuilt.result).toBe('failed')
    expect(overbuilt.workspace.issues).toEqual(expect.arrayContaining([
      'forbidden path present: src/forward.mjs',
      'forbidden path present: test/forward.test.mjs',
    ]))
    expect(restrained.result).toBe('passed')
    expect(restrained.workspace.actual_changed_paths).toEqual([
      'src/forward.mjs',
      'src/public-module.mjs',
      'test/forward.test.mjs',
    ])
  })

  it('preserves independent consequences and scores equivalent English and Chinese reports identically', () => {
    const prepared = prepare('independent-desktop-consequences', 'restrained')
    const english = score(prepared, 'Code: clean. The tests should not be merged or deleted because they protect separate consequences.')
    const chinese = score(prepared, '代码: clean。两个测试保护独立后果，不应合并或删除。')
    const overpruned = score(prepare('independent-desktop-consequences', 'overpruned'), '代码: clean。不应合并或删除。')

    expect(english.result).toBe('passed')
    expect(chinese.result).toBe('passed')
    expect(chinese.observation.dimensions).toEqual(english.observation.dimensions)
    expect(overpruned.result).toBe('failed')
    expect(overpruned.observation.dimensions.task_result.status).toBe('passed')
    expect(overpruned.workspace.issues).toContain(
      'required content missing in test/window.test.mjs: forwards-native-resize',
    )
  })

  it('rejects tests that restate a shared channel and each forwarding hop', () => {
    const overbuilt = score(prepare('shared-channel-forwarding-tests', 'overbuilt'), 'Added the sidebar close behavior.')
    const restrained = score(prepare('shared-channel-forwarding-tests', 'restrained'), 'Added the sidebar close behavior.')

    expect(overbuilt.result).toBe('failed')
    expect(overbuilt.workspace.issues).toEqual(expect.arrayContaining([
      'forbidden path present: test/channels.test.mjs',
      'forbidden path present: test/main-forwarding.test.mjs',
      'forbidden path present: test/preload-forwarding.test.mjs',
    ]))
    expect(restrained.result).toBe('passed')
    expect(restrained.workspace.actual_changed_paths).toEqual(['src/sidebar.mjs', 'test.mjs'])
  })

  it('rejects a source-string architecture assertion when behavior owns the removal', () => {
    const overbuilt = score(prepare('source-string-architecture-test', 'overbuilt'), 'Removed the legacy adapter.')
    const restrained = score(prepare('source-string-architecture-test', 'restrained'), 'Removed the legacy adapter.')

    expect(overbuilt.result).toBe('failed')
    expect(overbuilt.workspace.issues).toContain('forbidden path present: test/no-legacy-import.test.mjs')
    expect(overbuilt.observation.dimensions.task_result.status).toBe('passed')
    expect(restrained.result).toBe('passed')
  })

  it('rejects a fallback and test for a state the production producer cannot emit', () => {
    const overbuilt = score(prepare('imagined-state-fallback', 'overbuilt'), 'Added the saved timestamp.')
    const restrained = score(prepare('imagined-state-fallback', 'restrained'), 'Added the saved timestamp.')

    expect(overbuilt.result).toBe('failed')
    expect(overbuilt.workspace.issues).toEqual(expect.arrayContaining([
      'forbidden path present: test/missing-status.test.mjs',
      'forbidden content present in src/save.mjs: status == null',
    ]))
    expect(overbuilt.observation.dimensions.task_result.status).toBe('passed')
    expect(restrained.result).toBe('passed')
  })

  it('fails closed when adjudication is rebound to different localized output', () => {
    const prepared = prepare('independent-desktop-consequences', 'restrained')
    const adjudication = bindSkillRestraintAdjudication({
      caseId: prepared.case_id,
      contractSha256: prepared.contract_sha256,
      finalOutput: 'Code: clean.',
      variant: prepared.variant,
      verdict: acceptedVerdict(prepared),
    })

    expect(() => scoreSkillRestraintCase({
      adjudication,
      finalOutput: '代码: clean。',
      prepared,
    })).toThrow('output hash does not match')
  })

  it('rejects fixture removal paths that escape the isolated workspace', () => {
    const unsafeRoot = join(tmpdir(), `rsp-restraint-unsafe-${Date.now()}`)
    temporaryRoots.push(unsafeRoot)
    const fixture = join(unsafeRoot, 'evaluation', 'skill-restraint-eval', 'fixtures', 'unsafe-case')
    mkdirSync(join(fixture, 'base'), { recursive: true })
    writeFileSync(join(fixture, 'case.yaml'), `id: unsafe-case
source:
  class: real-world-derived
  project: boats-cloud
  sanitization: independent-reimplementation
  pattern: speculative-wrapper
request: Reject an escaping fixture path.
command: [node, test.mjs]
acceptance:
  changed_paths: []
  required_paths: []
  forbidden_paths: []
  content: []
  adjudication:
    decision: stop
    independent_consequences: not-applicable
    restraint: passed
    trigger: passed
variants:
  unsafe: { remove: [../outside] }
  safe: { remove: [] }
`)

    expect(() => prepareSkillRestraintCase({
      caseId: 'unsafe-case',
      root: unsafeRoot,
      variant: 'unsafe',
    })).toThrow('unsafe unsafe-case/unsafe remove')
  })
})
