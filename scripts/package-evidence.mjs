#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { arch, platform, release, tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

function argument(name, fallback) {
  const index = process.argv.indexOf(name)
  return index < 0 ? fallback : process.argv[index + 1]
}

function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options }).trim()
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
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

function prepare(root) {
  run('mise', ['exec', '--', 'pnpm', 'install', '--frozen-lockfile', '--ignore-scripts'], { cwd: root })
  run('mise', ['exec', '--', 'pnpm', 'run', 'build'], { cwd: root })
}

function packAndInstall(workspace, root, label) {
  const packRoot = join(workspace, `${label}-pack`)
  const installRoot = join(workspace, `${label}-install`)
  mkdirSync(packRoot)
  mkdirSync(installRoot)
  writeFileSync(join(installRoot, 'package.json'), `{"name":"rsp-${label}-evidence","private":true}\n`)
  const pack = JSON.parse(run('npm', ['pack', '--ignore-scripts', '--foreground-scripts=false', '--json', '--pack-destination', packRoot], { cwd: root }))[0]
  const tarball = join(packRoot, basename(pack.filename))
  run('npm', ['install', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund', '--package-lock=false', tarball], { cwd: installRoot })
  const packageRoot = join(installRoot, 'node_modules', '@oevery', 'rsp')
  const installedBin = join(packageRoot, 'bin', 'rsp.mjs')
  return {
    root,
    lock: { name: 'pnpm-lock.yaml', sha256: sha256(join(root, 'pnpm-lock.yaml')) },
    tarball,
    tarballSha256: sha256(tarball),
    packed: { bytes: pack.size, files: pack.entryCount, unpackedBytes: pack.unpackedSize },
    installedLogical: sumRegularFiles(join(installRoot, 'node_modules')),
    installedBin,
  }
}

function publicArtifact(artifact) {
  return {
    transientPaths: { sourceRoot: artifact.root, tarball: artifact.tarball, installedBin: artifact.installedBin },
    lock: artifact.lock,
    tarballSha256: artifact.tarballSha256,
    packed: artifact.packed,
    installedLogical: artifact.installedLogical,
    installedBin: 'node_modules/@oevery/rsp/bin/rsp.mjs',
  }
}

function worktreeRegistered(repository, worktree) {
  return run('git', ['worktree', 'list', '--porcelain'], { cwd: repository })
    .split('\n')
    .includes(`worktree ${worktree}`)
}

function removeRegisteredWorktree(repository, baselineRoot, workspace) {
  try {
    if (process.env.RSP_PACKAGE_EVIDENCE_FAIL_WORKTREE_REMOVE === '1')
      throw new Error('injected worktree remove failure')
    run('git', ['worktree', 'remove', '--force', baselineRoot], { cwd: repository })
  }
  catch (error) {
    process.stderr.write(`Package evidence cleanup warning: git worktree remove failed: ${error instanceof Error ? error.message : String(error)}\n`)
    rmSync(workspace, { force: true, recursive: true })
    try {
      run('git', ['worktree', 'prune'], { cwd: repository })
    }
    catch (pruneError) {
      process.stderr.write(`Package evidence cleanup warning: git worktree prune failed: ${pruneError instanceof Error ? pruneError.message : String(pruneError)}\n`)
    }
  }
  if (worktreeRegistered(repository, baselineRoot))
    throw new Error(`package evidence cleanup left a registered worktree: ${baselineRoot}`)
}

async function main() {
  const defaultRepository = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const repository = resolve(argument('--repository', defaultRepository))
  const baselineRef = argument('--baseline-ref')
  if (!baselineRef)
    throw new Error('--baseline-ref is required')
  const output = argument('--output')
  const workspace = mkdtempSync(join(resolve(process.env.RSP_PACKAGE_EVIDENCE_TMP_ROOT || tmpdir()), 'rsp-package-evidence-'))
  const baselineRoot = join(workspace, 'baseline-source')
  let worktreeAdded = false
  try {
    run('git', ['worktree', 'add', '--detach', baselineRoot, baselineRef], { cwd: repository })
    worktreeAdded = true
    if (process.env.RSP_PACKAGE_EVIDENCE_FAIL_AFTER_WORKTREE === '1')
      throw new Error('injected failure after worktree registration')
    prepare(baselineRoot)
    prepare(repository)
    const baseline = packAndInstall(workspace, baselineRoot, 'baseline')
    const candidate = packAndInstall(workspace, repository, 'candidate')
    const startup = JSON.parse(run(process.execPath, [join(repository, 'scripts', 'status-startup-benchmark.mjs'), '--baseline-cli', baseline.installedBin, '--candidate-cli', candidate.installedBin, '--warmups', '5', '--samples', '25']))
    const terminal = JSON.parse(run(process.execPath, [join(repository, 'scripts', 'tui-terminal-check.mjs'), '--cli', candidate.installedBin]))
    const report = {
      schema: 1,
      baselineRef,
      exactCommands: [
        `git worktree add --detach ${baselineRoot} ${baselineRef}`,
        `cd ${baselineRoot} && mise exec -- pnpm install --frozen-lockfile --ignore-scripts && mise exec -- pnpm run build`,
        `cd ${repository} && mise exec -- pnpm install --frozen-lockfile --ignore-scripts && mise exec -- pnpm run build`,
        `cd ${baselineRoot} && npm pack --ignore-scripts --foreground-scripts=false --json --pack-destination ${dirname(baseline.tarball)}`,
        `cd ${repository} && npm pack --ignore-scripts --foreground-scripts=false --json --pack-destination ${dirname(candidate.tarball)}`,
        `npm install --omit=dev --ignore-scripts --no-audit --no-fund --package-lock=false ${baseline.tarball}`,
        `npm install --omit=dev --ignore-scripts --no-audit --no-fund --package-lock=false ${candidate.tarball}`,
        `node scripts/status-startup-benchmark.mjs --baseline-cli ${baseline.installedBin} --candidate-cli ${candidate.installedBin} --warmups 5 --samples 25`,
        `node scripts/tui-terminal-check.mjs --cli ${candidate.installedBin}`,
      ],
      invocation: `node scripts/package-evidence.mjs --baseline-ref ${baselineRef}${repository === defaultRepository ? '' : ` --repository ${repository}`}${output ? ` --output ${output}` : ''}`,
      runtime: { node: process.version, platform: platform(), release: release(), arch: arch(), npm: run('npm', ['--version']), pnpm: run('pnpm', ['--version']) },
      baseline: publicArtifact(baseline),
      candidate: publicArtifact(candidate),
      delta: {
        packedBytes: candidate.packed.bytes - baseline.packed.bytes,
        installedBytes: candidate.installedLogical.bytes - baseline.installedLogical.bytes,
        installedFiles: candidate.installedLogical.files - baseline.installedLogical.files,
      },
      startup,
      terminal,
      gates: {
        packedBelow512KiB: candidate.packed.bytes < 512 * 1024,
        installedDeltaBelow15MiB: candidate.installedLogical.bytes - baseline.installedLogical.bytes < 15 * 1024 * 1024,
        startup: startup.passed,
        terminal: terminal.passed,
      },
    }
    report.passed = Object.values(report.gates).every(Boolean)
    const serialized = `${JSON.stringify(report, null, 2)}\n`
    if (output) {
      mkdirSync(dirname(resolve(output)), { recursive: true })
      writeFileSync(resolve(output), serialized)
    }
    process.stdout.write(serialized)
    if (!report.passed)
      process.exitCode = 1
  }
  finally {
    if (worktreeAdded) {
      removeRegisteredWorktree(repository, baselineRoot, workspace)
    }
    rmSync(workspace, { force: true, recursive: true })
  }
}

try {
  await main()
}
catch (error) {
  process.stderr.write(`Package evidence failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
}
