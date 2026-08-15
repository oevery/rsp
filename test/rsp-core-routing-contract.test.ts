import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { markdownHeadings, markdownLinks } from './helpers/markdown-contract'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string) => readFileSync(join(root, path), 'utf8')
const skill = read('skills/rsp/SKILL.md')
const fallback = read('rules/rsp-rules.md')
const controlModel = read('.rsp/specs/skill-control-model.md')
const managed = read('skills/rsp/references/managed-routing.md')
const manage = read('skills/rsp-manage/SKILL.md')
const closeout = read('skills/rsp-manage/references/closeout.md')

describe('rsp core routing contract', () => {
  it('keeps Core compact and loads inactive procedures conditionally', () => {
    expect(markdownHeadings(skill)).toEqual([
      'Scope',
      'Derive one next action',
      'Implementation evidence',
      'Operate the selected Change',
      'Ownership and safety',
      'Durable decision output',
    ])
    expect(markdownLinks(skill)).toEqual(expect.arrayContaining([
      'references/response-language.md',
      'references/managed-routing.md',
      'references/setup-repair.md',
      'references/groups-dependencies.md',
      'references/conflict-handling.md',
      'references/reopen-recovery.md',
      'references/durable-review.md',
    ]))
    expect(skill).not.toContain('### Release operations')
    expect(skill).not.toContain('An explicit pause must stop')
    expect(skill.split(/\s+/).length).toBeLessThan(2100)
  })

  it('keeps transient vocabulary exclusively in the control model', () => {
    expect(controlModel).toContain('A `ControlOutcome` is response-only derived coordination data')
    expect(controlModel).toContain('phase-specific `disposition`')
    expect(controlModel).toContain('resumeRule')
    expect(controlModel).toContain('Core owns `RouteDisposition`')
    expect(controlModel).toContain('`StopDisposition` values are exactly:')
    expect(controlModel).toContain('`AcceptanceDisposition` values are exactly')
    expect(controlModel).toContain('`CloseoutEligibility` values are exactly')
    expect(skill).toContain('Use the canonical transient control vocabulary')
    expect(skill).not.toContain('`RouteDisposition` is exactly')
    expect(skill).not.toContain('`StopDisposition` is exactly')
  })

  it('preserves routing, fallback, and authority boundaries', () => {
    expect(skill).toContain('Stages are derived guidance, never persisted state')
    expect(skill).toContain('Core may mutate only RSP control-plane state')
    expect(skill).toContain('product mutation belongs to Implement')
    expect(skill).toContain('Core alone evaluates `workspace.activation`')
    expect(skill).toContain('`auto` permits parallel Changes, unrelated dirty work, an independent runtime boundary, or an explicit request')
    expect(skill).toContain('`disabled` denies RSP isolation')
    expect(skill).toContain('Return `RouteDisposition: direct` only for one ready owner')
    expect(skill).toContain('Missing or non-ready ownership reports `RouteDisposition: shape`')
    expect(skill).toContain('Automatic selection grants routing only')
    expect(skill).toContain('A missing optional Discipline Skill does not invalidate RSP')
    expect(skill).toContain('never substitutes for a required managed worker or required independent Verify')
    expect(skill).toContain('do not infer release, archive, Git, publication, approval, or human acceptance')
    expect(fallback).toContain('does not emulate `rsp-manage`')
    expect(fallback).toContain('This fallback never archives, closes a Group, stages, commits, tags, pushes, publishes, deploys')
  })

  it('keeps implementation evidence and continuation output owned by Core', () => {
    expect(skill).toContain('Diagnosis first')
    expect(skill).toContain('`rsp-diagnose`')
    expect(skill).toContain('`rsp-tdd`')
    expect(skill).toContain('`rsp-implement`')
    expect(skill).toContain('`rsp-verify`')
    for (const field of ['WorkRef', 'Authority', 'Current state', 'Changed artifacts', 'Fresh verification', 'Blockers', 'Next action'])
      expect(skill).toContain(`\`${field}\``)
    expect(skill).toContain('the continuation is not a second state store')
    expect(skill).toContain('On same-session resume, reopen its pointers to authority and owned artifacts, inspect drift, replay safety, and refresh decisive evidence')
  })

  it('keeps Manage and local delivery detail in owning Skills', () => {
    expect(managed).toContain('After selection, stop using this reference for execution detail')
    expect(manage).toContain('solely owns')
    expect(manage).toContain('references/closeout.md')
    expect(closeout).toContain('Valid selected handoff only')
    expect(closeout).toContain('`rsp-commit`')
    expect(closeout).toContain('Push is opt-in only when user explicitly mentions push')
  })
})
