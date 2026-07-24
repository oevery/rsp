#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

function requiredArgument(name) {
  const index = process.argv.indexOf(name)
  if (index < 0 || !process.argv[index + 1])
    throw new Error(`${name} is required`)
  return resolve(process.argv[index + 1])
}

function main() {
  const cli = requiredArgument('--cli')
  const scriptRoot = dirname(fileURLToPath(import.meta.url))
  const workspace = mkdtempSync(join(tmpdir(), 'rsp-tui-terminal-check-'))
  try {
    mkdirSync(join(workspace, '.rsp', 'changes'), { recursive: true })
    for (const directory of ['focus.d', 'archives', 'specs'])
      mkdirSync(join(workspace, '.rsp', directory), { recursive: true })
    writeFileSync(join(workspace, '.rsp', 'changes', 'alpha.md'), `---\nkind: feature\n---\n\n# Change: alpha\n\n## Tasks\n- [ ] work\n\n## Verify\n- [ ] test\n\n## Blockers\n- none\n`)
    const cases = ['q', 'context-esc', 'raw-ctrl-c', 'SIGINT', 'SIGTERM', 'SIGHUP'].map(action => JSON.parse(execFileSync('python3', [
      join(scriptRoot, 'tui-pty-driver.py'),
      '--node',
      process.execPath,
      '--cli',
      cli,
      '--cwd',
      workspace,
      '--action',
      action,
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })))
    const report = {
      schema: 1,
      command: `node scripts/tui-terminal-check.mjs --cli ${cli}`,
      runtime: { node: process.version, platform: process.platform, arch: process.arch, python: execFileSync('python3', ['--version'], { encoding: 'utf8' }).trim() },
      cli,
      cases,
      passed: cases.every(item => item.passed),
    }
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
    if (!report.passed)
      process.exitCode = 1
  }
  finally {
    rmSync(workspace, { force: true, recursive: true })
  }
}

try {
  main()
}
catch (error) {
  process.stderr.write(`TUI terminal check failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
}
