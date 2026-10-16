import { spawnSync } from 'node:child_process'
import { expect, it } from 'vitest'

it('keeps calibration, unavailable grading and retry evidence distinct from acceptance', () => {
  const result = spawnSync('uv', ['run', '--frozen', '--project', 'tests/skills', 'python', 'tests/code/tooling/evaluation_contract.py'], {
    encoding: 'utf8',
    // Includes all fixture calibrations and negative controls; keep a bounded
    // budget large enough for cold Python startup and the expanded catalog.
    timeout: 90000,
  })
  expect(result.status, result.stdout + result.stderr).toBe(0)
}, 95000)
