import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))

function skill(name: string): string {
  return readFileSync(join(root, 'skills', name, 'SKILL.md'), 'utf8')
}

function projectFile(path: string): string {
  return readFileSync(join(root, path), 'utf8')
}

describe('rsp workspace Skills', () => {
  it('keeps Core as the sole isolation selector across routing surfaces', () => {
    const core = skill('rsp')
    const manage = skill('rsp-manage')
    const workspace = skill('rsp-workspace')
    const spec = projectFile('.rsp/specs/skill-system.md')
    const fallback = projectFile('rules/rsp-rules.md')

    for (const fragment of [
      'Before the small-work decision',
      'Core alone evaluates `workspace.activation`',
      '`auto` permits parallel Changes, unrelated dirty work, an independent runtime boundary, or an explicit request',
      '`explicit` permits only the explicit request',
      '`disabled` denies RSP isolation',
      'Load `rsp-workspace` only after selection',
    ])
      expect(core).toContain(fragment)
    expect(core.indexOf('Before the small-work decision')).toBeLessThan(core.indexOf('Return `RouteDisposition: direct`'))

    for (const fragment of [
      'Core resolves ownership before this Skill is entered and also resolves workspace-isolation selection',
      'allocate or reuse one `rsp-workspace` session per executable WorkRef',
      'Manage never independently selects isolation',
      'return that evidence to Core for fresh route derivation',
      'workspace-isolation evidence only when Core selected isolation',
      'The absence of a workspace-isolation boundary is valid when Core did not select isolation',
    ])
      expect(manage).toContain(fragment)

    expect(workspace).toContain('selected by Core for AI-orchestrated work')
    expect(workspace).toContain('policy-compliant selected isolation boundary')
    expect(workspace).toContain('`disabled` never enters this Skill')
    expect(workspace).toContain('A human may invoke the low-level CLI explicitly')
    expect(workspace).not.toContain('selected by Core or qualified Manage')
    expect(spec).toContain('`rsp` owns project entry, current-action routing')
    expect(spec).toContain('`rsp-workspace` is isolated execution infrastructure selected by Core')
    expect(spec).toContain('Detailed procedures are loaded from the owning Skill or a conditional reference')
    expect(spec).toContain('Core conditionally loads')
    expect(spec).toContain('Neither grants product, lifecycle, Git, remote, publication')
    expect(spec).not.toContain('after Core or Manage selects isolation')
    expect(fallback).toContain('As the Core fallback, read the effective `workspace.activation` before the small-work decision')
    expect(fallback).toContain('under `disabled`, never select or prepare an RSP workspace')
    expect(fallback).toContain('Evaluating policy and signals does not load the Workspace capability')
  })

  it('keeps workspace infrastructure separate from ownership and delivery authority', () => {
    const body = skill('rsp-workspace')
    for (const fragment of [
      'one executable open WorkRef',
      'Ordinary temporary work remains in the current worktree',
      '`rsp/<workref>`',
      'never create a random session branch',
      'Do not create a workspace-specific decision',
      'Core retains its `ControlOutcome`',
      'Manage retains its `WorkerEnvelope`',
      '`Workspace context`',
      'Do not persist it',
      'host-native capabilities',
      'rsp workspace activity register <workref>',
      'cooperative coordination, not an operating-system sandbox',
      'Return through the invoking result contract',
      '`Workspace observations`',
      'are not redefined here',
      'Core receives the ordinary invoking result',
      'Do not create nested workspaces',
      '`--discard` is destructive authority',
      'Never infer Commit, Land',
      'not a WorkOwner, project adapter, completion controller, Discipline',
    ])
      expect(body).toContain(fragment)
    for (const duplicate of [
      'WorkspaceDecision',
      'WorkspaceReceipt',
      'Disposition: ready | stop',
      '- `Effective authority`',
      '- `Next owner`',
    ])
      expect(body).not.toContain(duplicate)
    expect(body).not.toMatch(/\b(?:Node|Maven|Gradle|mise|Compose|Nacos|frontend|backend)\b/u)
  })

  it('documents Workspace as default Infrastructure without changing distribution', () => {
    const spec = projectFile('.rsp/specs/skill-system.md')

    expect(spec).toContain('Core, Shape, Discipline, Infrastructure, Controller, or Discovery')
    expect(spec).toContain('| `rsp-workspace` | default | Infrastructure: isolated execution |')
    expect(spec).not.toContain('| `rsp-workspace` | default | Discipline:')
  })

  it('requires exact local landing authority and preserves conflicts', () => {
    const body = skill('rsp-land')
    for (const fragment of [
      'explicit local landing authority',
      'ordered explicit commit list',
      'staged, unstaged, and untracked target paths',
      'reachable from `rsp/<workref>`',
      'preserve the source workspace',
      'Do not infer abort or cleanup',
      'Push and publication remain explicit external actions',
    ])
      expect(body).toContain(fragment)
  })
})
