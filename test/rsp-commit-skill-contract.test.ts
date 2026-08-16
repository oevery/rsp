import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const raw = readFileSync(join(root, 'skills', 'rsp-commit', 'SKILL.md'), 'utf8')
const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
const skill = match?.[2] ?? ''

describe('rsp-commit Skill contract', () => {
  it('publishes a portable commit capability', () => {
    expect(match).not.toBeNull()
    expect(skill).not.toContain('/Users/')
  })

  it('requires an RSP owner, explicit authority, decisive evidence, and one exact boundary', () => {
    for (const fragment of [
      'Core or qualified Manage',
      'allowed paths',
      'decisive verification',
      'lifecycle state',
      'commit authority',
      'one Change',
      'one integration-coupled Group wave',
      'one confirmed release commit boundary',
      'Stop without staging',
      'staged, unstaged, and untracked paths',
      'cached diff',
      'recent non-merge commit messages',
    ])
      expect(skill).toContain(fragment)
  })

  it('derives repository-consistent structured messages without invented relationships', () => {
    for (const fragment of [
      'explicit current commit-language instruction',
      'configured effective commit language',
      'nearest repository commit authority',
      'clear style of recent non-merge commits',
      'Response language',
      'Conventional Commit types/scopes and trailers',
      'Conventional Commit',
      'two to four concise bullets',
      '`RSP-WorkRef:`',
      '`RSP-Group:`',
      '`BREAKING CHANGE:`',
      'co-author',
      'AI attribution',
    ])
      expect(skill).toContain(fragment)
  })

  it('owns local staging, commit execution, and complete post-commit observation only', () => {
    for (const fragment of [
      'Stage only the explicit allowed paths',
      'complete cached path list and cached diff',
      'Create one local commit',
      'Do not cherry-pick, clean another checkout, push, tag, publish, amend, rebase, or force-push',
      'complete committed message',
      'parsed subject/body/trailers',
      'remaining worktree paths',
      'never silently amend',
    ])
      expect(skill).toContain(fragment)
  })

  it('preserves multiline messages across tool and shell boundaries', () => {
    for (const fragment of [
      'actual line breaks or a safely prepared message file',
      'ordinary quoted `\\n` escape sequences',
      'raw complete committed message',
      'unintended literal `\\n` sequences',
      'post-commit mismatch',
    ])
      expect(skill).toContain(fragment)
  })

  it('projects owned issue links without premature or invented closing syntax', () => {
    for (const fragment of [
      '`Issue: <canonical-url>`',
      'terminal commit',
      'acceptance is complete',
      '`relation: closes`',
      'Checkpoints',
      '`relation: relates`',
      'unresolved provider or repository identity',
      'canonical URL',
      'never infer an issue from changed files',
      'never',
    ])
      expect(skill).toContain(fragment)
  })
})
