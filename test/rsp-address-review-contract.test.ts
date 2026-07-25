import { lstatSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const root = fileURLToPath(new URL('..', import.meta.url))
const skill = join(root, 'skills', 'rsp-address-review')

function readSkill(): { body: string, frontmatter: Record<string, any> } {
  const content = readFileSync(join(skill, 'SKILL.md'), 'utf8')
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  expect(match).not.toBeNull()
  return { body: match![2]!, frontmatter: parseYaml(match![1]!) as Record<string, any> }
}

describe('rsp-address-review Skill contract', () => {
  it('publishes a concise host-neutral review-resolution capability', () => {
    const { body, frontmatter } = readSkill()

    expect(frontmatter.name).toBe(basename(skill))
    expect(frontmatter.description).toEqual(expect.any(String))
    expect(frontmatter.license).toBe('MIT')
    expect(frontmatter.metadata).toMatchObject({ author: 'oevery', version: expect.stringMatching(/^\d{4}\.\d{2}\.\d{2}(?:\.\d+)?$/) })
    expect(body.trim().split(/\s+/).length).toBeLessThanOrEqual(800)
    expect(lstatSync(join(skill, 'SKILL.md')).isSymbolicLink()).toBe(false)
    expect(body).not.toMatch(/Codex|Claude|ChatGPT|GitHub Actions|session id|thread id/i)
  })

  it('disposes every finding before a bounded correction', () => {
    const { body } = readSkill()

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
    const { body } = readSkill()

    expect(body).toContain('fresh verification')
    expect(body).toContain('fresh fixed-scope re-review')
    expect(body).toContain('The re-review remains report-only')
    expect(body).toContain('Do not modify `rsp-review`, the original report')
    expect(body).toContain('every accepted Finding has a verified correction')
    expect(body).toContain('Never infer Git or publication authority')
  })

  it('returns managed correction-needed to Core without self-looping', () => {
    const { body } = readSkill()

    expect(body).toContain('return any new Finding as unresolved input to Core')
    expect(body).toContain('Address Review never self-loops')
    expect(body).toContain('Only qualified Manage may classify an in-scope `accepted` Finding as `correction-needed`')
    expect(body).toContain('original managed authority and its separate convergence limit')
    expect(body).toContain('standalone work requires new authority')
    expect(body).toContain('it is not an external blocker or durable Change state')
    expect(body).toContain('do not begin an automatic retry loop')
  })

  it('returns a recoverable artifact-scoped handoff without hidden state', () => {
    const { body } = readSkill()

    expect(body).toContain('## Handoff and recovery')
    expect(body).toContain('## <localized Review Resolution Handoff heading>')
    expect(body).toContain('authoritative pointers, not project truth')
    expect(body).toContain('never create a hidden receipt or persistent run state')
    expect(body).toContain('inspect current worktree drift')
    expect(body).toContain('Mark stale evidence pending')
    expect(body).toContain('proprietary resume features are optional and never required')
  })
})
