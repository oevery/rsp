import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const cli = join(root, 'dist/cli.mjs')
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version as string
const projects: string[] = []

afterEach(() => {
  for (const path of projects.splice(0))
    rmSync(path, { recursive: true, force: true })
})

function run(project: string, ...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { cwd: project, encoding: 'utf8' })
}

function project() {
  const directory = mkdtempSync(join(tmpdir(), 'rsp-pinned-runtime-'))
  projects.push(directory)
  expect(run(directory, 'init').status).toBe(0)
  return directory
}

describe('pinned Skills-only runtime', () => {
  it('pins setup, generates an exact invocation and diagnoses missing or divergent Skills', () => {
    const directory = project()
    expect(readFileSync(join(directory, '.rsp/version'), 'utf8')).toBe(`${version}\n`)
    expect(readFileSync(join(directory, 'AGENTS.md'), 'utf8')).toContain(`npx -y @oevery/rsp@${version} <command>`)
    expect(existsSync(join(directory, '.rsp/rsp-rules.md'))).toBe(false)
    const missing = JSON.parse(run(directory, 'doctor', '--json').stdout)
    expect(missing.checks).toContainEqual(expect.objectContaining({ code: 'project_skill_suite', status: 'issue' }))
    expect(run(directory, 'skills', 'install').status).toBe(0)
    const installed = JSON.parse(run(directory, 'doctor', '--json').stdout)
    expect(installed.checks).toContainEqual(expect.objectContaining({ code: 'project_skill_suite', status: 'ok' }))
    const skill = join(directory, '.agents/skills/rsp/SKILL.md')
    writeFileSync(skill, `${readFileSync(skill, 'utf8')}\nLocal customization.\n`)
    const drift = JSON.parse(run(directory, 'doctor', '--fix', '--json').stdout)
    expect(drift.checks).toContainEqual(expect.objectContaining({ code: 'project_skill_suite', status: 'issue', message: 'rsp: divergent' }))
    expect(readFileSync(skill, 'utf8')).toContain('Local customization.')
  })

  it('rejects mismatched ordinary commands and repair without mutation, then adopts explicitly', () => {
    const directory = project()
    const pin = join(directory, '.rsp/version')
    const agents = readFileSync(join(directory, 'AGENTS.md'), 'utf8')
    writeFileSync(pin, '1.0.0\n')
    for (const args of [['create', 'unsafe'], ['--version', 'create', 'unsafe'], ['-v', 'create', 'unsafe'], ['init'], ['update'], ['update', '--adopt-version=false'], ['update', '--no-adopt-version'], ['skills', 'install']]) {
      const rejected = run(directory, ...args)
      expect(rejected.status).not.toBe(0)
      expect(rejected.stderr).toContain('Project pins RSP 1.0.0')
      expect(readFileSync(pin, 'utf8')).toBe('1.0.0\n')
      expect(readFileSync(join(directory, 'AGENTS.md'), 'utf8')).toBe(agents)
    }
    expect(existsSync(join(directory, '.rsp/changes/unsafe.md'))).toBe(false)
    const diagnostics = JSON.parse(run(directory, 'doctor', '--fix', '--json').stdout)
    expect(diagnostics.ok).toBe(false)
    expect(readFileSync(pin, 'utf8')).toBe('1.0.0\n')
    for (const flag of ['--version', '-v'])
      expect(run(directory, flag).stdout).toContain(version)
    expect(run(directory, '--help').status).toBe(0)
    expect(run(directory, 'config', '--json').status).toBe(0)
    expect(run(directory, 'update', '--adopt-version').status).toBe(0)
    expect(readFileSync(pin, 'utf8')).toBe(`${version}\n`)
    expect(run(directory, 'create', 'safe', 'Use selected CLI', '--kind', 'fix').status).toBe(0)
  })

  it.skipIf(process.platform === 'win32')('rejects a pin changed while the real Skills terminal waits for confirmation', () => {
    const directory = project()
    const result = spawnSync('python3', [join(root, 'tests/code/fixtures/pinned-skills-terminal.py'), cli, directory], { encoding: 'utf8', timeout: 15000 })
    expect(result.status, result.stderr).toBe(0)
    expect(JSON.parse(result.stdout)).toEqual({ ready: true, status: 1, installed: false })
    expect(readFileSync(join(directory, '.rsp/version'), 'utf8')).toBe('1.0.0\n')
  }, 20000)

  it('rejects positional boolean values without adopting a version or deleting Rules', () => {
    const directory = project()
    const pin = join(directory, '.rsp/version')
    const fallback = join(directory, '.rsp/rsp-rules.md')
    const agents = join(directory, 'AGENTS.md')
    writeFileSync(pin, '1.0.0\n')
    writeFileSync(fallback, 'Keep customized fallback.\n')
    const files = [pin, fallback, agents]
    const before = files.map(path => readFileSync(path, 'utf8'))
    for (const args of [
      ['update', '--adopt-version', 'false', '--remove-legacy-rules'],
      ['update', '--adopt-version', '--remove-legacy-rules', 'false'],
    ]) {
      expect(run(directory, ...args).status).not.toBe(0)
      expect(files.map(path => readFileSync(path, 'utf8'))).toEqual(before)
    }
  })

  it.skipIf(process.platform === 'win32' || process.getuid?.() === 0)('preserves the old pin and files when legacy Rules inspection is incomplete', () => {
    const directory = project()
    const pin = join(directory, '.rsp/version')
    const config = join(directory, '.rsp/config.yaml')
    const agents = join(directory, 'AGENTS.md')
    const fallback = join(directory, '.rsp/rsp-rules.md')
    writeFileSync(pin, '1.0.0\n')
    writeFileSync(config, 'kinds: []\n')
    writeFileSync(fallback, 'Keep customized fallback until inspection succeeds.\n')
    const unreadable = join(directory, '.rsp/rules/unreadable')
    mkdirSync(unreadable, { recursive: true })
    const files = [pin, config, agents, fallback]
    const before = files.map(path => readFileSync(path, 'utf8'))
    chmodSync(unreadable, 0)
    try {
      const rejected = run(directory, 'update', '--adopt-version', '--remove-legacy-rules')
      expect(rejected.status).not.toBe(0)
      expect(files.map(path => readFileSync(path, 'utf8'))).toEqual(before)
    }
    finally {
      chmodSync(unreadable, 0o700)
    }
  })

  it('restores removed Rules and entry/config changes when a later migration step fails', () => {
    const directory = project()
    const fallback = join(directory, '.rsp/rsp-rules.md')
    const pin = join(directory, '.rsp/version')
    const config = join(directory, '.rsp/config.yaml')
    const agents = join(directory, 'AGENTS.md')
    writeFileSync(fallback, 'Recover this customized fallback.\n')
    writeFileSync(pin, '1.0.0\n')
    writeFileSync(config, 'kinds: []\n')
    writeFileSync(agents, readFileSync(agents, 'utf8').replace('## RSP Entry', '## Old entry'))
    const before = [fallback, pin, config, agents].map(path => readFileSync(path, 'utf8'))
    const external = join(directory, 'external-index.md')
    writeFileSync(external, 'Do not follow this index.\n')
    symlinkSync(external, join(directory, '.rsp/archives/INDEX.md'))
    const rejected = run(directory, 'update', '--adopt-version', '--remove-legacy-rules')
    expect(rejected.status).not.toBe(0)
    expect([fallback, pin, config, agents].map(path => readFileSync(path, 'utf8'))).toEqual(before)
    expect(readFileSync(external, 'utf8')).toBe('Do not follow this index.\n')
  })

  it('refuses ranges and symlink pins without following them', () => {
    const directory = project()
    const pin = join(directory, '.rsp/version')
    for (const invalid of ['latest', '^3.3.0', '3', '3.03.0', '3.3.0-beta.01', '3.3.0\n4.0.0']) {
      writeFileSync(pin, invalid)
      expect(run(directory, 'update', '--adopt-version').status).not.toBe(0)
      expect(run(directory, 'status', '--json').status).not.toBe(0)
      expect(readFileSync(pin, 'utf8')).toBe(invalid)
    }
    rmSync(pin)
    const external = join(directory, 'external-version')
    writeFileSync(external, '1.0.0\n')
    symlinkSync(external, pin)
    expect(run(directory, 'update', '--adopt-version').status).not.toBe(0)
    expect(readFileSync(external, 'utf8')).toBe('1.0.0\n')
  })

  it('preserves retired and unrelated content until exact removal is selected', () => {
    const directory = project()
    const fallback = join(directory, '.rsp/rsp-rules.md')
    const legacy = join(directory, '.rsp/rules/rsp-rules.md')
    const custom = join(directory, '.rsp/rules/custom.md')
    mkdirSync(join(directory, '.rsp/rules'))
    for (const path of [fallback, legacy, custom])
      writeFileSync(path, `Keep ${path}\n`)
    const original = readFileSync(fallback, 'utf8')
    const agents = readFileSync(join(directory, 'AGENTS.md'), 'utf8')
    for (const args of [['update'], ['doctor', '--fix', '--json']]) {
      expect(run(directory, ...args).status).not.toBe(0)
      expect(readFileSync(fallback, 'utf8')).toBe(original)
      expect(readFileSync(join(directory, 'AGENTS.md'), 'utf8')).toBe(agents)
    }
    expect(run(directory, 'update', '--remove-legacy-rules').status).toBe(0)
    expect(existsSync(fallback)).toBe(false)
    expect(existsSync(legacy)).toBe(false)
    expect(readFileSync(custom, 'utf8')).toBe(`Keep ${custom}\n`)
    const external = join(directory, 'external-rules.md')
    writeFileSync(external, 'Never remove the target.\n')
    symlinkSync(external, fallback)
    expect(run(directory, 'update', '--remove-legacy-rules').status).not.toBe(0)
    expect(readFileSync(external, 'utf8')).toBe('Never remove the target.\n')
  })
})
