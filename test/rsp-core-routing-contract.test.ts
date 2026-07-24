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
    expect(body).toContain('explicitly owns a confirmed release identity or range')
    expect(body).toContain('unfinished changelog, release-note, or migration work')
    expect(body).toContain('select `rsp-release-docs` when available')
    expect(body).toContain('Lifecycle stage, completed implementation, or archive readiness alone is insufficient')
    expect(body).toContain('manual release-documentation fallback')
    expect(body).toContain('does not grant commit, tag, push, release creation, publication, deployment, or approval authority')
    expect(fallback).toContain('Route release documentation only when the selected Change explicitly owns a confirmed release identity or range')
    expect(fallback).toContain('Select `rsp-release-docs` when available')
    expect(fallback).toContain('lifecycle stage, completed implementation, and archive readiness alone are insufficient')
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
