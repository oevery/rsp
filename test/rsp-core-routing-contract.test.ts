import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { markdownHeadings, markdownLinks } from './helpers/markdown-contract'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string) => readFileSync(join(root, path), 'utf8')
const skill = read('skills/rsp/SKILL.md')
const controlOutcome = read('skills/rsp/references/control-outcome.md')
const fallback = read('rules/rsp-rules.md')
const controlModel = read('.rsp/specs/skill-control-model.md')
const managed = read('skills/rsp/references/managed-routing.md')
const manage = read('skills/rsp-manage/SKILL.md')
const managedExchange = read('skills/rsp-manage/references/managed-exchange.md')
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
      'references/control-outcome.md',
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

  it('keeps transient vocabulary in the control model and runtime forms with their owners', () => {
    expect(controlModel).toContain('A `ControlOutcome` is the single outer response receipt')
    expect(controlModel).toContain('`mode: solo | delegated | coordinated`')
    expect(controlModel).toContain('`status: running | waiting | completed`')
    expect(controlModel).toContain('`running -> waiting | completed` and `waiting -> running | completed`')
    expect(controlModel).toContain('Route, topology, lane result, `AcceptanceDisposition`, and `CloseoutEligibility` remain nested')
    expect(controlModel).toContain('Core owns `RouteDisposition`')
    expect(controlModel).toContain('`StopDisposition` values are exactly:')
    expect(controlModel).toContain('`AcceptanceDisposition` values are exactly')
    expect(controlModel).toContain('`CloseoutEligibility` values are exactly')
    expect(controlModel).toContain('observed execution location')
    expect(controlModel).toContain('`control-action`, `longitudinal`')
    expect(controlModel).toContain('`AssignmentDelta` continues only an observed resumed compatible WorkerSession')
    expect(managedExchange).toContain('immediately accepted Assignment or AssignmentDelta in that same observed WorkerSession')
    expect(controlModel).toContain('Token or context cost may break a tie only between otherwise equally safe and authorized strategies')
    expect(controlModel).not.toContain('WorkspaceSelection')
    expect(skill).toContain('Use the canonical transient control vocabulary')
    expect(skill).toContain('[control outcome](references/control-outcome.md)')
    expect(controlOutcome).toContain('Work: <current WorkRef>')
    expect(controlOutcome).toContain('Next owner: <NextOwner>')
    expect(controlOutcome).toContain('Exactly one of Result or Stop applies')
    expect(controlOutcome).toContain('localized labeled natural language')
    expect(skill).not.toContain('`RouteDisposition` is exactly')
    expect(skill).not.toContain('`StopDisposition` is exactly')
  })

  it('preserves routing, fallback, and authority boundaries', () => {
    expect(skill).toContain('Stages are derived guidance, never persisted state')
    expect(skill).toContain('Core may mutate only RSP control-plane state')
    expect(skill).toContain('product mutation belongs to Implement')
    expect(skill).toContain('Execution-environment selection and cross-branch integration remain host, user, or Git concerns')
    expect(skill).not.toContain('workspace.activation')
    expect(skill).not.toContain('rsp-workspace')
    expect(skill).not.toContain('rsp-land')
    expect(skill).toContain('Return `RouteDisposition: direct` only for one ready owner')
    expect(skill).toContain('explicit local commit authority may route exactly once to `rsp-commit`')
    expect(skill).toContain('a `direct` owner summary, exact allowed paths, decisive evidence, and current authority')
    expect(skill).toContain('do not invent a Change, WorkRef, lifecycle state, or RSP trailer')
    expect(skill).toContain('never becomes a manual fallback')
    expect(skill).toContain('Missing or non-ready ownership reports `RouteDisposition: shape`')
    expect(skill).toContain('Automatic selection grants routing only')
    expect(skill).toContain('A missing optional Discipline Skill does not invalidate RSP')
    expect(skill).toContain('never substitutes for a required managed worker or required independent Verify')
    expect(skill).toContain('do not infer release, archive, Git, publication, approval, or human acceptance')
    expect(fallback).toContain('does not emulate `rsp-manage`')
    expect(fallback).toContain('This fallback never archives, closes a Group, stages, commits, tags, pushes, publishes, deploys')
  })

  it('qualifies automatic Manage only from observable coordination obligations', () => {
    expect(managed).toContain('genuinely independent slices')
    expect(managed).toContain('interruption recovery')
    expect(managed).toContain('distinct execution and acceptance owners')
    expect(managed).toContain('real-host, provider, or hardware verification')
    expect(managed).toContain('bounded finding convergence')
    expect(managed).toContain('managed lifecycle coordination')
    expect(managed).toContain('clear ready successor')
    expect(managed).toContain('Multiple files, Specs, product presentation, public documentation, or verification files do not by themselves qualify Manage')
    expect(managed).toContain('one owner, one writer, one execution phase, one integrated check, no recovery, no independent acceptance obligation, and no ready successor')
    expect(managed).toContain('Substantial sequential work remains selected')
    expect(managed).not.toContain('bias non-small continuation toward Manage')
    expect(managed).not.toContain('fails any one of these conditions qualifies as non-small')
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
    expect(manage).toContain('`control-action` for a bounded Manager-owned control action')
    expect(manage).toContain('Return one bounded managed phase result for Core to compose through its `ControlOutcome` contract')
    expect(manage).toContain('Only an observed resumed compatible WorkerSession may receive an `AssignmentDelta`')
    expect(manage).toContain('session loss, boundary invalidation, or uncertain prior identity')
    expect(manage).not.toContain('`direct` for a bounded Manager-owned control action')
    expect(manage).toContain('references/closeout.md')
    expect(closeout).toContain('Valid selected handoff only')
    expect(closeout).toContain('`rsp-commit`')
    expect(closeout).toContain('Push is opt-in only when user explicitly mentions push')
  })
})
