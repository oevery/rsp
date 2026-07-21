import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const stableSkills = [
  'rsp',
  'rsp-address-review',
  'rsp-diagnose',
  'rsp-implement',
  'rsp-review',
  'rsp-shape',
  'rsp-tdd',
]

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8')
}

describe('3.0 daily-workflow product surface', () => {
  it('keeps progressive shaping depth inside the seven-Skill suite', () => {
    expect(readdirSync(join(root, 'skills')).sort()).toEqual(stableSkills)

    const shape = read('skills/rsp-shape/SKILL.md')
    const deepClarification = read('skills/rsp-shape/references/deep-clarification.md')
    expect(shape).toContain('references/deep-clarification.md')
    expect(deepClarification).toContain('the same returning WorkRef')

    const readme = read('README.md')
    const readmeZh = read('README.zh-CN.md')
    const design = read('.rsp/specs/design.md')
    expect(readme).toContain('The 3.0 product surface remains these seven Skills.')
    expect(readmeZh).toContain('3.0 产品面仍是这七个 Skills。')
    expect(readmeZh).toContain('通过同一个 WorkRef 返回')
    expect(design).toContain('Same-case terminal evidence qualifies the deep branch')
    expect(readme).toContain('Five same-case terminal journeys qualify Shape')
  })

  it('keeps managed continuation external and the rsp-manage candidate unpromoted', () => {
    const packageJson = JSON.parse(read('package.json')) as { files: string[] }
    expect(packageJson.files.some(path => path.includes('research/candidates'))).toBe(false)
    expect(stableSkills).not.toContain('rsp-manage')

    const productTruth = [
      read('README.md'),
      read('README.zh-CN.md'),
      read('.rsp/specs/design.md'),
      read('research/models/rsp-skill-system.md'),
      read('research/models/rsp-capability-coverage.md'),
    ].join('\n')
    expect(productTruth).toContain('research-only')
    expect(productTruth).toContain('recommendation `revise`')
    expect(productTruth).toContain('host/external orchestration')
    expect(productTruth).toContain('RSP artifacts')

    const readmeZh = read('README.zh-CN.md')
    expect(readmeZh).toContain('recommendation 为 `revise`')
    expect(readmeZh).toContain('五个 same-case terminal journeys 已验证 Shape progressive depth')
  })
})
