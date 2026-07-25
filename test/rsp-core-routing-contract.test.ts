import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const skillPath = join(root, 'skills', 'rsp', 'SKILL.md')
const fallbackPath = join(root, 'rules', 'rsp-rules.md')

describe('rsp core routing contract', () => {
  it('derives one evidence-backed next action with an explicit fallback and owner', () => {
    const body = readFileSync(skillPath, 'utf8')

    expect(body).toContain('## Derive one next action')
    expect(body).toContain('user intent')
    expect(body).toContain('`rsp status --json`')
    expect(body).toContain('readiness')
    expect(body).toContain('verification evidence')
    expect(body).toContain('blockers')
    expect(body).toContain('at most one available optional capability')
    expect(body).toContain('Only name an optional capability when it is the one next action')
    expect(body).toContain('host\'s loaded skill inventory')
    expect(body).toContain('manual fallback')
    expect(body).toContain('returned owner')
  })

  it('keeps stages derived and preserves optional capability boundaries', () => {
    const body = readFileSync(skillPath, 'utf8')

    expect(body).toContain('Stages are derived guidance, never persisted state')
    expect(body).toContain('Do not preload, enumerate, or recursively invoke optional capabilities')
    expect(body).toContain('Do not infer implementation, review, Git, publication, or approval authority')
  })

  it('keeps Changes convergent and persistent artifacts domain-oriented', () => {
    const body = readFileSync(skillPath, 'utf8')

    expect(body).toContain('convergent snapshot of the current plan and final decisive evidence')
    expect(body).toContain('Replace stale or superseded content')
    expect(body).toContain('RED/GREEN loops')
    expect(body).toContain('compress any material history')
    expect(body).toContain('persistent artifacts in domain, system, user, or operator language')
    expect(body).toContain('only when they are actual product actors, consumers, interface participants, or constraints')
    expect(body).toContain('using AI to perform the work is not itself a durable fact')
  })

  it('routes implementation evidence to diagnosis, TDD, or ordinary implementation', () => {
    const body = readFileSync(skillPath, 'utf8')

    expect(body).toContain('### Route implementation evidence')
    expect(body).toContain('unexplained failure')
    expect(body).toContain('`rsp-diagnose`')
    expect(body).toContain('manual diagnosis fallback')
    expect(body).toContain('`rsp-tdd`')
    expect(body).toContain('manual TDD fallback')
    expect(body).toContain('ordinary `rsp-implement`')
    expect(body).toContain('this is the default when diagnosis does not apply')
    expect(body).toContain('explicitly required by the user, selected Change, or project instructions')
    expect(body).toContain('concrete changed risk')
    expect(body).toContain('Behavior being testable, a test being possible, or the work being a fix is not sufficient by itself')
    expect(body).toContain('Fresh verification is required, but a new test is only one evidence option')
    expect(body).toContain('same selected Change')
  })

  it('routes one tracked design question without making design a controller', () => {
    const body = readFileSync(skillPath, 'utf8')

    expect(body).toContain('one material domain, module/seam, or evidence-seeking design question')
    expect(body).toContain('`rsp-design` when available')
    expect(body).toContain('compact manual design fallback')
    expect(body).toContain('same WorkRef without implementation or durable-truth mutation')
  })

  it('routes only explicit unfinished release-documentation work to rsp-release-docs', () => {
    const body = readFileSync(skillPath, 'utf8')
    const fallback = readFileSync(fallbackPath, 'utf8')

    expect(body).toContain('### Route release documentation')
    expect(body).toContain('user explicitly requests release documentation, finalization, publication, or reconciliation')
    expect(body).toContain('release operation has a confirmed identity or range')
    expect(body).toContain('A selected Change is not required')
    expect(body).toContain('select `rsp-release-docs` when available')
    expect(body).toContain('Lifecycle stage, completed implementation, or archive readiness alone is insufficient')
    expect(body).toContain('manual release-documentation fallback')
    expect(body).toContain('does not grant commit, tag, push, release creation, publication, deployment, or approval authority')
    expect(fallback).toContain('Route release documentation only for an explicit release operation with a confirmed identity or range')
    expect(fallback).toContain('no Release Change is required')
    expect(fallback).toContain('never infer it from version order, prior prereleases, commits, or planned prose')
    expect(fallback).toContain('Select `rsp-release-docs` when available')
  })

  it('requires a credential-free finalization gate before explicit publication', () => {
    const body = readFileSync(skillPath, 'utf8')

    expect(body).toContain('explicit request to create a release tag, hosted release, registry publication, or equivalent public release')
    expect(body).toContain('additional mandatory finalization gate')
    expect(body).toContain('`rsp-release-docs` **Finalize for publication** branch')
    expect(body).toContain('do not require or create an RSP Change by default')
    expect(body).toContain('create a separate release commit, and rerun exact finalization checks against it')
    expect(body).toContain('public tag/package release surfaces')
    expect(body).toContain('rejects transient publication-state prose in shipped artifacts')
    expect(body).toContain('credential-free `ready` or `not ready` handoff')
    expect(body).toContain('Neither result executes or grants authority for the external action')
    expect(body).toContain('without creating a Change by default')
    expect(body.indexOf('If the user explicitly requests release documentation, a tag, hosted release, registry publication, or published-release reconciliation')).toBeLessThan(body.indexOf('If no Change is selected'))
  })

  it('keeps ordinary Change delivery separate from late release identity', () => {
    const body = readFileSync(skillPath, 'utf8')

    expect(body).toContain('Treat release identity as an owner decision')
    expect(body).toContain('never infer it from version ordering, a previous prerelease, commit contents, or planned prose')
    expect(body).toContain('leave version manifests, target changelog headings, exact-version README commands, versioned release notes, and tag comparisons unchanged')
    expect(body).toContain('Keep each completed Change independently reviewable')
    expect(body).toContain('a separately authorized release operation may then finalize versioned shipped surfaces in a dedicated release commit without creating another Change')
  })

  it('creates a Release Change only for durable coordination needs', () => {
    const body = readFileSync(skillPath, 'utf8')

    expect(body).toContain('Use an optional Release Change only when material decisions, cross-stage coordination, recovery, blockers, or acceptance need a persistent owner')
    expect(body).toContain('never create one merely to retain a mechanical checklist or verification transcript')
    expect(body).toContain('do not infer a release operation from its completion')
  })

  it('reconciles published surfaces without rewriting immutable history', () => {
    const body = readFileSync(skillPath, 'utf8')

    expect(body).toContain('`rsp-release-docs` **Reconcile published release** branch')
    expect(body).toContain('unfinished external verification or mutable public-surface corrections')
    expect(body).toContain('assign a corrective version or owner instead of moving tags or rewriting packages')
  })

  it('routes managed continuation only through an explicit eligibility gate', () => {
    const body = readFileSync(skillPath, 'utf8')

    expect(body).toContain('If the user explicitly requests managed continuation')
    expect(body).toContain('select `rsp-manage` only when it is available')
    expect(body).toContain('one focused ready Change with genuinely independent slices')
    expect(body).toContain('an ineligible request returns the exact ordinary Core or Discipline next action')
    expect(body).toContain('Managed routing is never implicit')
    expect(body).toContain('grants no lifecycle, Git, publication, deployment, approval, or human-acceptance authority')
  })

  it('localizes response-only durable decision labels without translating canonical values', () => {
    const body = readFileSync(skillPath, 'utf8')

    expect(body).toContain('Use these semantic fields in this exact order.')
    expect(body).toContain('Localize the heading and human-facing labels to the response language')
    expect(body).toContain('Response-only Continuation and Durable Decision headings and labels are not canonical artifact headings')
    expect(body).toContain('`决策记录（Decision Record）`')
    expect(body).toContain('<No current-fact update needed | Update existing spec or scoped instruction | Create a new durable spec>')
    expect(body).toContain('<yes | no>')
  })
})
