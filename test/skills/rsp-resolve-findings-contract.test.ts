import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../..', import.meta.url))
const skill = join(root, 'skills', 'rsp-resolve-findings')

function readSkill(): string {
  const content = readFileSync(join(skill, 'SKILL.md'), 'utf8')
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  expect(match).not.toBeNull()
  return match![2]!
}

describe('rsp-resolve-findings Skill contract', () => {
  it('publishes a host-neutral review-resolution capability', () => {
    const body = readSkill()
    expect(body).not.toMatch(/Codex|Claude|ChatGPT|GitHub Actions|session id|thread id/i)
  })

  it('disposes every finding before a bounded correction', () => {
    const body = readSkill()

    expect(body).toContain('## Disposition every finding')
    expect(body).toContain('`accepted`')
    expect(body).toContain('`rejected`')
    expect(body).toContain('`needs-clarification`')
    expect(body).toContain('either explicit user permission or Core-confirmed original managed authority')
    expect(body).toContain('accepted Findings only')
    expect(body).toContain('do not edit for it')
    expect(body).toContain('do not begin an automatic retry loop')
  })

  it('requires verification and a report-only re-review before completion', () => {
    const body = readSkill()

    expect(body).toContain('fresh verification')
    expect(body).toContain('fresh fixed-scope re-review')
    expect(body).toContain('The re-review remains report-only')
    expect(body).toContain('Do not modify `rsp-review`, the original report')
    expect(body).toContain('every accepted Finding has a verified correction')
    expect(body).toContain('Never infer Git or publication authority')
  })

  it('returns managed correction-needed to Core without self-looping', () => {
    const body = readSkill()

    expect(body).toContain('return any new Finding as unresolved input to Core')
    expect(body).toContain('Resolve Findings never self-loops')
    expect(body).toContain('Only qualified Manage may classify an in-scope `accepted` Finding as `correction-needed`')
    expect(body).toContain('original managed authority and its separate convergence limit')
    expect(body).toContain('standalone work requires new authority')
    expect(body).toContain('it is not an external blocker or durable Change state')
    expect(body).toContain('do not begin an automatic retry loop')
  })

  it('returns a recoverable artifact-scoped handoff without hidden state', () => {
    const body = readSkill()

    expect(body).toContain('## Handoff and recovery')
    expect(body).toContain('## <localized Review Resolution Handoff heading>')
    expect(body).toContain('authoritative pointers, not project truth')
    expect(body).toContain('Return it in the response unless the user explicitly authorizes an artifact path')
    expect(body).toContain('inspect current worktree drift')
    expect(body).toContain('Mark stale evidence pending')
    expect(body).toContain('proprietary resume features are optional and never required')
  })
})
