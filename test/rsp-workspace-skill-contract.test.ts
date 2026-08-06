import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))

function skill(name: string): string {
  return readFileSync(join(root, 'skills', name, 'SKILL.md'), 'utf8')
}

describe('rsp workspace Skills', () => {
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
      'Do not create nested workspaces',
      '`--discard` is destructive authority',
      'Never infer Commit, Land',
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
