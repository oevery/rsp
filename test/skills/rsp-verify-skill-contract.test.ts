import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../..', import.meta.url))
const skill = readFileSync(join(root, 'skills', 'rsp-verify', 'SKILL.md'), 'utf8')

describe('rsp-verify Skill contract', () => {
  it('is a portable read-only Discipline with bounded results', () => {
    expect(skill).toContain('name: rsp-verify')
    expect(skill).toContain('one explicit WorkRef or one unambiguous focus marker')
    expect(skill).toContain('Do not edit product files')
    expect(skill).toContain('Verify does not select worker identity or isolation')
    expect(skill).toContain('any identity or independence evidence comes from the host')
    expect(skill).toContain('derive `review-clean`')
    expect(skill).toContain('claim `archiveReady`')
    expect(skill).toContain('`pass`')
    expect(skill).toContain('`fail`')
    expect(skill).toContain('`unavailable`')
    expect(skill).toContain('`evidence_delta: new | none`')
    expect(skill).toContain('`boundary: unchanged | changed`')
    expect(skill).toContain('never turn an unavailable check into success')
  })
})
