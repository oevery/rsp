import { spawnSync } from 'node:child_process'
import { expect, it } from 'vitest'

it('keeps calibration, unavailable grading and retry evidence distinct from acceptance', () => {
  const result = spawnSync('uv', ['run', '--frozen', '--project', 'tests/skills', 'python', 'tests/code/tooling/evaluation_contract.py'], {
    encoding: 'utf8',
    timeout: 30000,
  })
  expect(result.status, result.stdout + result.stderr).toBe(0)
}, 35000)
