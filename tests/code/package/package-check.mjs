#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { checkInstalledPackage } from './install-check.mjs'

const root = process.cwd()
const temporaryRoot = mkdtempSync(join(tmpdir(), 'rsp-package-check-'))
try {
  const result = spawnSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', temporaryRoot], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'pipe',
  })
  if (result.status !== 0)
    throw new Error(result.stderr.trim() || 'npm pack failed')

  const packed = JSON.parse(result.stdout)
  const filename = packed[0]?.filename
  if (!filename)
    throw new Error('npm pack returned no tarball')
  const tarball = filename.startsWith('/') ? filename : join(temporaryRoot, filename)
  const listing = spawnSync('tar', ['-tf', tarball], { encoding: 'utf8', stdio: 'pipe' })
  if (listing.status !== 0)
    throw new Error(listing.stderr.trim() || 'tar listing failed')

  const files = listing.stdout.split('\n').filter(Boolean).map(path => path.replace(/^package\//, ''))
  const forbidden = files.filter(path => /^(?:tests|evals|release)(?:\/|$)|^skills\/rsp-release-docs(?:\/|$)/u.test(path))
  const required = [
    'bin/rsp.mjs',
    'dist/cli.mjs',
    'rules/rsp-rules.md',
    ...['rsp', 'rsp-shape', 'rsp-implement', 'rsp-verify', 'rsp-review', 'rsp-commit', 'rsp-structural-audit', 'rsp-doc']
      .map(name => `skills/${name}/SKILL.md`),
  ]
  const missing = required.filter(path => !files.includes(path))
  const installation = forbidden.length === 0 && missing.length === 0 ? checkInstalledPackage(root, tarball, temporaryRoot) : null
  const report = { status: installation ? 'passed' : 'failed', package: filename, files: files.length, required, missing, forbidden, installation }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  process.exitCode = report.status === 'passed' ? 0 : 1
}
catch (error) {
  process.stderr.write(`Package check failed: ${error.message}\n`)
  process.exitCode = 1
}
finally {
  rmSync(temporaryRoot, { force: true, recursive: true })
}
