import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const skill = join(root, 'skills', 'rsp-diagnose')

function readSkill(): string {
  const content = readFileSync(join(skill, 'SKILL.md'), 'utf8')
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  expect(match).not.toBeNull()
  return match![2]!
}

describe('rsp-diagnose Skill contract', () => {
  it('publishes one host-neutral payload without a host projection', () => {
    const body = readSkill()
    expect(existsSync(join(skill, 'agents'))).toBe(false)
    expect(body).not.toMatch(/Codex|Claude|ChatGPT|session id|thread id/i)
  })

  it('requires ordered reproduction, localization, discrimination, and confirmation', () => {
    const body = readSkill()
    const steps = ['**REPRODUCE.**', '**LOCATE.**', '**HYPOTHESIZE.**', '**DISCRIMINATE.**', '**CONFIRM.**']

    expect(steps.map(step => body.indexOf(step))).toEqual([...steps.map(step => body.indexOf(step))].sort((a, b) => a - b))
    expect(body).toContain('first boundary where actual behavior diverges')
    expect(body).toContain('production consumer')
    expect(body).toContain('distinct observation each predicts')
    expect(body).toContain('selects it over the remaining live alternatives')
  })

  it('separates investigation from correction and returns truthful ownership', () => {
    const body = readSkill()

    expect(body).toContain('read-only investigation')
    expect(body).toContain('requires explicit mutation authority')
    expect(body).toContain('Production correction is outside this Skill')
    expect(body).toContain('`confirmed` or `unresolved`')
    expect(body).toContain('exactly one next action')
    expect(body).toContain('owned by the same Change; do not apply it')
    expect(body).toContain('never infer Git, delivery, publication, or approval authority')
  })
})
