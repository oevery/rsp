import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const expectedSkills = [
  'prepare-release-notes',
  'rsp',
  'rsp-address-review',
  'rsp-design',
  'rsp-diagnose',
  'rsp-implement',
  'rsp-review',
  'rsp-shape',
  'rsp-tdd',
]

describe('clean install package check', () => {
  it('packs, installs, validates, reports, and cleans the exact package', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'rsp-package-check-test-'))
    try {
      const result = spawnSync(process.execPath, [join(root, 'scripts', 'clean-install-check.mjs'), '--json'], {
        cwd: root,
        encoding: 'utf8',
        env: { ...process.env, RSP_PACKAGE_CHECK_TMP_ROOT: temporaryRoot },
      })

      expect(result.status, result.stderr || result.stdout).toBe(0)
      const report = JSON.parse(result.stdout) as Record<string, any>
      expect(report.package).toBe('@oevery/rsp@3.0.0')
      expect(report.tarballSha256).toMatch(/^[a-f0-9]{64}$/)
      expect(report.inventory.skills).toEqual(expectedSkills)
      expect(report.rspDesignReferences).toEqual([
        'domain-modeling.md',
        'module-seams.md',
        'reversible-exploration.md',
      ])
      expect(report.prepareReleaseNotesReferences).toEqual([
        'convention-discovery.md',
        'output-contracts.md',
      ])
      expect(report.inventory.files).toContain('skills/rsp-design/SKILL.md')
      expect(report.inventory.files).toContain('skills/prepare-release-notes/SKILL.md')
      expect(report.inventory.files).toContain('skills/prepare-release-notes/references/output-contracts.md')
      expect(report.inventory.files.some((path: string) => /^(?:research|\.rsp|\.agents|scripts|\.cache)(?:\/|$)/u.test(path))).toBe(false)
      expect(readdirSync(temporaryRoot)).toEqual([])
    }
    finally {
      rmSync(temporaryRoot, { force: true, recursive: true })
    }
  }, 120_000)

  it('keeps npm pack JSON clean when lifecycle output would be foregrounded', ({ onTestFinished }) => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'rsp-package-check-npm10-'))
    onTestFinished(() => rmSync(temporaryRoot, { force: true, recursive: true }))
    const fakeBin = join(temporaryRoot, 'bin')
    mkdirSync(fakeBin)
    const wrapperModule = join(fakeBin, 'npm-wrapper.mjs')
    writeFileSync(wrapperModule, `
import { spawnSync } from 'node:child_process'
const args = process.argv.slice(2)
if (args[0] === 'pack' && !args.includes('--foreground-scripts=false'))
  process.stdout.write('prepare lifecycle output\\n')
const command = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const result = spawnSync(command, args, {
  env: { ...process.env, PATH: process.env.RSP_TEST_REAL_PATH },
  shell: process.platform === 'win32',
  stdio: 'inherit',
})
process.exit(result.status ?? 1)
`)
    const npmWrapper = join(fakeBin, process.platform === 'win32' ? 'npm.cmd' : 'npm')
    if (process.platform === 'win32') {
      writeFileSync(npmWrapper, `@echo off\r\n"${process.execPath}" "${wrapperModule}" %*\r\n`)
    }
    else {
      writeFileSync(npmWrapper, `#!/bin/sh\nexec "${process.execPath}" "${wrapperModule}" "$@"\n`)
      chmodSync(npmWrapper, 0o755)
    }

    const result = spawnSync(process.execPath, [join(root, 'scripts', 'clean-install-check.mjs'), '--json'], {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${fakeBin}${delimiter}${process.env.PATH}`,
        RSP_PACKAGE_CHECK_TMP_ROOT: temporaryRoot,
        RSP_TEST_REAL_PATH: process.env.PATH,
      },
    })

    expect(result.status, result.stderr || result.stdout).toBe(0)
    expect(JSON.parse(result.stdout).package).toBe('@oevery/rsp@3.0.0')
  }, 120_000)
})
