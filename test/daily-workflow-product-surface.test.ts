import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const currentSkills = [
  'rsp',
  'rsp-address-review',
  'rsp-design',
  'rsp-diagnose',
  'rsp-implement',
  'rsp-manage',
  'rsp-release-docs',
  'rsp-review',
  'rsp-shape',
  'rsp-tdd',
]

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8')
}

describe('daily-workflow product surface', () => {
  it('keeps the existing discipline Skills alongside managed continuation', () => {
    expect(readdirSync(join(root, 'skills')).sort()).toEqual(currentSkills)

    const shape = read('skills/rsp-shape/SKILL.md')
    const deepClarification = read('skills/rsp-shape/references/deep-clarification.md')
    const rspDesign = read('skills/rsp-design/SKILL.md')
    expect(shape).toContain('references/deep-clarification.md')
    expect(deepClarification).toContain('the same returning WorkRef')
    expect(rspDesign).toContain('Tracked results return to Shape or the user against the same WorkRef')

    expect(read('skills/rsp-manage/SKILL.md')).toContain('Keep RSP artifacts as durable truth and process data transient')
  })

  it('preserves historical managed-controller research outside the promoted product Skill', () => {
    const packageJson = JSON.parse(read('package.json')) as { files: string[] }
    expect(packageJson.files.some(path => path.includes('research/candidates'))).toBe(false)
    expect(currentSkills).toContain('rsp-manage')
    expect(read('skills/rsp-manage/SKILL.md')).toContain('Keep RSP artifacts as durable truth and process data transient')

    const productTruth = [
      read('research/models/rsp-skill-system.md'),
      read('research/models/rsp-capability-coverage.md'),
    ].join('\n')
    expect(productTruth).toContain('research-only')
    expect(productTruth).toContain('recommendation `revise`')
    expect(productTruth).toContain('host/external orchestration')
    expect(productTruth).toContain('RSP artifacts')
  })
})
