import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'

it('installs the packed CLI and preserves consumer customizations on refresh', () => {
  const result = spawnSync(process.execPath, ['tests/code/package/package-check.mjs'], { encoding: 'utf8', timeout: 180000 })
  expect(result.status, result.stderr || result.stdout).toBe(0)
  expect(JSON.parse(result.stdout)).toMatchObject({ status: 'passed', missing: [], forbidden: [], installation: { cleanInstall: 'passed', installedCli: 'passed', skillRefresh: 'passed', projectUpdate: 'passed' } })
}, 190000)

it('checks the provided candidate without repacking or changing its bytes', () => {
  const directory = mkdtempSync(join(tmpdir(), 'rsp-provided-package-'))
  try {
    const packed = spawnSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', directory], { encoding: 'utf8' })
    expect(packed.status, packed.stderr).toBe(0)
    const tarball = join(directory, 'candidate.tgz')
    renameSync(join(directory, JSON.parse(packed.stdout)[0].filename), tarball)
    const digest = () => createHash('sha256').update(readFileSync(tarball)).digest('hex')
    const before = digest()
    // A mistaken npm pack would only preview and leave no archive to check.
    const result = spawnSync(process.execPath, ['tests/code/package/package-check.mjs'], {
      encoding: 'utf8',
      timeout: 180000,
      env: { ...process.env, TARBALL: tarball, npm_config_dry_run: 'true' },
    })
    expect(result.status, result.stderr || result.stdout).toBe(0)
    expect(JSON.parse(result.stdout)).toMatchObject({ status: 'passed', package: 'candidate.tgz', missing: [], forbidden: [], installation: { cleanInstall: 'passed', installedCli: 'passed', skillRefresh: 'passed', projectUpdate: 'passed' } })
    expect(digest()).toBe(before)
  }
  finally {
    rmSync(directory, { recursive: true, force: true })
  }
}, 190000)

it('does not fall back to a warm project cache when an empty npm cache is explicitly selected', () => {
  const directory = mkdtempSync(join(tmpdir(), 'rsp-selected-cache-'))
  try {
    const env = { ...process.env, npm_config_cache: undefined, NPM_CONFIG_CACHE: undefined }
    const baseline = spawnSync(process.execPath, ['tests/code/package/package-check.mjs'], {
      encoding: 'utf8',
      timeout: 180000,
      env,
    })
    expect(baseline.status, baseline.stderr || baseline.stdout).toBe(0)
    for (const field of ['npm_config_cache', 'NPM_CONFIG_CACHE']) {
      const result = spawnSync(process.execPath, ['tests/code/package/package-check.mjs'], {
        encoding: 'utf8',
        timeout: 180000,
        env: { ...env, RSP_INSTALL_ALLOW_NETWORK: '0', [field]: join(directory, field) },
      })
      expect(result.status).toBe(1)
      expect(result.stderr).toContain('Offline clean install unavailable')
    }
  }
  finally {
    rmSync(directory, { recursive: true, force: true })
  }
}, 190000)

it('rejects an installed CLI terminated during an expected rejection', () => {
  const directory = mkdtempSync(join(tmpdir(), 'rsp-abnormal-cli-'))
  try {
    const fixture = join(directory, 'package')
    mkdirSync(fixture)
    for (const entry of ['package.json', 'bin', 'dist', 'rules', 'skills'])
      cpSync(join(process.cwd(), entry), join(fixture, entry), { recursive: true })
    writeFileSync(join(fixture, 'bin/rsp.mjs'), `
if (process.argv.slice(2).join(' ') === 'skills install rsp-review') {
  process.kill(process.pid, 'SIGTERM')
}
else {
  const { runCliMain } = await import('../dist/cli.mjs')
  void runCliMain()
}
`)
    const packed = spawnSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', directory], { cwd: fixture, encoding: 'utf8' })
    expect(packed.status, packed.stderr).toBe(0)
    const result = spawnSync(process.execPath, ['tests/code/package/package-check.mjs'], {
      encoding: 'utf8',
      timeout: 180000,
      env: { ...process.env, TARBALL: join(directory, JSON.parse(packed.stdout)[0].filename) },
    })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Installed CLI contract failed: skills install rsp-review')
  }
  finally {
    rmSync(directory, { recursive: true, force: true })
  }
}, 190000)

it('rejects a relative candidate path before packing or installing', () => {
  const result = spawnSync(process.execPath, ['tests/code/package/package-check.mjs'], {
    encoding: 'utf8',
    timeout: 10000,
    env: { ...process.env, TARBALL: 'relative.tgz' },
  })
  expect(result.status).not.toBe(0)
  expect(result.stderr).toContain('TARBALL must be an absolute path')
})
