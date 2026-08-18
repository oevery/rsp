import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const skill = join(root, 'skills', 'rsp-tdd')

function readSkill(): string {
  const content = readFileSync(join(skill, 'SKILL.md'), 'utf8')
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  expect(match).not.toBeNull()
  return match![2]!
}

describe('rsp-tdd Skill contract', () => {
  it('publishes a host-neutral discipline', () => {
    const body = readSkill()
    expect(body).not.toMatch(/Codex|Claude|ChatGPT|GitHub Actions|session id|thread id/i)
  })

  it('requires an observed red before minimal green and safe refactor', () => {
    const body = readSkill()

    expect(body).toContain('## RED')
    expect(body).toContain('before production mutation')
    expect(body).toContain('expected missing or incorrect behavior')
    expect(body).toContain('syntax, fixture, environment, or unrelated baseline failure')
    expect(body).toContain('## GREEN')
    expect(body).toContain('minimum production change')
    expect(body).toContain('## REFACTOR')
    expect(body).toContain('only after GREEN')
    expect(body).toContain('rerun the focused check')
  })

  it('does not let a test invent or widen the product contract', () => {
    const body = readSkill()

    expect(body).toContain('## Admit the behavior and test seam')
    expect(body).toContain('selected Change, Spec, or project authority owns the observable behavior')
    expect(body).toContain('A test cannot create product authority')
    expect(body).toContain('imagined edge state, test-only consumer, wrapper hop, or source-string convention is not sufficient')
    expect(body).toContain('stop for the owning decision instead of encoding the assumption as RED')
    expect(body).toContain('Do not widen the product contract merely to satisfy the test')
    expect(body).toContain('unauthorized API, fallback, compatibility behavior, test-only hook, or unreachable-state branch')
  })

  it('retains only valuable tests and cleans disposable probes before final verification', () => {
    const body = readSkill()

    expect(body).toContain('## Retain or remove the test')
    expect(body).toContain('observable behavior or a real boundary')
    expect(body).toContain('distinct future confidence beyond existing checks')
    expect(body).toContain('implementation-detail coupling or duplicate coverage')
    expect(body).toContain('proportionate maintenance cost')
    expect(body).toContain('A user, Change, or project requirement to retain the test remains authoritative')
    expect(body).toContain('treat it as a disposable probe')
    expect(body).toContain('remove it before completion')
    expect(body).toContain('verify that no disposable fixture or helper remains')
    expect(body).toContain('cheapest decisive existing check against the final production state')
    expect(body).toContain('A removed probe is process evidence, not final verification')
    expect(body).toContain('final decisive evidence, omissions, and unresolved risk rather than a chronological test transcript')
  })

  it('stops truthfully and returns evidence to the same Change', () => {
    const body = readSkill()

    expect(body).toContain('behavior or acceptance is unclear')
    expect(body).toContain('mutation authority is missing')
    expect(body).toContain('unexplained cause')
    expect(body).toContain('execution environment is unavailable')
    expect(body).toContain('baseline failure cannot be separated')
    expect(body).toContain('fresh required Change checks')
    expect(body).toContain('Return to the same selected Change')
    expect(body).toContain('do not create parallel lifecycle state or recursively invoke another Skill')
    expect(body).toContain('Git staging, commit, push, publication, deployment, review, archive, and approval')
  })
})
