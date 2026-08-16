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
    const controlModel = projectFile('.rsp/specs/skill-control-model.md')

    for (const fragment of [
      'Before the small-work decision',
      'Core alone evaluates `workspace.activation`',
      'Workspace defaults to `explicit`',
      '`auto` is an advanced project opt-in',
      '`explicit`, which permits selection only for a current explicit isolation request',
      '`disabled` denies RSP isolation',
      'Load `rsp-workspace` only after selection',
    ])
      expect(core).toContain(fragment)
    expect(core.indexOf('Before the small-work decision')).toBeLessThan(core.indexOf('Return `RouteDisposition: direct`'))
    expect(core).toContain('Core produces one four-field `WorkspaceSelection`')
    expect(controlModel).toContain('A `WorkspaceSelection` is the unique response-only isolation handoff produced by Core')

    for (const fragment of [
      'Core resolves ownership before this Skill is entered and also resolves workspace-isolation selection',
      'allocate or reuse one `rsp-workspace` session per executable WorkRef',
      'Manage never independently selects isolation',
      'return that evidence to Core for fresh route derivation',
      'missing or invalid `WorkspaceSelection` only when Core selected isolation',
      'The current checkout is valid when Core did not select workspace isolation',
      'Validate the four-field `WorkspaceSelection` and forward it unchanged',
    ])
      expect(manage).toContain(fragment)

    expect(workspace).toContain('selected by Core for AI-orchestrated work')
    expect(workspace).toContain('policy-compliant `WorkspaceSelection`')
    expect(workspace).toContain('Consume the invoking `WorkspaceSelection` without redefining it')
    expect(workspace).toContain('append only observed workspace facts')
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

  it('refreshes Workspace selection at the preparation boundary', () => {
    const core = skill('rsp')
    const manage = skill('rsp-manage')
    const workspace = skill('rsp-workspace')
    const coreSpec = projectFile('.rsp/specs/core-model.md')
    const controlModel = projectFile('.rsp/specs/skill-control-model.md')
    const skillSpec = projectFile('.rsp/specs/skill-system.md')
    const fallback = projectFile('rules/rsp-rules.md')

    for (const content of [core, coreSpec, controlModel, skillSpec, fallback]) {
      const normalized = content.toLowerCase()
      expect(normalized).toContain('immediately before workspace preparation')
    }

    expect(core).toContain('Freshly rederive Workspace selection')
    expect(core).toContain('unrelated dirty or overlapping product paths')
    expect(core).toContain('one WorkRef, one writer')
    expect(core).toContain('same-WorkRef Change and focus mutations')
    expect(core).toContain('provider or evaluation harness')
    expect(core).toContain('stays in the current checkout')
    expect(manage).toContain('immediately before invoking `rsp-workspace`')
    expect(manage).toContain('return the stale selection or handoff evidence to Core before preparation')
    expect(workspace).toContain('If the invoking selection has not been refreshed immediately before preparation')
    expect(workspace).toContain('stop without running `rsp workspace prepare`')
    expect(workspace).toContain('one WorkRef, one writer')
    expect(workspace).toContain('same-WorkRef Change and focus mutations')
    expect(workspace).toContain('provider or evaluation harness')
    expect(workspace).toContain('current checkout is sufficient')
    expect(workspace).toContain('The CLI remains a mechanical ownership executor')
  })

  it('keeps Workspace explicit by default and refuses silent late handoff', () => {
    const core = skill('rsp')
    const manage = skill('rsp-manage')
    const workspace = skill('rsp-workspace')
    const coreSpec = projectFile('.rsp/specs/core-model.md')
    const cliSpec = projectFile('.rsp/specs/cli-contracts.md')
    const fallback = projectFile('rules/rsp-rules.md')

    for (const content of [core, coreSpec, cliSpec, fallback]) {
      expect(content).toContain('Workspace defaults to `explicit`')
      expect(content).toContain('`auto` is an advanced project opt-in')
    }
    expect(core).toContain('a current explicit isolation request')
    expect(manage).toContain('product mutation has not begun in the source checkout')
    expect(workspace).toContain('Workspace is pre-mutation infrastructure')
    expect(workspace).toContain('require an explicit owner-directed handoff')
    expect(workspace).toContain('Never copy only RSP control files and silently continue')
    expect(workspace).toContain('`--allow-dirty-source`')
    expect(workspace).toContain('established that those paths are unrelated')
  })

  it('documents bounded active Workspace recovery without semantic promotion', () => {
    const cliSpec = projectFile('.rsp/specs/cli-contracts.md')
    const english = projectFile('docs/site/en/reference/cli.md')
    const chinese = projectFile('docs/site/zh-CN/reference/cli.md')

    for (const content of [cliSpec, english, chinese]) {
      expect(content).toContain('activeWorkspaces')
      expect(content).toContain('commitsAhead')
      expect(content).toContain('activeActivityCount')
    }
    expect(cliSpec).toContain('mechanical observations')
    expect(cliSpec).toContain('not Change readiness or acceptance')
    expect(cliSpec).toContain('`landed | unlanded | landed-equivalent`')
    expect(cliSpec).toContain('`rsp workspace prune <work-ref>` is report-only by default')
    expect(english).toContain('No machine-specific workspace path appears in default plain status')
    expect(chinese).toContain('默认纯文本 status 不显示机器相关的 Workspace 路径')
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
      'Manage retains its ExecutionFrame, Assignment and Receipt contracts',
      '`Workspace context`',
      'Do not persist it',
      'host-native capabilities',
      'rsp workspace activity register <workref>',
      'not the universal managed ResourceLease model, an operating-system sandbox',
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
