import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../..', import.meta.url))
const packageVersion = (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string }).version
const expectedSkills = [
  'rsp',
  'rsp-commit',
  'rsp-design',
  'rsp-diagnose',
  'rsp-implement',
  'rsp-manage',
  'rsp-release-docs',
  'rsp-resolve-findings',
  'rsp-review',
  'rsp-shape',
  'rsp-structural-audit',
  'rsp-tdd',
  'rsp-verify',
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
      expect(report.package).toBe(`@oevery/rsp@${packageVersion}`)
      expect(report.entrySmoke).toMatchObject({
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
        lifecycle: {
          incompleteReadyBlocked: true,
          focusCapsuleProjected: true,
          completedReady: true,
          archivedHistory: true,
        },
        exactCommit: {
          committedPaths: ['accepted.txt'],
          unrelatedDirtyPreserved: true,
        },
        unsupportedWorkspaceConfigRejected: true,
        compatibilityBoundary: {
          nodeEngine: '>=22',
        },
        nonTtyUi: { exitCode: 1, stderr: 'Error: rsp ui requires an interactive terminal; use rsp status or rsp status --json instead' },
        invalidLocale: { exitCode: 1, stderr: 'Error: --lang must be auto, en, or zh-CN' },
      })
      expect(report.tarballSha256).toMatch(/^[a-f0-9]{64}$/)
      expect(report.projectCoverage).toEqual({
        observed: expect.arrayContaining([
          'complex-existing-rsp',
          'dirty-git-worktree',
          'fresh-adoption',
          'monorepo-nesting',
          'published-upgrade',
          'real-project',
          'unicode-content',
        ]),
        required: [
          'complex-existing-rsp',
          'dirty-git-worktree',
          'fresh-adoption',
          'monorepo-nesting',
          'published-upgrade',
          'unicode-content',
        ],
      })
      expect(report.projectScenarios).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: 'home-manager-fresh-adoption',
          kind: 'fresh-adoption',
          checks: {
            init: true,
            addSpec: true,
            doctor: true,
            status: true,
            specs: true,
            preservedFiles: true,
          },
        }),
        expect.objectContaining({
          id: 'rsp-v3-2-published-upgrade',
          kind: 'published-upgrade',
          sourceVersion: '3.2.0',
          checks: {
            update: true,
            doctor: true,
            check: true,
            specs: true,
            generatedIndexRemoved: true,
          },
        }),
        expect.objectContaining({
          id: 'sanitized-dirty-git-adoption',
          derivedFrom: 'sanitized-product-worktree',
          sanitizationVersion: 'v1',
          checks: expect.objectContaining({ dirtyGitWorktree: true, preservedFiles: true }),
        }),
        expect.objectContaining({
          id: 'sanitized-existing-rsp',
          kind: 'existing-rsp',
          checks: {
            update: true,
            doctor: true,
            check: true,
            status: true,
            specs: true,
            history: true,
            preservedFiles: true,
          },
        }),
        expect.objectContaining({
          id: 'sanitized-unicode-monorepo-adoption',
          checks: expect.objectContaining({ monorepoNesting: true, unicodeContent: true }),
        }),
      ]))
      for (const coverage of report.projectCoverage.required)
        expect(report.projectCoverage.observed).toContain(coverage)
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
        'control-outcome.md',
        'durable-review.md',
        'groups-dependencies.md',
        'managed-routing.md',
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
      for (const path of [
        'skills/rsp/references/conflict-handling.md',
        'skills/rsp/references/control-outcome.md',
        'skills/rsp/references/durable-review.md',
        'skills/rsp/references/groups-dependencies.md',
        'skills/rsp/references/managed-routing.md',
        'skills/rsp/references/reopen-recovery.md',
        'skills/rsp/references/response-language.md',
        'skills/rsp/references/setup-repair.md',
        'skills/rsp-manage/SKILL.md',
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

  it('rejects an undeclared file even when it is under an allowed package root', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'rsp-package-check-inventory-'))
    try {
      const result = spawnSync(process.execPath, [join(root, 'scripts', 'clean-install-check.mjs'), '--json'], {
        cwd: root,
        encoding: 'utf8',
        env: {
          ...process.env,
          RSP_PACKAGE_CHECK_TEST_INVENTORY_EXTRA: 'dist/unexpected.tmp',
          RSP_PACKAGE_CHECK_TMP_ROOT: temporaryRoot,
        },
      })

      expect(result.status).toBe(1)
      expect(result.stderr).toContain('Package inventory does not match the declared release inventory')
      expect(result.stderr).toContain('unexpected: dist/unexpected.tmp')
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
