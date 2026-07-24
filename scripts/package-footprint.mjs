#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

function argument(name, fallback) {
  const index = process.argv.indexOf(name)
  return index < 0 ? fallback : process.argv[index + 1]
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim()
}

function sumRegularFiles(root) {
  let bytes = 0
  let files = 0
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name)
    const stats = lstatSync(path)
    if (stats.isDirectory()) {
      const child = sumRegularFiles(path)
      bytes += child.bytes
      files += child.files
    }
    else if (stats.isFile()) {
      bytes += stats.size
      files += 1
    }
  }
  return { bytes, files }
}

function lockfileMetadata(root) {
  for (const name of ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock']) {
    const path = join(root, name)
    try {
      const content = readFileSync(path)
      return { name, sha256: createHash('sha256').update(content).digest('hex') }
    }
    catch {}
  }
  return { name: null, sha256: null }
}

function main() {
  const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const root = resolve(argument('--root', defaultRoot))
  const npmCli = argument('--npm-cli')
  const runNpm = (args, options = {}) => npmCli
    ? run(process.execPath, [resolve(npmCli), ...args], options)
    : run('npm', args, options)
  const workspace = mkdtempSync(join(resolve(process.env.RSP_FOOTPRINT_TMP_ROOT || tmpdir()), 'rsp-footprint-'))
  try {
    const packRoot = join(workspace, 'pack')
    const installRoot = join(workspace, 'install')
    mkdirSync(packRoot)
    mkdirSync(installRoot)
    writeFileSync(join(installRoot, 'package.json'), '{"name":"rsp-footprint","private":true}\n')
    const pack = JSON.parse(runNpm([
      'pack',
      '--ignore-scripts',
      '--foreground-scripts=false',
      '--json',
      '--pack-destination',
      packRoot,
    ], { cwd: root }))[0]
    const tarball = join(packRoot, basename(pack.filename))
    runNpm([
      'install',
      '--omit=dev',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--package-lock=false',
      tarball,
    ], { cwd: installRoot })
    const installed = sumRegularFiles(join(installRoot, 'node_modules'))
    const report = {
      schema: 1,
      package: `${pack.name}@${pack.version}`,
      root,
      packed: { bytes: pack.size, files: pack.entryCount, unpackedBytes: pack.unpackedSize },
      installedLogical: installed,
      packageManager: runNpm(['--version']),
      lockfile: lockfileMetadata(root),
      runtime: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    }
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  }
  finally {
    rmSync(workspace, { force: true, recursive: true })
  }
}

try {
  main()
}
catch (error) {
  process.stderr.write(`Package footprint failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
}
