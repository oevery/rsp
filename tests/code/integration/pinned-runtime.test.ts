import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
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
function fresh() {
  const path = realpathSync(mkdtempSync(join(tmpdir(), 'rsp-ownership-')))
  projects.push(path)
  return path
}
function run(project: string, ...args: string[]) {
  return spawnSync(process.execPath, [cli, ...args], { cwd: project, encoding: 'utf8' })
}
function project() {
  const path = fresh()
  expect(run(path, 'init').status).toBe(0)
  return path
}
function read(project: string, path: string) {
  return readFileSync(join(project, path), 'utf8')
}
function write(project: string, path: string, content: string) {
  writeFileSync(join(project, path), content)
}
function fail(project: string, command: string, scenario: string, ...args: string[]) {
  return spawnSync(process.execPath, ['--import', join(root, 'tests/code/fixtures/setup-failure.mjs'), cli, command, ...args], { cwd: project, encoding: 'utf8', env: { ...process.env, RSP_TEST_FAILURE: scenario } })
}
function generated(name: string) {
  return `---\nkind: generated-index\nindex_type: specs\nsource_dir: .rsp/specs\n---\n${name}`
}
function sourceProject() {
  const path = project()
  for (const directory of ['dist', 'skills'])
    cpSync(join(root, directory), join(path, directory), { recursive: true })
  cpSync(join(root, 'package.json'), join(path, 'package.json'))
  mkdirSync(join(path, 'src'))
  cpSync(join(root, 'src/cli.ts'), join(path, 'src/cli.ts'))
  symlinkSync(join(root, 'node_modules'), join(path, 'node_modules'), 'dir')
  rmSync(join(path, '.rsp/version'))
  write(path, '.rsp/source', '.\n')
  return {
    path,
    run: (...args: string[]) => spawnSync(process.execPath, [join(path, 'dist/cli.mjs'), ...args], { cwd: path, encoding: 'utf8' }),
  }
}

