import { execFileSync, execSync, spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { chmod, mkdir, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseFrontmatter } from '../../src/core/content.js'
import { archivePath, changesPath, cliPath, completeOpenChange, completeReopenChange, createRspFixture, focusDPath, renderChange, renderGeneratedIndexMetadata, renderGroupBrief } from './harness.js'

describe('change lifecycle integration', () => {
  it('creates a change file', async () => {
    const { createChange } = await import('../../src/commands/create.js')
    await createChange('test-change', 'A test change')

    const content = await readFile(changesPath('test-change.md'), 'utf-8')
    expect(content).toContain('# Change: test-change')
    expect(content).toContain('- Outcome: A test change')
    expect(existsSync(focusDPath('test-change'))).toBe(true)
  })

  it('prints next-step guidance aligned with the richer change template', () => {
    const createDir = join(tmpdir(), 'rsp-create-next-steps-test', randomUUID())
    return (async () => {
      await mkdir(createDir, { recursive: true })
      execSync(`node ${cliPath()} init`, { cwd: createDir })

      const output = execSync(`node ${cliPath()} create guided-change "Improve guidance"`, { cwd: createDir, encoding: 'utf-8' })
      expect(output).toContain('Next: fill proposal/spec/design first, then implement and complete the tasks')
    })()
  })

  it('supports subdirectory changes', async () => {
    const { createChange } = await import('../../src/commands/create.js')
    await mkdir(changesPath('auth'), { recursive: true })
    await writeFile(changesPath('auth', '00-brief.md'), renderGroupBrief('auth', ['auth/login', 'auth/session']))
    await createChange('auth/login', 'Login change')
    await writeFile(changesPath('auth', 'session.md'), renderChange('auth/session'))

    expect(existsSync(changesPath('auth', 'login.md'))).toBe(true)
    expect(existsSync(focusDPath('auth', 'login'))).toBe(true)
  })

  it('supports one direct grouped Change across the CLI lifecycle', async () => {
    const groupDir = join(tmpdir(), 'rsp-grouped-change-lifecycle-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))

    execSync(`node ${cliPath()} create release/api --kind feature "Ship release API"`, { cwd: groupDir })
    await completeOpenChange(groupDir, 'release/api')
    const shown = JSON.parse(execSync(`node ${cliPath()} show release/api --json`, { cwd: groupDir, encoding: 'utf-8' }))
    const ready = JSON.parse(execSync(`node ${cliPath()} ready release/api --json`, { cwd: groupDir, encoding: 'utf-8' }))
    execSync(`node ${cliPath()} archive release/api`, { cwd: groupDir })

    expect(shown.change.name).toBe('release/api')
    expect(ready.change).toBe('release/api')
    expect(existsSync(join(groupDir, '.rsp', 'archives', 'release'))).toBe(true)
    expect((await readdir(join(groupDir, '.rsp', 'archives', 'release'))).some(name => name.endsWith('_api.md'))).toBe(true)
    expect(existsSync(join(groupDir, '.rsp', 'focus.d', 'release', 'api'))).toBe(false)
  })

  it('preserves one flat Chinese WorkRef across create, focus, archive, history, and reopen', async () => {
    const root = join(tmpdir(), 'rsp-unicode-flat-lifecycle-test', randomUUID())
    const workRef = '中文标题'
    await mkdir(root, { recursive: true })
    execFileSync('node', [cliPath(), 'init'], { cwd: root })
    execFileSync('node', [cliPath(), 'create', workRef, '保留中文文件名'], { cwd: root })
    const changePath = join(root, '.rsp', 'changes', `${workRef}.md`)
    expect(existsSync(changePath)).toBe(true)
    expect(existsSync(join(root, '.rsp', 'focus.d', workRef))).toBe(true)

    await writeFile(changePath, completeReopenChange(await readFile(changePath, 'utf-8')))
    execFileSync('node', [cliPath(), 'archive', workRef], { cwd: root })
    const history = JSON.parse(execFileSync('node', [cliPath(), 'history', workRef, '--json'], { cwd: root, encoding: 'utf-8' }))
    expect(history.record).toEqual(expect.objectContaining({ workRef, group: null }))
    expect(history.record.path).toMatch(/_中文标题\.md$/)

    execFileSync('node', [cliPath(), 'reopen', workRef, '--reason', '需要补充验证'], { cwd: root })
    expect(existsSync(changePath)).toBe(true)
    expect(await readFile(changePath, 'utf-8')).toContain('需要补充验证')
  })

  it('preserves Chinese grouped WorkRefs across dependency, archive, history, and reopen', async () => {
    const groupDir = join(tmpdir(), 'rsp-unicode-grouped-lifecycle-test', randomUUID())
    const group = '听说训练'
    const foundation = `${group}/基础`
    const simulation = `${group}/模拟朗读`
    await mkdir(groupDir, { recursive: true })
    execFileSync('node', [cliPath(), 'init'], { cwd: groupDir })
    execFileSync('node', [cliPath(), 'group', 'create', group, '提供听说训练'], { cwd: groupDir })
    await writeFile(
      join(groupDir, '.rsp', 'changes', group, '00-brief.md'),
      renderGroupBrief(group, [foundation, simulation]),
    )

    execFileSync('node', [cliPath(), 'create', foundation, '完成基础训练'], { cwd: groupDir })
    execFileSync('node', [cliPath(), 'create', simulation, '完成模拟朗读'], { cwd: groupDir })
    const foundationPath = join(groupDir, '.rsp', 'changes', group, '基础.md')
    const simulationPath = join(groupDir, '.rsp', 'changes', group, '模拟朗读.md')
    await writeFile(simulationPath, (await readFile(simulationPath, 'utf-8')).replace(
      '## Blockers\n- none',
      `## Blockers\n- requires \`${foundation}\`: 需要先完成基础训练`,
    ))

    const blocked = JSON.parse(execFileSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' }))
    expect(blocked.plan.edges).toContainEqual({
      change: simulation,
      requires: foundation,
      reason: '需要先完成基础训练',
      state: 'open',
    })

    await writeFile(foundationPath, completeReopenChange(await readFile(foundationPath, 'utf-8')))
    execFileSync('node', [cliPath(), 'archive', foundation], { cwd: groupDir })
    const unblocked = JSON.parse(execFileSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' }))
    expect(unblocked.plan.edges).toContainEqual(expect.objectContaining({ change: simulation, requires: foundation, state: 'archived' }))

    await writeFile(simulationPath, completeReopenChange(await readFile(simulationPath, 'utf-8')))
    execFileSync('node', [cliPath(), 'archive', simulation], { cwd: groupDir })
    const history = JSON.parse(execFileSync('node', [cliPath(), 'history', simulation, '--json'], { cwd: groupDir, encoding: 'utf-8' }))
    expect(history.record).toEqual(expect.objectContaining({ workRef: simulation, group }))

    execFileSync('node', [cliPath(), 'reopen', simulation, '--reason', '需要补充一次人工验证'], { cwd: groupDir })
    expect(existsSync(simulationPath)).toBe(true)
    expect(existsSync(join(groupDir, '.rsp', 'focus.d', group, '模拟朗读'))).toBe(true)
    expect(await readFile(simulationPath, 'utf-8')).toContain('需要补充一次人工验证')
  })

  it('releases the mutation lock when an unfocus marker is missing', async () => {
    const focusDir = join(tmpdir(), 'rsp-unfocus-missing-marker-lock-test', randomUUID())
    await mkdir(focusDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: focusDir })
    execSync(`node ${cliPath()} create missing-marker`, { cwd: focusDir })
    await rm(join(focusDir, '.rsp', 'focus.d', 'missing-marker'))

    const result = spawnSync('node', [cliPath(), 'unfocus', 'missing-marker'], { cwd: focusDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Focus marker not found')
    expect(existsSync(join(focusDir, '.rsp', '.lock'))).toBe(false)
  })

  it('does not focus through a symlinked marker file', async () => {
    const focusDir = join(tmpdir(), 'rsp-focus-marker-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-focus-marker-external-test', randomUUID())
    await mkdir(focusDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: focusDir })
    execSync(`node ${cliPath()} create focus-target`, { cwd: focusDir })
    await rm(join(focusDir, '.rsp', 'focus.d', 'focus-target'))
    await writeFile(join(externalDir, 'marker'), 'do-not-touch\n')
    await symlink(join(externalDir, 'marker'), join(focusDir, '.rsp', 'focus.d', 'focus-target'))

    const result = spawnSync('node', [cliPath(), 'focus', 'focus-target'], { cwd: focusDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('focus marker must be a regular file')
    expect(await readFile(join(externalDir, 'marker'), 'utf-8')).toBe('do-not-touch\n')
    expect(existsSync(join(focusDir, '.rsp', '.lock'))).toBe(false)
  })

  it('rejects recursive change identities before mutating the workspace', () => {
    const createDir = join(tmpdir(), 'rsp-create-depth-test', randomUUID())
    return (async () => {
      await mkdir(createDir, { recursive: true })
      execSync(`node ${cliPath()} init`, { cwd: createDir })

      const result = spawnSync('node', [cliPath(), 'create', 'release/backend/api'], { cwd: createDir, encoding: 'utf-8' })

      expect(result.status).toBe(1)
      expect(result.stderr).toContain('exceeds the supported one-level Change Group depth')
      expect(existsSync(join(createDir, '.rsp', 'changes', 'release'))).toBe(false)
    })()
  })

  it('rejects file and directory work identity collisions before mutation', () => {
    const createDir = join(tmpdir(), 'rsp-create-collision-test', randomUUID())
    return (async () => {
      await mkdir(createDir, { recursive: true })
      execSync(`node ${cliPath()} init`, { cwd: createDir })
      await writeFile(join(createDir, '.rsp', 'changes', 'release.md'), renderChange('release'))

      const result = spawnSync('node', [cliPath(), 'create', 'release/api'], { cwd: createDir, encoding: 'utf-8' })

      expect(result.status).toBe(1)
      expect(result.stderr).toContain('claimed by both a file and a directory')
      expect(existsSync(join(createDir, '.rsp', 'changes', 'release'))).toBe(false)
      expect(existsSync(join(createDir, '.rsp', '.lock'))).toBe(false)
    })()
  })

  it('rejects a non-directory grouped prefix without leaking a raw filesystem error', async () => {
    const createDir = join(tmpdir(), 'rsp-create-prefix-type-test', randomUUID())
    await mkdir(createDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: createDir })
    await writeFile(join(createDir, '.rsp', 'changes', 'release'), 'not a directory')

    const result = spawnSync('node', [cliPath(), 'create', 'release/api'], { cwd: createDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('open work path must be a real directory')
    expect(result.stderr).not.toContain('EEXIST')
    expect(existsSync(join(createDir, '.rsp', '.lock'))).toBe(false)
  })

  it('does not create a Change or external marker through a symlinked focus root', async () => {
    const createDir = join(tmpdir(), 'rsp-create-focus-root-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-create-focus-root-external-test', randomUUID())
    await mkdir(createDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: createDir })
    await rm(join(createDir, '.rsp', 'focus.d'), { recursive: true })
    await symlink(externalDir, join(createDir, '.rsp', 'focus.d'))

    const result = spawnSync('node', [cliPath(), 'create', 'escaped'], { cwd: createDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('focus root must be a real directory')
    expect(existsSync(join(createDir, '.rsp', 'changes', 'escaped.md'))).toBe(false)
    expect(existsSync(join(externalDir, 'escaped'))).toBe(false)
    expect(existsSync(join(createDir, '.rsp', '.lock'))).toBe(false)
  })

  it('creates a kind-aware neutral docs scaffold when requested', () => {
    const createDir = join(tmpdir(), 'rsp-create-kind-test', randomUUID())
    return (async () => {
      await mkdir(createDir, { recursive: true })
      execSync(`node ${cliPath()} init`, { cwd: createDir })
      execSync(`node ${cliPath()} create docs-guide --kind docs "Improve docs"`, { cwd: createDir })

      const content = await readFile(join(createDir, '.rsp', 'changes', 'docs-guide.md'), 'utf-8')
      expect(content).toContain('kind: "docs"')
      expect(content).toContain('### MODIFIED')
      expect(content).toContain('- Requirement: <…>')
      expect(content).not.toContain('documentation accuracy')
      expect(content).not.toContain('Exact prerequisite:')
    })()
  })

  it('creates the single kind-aware Change template and rejects the removed lite option', () => {
    const createDir = join(tmpdir(), 'rsp-create-single-template-test', randomUUID())
    return (async () => {
      await mkdir(createDir, { recursive: true })
      execSync(`node ${cliPath()} init`, { cwd: createDir })
      const output = execSync(`node ${cliPath()} create tiny-fix --kind fix "Fix tiny issue"`, { cwd: createDir, encoding: 'utf-8' })

      const content = await readFile(join(createDir, '.rsp', 'changes', 'tiny-fix.md'), 'utf-8')
      expect(output).toContain('fill proposal/spec/design first')
      expect(content).toContain('kind: "fix"')
      expect(content).toContain('- Outcome: Fix tiny issue')
      expect(content).toContain('- [ ] <…>')
      expect(content).not.toContain('Finalize the proposal, spec, and design details')
      expect(content).not.toContain('Exact prerequisite:')

      for (const [name, option] of [
        ['another-fix', '--lite'],
        ['equals-true-fix', '--lite=true'],
        ['equals-false-fix', '--lite=false'],
      ]) {
        const result = spawnSync('node', [cliPath(), 'create', name, '--kind', 'fix', option, 'Should fail'], { cwd: createDir, encoding: 'utf-8' })
        expect(result.status).toBe(1)
        expect(result.stderr).toContain('create option "--lite" was removed')
        expect(existsSync(join(createDir, '.rsp', 'changes', `${name}.md`))).toBe(false)
        expect(existsSync(join(createDir, '.rsp', 'focus.d', name))).toBe(false)
      }
    })()
  })

  it('keeps every CLI-created artifact scaffold neutral under a non-English artifact policy', async () => {
    const scaffoldDir = join(tmpdir(), 'rsp-neutral-scaffold-test', randomUUID())
    await mkdir(scaffoldDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: scaffoldDir })
    await writeFile(join(scaffoldDir, '.rsp', 'config.yaml'), `language:
  default: zh-CN
manage:
  activation: auto
  closeout: lifecycle
`)

    execFileSync('node', [cliPath(), 'create', 'language-policy', '中文摘要', '--kind', 'feature'], { cwd: scaffoldDir })
    execFileSync('node', [cliPath(), 'group', 'create', 'delivery', '中文目标'], { cwd: scaffoldDir })
    execFileSync('node', [cliPath(), 'add', 'spec', 'language-surface'], { cwd: scaffoldDir })
    execFileSync('node', [cliPath(), 'init', '--with-project-setup'], { cwd: scaffoldDir })

    const artifacts = await Promise.all([
      readFile(join(scaffoldDir, '.rsp', 'changes', 'language-policy.md'), 'utf-8'),
      readFile(join(scaffoldDir, '.rsp', 'changes', 'delivery', '00-brief.md'), 'utf-8'),
      readFile(join(scaffoldDir, '.rsp', 'changes', 'project-setup.md'), 'utf-8'),
      readFile(join(scaffoldDir, '.rsp', 'specs', 'language-surface.md'), 'utf-8'),
    ])

    expect(artifacts[0]).toContain('- Outcome: 中文摘要')
    expect(artifacts[0]).not.toContain('<!--')
    expect(artifacts[1]).toContain('## Goal\n- 中文目标')
    for (const content of artifacts) {
      expect(content).toContain('<…>')
      expect(content).not.toMatch(/Capture the project model|what shared outcome|why this project-level spec exists|Describe observable behavior/)
    }
  })

  it('does not change focus when reusing an existing change', async () => {
    const { createChange } = await import('../../src/commands/create.js')
    const { unfocusChange } = await import('../../src/commands/focus.js')

    await unfocusChange('auth/login')
    expect(existsSync(focusDPath('auth', 'login'))).toBe(false)

    await createChange('auth/login', 'Login change again')
    expect(existsSync(focusDPath('auth', 'login'))).toBe(false)
  })

  it('archives a change and clears its marker', async () => {
    const { archiveChange } = await import('../../src/commands/archive.js')
    await writeFile(changesPath('test-change.md'), (await readFile(changesPath('test-change.md'), 'utf-8')).replaceAll('- [ ]', '- [x]'))
    await archiveChange('test-change')

    expect(existsSync(changesPath('test-change.md'))).toBe(false)
    expect(existsSync(focusDPath('test-change'))).toBe(false)

    const archiveFiles = await readdir(archivePath())
    expect(archiveFiles.some(f => f.endsWith('_test-change.md'))).toBe(true)
    expect(existsSync(archivePath('INDEX.md'))).toBe(false)
  })

  it('keeps post-archive Git delivery advisory and lifecycle-complete', async () => {
    const gitDir = await createRspFixture('rsp-archive-git-guidance-test', ['specs', 'changes', 'archives', 'focus.d'])
    await mkdir(join(gitDir, '.git'))
    await writeFile(join(gitDir, '.rsp', 'changes', 'complete.md'), renderChange('complete').replaceAll('- [ ]', '- [x]'))
    await writeFile(join(gitDir, '.rsp', 'focus.d', 'complete'), '')

    const output = execSync(`node ${cliPath()} archive complete`, { cwd: gitDir, encoding: 'utf-8' })

    expect(output).toContain('git status --short')
    expect(output).toContain('separate Git authority')
    expect(output).not.toContain('git add .rsp/archives/')
    expect(output).not.toContain('git commit -m')
  })

  it('archive warns when verify checklist or durable updates are still incomplete', async () => {
    const archiveWarnDir = await createRspFixture('rsp-archive-warn-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(archiveWarnDir, '.rsp', 'changes', 'warn-me.md'), renderChange('warn-me'))
    await writeFile(join(archiveWarnDir, '.rsp', 'focus.d', 'warn-me'), '')

    const result = spawnSync('node', [cliPath(), 'archive', 'warn-me'], { cwd: archiveWarnDir, encoding: 'utf-8' })
    const output = `${result.stdout}${result.stderr}`
    expect(result.status).toBe(1)
    expect(output).toContain('required Verify item(s) are still incomplete')
    expect(existsSync(join(archiveWarnDir, '.rsp', 'changes', 'warn-me.md'))).toBe(true)
    expect((await readdir(join(archiveWarnDir, '.rsp', 'archives'))).some(f => f.endsWith('_warn-me.md'))).toBe(false)
  })

  it('archives a complete change with incomplete optional verification', async () => {
    const archiveOptionalDir = await createRspFixture('rsp-archive-optional-test', ['specs', 'changes', 'archives', 'focus.d'])
    const content = renderChange('optional')
      .replace('- [ ] implement optional', '- [x] implement optional')
      .replace(
        `## Verify
- Automated:
  - [ ] run tests
- Manual:
  - [ ] smoke test optional
- Durable updates:
  - [ ] decide whether this change produced durable knowledge for .rsp/specs/ or stable instructions for the nearest project-owned AGENTS.md
  - [ ] if yes, update the smallest correct target before archive`,
        `## Verify
### Required
- [x] run tests
- [x] durable decision
### Optional
- [ ] smoke test optional`,
      )
    await writeFile(join(archiveOptionalDir, '.rsp', 'changes', 'optional.md'), content)
    await writeFile(join(archiveOptionalDir, '.rsp', 'focus.d', 'optional'), '')

    const result = spawnSync('node', [cliPath(), 'archive', 'optional'], { cwd: archiveOptionalDir, encoding: 'utf-8' })
    const output = `${result.stdout}${result.stderr}`
    expect(result.status).toBe(0)
    expect(output).toContain('optional Verify item(s) are still incomplete')
    expect(existsSync(join(archiveOptionalDir, '.rsp', 'changes', 'optional.md'))).toBe(false)
    expect((await readdir(join(archiveOptionalDir, '.rsp', 'archives'))).some(f => f.endsWith('_optional.md'))).toBe(true)
  })

  it('treats archive follow-up failures as warnings after the archive move succeeds', async () => {
    const archiveWarnDir = await createRspFixture('rsp-archive-followup-warning-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(archiveWarnDir, '.rsp', 'changes', 'warn-followup.md'), renderChange('warn-followup').replaceAll('- [ ]', '- [x]'))
    await writeFile(join(archiveWarnDir, '.rsp', 'focus.d', 'warn-followup'), '')
    await mkdir(join(archiveWarnDir, '.git'), { recursive: true })
    await chmod(join(archiveWarnDir, '.rsp', 'focus.d'), 0o555)

    let output = ''
    try {
      output = execSync(`node ${cliPath()} archive warn-followup`, { cwd: archiveWarnDir, encoding: 'utf-8' })
    }
    finally {
      await chmod(join(archiveWarnDir, '.rsp', 'focus.d'), 0o755)
    }

    expect(output).toContain('Archived:')
    expect(output).toContain('Archive completed, but follow-up cleanup was only partially successful.')
    expect(existsSync(join(archiveWarnDir, '.rsp', 'archives'))).toBe(true)
  })

  it('can focus and unfocus an existing open change', async () => {
    const { focusChange, unfocusChange } = await import('../../src/commands/focus.js')

    await focusChange('auth/login')
    await unfocusChange('auth/login')
    expect(existsSync(focusDPath('auth', 'login'))).toBe(false)

    await focusChange('auth/login')
    expect(existsSync(focusDPath('auth', 'login'))).toBe(true)
  })
})

describe('compact JSON output', () => {
  it('emits equivalent LF-terminated compact JSON for every JSON inspection command', async () => {
    const compactDir = join(tmpdir(), 'rsp-compact-json-test', randomUUID())
    await mkdir(compactDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: compactDir, stdio: 'pipe' })
    await writeFile(join(compactDir, '.rsp', 'changes', 'compact-me.md'), renderChange('compact-me'))

    const commands = [
      ['status'],
      ['show', 'compact-me'],
      ['ready', 'compact-me'],
      ['check'],
      ['doctor'],
      ['history'],
    ]

    for (const command of commands) {
      const pretty = execFileSync('node', [cliPath(), ...command, '--json'], { cwd: compactDir, encoding: 'utf-8' })
      const compact = execFileSync('node', [cliPath(), ...command, '--json', '--compact'], { cwd: compactDir, encoding: 'utf-8' })

      expect(JSON.parse(compact)).toEqual(JSON.parse(pretty))
      expect(compact).toBe(`${JSON.stringify(JSON.parse(pretty))}\n`)
    }
  })

  it('uses compact serialization for existing structured JSON errors', async () => {
    const compactDir = await createRspFixture('rsp-compact-json-error-test', ['specs', 'changes', 'focus.d'])
    const pretty = spawnSync('node', [cliPath(), 'status', '--json', '--stale', 'nope'], { cwd: compactDir, encoding: 'utf-8' })
    const compact = spawnSync('node', [cliPath(), 'status', '--json', '--compact', '--stale', 'nope'], { cwd: compactDir, encoding: 'utf-8' })

    expect(pretty.status).toBe(1)
    expect(compact.status).toBe(1)
    expect(compact.stderr).toBe('')
    expect(JSON.parse(compact.stdout)).toEqual(JSON.parse(pretty.stdout))
    expect(compact.stdout).toBe(`${JSON.stringify(JSON.parse(pretty.stdout))}\n`)
  })

  it('rejects compact on JSON commands when JSON mode is absent', async () => {
    const compactDir = await createRspFixture('rsp-compact-requires-json-test', ['specs', 'changes', 'focus.d'])
    const result = spawnSync('node', [cliPath(), 'status', '--compact'], { cwd: compactDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stdout).toBe('')
    expect(result.stderr).toContain('--compact requires --json')
  })

  it('rejects compact on other commands before command behavior runs', async () => {
    const compactDir = await createRspFixture('rsp-compact-unsupported-command-test', ['specs', 'changes', 'focus.d'])
    const result = spawnSync('node', [cliPath(), 'create', 'must-not-exist', '--compact'], { cwd: compactDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stdout).toBe('')
    expect(result.stderr).toContain('--compact is unsupported for rsp create')
    expect(existsSync(join(compactDir, '.rsp', 'changes', 'must-not-exist.md'))).toBe(false)
  })

  it('documents compact only on JSON inspection command help', () => {
    for (const command of ['status', 'show', 'ready', 'check', 'doctor', 'history']) {
      const output = execFileSync('node', [cliPath(), command, '--help'], { encoding: 'utf-8' })
      expect(output).toContain('--compact')
    }

    const createHelp = execFileSync('node', [cliPath(), 'create', '--help'], { encoding: 'utf-8' })
    expect(createHelp).not.toContain('--compact')
  })

  it('states the update and archive compatibility boundaries in command help', () => {
    const rootHelp = execFileSync('node', [cliPath(), '--help'], { encoding: 'utf-8' })
    const archiveHelp = execFileSync('node', [cliPath(), 'archive', '--help'], { encoding: 'utf-8' })

    expect(rootHelp).toContain('Refresh RSP-managed project files after upgrade; does not update packaged Skills')
    expect(archiveHelp).toContain('Deprecated compatibility route to rsp ready; never moves the Change')
  })
})

describe('history command', () => {
  it('lists bounded deterministic archive summaries with inclusive filters', async () => {
    const historyDir = await createRspFixture('rsp-history-list-test', ['specs', 'changes', 'archives', 'focus.d'])
    await mkdir(join(historyDir, '.rsp', 'archives', 'release'), { recursive: true })
    await writeFile(join(historyDir, '.rsp', 'archives', '2026-07-21_flat.md'), renderChange('flat').replace('kind: feature', 'kind: docs'))
    await writeFile(join(historyDir, '.rsp', 'archives', 'release', '2026-07-24_api.md'), renderChange('release/api'))
    await writeFile(join(historyDir, '.rsp', 'archives', 'release', '2026-07-23_ui.md'), renderChange('release/ui').replace('kind: feature', 'kind: fix'))
    await writeFile(join(historyDir, '.rsp', 'archives', 'release', '2026-07-24_brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))

    const output = execFileSync('node', [cliPath(), 'history', '--group', 'release', '--since', '2026-07-23', '--until', '2026-07-24', '--limit', '1', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    const result = JSON.parse(output)

    expect(result).toEqual(expect.objectContaining({
      command: 'history',
      ok: true,
      mode: 'list',
      query: { limit: 1, since: '2026-07-23', until: '2026-07-24', kind: null, group: 'release', search: null },
      summary: { matched: 2, returned: 1, hasMore: true },
      diagnostics: [],
      runtime: [],
    }))
    expect(result.records).toEqual([expect.objectContaining({
      date: '2026-07-24',
      workRef: 'release/api',
      group: 'release',
      kind: 'feature',
      summary: 'release/api summary',
      path: '.rsp/archives/release/2026-07-24_api.md',
    })])

    const kindOutput = execFileSync('node', [cliPath(), 'history', '--kind', 'fix', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    expect(JSON.parse(kindOutput).records.map((record: { workRef: string }) => record.workRef)).toEqual(['release/ui'])

    const searchOutput = execFileSync('node', [cliPath(), 'history', '--search', 'RELEASE/', '--limit', '1', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    expect(JSON.parse(searchOutput)).toEqual(expect.objectContaining({
      query: expect.objectContaining({ search: 'RELEASE/' }),
      summary: { matched: 2, returned: 1, hasMore: true },
      records: [expect.objectContaining({ workRef: 'release/api' })],
    }))
  })

  it('returns bounded detail for one exact WorkRef without unrelated archive bodies', async () => {
    const historyDir = await createRspFixture('rsp-history-detail-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(historyDir, '.rsp', 'archives', '2026-07-24_target.md'), renderChange('target'))
    await writeFile(join(historyDir, '.rsp', 'archives', '2026-07-23_other.md'), renderChange('other', 'UNRELATED_MARKER'))

    const output = execFileSync('node', [cliPath(), 'history', 'target', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    const result = JSON.parse(output)

    expect(result.command).toBe('history')
    expect(result.ok).toBe(true)
    expect(result.mode).toBe('detail')
    expect(result.record).toEqual(expect.objectContaining({
      workRef: 'target',
      scenarioCount: 1,
      checkboxes: expect.objectContaining({ tasks: expect.objectContaining({ todo: 1 }) }),
      evidence: expect.objectContaining({ tasks: expect.objectContaining({ items: expect.any(Array), truncated: false }) }),
    }))
    expect(output).not.toContain('UNRELATED_MARKER')
  })

  it('returns structured not-found, ambiguous, invalid-filter, and incomplete-inspection failures', async () => {
    const historyDir = await createRspFixture('rsp-history-errors-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(historyDir, '.rsp', 'archives', '2026-07-24_repeat.md'), renderChange('repeat'))
    await writeFile(join(historyDir, '.rsp', 'archives', '2026-07-24_repeat-2.md'), renderChange('repeat'))

    const ambiguous = spawnSync('node', [cliPath(), 'history', 'repeat', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    const missing = spawnSync('node', [cliPath(), 'history', 'missing', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    const invalid = spawnSync('node', [cliPath(), 'history', '--limit', '101', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    const invalidDate = spawnSync('node', [cliPath(), 'history', '--since', '2026-02-30', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    const invalidSearch = spawnSync('node', [cliPath(), 'history', '--search', '', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    const reservedWorkRef = spawnSync('node', [cliPath(), 'history', 'release/00-brief', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    const detailFilter = spawnSync('node', [cliPath(), 'history', 'repeat', '--kind', 'feature', '--json'], { cwd: historyDir, encoding: 'utf-8' })

    expect(ambiguous.status).toBe(1)
    expect(ambiguous.stderr).toBe('')
    expect(JSON.parse(ambiguous.stdout).error).toEqual(expect.objectContaining({ code: 'archive_ambiguous', candidates: expect.any(Array) }))
    expect(JSON.parse(missing.stdout).error.code).toBe('archive_not_found')
    expect(JSON.parse(invalid.stdout).error.code).toBe('invalid_history_limit')
    expect(JSON.parse(invalidDate.stdout).error.code).toBe('invalid_history_since')
    expect(JSON.parse(invalidSearch.stdout).error.code).toBe('invalid_history_search')
    expect(JSON.parse(reservedWorkRef.stdout).error.code).toBe('invalid_history_work_ref')
    expect(JSON.parse(detailFilter.stdout).error.code).toBe('history_detail_filters_unsupported')

    await writeFile(join(historyDir, '.rsp', 'archives', '2026-07-20_wrong.md'), renderChange('different'))
    const incomplete = spawnSync('node', [cliPath(), 'history', '--kind', 'does-not-match', '--json'], { cwd: historyDir, encoding: 'utf-8' })
    const incompleteResult = JSON.parse(incomplete.stdout)
    expect(incomplete.status).toBe(1)
    expect(incompleteResult.ok).toBe(false)
    expect(incompleteResult.diagnostics).toContainEqual(expect.objectContaining({ code: 'archive_identity_mismatch' }))
  })

  it('fails closed for a missing archive root and rejects extra positional arguments in every output mode', async () => {
    const missingRootDir = await createRspFixture('rsp-history-missing-root-test', ['specs', 'changes', 'focus.d'])
    const missingRoot = spawnSync('node', [cliPath(), 'history', '--json'], { cwd: missingRootDir, encoding: 'utf-8' })
    expect(missingRoot.status).toBe(1)
    expect(JSON.parse(missingRoot.stdout)).toEqual(expect.objectContaining({
      ok: false,
      error: expect.objectContaining({ code: 'archive_inspection_incomplete' }),
      diagnostics: [expect.objectContaining({ code: 'archive_root_missing' })],
      diagnosticSummary: { total: 1, returned: 1, hasMore: false },
    }))

    const human = spawnSync('node', [cliPath(), 'history', 'one', 'two'], { cwd: missingRootDir, encoding: 'utf-8' })
    const json = spawnSync('node', [cliPath(), 'history', 'one', 'two', '--json'], { cwd: missingRootDir, encoding: 'utf-8' })
    const compact = spawnSync('node', [cliPath(), 'history', 'one', 'two', '--json', '--compact'], { cwd: missingRootDir, encoding: 'utf-8' })

    expect(human.status).toBe(1)
    expect(human.stderr).toContain('history accepts at most one positional WorkRef')
    expect(json.status).toBe(1)
    expect(json.stderr).toBe('')
    expect(JSON.parse(json.stdout).error.code).toBe('history_positional_args_unsupported')
    expect(compact.status).toBe(1)
    expect(compact.stderr).toBe('')
    expect(compact.stdout).toBe(`${JSON.stringify(JSON.parse(compact.stdout))}\n`)
  })

  it('bounds human diagnostics and ambiguity candidates', async () => {
    const diagnosticsDir = await createRspFixture('rsp-history-bounded-errors-test', ['specs', 'changes', 'archives', 'focus.d'])
    for (let index = 0; index < 25; index++)
      await writeFile(join(diagnosticsDir, '.rsp', 'archives', `2026-07-20_bad-${index}.md`), renderChange(`different-${index}`))

    const diagnostics = spawnSync('node', [cliPath(), 'history'], { cwd: diagnosticsDir, encoding: 'utf-8' })
    const diagnosticsJson = spawnSync('node', [cliPath(), 'history', '--json'], { cwd: diagnosticsDir, encoding: 'utf-8' })
    expect(diagnostics.status).toBe(1)
    expect(diagnostics.stderr.match(/\.rsp\/archives\/2026-07-20_bad-/g)).toHaveLength(20)
    expect(diagnostics.stderr).toContain('5 additional diagnostic(s) omitted')
    expect(JSON.parse(diagnosticsJson.stdout)).toEqual(expect.objectContaining({
      diagnostics: expect.any(Array),
      diagnosticSummary: { total: 25, returned: 20, hasMore: true },
    }))
    expect(JSON.parse(diagnosticsJson.stdout).diagnostics).toHaveLength(20)

    const candidatesDir = await createRspFixture('rsp-history-bounded-candidates-test', ['specs', 'changes', 'archives', 'focus.d'])
    for (let index = 0; index < 25; index++) {
      const suffix = index === 0 ? '' : `-${index + 1}`
      await writeFile(join(candidatesDir, '.rsp', 'archives', `2026-07-20_repeat${suffix}.md`), renderChange('repeat'))
    }
    const candidates = spawnSync('node', [cliPath(), 'history', 'repeat'], { cwd: candidatesDir, encoding: 'utf-8' })
    const candidatesJson = spawnSync('node', [cliPath(), 'history', 'repeat', '--json'], { cwd: candidatesDir, encoding: 'utf-8' })
    expect(candidates.status).toBe(1)
    expect(candidates.stderr.match(/\.rsp\/archives\/2026-07-20_repeat/g)).toHaveLength(20)
    expect(candidates.stderr).toContain('5 additional candidate(s) omitted')
    expect(JSON.parse(candidatesJson.stdout).error).toEqual(expect.objectContaining({
      candidates: expect.any(Array),
      candidateSummary: { total: 25, returned: 20, hasMore: true },
    }))
    expect(JSON.parse(candidatesJson.stdout).error.candidates).toHaveLength(20)
  })

  it('renders an empty human list without reading the generated index', async () => {
    const historyDir = await createRspFixture('rsp-history-empty-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(historyDir, '.rsp', 'archives', 'INDEX.md'), '# stale generated index\n| 2020-01-01 | stale | fix | stale |\n')

    const output = execFileSync('node', [cliPath(), 'history'], { cwd: historyDir, encoding: 'utf-8' })
    expect(output).toContain('No archived Changes match the query.')
    expect(output).not.toContain('stale')
  })
})

describe('specs index behavior', () => {
  it('creates root direct-child navigation with design.md on init', async () => {
    const initDir = join(tmpdir(), 'rsp-specs-index-init-test', randomUUID())
    await mkdir(initDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: initDir })

    const index = await readFile(join(initDir, '.rsp', 'specs', '00-index.md'), 'utf-8')
    const metadata = parseFrontmatter(index)
    expect(metadata?.kind).toBe('generated-index')
    expect(metadata?.index_type).toBe('specs')
    expect(metadata?.entry_count).toBe(1)
    expect(index).toContain('[design.md](design.md)')
    expect(existsSync(join(initDir, '.rsp', 'specs', 'INDEX.md'))).toBe(false)
  })

  it('creates direct-child indexes and keeps unrelated indexes byte-identical', async () => {
    const specDir = join(tmpdir(), 'rsp-specs-index-add-spec-test', randomUUID())
    await mkdir(specDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: specDir })
    execSync(`node ${cliPath()} add spec cli/base`, { cwd: specDir })
    execSync(`node ${cliPath()} add spec skill-system/base`, { cwd: specDir })
    const rootBefore = await readFile(join(specDir, '.rsp', 'specs', '00-index.md'), 'utf-8')
    const skillBefore = await readFile(join(specDir, '.rsp', 'specs', 'skill-system', '00-index.md'), 'utf-8')

    execSync(`node ${cliPath()} add spec cli/history-output`, { cwd: specDir })

    const index = await readFile(join(specDir, '.rsp', 'specs', 'cli', '00-index.md'), 'utf-8')
    const metadata = parseFrontmatter(index)
    expect(metadata?.kind).toBe('generated-index')
    expect(metadata?.index_type).toBe('specs')
    expect(metadata?.entry_count).toBe(2)
    expect(index).toContain('[base.md](base.md)')
    expect(index).toContain('[history-output.md](history-output.md)')
    expect(await readFile(join(specDir, '.rsp', 'specs', '00-index.md'), 'utf-8')).toBe(rootBefore)
    expect(await readFile(join(specDir, '.rsp', 'specs', 'skill-system', '00-index.md'), 'utf-8')).toBe(skillBefore)
  })

  it('adds a new domain to its local index and the root index', async () => {
    const specDir = join(tmpdir(), 'rsp-specs-index-new-domain-test', randomUUID())
    await mkdir(specDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: specDir })

    execSync(`node ${cliPath()} add spec runtime/lifecycle`, { cwd: specDir })

    const root = await readFile(join(specDir, '.rsp', 'specs', '00-index.md'), 'utf-8')
    const runtime = await readFile(join(specDir, '.rsp', 'specs', 'runtime', '00-index.md'), 'utf-8')
    expect(root).toContain('[runtime/](runtime/00-index.md)')
    expect(runtime).toContain('[lifecycle.md](lifecycle.md)')
  })

  it('fully reconciles nested direct-child navigation without flattening descendants', async () => {
    const specDir = join(tmpdir(), 'rsp-specs-index-full-reconcile-test', randomUUID())
    await mkdir(specDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: specDir })
    await mkdir(join(specDir, '.rsp', 'specs', 'platform', 'api'), { recursive: true })
    await writeFile(join(specDir, '.rsp', 'specs', 'platform', 'api', 'endpoint.md'), '# Endpoint contract\n\nStable endpoint facts.\n')

    execSync(`node ${cliPath()} update`, { cwd: specDir })

    const root = await readFile(join(specDir, '.rsp', 'specs', '00-index.md'), 'utf-8')
    const platform = await readFile(join(specDir, '.rsp', 'specs', 'platform', '00-index.md'), 'utf-8')
    const api = await readFile(join(specDir, '.rsp', 'specs', 'platform', 'api', '00-index.md'), 'utf-8')
    expect(root).toContain('[platform/](platform/00-index.md)')
    expect(root).not.toContain('endpoint.md')
    expect(platform).toContain('[api/](api/00-index.md)')
    expect(platform).not.toContain('endpoint.md')
    expect(api).toContain('[endpoint.md](endpoint.md)')
  })

  it('migrates only a recognized legacy root Specs index', async () => {
    const recognizedDir = join(tmpdir(), 'rsp-specs-index-legacy-recognized-test', randomUUID())
    const customDir = join(tmpdir(), 'rsp-specs-index-legacy-custom-test', randomUUID())
    await mkdir(recognizedDir, { recursive: true })
    await mkdir(customDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: recognizedDir })
    execSync(`node ${cliPath()} init`, { cwd: customDir })
    await writeFile(join(recognizedDir, '.rsp', 'specs', 'INDEX.md'), renderGeneratedIndexMetadata('specs'))
    await writeFile(join(customDir, '.rsp', 'specs', 'INDEX.md'), '# Project-owned notes\n')

    execSync(`node ${cliPath()} update`, { cwd: recognizedDir })
    const custom = spawnSync('node', [cliPath(), 'update'], { cwd: customDir, encoding: 'utf-8' })

    expect(existsSync(join(recognizedDir, '.rsp', 'specs', 'INDEX.md'))).toBe(false)
    expect(existsSync(join(recognizedDir, '.rsp', 'specs', '00-index.md'))).toBe(true)
    expect(custom.status).not.toBe(0)
    expect(`${custom.stdout}${custom.stderr}`).toContain('reserved Specs index is not recognized generated content')
    expect(await readFile(join(customDir, '.rsp', 'specs', 'INDEX.md'), 'utf-8')).toBe('# Project-owned notes\n')
  })

  it('removes only recognized obsolete local indexes during full update', async () => {
    const specDir = join(tmpdir(), 'rsp-specs-index-obsolete-test', randomUUID())
    await mkdir(specDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: specDir })
    const emptyDir = join(specDir, '.rsp', 'specs', 'empty')
    await mkdir(emptyDir)
    await writeFile(join(emptyDir, '00-index.md'), renderGeneratedIndexMetadata('specs').replace('source_dir: .rsp/specs', 'source_dir: .rsp/specs/empty'))

    execSync(`node ${cliPath()} update`, { cwd: specDir })

    expect(existsSync(join(emptyDir, '00-index.md'))).toBe(false)
  })

  it('reserves local index identities from add spec', async () => {
    const specDir = join(tmpdir(), 'rsp-specs-index-reserved-name-test', randomUUID())
    await mkdir(specDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: specDir })

    for (const name of ['index', 'cli/index', '00-index', 'cli/00-index']) {
      const result = spawnSync('node', [cliPath(), 'add', 'spec', name], { cwd: specDir, encoding: 'utf-8' })
      expect(result.status).not.toBe(0)
      expect(result.stderr).toContain('reserved for generated local navigation')
    }
  })

  it('does not add a Spec through a symlinked parent directory', async () => {
    const specDir = join(tmpdir(), 'rsp-add-spec-parent-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-add-spec-parent-external-test', randomUUID())
    await mkdir(specDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: specDir })
    await symlink(externalDir, join(specDir, '.rsp', 'specs', 'group'))

    const result = spawnSync('node', [cliPath(), 'add', 'spec', 'group/escaped'], { cwd: specDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(`${result.stdout}${result.stderr}`).toContain('spec path must be a real directory')
    expect(existsSync(join(externalDir, 'escaped.md'))).toBe(false)
    expect(existsSync(join(specDir, '.rsp', '.lock'))).toBe(false)
  })

  it('does not index a symlinked Markdown Spec', async () => {
    const specDir = join(tmpdir(), 'rsp-specs-index-file-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-specs-index-file-external-test', randomUUID())
    await mkdir(specDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: specDir })
    await writeFile(join(externalDir, 'secret.md'), '---\ntitle: External Secret Title\n---\n')
    await symlink(join(externalDir, 'secret.md'), join(specDir, '.rsp', 'specs', 'leak.md'))

    const result = spawnSync('node', [cliPath(), 'update'], { cwd: specDir, encoding: 'utf-8' })
    const index = await readFile(join(specDir, '.rsp', 'specs', '00-index.md'), 'utf-8')

    expect(result.status).toBe(1)
    expect(`${result.stdout}${result.stderr}`).toContain('unsupported entry in the Specs tree')
    expect(index).not.toContain('External Secret Title')
    expect(existsSync(join(specDir, '.rsp', '.lock'))).toBe(false)
  })
})

describe('ready command', () => {
  it('reports archive readiness without moving the change', async () => {
    const readyDir = await createRspFixture('rsp-ready-test')
    await writeFile(join(readyDir, '.rsp', 'changes', 'incomplete.md'), renderChange('incomplete'))

    const output = execSync(`node ${cliPath()} ready incomplete`, { cwd: readyDir, encoding: 'utf-8' })
    expect(output).toContain('task item(s) still incomplete')
    expect(output).toContain('required Verify item(s) are still incomplete')
    expect(output).not.toContain('Run: rsp archive incomplete')

    // change should still be there (not archived)
    expect(existsSync(join(readyDir, '.rsp', 'changes', 'incomplete.md'))).toBe(true)
  })

  it('reports ready when all checks pass', async () => {
    const readyDir = await createRspFixture('rsp-ready-clean-test')
    await writeFile(join(readyDir, '.rsp', 'changes', 'complete.md'), renderChange('complete').replace(
      '- [ ] implement complete',
      '- [x] implement complete',
    ).replace(
      '- [ ] run tests',
      '- [x] run tests',
    ).replace(
      '- [ ] smoke test complete',
      '- [x] smoke test complete',
    ).replace(
      '- [ ] decide whether this change produced durable knowledge',
      '- [x] decide whether this change produced durable knowledge',
    ).replace(
      '- [ ] if yes, update the smallest correct target before archive',
      '- [x] if yes, update the smallest correct target before archive',
    ))

    const output = execSync(`node ${cliPath()} ready complete`, { cwd: readyDir, encoding: 'utf-8' })
    expect(output).toContain('Ready to archive.')
    expect(output).not.toContain('Run: rsp archive complete')
  })

  it('emits machine-readable JSON', async () => {
    const readyDir = await createRspFixture('rsp-ready-json-test')
    await writeFile(join(readyDir, '.rsp', 'changes', 'incomplete.md'), renderChange('incomplete'))

    const output = execSync(`node ${cliPath()} ready incomplete --json`, { cwd: readyDir, encoding: 'utf-8' })
    const result = JSON.parse(output)
    expect(result.command).toBe('ready')
    expect(result.ok).toBe(true)
    expect(result.change).toBe('incomplete')
    expect(result.readiness.incompleteTasks).toBe(1)
    expect(result.readiness.incompleteVerify).toBe(4)
    expect(result.readiness.activeBlockers).toBe(false)
    expect(result.readiness.missingScenarios).toBe(false)
    expect(result.readiness.deterministic).toBe('warnings')
    expect(result.readiness.semantic).toBe('needs-review')
    expect(result.readiness.archiveReady).toBe('no')
    expect(result.readiness.completionGate).toBe('blocked')
    expect(result.durableReview.required).toBe(true)
    expect(result.durableReview.factDecisions).toContain('No current-fact update needed')
    expect(result.durableReview.rationaleDecisions).toContain('No Decision Record needed')
    expect(result.durableReview.factCandidateTargets).toContain('.rsp/specs/design.md')
    expect(result.durableReview.factCandidateTargets).not.toContain('.rsp/specs/00-index.md')
    expect(result.durableReview.factCandidateTargets).not.toContain('.rsp/rules/rsp-rules.md')
    expect(result.durableReview.decisionRecordsPath).toBe('.rsp/specs/decisions')
    expect(result.durableReview.note).toContain('never promotes Change content automatically')
    expect(result).not.toHaveProperty('nextActions')
    expect(Array.isArray(result.warnings)).toBe(true)
  })

  it('keeps deterministic readiness advisory when the change is ready', async () => {
    const readyDir = await createRspFixture('rsp-ready-next-actions-test')
    await writeFile(join(readyDir, '.rsp', 'changes', 'complete.md'), renderChange('complete').replaceAll('- [ ]', '- [x]'))

    const output = execSync(`node ${cliPath()} ready complete --json`, { cwd: readyDir, encoding: 'utf-8' })
    const result = JSON.parse(output)

    expect(result.readiness.archiveReady).toBe('yes')
    expect(result).not.toHaveProperty('nextActions')
  })

  it('reports machine-readable readiness categories for active blockers', async () => {
    const readyDir = await createRspFixture('rsp-ready-json-blocked-test')
    await writeFile(join(readyDir, '.rsp', 'changes', 'blocked.md'), renderChange('blocked').replace('## Blockers\n- none', '## Blockers\n- waiting on release owner'))

    const output = execSync(`node ${cliPath()} ready blocked --json`, { cwd: readyDir, encoding: 'utf-8' })
    const result = JSON.parse(output)
    expect(result.readiness.deterministic).toBe('warnings')
    expect(result.readiness.semantic).toBe('needs-review')
    expect(result.readiness.archiveReady).toBe('no')
  })

  it('prints readiness category guidance in human output', async () => {
    const readyDir = await createRspFixture('rsp-ready-human-categories-test')
    await writeFile(join(readyDir, '.rsp', 'changes', 'incomplete.md'), renderChange('incomplete'))

    const output = execSync(`node ${cliPath()} ready incomplete`, { cwd: readyDir, encoding: 'utf-8' })
    expect(output).toContain('Deterministic readiness:')
    expect(output).toContain('Semantic review:')
    expect(output).toContain('Archive ready:')
    expect(output).toContain('Durable review:')
    expect(output).toContain('Current-fact options:')
    expect(output).toContain('Rationale options:')
    expect(output).toContain('Decision Record path:')
  })

  it('keeps ready errors machine-readable when the target is not a file', async () => {
    const readyDir = await createRspFixture('rsp-ready-not-file-test')
    await mkdir(join(readyDir, '.rsp', 'changes', 'not-a-file.md'), { recursive: true })

    const result = spawnSync('node', [cliPath(), 'ready', 'not-a-file', '--json'], { cwd: readyDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.error.code).toBe('work_ref_not_file')
  })
})
