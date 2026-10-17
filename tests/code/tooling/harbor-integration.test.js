import { spawnSync } from 'node:child_process'
import { expect, it } from 'vitest'

it('keeps calibration, unavailable grading and retry evidence distinct from acceptance', () => {
  const result = spawnSync('uv', ['run', '--frozen', '--project', 'tests/skills', 'python', 'tests/code/tooling/evaluation_contract.py', '-v'], {
    encoding: 'utf8',
    // The 43-method suite measured 118.5s with local metadata; preserve all
    // fixture/negative controls and allow bounded cold-start headroom.
    timeout: 180000,
  })
  expect(result.status, result.stdout + result.stderr).toBe(0)
}, 185000)