describe('explicit source runtime', () => {
  it('keeps source selection and canonical Skills across init, update and version changes', () => {
    const source = sourceProject()
    const { path } = source
    rmSync(join(path, '.agents/skills/rsp'), { recursive: true })
    symlinkSync(join(path, 'skills/rsp'), join(path, '.agents/skills/rsp'), 'dir')
    write(path, 'AGENTS.md', '# User policy\n')
    write(path, '.rsp/config.yaml', '# Keep config\nkinds: []\n')
    const before = read(path, 'AGENTS.md')
    expect(source.run('update', '--dry-run').status).toBe(0)
    expect(read(path, 'AGENTS.md')).toBe(before)
    expect(existsSync(join(path, '.rsp/version'))).toBe(false)
    for (const nextVersion of [version, '4.0.0-dev.1']) {
      const manifest = JSON.parse(read(path, 'package.json'))
      manifest.version = nextVersion
      write(path, 'package.json', JSON.stringify(manifest))
      expect(source.run('init').status).toBe(0)
      expect(source.run('update').status).toBe(0)
      expect(source.run('status', '--json').status).toBe(0)
      expect(read(path, '.rsp/source')).toBe('.\n')
      expect(existsSync(join(path, '.rsp/version'))).toBe(false)
      expect(read(path, '.rsp/config.yaml')).toBe('# Keep config\nkinds: []\n')
      expect(lstatSync(join(path, '.agents/skills/rsp')).isSymbolicLink()).toBe(true)
      expect(read(path, 'AGENTS.md')).toContain('# User policy')
      expect(read(path, 'AGENTS.md')).toContain('mise exec -- node dist/cli.mjs')
      expect(read(path, 'AGENTS.md')).not.toContain('npx -y @oevery/rsp@')
      const diagnostic = source.run('doctor', '--json')
      expect(diagnostic.status, diagnostic.stderr).toBe(0)
      const runtime = JSON.parse(diagnostic.stdout).checks.find((item: { code: string }) => item.code === 'project_cli_version')
      expect(runtime.status).toBe('ok')
      expect(runtime.message).toContain('Source mode')
      expect(runtime.hint).not.toContain('npx')
      expect(source.run('update').stdout).toContain('up to date')
    }
  })

  it('keeps explicit registry notices informational for the source runtime', () => {
    const source = sourceProject()
    expect(source.run('update').status).toBe(0)
    const mockRegistry = `globalThis.fetch = async () => new Response(JSON.stringify({ latest: '999.0.0' }))`
    const result = spawnSync(process.execPath, [
      '--import',
      `data:text/javascript,${encodeURIComponent(mockRegistry)}`,
      join(source.path, 'dist/cli.mjs'),
      'doctor',
      '--check-updates',
      '--json',
    ], { cwd: source.path, encoding: 'utf8' })
    expect(result.status, result.stderr).toBe(0)
    const notice = JSON.parse(result.stdout).checks.find((item: { code: string }) => item.code === 'update_available')
    expect(notice.hint).toContain('local source CLI')
    expect(notice.hint).not.toContain('choose an exact target')
    expect(existsSync(join(source.path, '.rsp/version'))).toBe(false)
    expect(read(source.path, '.rsp/source')).toBe('.\n')
  })

  it('rejects another checkout even at the same version before modifying the project', () => {
    const source = sourceProject()
    const before = read(source.path, 'AGENTS.md')
    for (const args of [['status'], ['init'], ['update'], ['update', '--dry-run'], ['create', 'unsafe']]) {
      const result = run(source.path, ...args)
      expect(result.status).not.toBe(0)
      expect(result.stderr).toContain('local CLI')
    }
    const doctor = run(source.path, 'doctor', '--json')
    expect(doctor.status).not.toBe(0)
    expect(JSON.parse(doctor.stdout).checks).toContainEqual(expect.objectContaining({ code: 'project_cli_version', status: 'issue' }))
    expect(read(source.path, 'AGENTS.md')).toBe(before)
    expect(existsSync(join(source.path, '.rsp/version'))).toBe(false)
    expect(existsSync(join(source.path, '.rsp/changes/unsafe.md'))).toBe(false)
  })

  it('does not infer source mode from source files, package identity or missing pins', () => {
    const source = sourceProject()
    rmSync(join(source.path, '.rsp/source'))
    expect(source.run('doctor', '--json').status).not.toBe(0)
    expect(source.run('init').status).toBe(0)
    expect(read(source.path, '.rsp/version')).toBe(`${version}\n`)
    expect(read(source.path, 'AGENTS.md')).toContain(`npx -y @oevery/rsp@${version}`)
    write(source.path, '.rsp/version', '1.0.0\n')
    expect(source.run('status').status).not.toBe(0)
    expect(read(source.path, '.rsp/version')).toBe('1.0.0\n')
  })

  it.each(['conflict', 'invalid', 'symlink', 'missing-source'])('fails closed on invalid source selection (%s)', (scenario) => {
    const source = sourceProject()
    const { path } = source
    if (scenario === 'conflict')
      write(path, '.rsp/version', `${version}\n`)
    if (scenario === 'invalid')
      write(path, '.rsp/source', '../other\n')
    if (scenario === 'symlink') {
      write(path, 'external-source', '.\n')
      rmSync(join(path, '.rsp/source'))
      symlinkSync(join(path, 'external-source'), join(path, '.rsp/source'))
    }
    if (scenario === 'missing-source')
      rmSync(join(path, 'src/cli.ts'))
    const before = read(path, 'AGENTS.md')
    for (const args of [['status'], ['init'], ['update'], ['update', '--dry-run'], ['doctor', '--json']])
      expect(source.run(...args).status, args.join(' ')).not.toBe(0)
    expect(read(path, 'AGENTS.md')).toBe(before)
    expect(source.run('--help').status).toBe(0)
    expect(source.run('config', '--json').status).toBe(0)
  })
})

