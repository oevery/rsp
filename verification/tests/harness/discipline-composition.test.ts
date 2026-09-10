import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const holdout = join(root, 'verification', 'evaluations', 'workflows', 'discipline-composition', 'holdout')

describe('rsp engineering-discipline composition', () => {
  it('executes the failing diagnosis and passing TDD holdouts', () => {
    const diagnoseRoot = join(holdout, 'diagnose')
    const tddRoot = join(holdout, 'tdd')
    const diagnosis = spawnSync(process.execPath, ['--test'], { cwd: diagnoseRoot, encoding: 'utf8' })
    const tdd = spawnSync(process.execPath, ['--test'], { cwd: tddRoot, encoding: 'utf8' })

    expect(diagnosis.status).toBe(1)
    expect(`${diagnosis.stdout}\n${diagnosis.stderr}`).toMatch(/'' !== 'safe'/)
    expect(tdd.status).toBe(0)
  })
})
