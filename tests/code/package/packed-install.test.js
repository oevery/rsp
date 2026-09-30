import { spawnSync } from 'node:child_process'
import { expect, it } from 'vitest'

it('installs the packed CLI and preserves consumer customizations on refresh', () => {
  const result = spawnSync(process.execPath, ['tests/code/package/package-check.mjs'], { encoding: 'utf8', timeout: 180000 })
  expect(result.status, result.stderr || result.stdout).toBe(0)
  expect(JSON.parse(result.stdout)).toMatchObject({ status: 'passed', missing: [], forbidden: [], installation: { cleanInstall: 'passed', installedCli: 'passed', skillRefresh: 'passed', projectUpdate: 'passed' } })
}, 190000)
