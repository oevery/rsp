import { spawnSync } from 'node:child_process'
import { expect, it } from 'vitest'

it('calibrates quality repairs and preservation controls without model calls', () => {
  const result = spawnSync('python3', ['tests/code/tooling/code_quality_matrix.py'], {
    encoding: 'utf8',
    timeout: 60000,
  })
  expect(result.status, result.stdout + result.stderr).toBe(0)
}, 65000)