describe('ownership-based setup', () => {
  it.each(['.rsp/specs/decisions', 'docs/adr'])('guides missing Decision Records to explicit scaffold creation (%s)', (directory) => {
    const path = project()
    const config = `kinds: []\ndecisions:\n  path: ${directory}\n`
    write(path, '.rsp/config.yaml', config)
    rmSync(join(path, '.rsp/specs/decisions'), { recursive: true })
    const result = run(path, 'doctor', '--json')
    expect(result.status).not.toBe(0)
    const check = JSON.parse(result.stdout).checks.find((item: { label: string }) => item.label === `${directory} is the authoritative Decision Record directory`)
    expect(check.message).toContain('directory is missing')
    expect(check.hint).toContain('run rsp init')
    expect(check.hint).not.toContain('Run: rsp update')
    expect(run(path, 'update').status).toBe(0)
    expect(existsSync(join(path, directory))).toBe(false)
    expect(run(path, 'init').status).toBe(0)
    expect(existsSync(join(path, directory))).toBe(true)
    expect(read(path, '.rsp/config.yaml')).toBe(config)
    expect(JSON.parse(run(path, 'doctor', '--json').stdout).ok).toBe(true)
  })

  it.each(['decision-permissions', 'agents-permissions'])('reports access failures without suggesting scaffold recreation (%s)', (scenario) => {
    const path = project()
    const target = scenario === 'decision-permissions' ? '.rsp/specs/decisions/.gitkeep' : 'AGENTS.md'
    const before = read(path, target)
    const result = fail(path, 'doctor', scenario, '--json')
    expect(result.stderr).toContain(`failure-injected:${scenario}`)
    expect(result.status).not.toBe(0)
    const diagnostic = JSON.parse(result.stdout)
    const check = diagnostic.checks.find((item: { label: string }) => item.label === (scenario === 'decision-permissions' ? '.rsp/specs/decisions is the authoritative Decision Record directory' : 'AGENTS.md contains managed RSP block'))
    expect(check.message).not.toContain('missing')
    expect(check.hint).toContain('permissions')
    expect(check.hint).not.toMatch(/Run: rsp|run rsp init|recreate/)
    expect(diagnostic.runtime.some((item: { message: string }) => item.message.includes('EACCES'))).toBe(true)
    expect(read(path, target)).toBe(before)
    expect(JSON.parse(run(path, 'doctor', '--json').stdout).ok).toBe(true)
  })

  it('preserves a non-directory Decision Record entry and reports its type', () => {
    const path = project()
    rmSync(join(path, '.rsp/specs/decisions'), { recursive: true })
    write(path, '.rsp/specs/decisions', 'User file')
    const result = run(path, 'doctor', '--json')
    expect(result.status).not.toBe(0)
    const check = JSON.parse(result.stdout).checks.find((item: { label: string }) => item.label === '.rsp/specs/decisions is the authoritative Decision Record directory')
    expect(check.message).toContain('must be a directory')
    expect(check.hint).not.toMatch(/Run: rsp|run rsp init/)
    expect(read(path, '.rsp/specs/decisions')).toBe('User file')
  })

  it('gives consistent missing-design guidance across ordinary entrypoints', () => {
    const path = project()
    rmSync(join(path, '.rsp/specs/design.md'))
    for (const args of [
      ['create', 'example'],
      ['add', 'spec', 'example'],
      ['archive', 'example'],
      ['focus', 'example'],
      ['unfocus', 'example'],
      ['reopen', 'example', '--reason', 'Review'],
      ['group', 'create', 'example'],
      ['group', 'close', 'example'],
      ['group', 'reopen', 'example', '--reason', 'Review'],
      ['specs'],
      ['show', 'example'],
      ['ready', 'example'],
      ['history'],
      ['doctor'],
    ]) {
      const result = run(path, ...args)
      expect(result.status, args.join(' ')).not.toBe(0)
      expect(`${result.stdout}${result.stderr}`, args.join(' ')).toContain('Restore your design file, or run rsp init')
    }
    expect(existsSync(join(path, '.rsp/specs/design.md'))).toBe(false)
    expect(run(path, 'init').status).toBe(0)
    expect(JSON.parse(run(path, 'doctor', '--json').stdout).ok).toBe(true)
  })

  it.each(['create', 'specs', 'doctor'])('does not misclassify inaccessible design as missing (%s)', (command) => {
    const path = project()
    const before = read(path, '.rsp/specs/design.md')
    const result = fail(path, command, 'design-permissions', ...(command === 'create' ? ['example'] : []))
    expect(result.stderr).toContain('failure-injected:design-permissions')
    expect(result.status).not.toBe(0)
    expect(`${result.stdout}${result.stderr}`).toContain('EACCES')
    expect(`${result.stdout}${result.stderr}`).not.toContain('Restore your design file')
    expect(read(path, '.rsp/specs/design.md')).toBe(before)
  })

  it('creates a complete setup and leaves existing user files unchanged on repeated init', () => {
    const path = project()
    expect(JSON.parse(run(path, 'doctor', '--json').stdout).ok).toBe(true)
    write(path, '.rsp/config.yaml', '# User config\nkinds: []\n')
    write(path, '.rsp/specs/design.md', 'User design')
    expect(run(path, 'init').status).toBe(0)
    expect(read(path, '.rsp/config.yaml')).toBe('# User config\nkinds: []\n')
    expect(read(path, '.rsp/specs/design.md')).toBe('User design')
    expect(JSON.parse(run(path, 'config', '--json').stdout).workflow).toEqual({ delegation: 'off', closeout: 'ask' })
    expect(run(path, 'init').stdout).toContain('nothing changed')
  })

  it('previews and updates only owned assets while preserving user content', () => {
    const path = project()
    write(path, '.rsp/version', '1.0.0\n')
    write(path, '.rsp/config.yaml', '# User config\nkinds: []\n')
    write(path, 'AGENTS.md', '# User policy\n\nOutside the managed block.\n')
    write(path, '.agents/skills/rsp/SKILL.md', 'Old Skill')
    write(path, '.agents/skills/rsp/.obsolete', 'Stale hidden content')
    mkdirSync(join(path, '.agents/skills/custom'))
    write(path, '.agents/skills/custom/SKILL.md', 'User Skill')
    mkdirSync(join(path, '.rsp/rules'))
    write(path, '.rsp/rules/rsp-rules.md', 'Retired managed Rules')
    write(path, '.rsp/rsp-rules.md', 'Retired root Rules')
    write(path, '.rsp/rules/custom.md', 'User Rules')
    write(path, '.rsp/specs/INDEX.md', generated('Old generated index'))
    write(path, '.rsp/archives/INDEX.md', 'User archive index')
    write(path, '.rsp/changes/.gitkeep', 'User placeholder')
    const preserved = ['.rsp/config.yaml', '.rsp/specs/design.md', '.rsp/archives/INDEX.md', '.rsp/changes/.gitkeep', '.rsp/focus.d/.gitkeep', '.rsp/rules/custom.md', '.agents/skills/custom/SKILL.md']
    const before = preserved.map(file => read(path, file))
    expect(run(path, 'update', '--dry-run').status).toBe(0)
    expect(read(path, '.rsp/version')).toBe('1.0.0\n')
    expect(read(path, '.agents/skills/rsp/SKILL.md')).toBe('Old Skill')
    expect(run(path, 'update').status).toBe(0)
    expect(preserved.map(file => read(path, file))).toEqual(before)
    expect(read(path, 'AGENTS.md')).toContain('Outside the managed block.')
    expect(read(path, '.agents/skills/rsp/SKILL.md')).toBe(read(root, 'skills/rsp/SKILL.md'))
    for (const file of ['.rsp/rsp-rules.md', '.rsp/rules/rsp-rules.md', '.rsp/specs/INDEX.md', '.agents/skills/rsp/.obsolete']) expect(existsSync(join(path, file))).toBe(false)
    expect(read(path, '.rsp/version')).toBe(`${version}\n`)
    expect(run(path, 'update').stdout).toContain('up to date')
  })

  it('does not recreate missing user directories or config during update', () => {
    const path = project()
    const missing = ['.rsp/changes', '.rsp/focus.d', '.rsp/archives', '.rsp/specs/decisions', '.rsp/config.yaml']
    for (const file of missing) rmSync(join(path, file), { recursive: true })
    expect(run(path, 'update', '--dry-run').status).toBe(0)
    expect(run(path, 'update').status).toBe(0)
    for (const file of missing) expect(existsSync(join(path, file))).toBe(false)
    expect(JSON.parse(run(path, 'config', '--json').stdout).workflow).toEqual({ delegation: 'off', closeout: 'ask' })
  })

  it.each(['skill', 'index', 'agents', 'pin'])('stops without rollback and converges on same-target retry (%s)', (scenario) => {
    const path = project()
    write(path, '.rsp/version', '1.0.0\n')
    write(path, '.rsp/config.yaml', '# Keep exact bytes\nkinds: []\n')
    write(path, 'AGENTS.md', '# User policy\n')
    write(path, '.agents/skills/rsp/SKILL.md', 'Old Skill')
    write(path, '.agents/skills/rsp-review/SKILL.md', 'Old Review Skill')
    for (const name of ['00-index.md', 'INDEX.md']) write(path, `.rsp/specs/${name}`, generated(name))
    const result = fail(path, 'update', scenario)
    expect(result.stderr).toContain(`failure-injected:${scenario}`)
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('No rollback was attempted')
    expect(read(path, '.rsp/version')).toBe('1.0.0\n')
    expect(read(path, '.rsp/config.yaml')).toBe('# Keep exact bytes\nkinds: []\n')
    if (scenario === 'agents')
      expect(read(path, 'AGENTS.md')).toBe('# User policy\n')
    expect(read(path, '.agents/skills/rsp/SKILL.md')).toBe(read(root, 'skills/rsp/SKILL.md'))
    if (scenario === 'index')
      expect(existsSync(join(path, '.rsp/specs/00-index.md'))).toBe(false)
    expect(run(path, 'update').status).toBe(0)
    expect(read(path, '.rsp/version')).toBe(`${version}\n`)
    expect(read(path, 'AGENTS.md')).toContain('# User policy')
    expect(JSON.parse(run(path, 'doctor', '--json').stdout).ok).toBe(true)
    expect(run(path, 'update').stdout).toContain('up to date')
    expect(readdirSync(join(path, '.agents/skills')).some(name => name.startsWith('.rsp-'))).toBe(false)
  })

  it.each(['archive-read', 'archive-recheck'])('stops on Archive Index read failure and converges on same-target retry (%s)', (scenario) => {
    const path = project()
    const index = '---\nkind: generated-index\nindex_type: archives\n---\nOld archive index\n'
    write(path, '.rsp/archives/INDEX.md', index)
    write(path, '.rsp/version', '1.0.0\n')
    write(path, '.rsp/config.yaml', '# User config\nkinds: []\n')
    write(path, '.agents/skills/rsp/SKILL.md', 'Old Skill')
    write(path, 'AGENTS.md', '# User policy\n')

    const result = fail(path, 'update', scenario)
    expect(result.stderr).toContain(`failure-injected:${scenario}`)
    expect(result.status).not.toBe(0)
    expect(read(path, '.rsp/version')).toBe('1.0.0\n')
    expect(read(path, '.rsp/archives/INDEX.md')).toBe(index)
    expect(read(path, 'AGENTS.md')).toBe('# User policy\n')
    expect(read(path, '.rsp/config.yaml')).toBe('# User config\nkinds: []\n')
    expect(read(path, '.agents/skills/rsp/SKILL.md')).toBe(scenario === 'archive-read' ? 'Old Skill' : read(root, 'skills/rsp/SKILL.md'))

    expect(run(path, 'update').status).toBe(0)
    expect(existsSync(join(path, '.rsp/archives/INDEX.md'))).toBe(false)
    expect(read(path, '.rsp/version')).toBe(`${version}\n`)
    expect(read(path, '.rsp/config.yaml')).toBe('# User config\nkinds: []\n')
    expect(read(path, 'AGENTS.md')).toContain('# User policy\n')
    expect(JSON.parse(run(path, 'doctor', '--json').stdout).ok).toBe(true)
    expect(run(path, 'update').stdout).toContain('up to date')
  })

  it.each(['prepare', 'pin'])('retries partial fresh initialization without overwriting existing user files (%s)', (scenario) => {
    const path = fresh()
    const result = fail(path, 'init', scenario)
    expect(result.stderr).toContain(`failure-injected:${scenario}`)
    expect(result.status).not.toBe(0)
    expect(existsSync(join(path, '.rsp/version'))).toBe(false)
    expect(existsSync(join(path, '.agents/skills/rsp/SKILL.md'))).toBe(true)
    write(path, '.rsp/config.yaml', '# User settings after failure\nkinds: []\n')
    expect(run(path, 'init').status).toBe(0)
    expect(read(path, '.rsp/config.yaml')).toBe('# User settings after failure\nkinds: []\n')
    expect(JSON.parse(run(path, 'doctor', '--json').stdout).ok).toBe(true)
  })

  it('rejects invalid config and owner-controlled indexes before changing assets', () => {
    const path = project()
    write(path, '.agents/skills/rsp/SKILL.md', 'Old Skill')
    for (const config of ['manage: {}\n', 'workflow:\n  delegation: invalid\n']) {
      write(path, '.rsp/config.yaml', config)
      expect(run(path, 'update').status).not.toBe(0)
      expect(read(path, '.rsp/config.yaml')).toBe(config)
      expect(read(path, '.agents/skills/rsp/SKILL.md')).toBe('Old Skill')
    }
    write(path, '.rsp/config.yaml', 'kinds: []\n')
    write(path, '.rsp/specs/INDEX.md', 'User index')
    expect(run(path, 'update').status).not.toBe(0)
    expect(read(path, '.rsp/specs/INDEX.md')).toBe('User index')
    expect(read(path, '.agents/skills/rsp/SKILL.md')).toBe('Old Skill')
  })

  it('rejects mismatched ordinary commands, downgrades, invalid pins and retired entrypoints', () => {
    const path = project()
    write(path, '.rsp/version', '1.0.0\n')
    expect(run(path, 'init').status).not.toBe(0)
    expect(run(path, 'create', 'unsafe').status).not.toBe(0)
    expect(run(path, 'update').status).toBe(0)
    for (const args of [['update', '--adopt-version'], ['update', '--remove-legacy-rules'], ['update', '--force'], ['doctor', '--fix'], ['skills', 'install'], ['recover']]) expect(run(path, ...args).status).not.toBe(0)
    for (const invalid of ['999.0.0', 'latest', '^3.3.0', '3.3.0\n4.0.0']) {
      write(path, '.rsp/version', invalid)
      expect(run(path, 'update').status).not.toBe(0)
      expect(read(path, '.rsp/version')).toBe(invalid)
    }
  })

  it('rejects managed symlinks without changing their external targets', () => {
    const path = project()
    const external = join(path, 'external')
    writeFileSync(external, 'External bytes')
    rmSync(join(path, 'AGENTS.md'))
    symlinkSync(external, join(path, 'AGENTS.md'))
    expect(run(path, 'update').status).not.toBe(0)
    expect(readFileSync(external, 'utf8')).toBe('External bytes')
  })
})
