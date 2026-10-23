import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

const workspace = fileURLToPath(new URL('../skills/tasks/correction-continue/environment/workspace/', import.meta.url))

it.each([['original failing source', false], ['repaired source', true]])('preserves the isolated check exit code for %s', (_, repaired) => {
  const directory = mkdtempSync(join(tmpdir(), 'rsp-check-receipt-'))
  try {
    mkdirSync(join(directory, 'src'))
    mkdirSync(join(directory, 'tools'))
    const original = readFileSync(join(workspace, 'src/expiry.mjs'), 'utf8')
    writeFileSync(join(directory, 'src/expiry.mjs'), repaired ? original.replace('now <= Number', 'now < Number') : original)
    writeFileSync(join(directory, 'tools/check.mjs'), readFileSync(join(workspace, 'tools/check.mjs')))
    const env = { PATH: process.env.PATH, HOME: directory, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' }
    const git = args => spawnSync('git', args, { cwd: directory, env, encoding: 'utf8', timeout: 5000 })
    expect(git(['init', '-q']).status).toBe(0)
    // Trusted local reproducer of the observed organization, not execution of captured text.
    const mixed = spawnSync('bash', ['--noprofile', '--norc', '-c', 'node tools/check.mjs; git status --short'], {
      cwd: directory,
      env,
      encoding: 'utf8',
      timeout: 5000,
    })
    expect(mixed.error).toBeUndefined()
    expect(mixed.status).toBe(0)
    if (!repaired)
      expect(mixed.stderr).toContain('AssertionError')
    const result = spawnSync(process.execPath, ['tools/check.mjs'], { cwd: directory, env, encoding: 'utf8', timeout: 5000 })
    expect(result.error).toBeUndefined()
    expect(result.signal).toBeNull()
    expect(git(['status', '--short']).status).toBe(0)
    expect(result.status).toBe(repaired ? 0 : 1)
  }
  finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
