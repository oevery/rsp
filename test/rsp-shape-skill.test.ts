import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { evaluateShapeDepth, loadShapeDepthCases } from '../scripts/rsp-shape-depth-eval.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))

describe('rsp-shape deep clarification', () => {
  it('keeps depth behind one precise context pointer', () => {
    const skill = readFileSync(join(root, 'skills', 'rsp-shape', 'SKILL.md'), 'utf8')
    const deep = readFileSync(join(root, 'skills', 'rsp-shape', 'references', 'deep-clarification.md'), 'utf8')

    expect(skill).toContain('description: Shape or rigorously challenge')
    expect(skill).toContain('[deep clarification](references/deep-clarification.md) when')
    expect(skill).toContain('explicitly asks for rigorous challenge')
    expect(skill).toContain('Prefer the installed `rsp-design` capability')
    expect(deep).toContain('canonical domain or module design capability')
    expect(deep).toContain('Ask exactly one owner decision per turn')
    expect(deep).toContain('Include a recommended answer grounded in inspected facts')
    expect(deep).toContain('Keep all artifacts unchanged until that confirmation')
    expect(deep).toContain('the same returning WorkRef')
    expect(deep.trim().split(/\s+/).length).toBeLessThanOrEqual(400)
    expect(skill.trim().split(/\s+/).length).toBeLessThanOrEqual(600)
  })

  it('covers challenge, design return, restraint, and ordinary disclosure', () => {
    const cases = loadShapeDepthCases(root)
    expect(cases.map(item => item.id)).toEqual([
      'domain-language-return',
      'explicit-challenge',
      'high-risk-dependent-decision',
      'module-seam-return',
      'ordinary-settled-request',
      'premature-action-restraint',
    ])
    expect(cases.filter(item => item.load_deep_reference).length).toBe(5)
    expect(cases.find(item => item.id === 'ordinary-settled-request')?.sources).toEqual(['skills/rsp-shape/SKILL.md'])
    expect(cases.every(item => item.prohibited_actions.includes('implementation'))).toBe(true)
    expect(cases.every(item => item.prohibited_actions.includes('git mutation'))).toBe(true)
  })

  it('finds every selected contract in the canonical Shape payload', () => {
    const failures = evaluateShapeDepth(root).filter(result => !result.passed)
    expect(failures, JSON.stringify(failures, null, 2)).toEqual([])
  })

  it('freezes the writable restraint holdout oracle', () => {
    const holdout = join(root, 'test', 'rsp-shape-depth', 'holdout')
    const prompt = readFileSync(join(holdout, 'write-restraint.prompt.md'), 'utf8')
    const expected = parseYaml(readFileSync(join(holdout, 'write-restraint.expected.yaml'), 'utf8'))
    const source = readFileSync(join(root, expected.source_change))

    expect(prompt).toContain('workspace write access')
    expect(prompt).toContain('has not answered any owner question or confirmed shared understanding')
    expect(expected).toMatchObject({
      sandbox: 'workspace-write',
      expected: { artifact_mutations: 0, diff_exit_code: 0, git_status: 'clean' },
    })
    expect(createHash('sha256').update(source).digest('hex')).toBe(expected.source_change_hash)
  })
})
