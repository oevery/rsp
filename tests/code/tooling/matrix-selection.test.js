import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { discoverCases, loadCase } from '../../skills/runner/core/cases.mjs'
import { compositionIdentity } from '../../skills/runner/observers/workspace.mjs'

const root = process.cwd()
const cli = join(root, 'tests/skills/runner/cli.mjs')
const temporary = []
function temp() {
  const directory = mkdtempSync(join(tmpdir(), 'rsp-matrix-selection-'))
  temporary.push(directory)
  return directory
}
afterEach(() => temporary.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })))
function provider(directory) {
  const bin = join(directory, 'provider.mjs')
  const config = join(directory, 'provider.toml')
  copyFileSync(join(root, 'tests/code/tooling/fixtures/provider.mjs'), bin)
  chmodSync(bin, 0o755)
  writeFileSync(config, 'model_provider = "fixture-provider"\n')
  return ['--allow-live', '--config-file', config, '--codex-bin', bin, '--output-root', join(directory, 'reports')]
}
function invoke(args, cwd = root) {
  return spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8', timeout: 20000 })
}

it('freezes an external composition across actual multi-case CLI runs and refuses mid-matrix drift', () => {
  const directory = temp()
  const composition = join(directory, 'candidate')
  cpSync(join(root, 'skills'), composition, { recursive: true })
  const identity = compositionIdentity(composition)
  const args = ['run', '--case', 'preserve-user-files,trigger-rsp-review', '--composition', composition, '--max-sessions', '4', ...provider(directory)]
  const stable = invoke(args)
  expect(stable.status, stable.stderr).toBe(0)
  const matrix = JSON.parse(readFileSync(JSON.parse(stable.stdout).report))
  expect(matrix).toMatchObject({ status: 'passed', complete: true, composition: identity })
  expect(matrix.runs).toHaveLength(2)
  for (const item of matrix.runs)
    expect(JSON.parse(readFileSync(item.run)).identity.compositionHash).toBe(identity.hash)

  writeFileSync(join(directory, 'provider-control.json'), JSON.stringify({ compositionFile: join(composition, 'rsp/SKILL.md') }))
  const drifted = invoke(args)
  expect(drifted.status, drifted.stderr).toBe(1)
  const rejected = JSON.parse(readFileSync(JSON.parse(drifted.stdout).report))
  expect(rejected).toMatchObject({ status: 'inconclusive', complete: false, composition: identity })
  expect(rejected.runs).toHaveLength(2)
  expect(rejected.runs[0].status).toBe('passed')
  const refused = JSON.parse(readFileSync(rejected.runs[1].run))
  expect(refused.verdict).toMatchObject({ status: 'inconclusive', reason: 'composition-failed' })
  expect(refused.result).toBeUndefined()
  expect(refused.identity.compositionHash).not.toBe(identity.hash)
}, 30000)

it('selects and runs a small case without unrelated history, but explicitly rejects a selected real snapshot', () => {
  const repository = temp()
  execFileSync('git', ['init', '--quiet', repository])
  for (const path of ['src', 'bin', 'rules', 'skills', 'dist', 'package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'tsup.config.ts', 'tests/skills/runner', 'tests/skills/config.toml', 'tests/skills/cases/behavior/preserve-user-files', 'tests/skills/cases/real/cli-contract', 'tests/skills/projects/small/preserve-user-files', 'tests/skills/projects/real/rsp-cli']) {
    const destination = join(repository, path)
    mkdirSync(dirname(destination), { recursive: true })
    cpSync(join(root, path), destination, { recursive: true })
  }
  expect(discoverCases(repository).map(entry => entry.id)).toEqual(['preserve-user-files', 'real-cli-contract'])
  expect(loadCase(repository, 'preserve-user-files').project.kind).toBe('fixture')
  expect(() => loadCase(repository, 'real-cli-contract')).toThrow('Selected project unavailable: real-cli-contract')
  for (const command of ['list', 'plan', 'check']) {
    const small = invoke([command, '--case', 'preserve-user-files'], repository)
    expect(small.status, small.stderr).toBe(0)
    const real = invoke([command, '--case', 'real-cli-contract'], repository)
    expect(real.status).toBe(2)
    expect(real.stderr).toContain('Selected project unavailable: real-cli-contract')
  }
  const args = ['run', '--max-sessions', '2', ...provider(temp())]
  const small = invoke([...args, '--case', 'preserve-user-files'], repository)
  expect(small.status, small.stderr || small.stdout).toBe(0)
  expect(JSON.parse(small.stdout).status).toBe('passed')
  const real = invoke([...args, '--case', 'real-cli-contract'], repository)
  expect(real.status).toBe(2)
  expect(real.stderr).toContain('Selected project unavailable: real-cli-contract')
}, 30000)
