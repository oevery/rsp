import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { evaluateDisciplineComposition, loadDisciplineCompositionCases } from '../scripts/discipline-composition-eval.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const holdout = join(root, 'test', 'discipline-composition', 'holdout')

describe('rsp engineering-discipline composition', () => {
  it('covers routing, precedence, fallback, and authority without a controller', () => {
    const cases = loadDisciplineCompositionCases(root)

    expect(cases.map(item => item.id)).toEqual([
      'authority-restraint',
      'diagnosis-precedence',
      'diagnosis-route',
      'missing-capability-fallback',
      'ordinary-implementation',
      'tdd-route',
    ])
    expect(cases.every(item => item.expected.returned_owner === 'the same selected Change')).toBe(true)
    expect(cases.every(item => item.prohibited_actions.includes('commit'))).toBe(true)
    expect(cases.every(item => item.prohibited_actions.includes('push'))).toBe(true)
    expect(cases.every(item => item.prohibited_actions.includes('publish'))).toBe(true)
  })

  it('finds the composition contracts in the final canonical suite', () => {
    const failures = evaluateDisciplineComposition(root).filter(result => !result.passed)
    expect(failures, JSON.stringify(failures, null, 2)).toEqual([])
  })

  it('keeps diagnosis and TDD holdouts independent and uncontaminated', () => {
    const diagnoseRoot = join(holdout, 'diagnose')
    const tddRoot = join(holdout, 'tdd')
    const diagnosis = spawnSync(process.execPath, ['--test'], { cwd: diagnoseRoot, encoding: 'utf8' })
    const tdd = spawnSync(process.execPath, ['--test'], { cwd: tddRoot, encoding: 'utf8' })

    expect(diagnosis.status).toBe(1)
    expect(`${diagnosis.stdout}\n${diagnosis.stderr}`).toMatch(/'' !== 'safe'/)
    expect(tdd.status).toBe(0)
    expect(readFileSync(join(tddRoot, 'src', 'compact-label.mjs'), 'utf8')).not.toContain('…')
    expect(readFileSync(join(tddRoot, 'test', 'compact-label.test.mjs'), 'utf8')).not.toContain('abcdefghij')
    expect(readdirSync(join(diagnoseRoot, '.rsp', 'changes'))).toEqual(['fix-empty-mode.md'])
    expect(readdirSync(join(tddRoot, '.rsp', 'changes'))).toEqual(['compact-truncated-label.md'])
  })
})
