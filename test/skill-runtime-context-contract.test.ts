import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { findSemanticUnit, markdownHeadings, markdownLinks, markdownSection } from './helpers/markdown-contract'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string) => readFileSync(join(root, path), 'utf8')
const core = read('skills/rsp/SKILL.md')
const implement = read('skills/rsp-implement/SKILL.md')
const manage = read('skills/rsp-manage/SKILL.md')
const manageInterruption = read('skills/rsp-manage/references/interruption-recovery.md')
const manageReview = read('skills/rsp-manage/references/review-convergence.md')
const manageCloseout = read('skills/rsp-manage/references/closeout.md')
const managed = read('skills/rsp/references/managed-routing.md')
const release = read('skills/rsp/references/release-operations.md')
const reopen = read('skills/rsp/references/reopen-recovery.md')
const shape = read('skills/rsp-shape/SKILL.md')
const skillSystem = read('.rsp/specs/skill-system.md')
const evaluation = join(root, 'research/evaluations/rsp-skill-runtime-context/2026-07-29-three-stage-behavior')
const verifiedEvaluation = join(root, 'research/evaluations/rsp-skill-runtime-context/2026-07-29-three-stage-behavior-user-config-adjudicated')
const hash = (body: string | Uint8Array) => createHash('sha256').update(body).digest('hex')

