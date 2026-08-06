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
      'Before applying the small-work exclusion',
      'Core alone selects whether workspace isolation is materially useful',
      'Evaluating those signals does not load `rsp-workspace`',
      'An explicit direct request still enters Core for this selection',
      'A selected workspace remains execution infrastructure for that direct route',
    ])
      expect(core).toContain(fragment)
    expect(core.indexOf('Before applying the small-work exclusion')).toBeLessThan(core.indexOf('Return tiny settled work directly'))

    for (const fragment of [
      'Core resolves ownership before this Skill is entered and also resolves workspace-isolation selection',
      'allocate or reuse one `rsp-workspace` session per executable WorkRef',
      'Manage never independently selects isolation',
      'return that evidence to Core for fresh route derivation',
      'workspace-isolation evidence only when Core selected isolation',
      'The absence of a workspace-isolation boundary is valid when Core did not select isolation',
    ])
      expect(manage).toContain(fragment)

    expect(workspace).toContain('selected only by Core')
    expect(workspace).toContain('An explicit direct request routes through Core')
    expect(workspace).not.toContain('selected by Core or qualified Manage')
    expect(spec).toContain('Core keeps selection, routing, ownership, safety')
    expect(spec).toContain('evaluating those signals does not load `rsp-workspace`')
    expect(spec).toContain('Manage allocates or reuses workspace sessions only after Core selection')
    expect(spec).not.toContain('after Core or Manage selects isolation')
    expect(fallback).toContain('As the Core fallback, evaluate workspace isolation before the small-work decision')
    expect(fallback).toContain('Evaluating those signals does not load the Workspace capability')
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
