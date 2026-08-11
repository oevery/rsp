import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const packageVersion = (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string }).version
const expectedSkills = [
  'rsp',
  'rsp-commit',
  'rsp-design',
  'rsp-diagnose',
  'rsp-implement',
  'rsp-land',
  'rsp-manage',
  'rsp-release-docs',
  'rsp-resolve-findings',
  'rsp-review',
  'rsp-shape',
  'rsp-structural-audit',
  'rsp-tdd',
  'rsp-verify',
  'rsp-workspace',
]

function processExists(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH')
      return false
    throw error
  }
}

function waitForProcessExit(pid: number, timeoutMs = 2000): boolean {
  const deadline = Date.now() + timeoutMs
  const sleeper = new Int32Array(new SharedArrayBuffer(4))
  while (Date.now() < deadline) {
    if (!processExists(pid))
      return true
    Atomics.wait(sleeper, 0, 0, 25)
  }
  return !processExists(pid)
}

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
      expect(report.package).toBe(`@oevery/rsp@${packageVersion}`)
      expect(report.entrySmoke).toEqual({
        help: true,
        version: packageVersion,
        npmExecVersion: packageVersion,
        init: true,
        skillsInstall: true,
        skillsInstallIdempotent: true,
        optionalSkillInstall: true,
        optionalSkillInstallIdempotent: true,
        statusJson: true,
        specsJson: true,
        runtimeStore: {
          schema: '1.4',
          eventCount: 1,
          manageCapability: 'rsp.manage-runtime@1.0',
          manageRunId: 'package-manage-run',
          manageSourceSequence: 1,
          disposal: 'absent',
          sqliteDisabled: 'runtime_sqlite_unavailable',
          ordinaryCliWithoutSqlite: true,
        },
        brokerLifecycle: {
          before: 'absent',
          start: 'running',
          reused: false,
          status: 'running',
          stop: true,
          processExited: true,
          after: 'absent',
        },
        webObservatory: {
          commandSafe: true,
          page: 200,
          assets: true,
          projection: '1.1',
          managed: true,
          projectIsolation: true,
          securityHeaders: true,
        },
        nonTtyUi: { exitCode: 1, stderr: 'Error: rsp ui requires an interactive terminal; use rsp status or rsp status --json instead' },
        invalidLocale: { exitCode: 1, stderr: 'Error: --lang must be auto, en, or zh-CN' },
      })
      expect(report.tarballSha256).toMatch(/^[a-f0-9]{64}$/)
      expect(report.inventory.skills).toEqual(expectedSkills)
      expect(report.inventory.defaultProjectSkills).toEqual(expectedSkills.filter(name => name !== 'rsp-structural-audit'))
      expect(report.inventory.projectSkills).toEqual(expectedSkills)
      expect(report.rspDesignReferences).toEqual([
        'domain-modeling.md',
        'module-seams.md',
        'reversible-exploration.md',
      ])
      expect(report.rspCoreReferences).toEqual([
        'conflict-handling.md',
        'durable-review.md',
        'groups-dependencies.md',
        'managed-routing.md',
        'release-operations.md',
        'reopen-recovery.md',
        'response-language.md',
        'setup-repair.md',
      ])
      expect(report.prepareReleaseNotesReferences).toEqual([
        'convention-discovery.md',
        'evidence-and-surfaces.md',
        'output-contracts.md',
        'publication-lifecycle.md',
      ])
      expect(report.inventory.files).toContain('skills/rsp-design/SKILL.md')
      expect(report.inventory.files).toContain('skills/rsp-commit/SKILL.md')
      expect(report.inventory.files).toContain('skills/rsp-manage/SKILL.md')
      expect(report.inventory.files).toContain('skills/rsp-release-docs/SKILL.md')
      expect(report.inventory.files).toContain('skills/rsp-structural-audit/SKILL.md')
      expect(report.inventory.files).toContain('skills/rsp-structural-audit/references/structural-lenses.md')
      expect(report.inventory.files).toContain('dist/broker-daemon.mjs')
      expect(report.inventory.files).toContain('dist/manage-runtime.mjs')
      expect(report.inventory.files).toContain('dist/runtime-store.mjs')
      expect(report.inventory.files).toContain('dist/web-projector.mjs')
      expect(report.inventory.files).toContain('web/static/index.html')
      expect(report.inventory.files).toContain('web/static/app.css')
      expect(report.inventory.files).toContain('web/static/app.js')
      for (const path of [
        'skills/rsp/references/conflict-handling.md',
        'skills/rsp/references/durable-review.md',
        'skills/rsp/references/groups-dependencies.md',
        'skills/rsp/references/managed-routing.md',
        'skills/rsp/references/release-operations.md',
        'skills/rsp/references/reopen-recovery.md',
        'skills/rsp/references/response-language.md',
        'skills/rsp/references/setup-repair.md',
        'skills/rsp-release-docs/references/evidence-and-surfaces.md',
        'skills/rsp-release-docs/references/publication-lifecycle.md',
      ])
        expect(report.inventory.files).toContain(path)
      expect(report.inventory.files.some((path: string) => /^(?:research|\.rsp|\.agents|\.codex|scripts|\.cache)(?:\/|$)/u.test(path))).toBe(false)
      expect(readdirSync(temporaryRoot)).toEqual([])
    }
    finally {
      rmSync(temporaryRoot, { force: true, recursive: true })
    }
  }, 120_000)

  it('cleans a started Broker when start output validation fails', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'rsp-package-check-broker-failure-'))
    const packageTemporaryRoot = join(temporaryRoot, 'package-workspaces')
    const pidPath = join(temporaryRoot, 'broker.pid')
    mkdirSync(packageTemporaryRoot)
    let brokerPid: number | undefined
    try {
      const result = spawnSync(process.execPath, [join(root, 'scripts', 'clean-install-check.mjs'), '--json'], {
        cwd: root,
        encoding: 'utf8',
        env: {
          ...process.env,
          RSP_PACKAGE_CHECK_TEST_BROKER_IDLE_MS: '60000',
          RSP_PACKAGE_CHECK_TEST_BROKER_PID_FILE: pidPath,
          RSP_PACKAGE_CHECK_TEST_BROKER_START_OUTPUT: 'invalid-json',
          RSP_PACKAGE_CHECK_TMP_ROOT: packageTemporaryRoot,
        },
      })

      expect(result.status).toBe(1)
      expect(result.stderr).toContain('Clean install invalid: Installed rsp broker start did not return valid JSON')
      brokerPid = Number.parseInt(readFileSync(pidPath, 'utf8').trim(), 10)
      expect(Number.isSafeInteger(brokerPid)).toBe(true)
      expect(waitForProcessExit(brokerPid)).toBe(true)
      expect(readdirSync(packageTemporaryRoot)).toEqual([])
    }
    finally {
      if (brokerPid && processExists(brokerPid)) {
        process.kill(brokerPid, 'SIGTERM')
        waitForProcessExit(brokerPid)
      }
      rmSync(temporaryRoot, { force: true, recursive: true })
    }
  }, 120_000)

  it('retains decisive child-process diagnostics when the installed Web smoke fails', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'rsp-package-check-web-smoke-failure-'))
    try {
      const result = spawnSync(process.execPath, [join(root, 'scripts', 'clean-install-check.mjs'), '--json'], {
        cwd: root,
        encoding: 'utf8',
        env: {
          ...process.env,
          RSP_PACKAGE_CHECK_TEST_BROKER_IDLE_MS: '60000',
          RSP_PACKAGE_CHECK_TEST_WEB_SMOKE_FAILURE: 'exit-17',
          RSP_PACKAGE_CHECK_TMP_ROOT: temporaryRoot,
        },
      })

      expect(result.status).toBe(1)
      expect(result.stderr).toContain(
        'Installed Web Observatory smoke failed: status=17; signal=none; stdout="web-smoke-stdout"; stderr="web-smoke-stderr"',
      )
      expect(readdirSync(temporaryRoot)).toEqual([])
    }
    finally {
      rmSync(temporaryRoot, { force: true, recursive: true })
    }
  }, 120_000)

  it('rejects an undeclared file even when it is under an allowed package root', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'rsp-package-check-inventory-'))
    try {
      const result = spawnSync(process.execPath, [join(root, 'scripts', 'clean-install-check.mjs'), '--json'], {
        cwd: root,
        encoding: 'utf8',
        env: {
          ...process.env,
          RSP_PACKAGE_CHECK_TEST_INVENTORY_EXTRA: 'web/static/unexpected.tmp',
          RSP_PACKAGE_CHECK_TMP_ROOT: temporaryRoot,
        },
      })

      expect(result.status).toBe(1)
      expect(result.stderr).toContain('Package inventory does not match the declared release inventory')
      expect(result.stderr).toContain('unexpected: web/static/unexpected.tmp')
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
    expect(JSON.parse(result.stdout).package).toBe(`@oevery/rsp@${packageVersion}`)
  }, 120_000)
})