describe('skill runtime context composition', () => {
  it('keeps inactive release and reopen procedures behind direct Core references', () => {
    expect(markdownLinks(core)).toEqual(expect.arrayContaining([
      'references/release-operations.md',
      'references/reopen-recovery.md',
    ]))
    expect(core).not.toContain('### Release operations')
    expect(core).not.toContain('`rsp reopen <work-ref> --reason <text>` retains the selected archive')

    expect(findSemanticUnit(release, ['Load this reference only', 'release'])).toBeDefined()
    expect(findSemanticUnit(release, ['Release identity', 'owner decision'])).toBeDefined()
    expect(findSemanticUnit(release, ['unconfirmed', 'unclean exact candidate', 'stops before versioned mutation'])).toBeDefined()
    expect(findSemanticUnit(release, ['credential-free', '`ready`', '`not ready`', 'handoff'])).toBeDefined()
    expect(findSemanticUnit(reopen, ['Load this reference only', 'archived', 'acceptance'])).toBeDefined()
    expect(findSemanticUnit(reopen, ['`rsp reopen <work-ref> --reason <text>`'])).toBeDefined()
    expect(findSemanticUnit(reopen, ['`rsp group reopen <group> --reason <text>`', 'first'])).toBeDefined()
    expect(findSemanticUnit(reopen, ['grants no Git', 'release', 'publication', 'deployment', 'approval authority'])).toBeDefined()
  })

  it('keeps routing preselection separate from selected Manage execution detail', () => {
    expect(findSemanticUnit(core, ['Manage', 'solely owns', 'same-goal revalidation', 'review convergence', 'lifecycle closeout'])).toBeDefined()
    expect(findSemanticUnit(core, ['`rsp-commit`', 'exact Git execution'])).toBeDefined()
    expect(core).not.toContain('An explicit pause must stop and confirm active workers before acknowledgement')
    expect(markdownHeadings(managed, [2])).toEqual([
      'OWNER PREFLIGHT — Core resolves the owner without execution',
      'QUALIFY — select or decline Manage',
      'HANDOFF AND RETURN — bound selected execution',
      'Dormant closeout fail-safe',
    ])
    expect(markdownHeadings(managed)).not.toEqual(expect.arrayContaining(['Interrupt and resume', 'CONVERGE', 'CLOSE']))
    expect(managed).not.toContain('Allow at most three Resolve Findings passes per Change')
    expect(managed).not.toContain('When lifecycle closeout is granted')
    expect(findSemanticUnit(manage, ['this Skill', 'solely owns', 'same-goal revalidation', 'review convergence', 'lifecycle closeout'])).toBeDefined()
    expect(findSemanticUnit(manage, ['staging', 'message construction', 'local commit execution', '`rsp-commit`'])).toBeDefined()
    expect(markdownLinks(manage)).toEqual(expect.arrayContaining([
      'references/interruption-recovery.md',
      'references/review-convergence.md',
      'references/closeout.md',
    ]))
    expect(markdownHeadings(manage, [2])).not.toEqual(expect.arrayContaining(['Handle interruption', 'Converge managed review']))
    expect(findSemanticUnit(manageInterruption, ['progress or status inquiry', 'explicit pause', 'resume'])).toBeDefined()
    expect(findSemanticUnit(manageReview, ['fixed-scope re-review', 'Resolve Findings'])).toBeDefined()
    expect(findSemanticUnit(manageReview, ['three Resolve Findings passes', 'worker retry limit'])).toBeDefined()
    expect(findSemanticUnit(manageCloseout, ['`manage.closeout`', 'automatic grant ceiling'])).toBeDefined()
    expect(findSemanticUnit(manageCloseout, ['`rsp-commit`', 'exactly once', 'does not stage or commit'])).toBeDefined()
    expect(findSemanticUnit(markdownSection(manage, 'Preserve boundaries'), [/Core-selected and qualified handoff/i, '`manage.closeout`', 'dormant'])).toBeDefined()
    expect(findSemanticUnit(manageCloseout, [/valid selected handoff/i, '`manage.closeout`', 'grant ceiling'])).toBeDefined()
    expect(findSemanticUnit(manage, ['no pre-owner Intake'])).toBeDefined()
    expect(findSemanticUnit(manage, ['goal', 'WorkRef', 'authority envelope', 'qualification evidence', 'closeout ceiling', 'return boundaries'])).toBeDefined()
    expect(findSemanticUnit(manage, ['Do not return to Core', 'repeat route selection or qualification'])).toBeDefined()
  })

  it('uses only local numbered arrows for the closed implementation route', () => {
    expect(implement).toContain('Apply these routes in order before mutation and after failure')
    expect(implement).toMatch(/1\. Unexplained failure → return `rsp-diagnose`/u)
    expect(implement).toMatch(/2\. No unexplained failure,[\s\S]+ → return `rsp-tdd`/u)
    expect(implement).toMatch(/3\. Otherwise,[^\n]+ → continue ordinary implementation/u)
    expect(implement).toContain('Diagnosis precedes TDD')
    expect(implement).toContain('Do not invoke another Skill from inside this Skill')
    expect(implement).not.toMatch(/(?:glossary|notation vocabulary|private DSL)/iu)
  })

  it('records single ownership, standalone invocation, and measured-notation boundaries', () => {
    expect(skillSystem).toContain('Each branch has one detailed procedure owner')
    expect(skillSystem).toContain('Skill classification has three orthogonal axes')
    expect(skillSystem).toContain('Every Discipline remains independently invocable within its invocation contract')
    expect(skillSystem).toContain('only a Core-qualified Manage controller may compose bounded worker lanes')
    expect(skillSystem).toContain('A `specialist` route ends at one explicitly bounded Discipline result')
    expect(skillSystem).toContain('A `direct` route is one non-managed completion orchestration and may name exactly one Discipline executor')
    expect(skillSystem).toContain('only a Core-qualified Manage controller may compose bounded worker lanes and review convergence')
    expect(skillSystem).toContain('never requires recursively loading another Discipline Skill body or a runtime glossary')
    expect(skillSystem).toContain('measurably reduce its loaded-path token cost')
    expect(skillSystem).toContain('private notation')
  })

  it('records the WorkRef boundary once and leaves detailed inference to Shape', () => {
    expect(skillSystem).toContain('WorkRefs are stable identities independent from prose-language and locale policy')
    expect(skillSystem).toContain('later guidance never renames an existing identity')
    expect(skillSystem).toContain('Shape owns the naming policy whenever a new WorkRef must be inferred')
    expect(skillSystem).not.toContain('WorkRef authoring preserves explicit valid user input')

    expect(shape).toContain('preserve an explicit valid user-supplied identity')
    expect(shape).toContain('explicit nearest project or domain WorkRef naming convention')
    expect(shape).toContain('infer ASCII lowercase kebab-case from stable domain or technical vocabulary')
    expect(shape).toContain('Artifact, commit, response, host locale, and TUI language settings never select or translate WorkRef language')
  })

  it('keeps review-related gates separate across runtime composition', () => {
    expect(findSemanticUnit(core, ['Tasks', 'required verification', 'without blockers', 'durable writeback decision'])).toBeDefined()
    expect(findSemanticUnit(core, ['implementation verification'])).toBeDefined()
    expect(findSemanticUnit(core, ['fixed-scope change review', 'separate report-only gate'])).toBeDefined()
    expect(findSemanticUnit(manage, ['Implementation verification', 'fixed-scope change review', 'durable writeback decision', 'separate gates'])).toBeDefined()
    expect(findSemanticUnit(manage, ['clean fixed-scope change review', '`review-clean`'])).toBeDefined()
  })

  it('retains exact three-stage inputs and a truthful provider blocker', () => {
    const cases = JSON.parse(readFileSync(join(evaluation, 'cases.json'), 'utf8'))
    const tokenCounts = JSON.parse(readFileSync(join(evaluation, 'token-counts.json'), 'utf8'))
    const report = readFileSync(join(evaluation, 'README.md'), 'utf8')

    expect(cases.map((item: { id: string }) => item.id)).toEqual([
      'normal-implement',
      'unexplained-diagnose',
      'risk-qualified-tdd',
      'missing-authority',
      'release-fallback-unconfirmed-unclean',
      'reopen-ambiguous-no-authority',
      'managed-status',
      'managed-pause',
    ])
    expect(tokenCounts.current.core_implement).toBe(3848)
    expect(tokenCounts.structural.core_implement).toBe(3386)
    expect(tokenCounts.combined.core_implement).toBe(3371)
    expect(report).toContain('does **not** establish behavior equivalence')
    expect(report).toContain('usage limit had been reached')

    for (const variant of ['current', 'structural', 'combined']) {
      const metadata = JSON.parse(readFileSync(join(evaluation, 'runs', variant, 'metadata.json'), 'utf8'))
      const score = JSON.parse(readFileSync(join(evaluation, 'runs', variant, 'score.json'), 'utf8'))
      const composition = metadata.sources.map((source: { path: string }) => {
        const content = readFileSync(join(evaluation, 'inputs', variant, source.path), 'utf8')
        expect(hash(content)).toBe(metadata.sources.find((item: { path: string }) => item.path === source.path).sha256)
        return `${source.path}\0${content}\0`
      }).join('')
      expect(hash(composition)).toBe(metadata.bundle_hash)
      expect(hash(readFileSync(join(evaluation, 'inputs', variant, 'prompt.md')))).toBe(metadata.prompt_hash)
      expect(metadata).toMatchObject({
        variant,
        model: 'gpt-5.6-terra',
        effort: 'low',
        exit_code: 1,
        usage: null,
        score_passed: false,
      })
      expect(score).toEqual({ passed: false, parse_error: true, cases: [] })
    }
  })

  it('retains a successful candidate evaluation through the user-configured provider', () => {
    const report = readFileSync(join(verifiedEvaluation, 'README.md'), 'utf8')
    expect(report).toContain('`structural` and `combined` pass all eight')
    expect(report).toContain('Private endpoint and credential values were neither inspected nor retained')

    for (const variant of ['current', 'structural', 'combined']) {
      const metadata = JSON.parse(readFileSync(join(verifiedEvaluation, 'runs', variant, 'metadata.json'), 'utf8'))
      const score = JSON.parse(readFileSync(join(verifiedEvaluation, 'runs', variant, 'score.json'), 'utf8'))
      expect(metadata).toMatchObject({
        variant,
        model: 'user-configured',
        effort: 'user-configured',
        exit_code: 0,
      })
      expect(metadata.usage.input_tokens).toBeGreaterThan(0)
      expect(score.parse_error).toBe(false)
      expect(score.passed).toBe(variant !== 'current')
    }
  })
})
