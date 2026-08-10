import { execFileSync, execSync, spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { cp, mkdir, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { archivePath, changesPath, cliPath, completeOpenChange, completeReopenChange, copyFixture, createClosedGroupProject, createRspFixture, renderChange, renderGroupBrief } from './harness.js'

describe('pseudo-real fixture workflow', () => {
  it('initializes, adds files, and passes doctor in a repo with existing AGENTS.md', async () => {
    const fixtureDir = await copyFixture('home-manager-ish')

    execSync(`node ${cliPath()} init`, { cwd: fixtureDir })
    execSync(`node ${cliPath()} add spec shell-layout`, { cwd: fixtureDir })

    const agents = await readFile(join(fixtureDir, 'AGENTS.md'), 'utf-8')
    expect(agents).toContain('<!-- rsp:begin -->')

    const doctorOutput = execSync(`node ${cliPath()} doctor`, { cwd: fixtureDir, encoding: 'utf-8' })
    expect(doctorOutput).toContain('RSP setup looks healthy')
  })
})

describe('archive name collisions', () => {
  it('fails closed on a normalization-equivalent archive filename', async () => {
    const archiveDir = join(tmpdir(), 'rsp-archive-normalization-collision-test', randomUUID())
    await mkdir(archiveDir, { recursive: true })
    execFileSync('node', [cliPath(), 'init'], { cwd: archiveDir })
    const workRef = '听说训练-é'
    execFileSync('node', [cliPath(), 'create', workRef, '验证中文归档'], { cwd: archiveDir })
    await completeOpenChange(archiveDir, workRef)

    const today = new Date().toISOString().slice(0, 10)
    const canonicalName = `${today}_${workRef}.md`
    const decomposedName = canonicalName.normalize('NFD')
    expect(decomposedName).not.toBe(canonicalName)
    await writeFile(join(archiveDir, '.rsp', 'archives', decomposedName), '# normalization alias\n')

    const result = spawnSync('node', [cliPath(), 'archive', workRef], { cwd: archiveDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Unicode normalization collision')
    expect(existsSync(join(archiveDir, '.rsp', 'changes', `${workRef}.md`))).toBe(true)
    expect(await readdir(join(archiveDir, '.rsp', 'archives'))).toContain(decomposedName)
  })

  it('does not archive through a symlinked group destination', async () => {
    const archiveDir = join(tmpdir(), 'rsp-archive-group-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-archive-group-external-test', randomUUID())
    await mkdir(archiveDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: archiveDir })
    execSync(`node ${cliPath()} group create release "Ship release"`, { cwd: archiveDir })
    await writeFile(join(archiveDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))
    execSync(`node ${cliPath()} create release/api`, { cwd: archiveDir })
    await symlink(externalDir, join(archiveDir, '.rsp', 'archives', 'release'))

    const dryRun = spawnSync('node', [cliPath(), 'archive', 'release/api', '--dry-run'], { cwd: archiveDir, encoding: 'utf-8' })
    const result = spawnSync('node', [cliPath(), 'archive', 'release/api'], { cwd: archiveDir, encoding: 'utf-8' })

    expect(dryRun.status).toBe(0)
    expect(dryRun.stderr).toContain('Deprecated: use `rsp ready <name>`')
    expect(dryRun.stdout).toContain('Archive readiness for release/api')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('archive path must be a real directory')
    expect(existsSync(join(archiveDir, '.rsp', 'changes', 'release', 'api.md'))).toBe(true)
    expect((await readdir(externalDir))).toEqual([])
    expect(existsSync(join(archiveDir, '.rsp', '.lock'))).toBe(false)
  })

  it('keeps both archives when the same change is archived twice on the same day', async () => {
    const { createChange } = await import('../../src/commands/create.js')
    const { archiveChange } = await import('../../src/commands/archive.js')

    await createChange('duplicate-archive', 'first pass')
    await writeFile(changesPath('duplicate-archive.md'), (await readFile(changesPath('duplicate-archive.md'), 'utf-8')).replaceAll('- [ ]', '- [x]'))
    await archiveChange('duplicate-archive')
    await createChange('duplicate-archive', 'second pass')
    await writeFile(changesPath('duplicate-archive.md'), (await readFile(changesPath('duplicate-archive.md'), 'utf-8')).replaceAll('- [ ]', '- [x]'))
    await archiveChange('duplicate-archive')

    const archiveFiles = (await readdir(archivePath())).filter(f => f !== 'INDEX.md')
    const matches = archiveFiles.filter(f => /_duplicate-archive(?:-2)?\.md$/.test(f))
    expect(matches).toHaveLength(2)
  })
})

describe('reopen command', () => {
  const today = new Date().toISOString().slice(0, 10)

  it('restores one archived Change under the same WorkRef while retaining history', async () => {
    const root = await createReopenProject('success')
    runReopen(root, ['create', 'recover-me', 'Recover this work'])
    const originalPath = join(root, '.rsp', 'changes', 'recover-me.md')
    await writeFile(originalPath, completeReopenChange(await readFile(originalPath, 'utf-8')))
    runReopen(root, ['archive', 'recover-me'])
    const archive = join(root, '.rsp', 'archives', `${today}_recover-me.md`)
    const archived = await readFile(archive, 'utf-8')

    const output = runReopen(root, ['reopen', 'recover-me', '--reason', 'real run still fails'])

    expect(output).toContain('Reopened: recover-me')
    expect(await readFile(archive, 'utf-8')).toBe(archived)
    const reopened = await readFile(originalPath, 'utf-8')
    expect(reopened).toContain('- [ ] Resolve reopened concern: real run still fails')
    expect(reopened).toContain('- [ ] Verify reopened concern: real run still fails')
    expect(existsSync(join(root, '.rsp', 'focus.d', 'recover-me'))).toBe(true)

    await writeFile(originalPath, completeReopenChange(reopened))
    runReopen(root, ['archive', 'recover-me'])
    expect((await readdir(join(root, '.rsp', 'archives'))).filter(name => name.includes('recover-me'))).toHaveLength(2)
    expect(existsSync(join(root, '.rsp', 'focus.d', 'recover-me'))).toBe(false)
  })

  it('fails on ambiguous history and accepts one exact matching archive path', async () => {
    const root = await createReopenProject('ambiguous')
    await createReopenArchive(root, 'repeat', 'first pass')
    await createReopenArchive(root, 'repeat', 'second pass')

    const ambiguous = failReopen(root, ['reopen', 'repeat', '--reason', 'needs correction'])
    expect(ambiguous.stderr).toContain('multiple archives match WorkRef repeat')
    expect(ambiguous.stderr).toContain(`.rsp/archives/${today}_repeat.md`)
    expect(ambiguous.stderr).toContain(`.rsp/archives/${today}_repeat-2.md`)
    expect(existsSync(join(root, '.rsp', 'changes', 'repeat.md'))).toBe(false)

    runReopen(root, ['reopen', 'repeat', '--from', `.rsp/archives/${today}_repeat-2.md`, '--reason', 'needs correction'])
    expect(await readFile(join(root, '.rsp', 'changes', 'repeat.md'), 'utf-8')).toContain('- Outcome: second pass')
    expect((await readdir(join(root, '.rsp', 'archives'))).filter(name => name.includes('repeat'))).toHaveLength(2)
  })

  it('rejects identity mismatch and never overwrites existing open work', async () => {
    const root = await createReopenProject('identity-and-collision')
    await createReopenArchive(root, 'first', 'archived version')

    const mismatch = failReopen(root, ['reopen', 'other', '--from', `.rsp/archives/${today}_first.md`, '--reason', 'wrong target'])
    expect(mismatch.stderr).toContain('selected archive belongs to first, not other')

    runReopen(root, ['create', 'first', 'current open version'])
    const openPath = join(root, '.rsp', 'changes', 'first.md')
    const current = await readFile(openPath, 'utf-8')
    const collision = failReopen(root, ['reopen', 'first', '--reason', 'must not overwrite'])
    expect(collision.stderr).toContain('open Change already exists: first')
    expect(await readFile(openPath, 'utf-8')).toBe(current)
  })

  it('treats reopened work as an open dependency rather than archived history', async () => {
    const root = await createReopenProject('dependency')
    await createReopenArchive(root, 'foundation', 'foundation pass')
    runReopen(root, ['create', 'consumer', 'consumer pass'])
    const consumerPath = join(root, '.rsp', 'changes', 'consumer.md')
    await writeFile(consumerPath, (await readFile(consumerPath, 'utf-8')).replace(
      '## Blockers\n- none',
      '## Blockers\n- requires `foundation`: foundation must be complete',
    ))

    runReopen(root, ['reopen', 'foundation', '--reason', 'foundation is incomplete'])
    const status = JSON.parse(runReopen(root, ['status', '--json']))
    expect(status.plan.edges).toContainEqual(expect.objectContaining({ change: 'consumer', requires: 'foundation', state: 'open' }))
    expect(status.plan.nodes).toContainEqual(expect.objectContaining({ name: 'foundation', selection: 'selected', state: 'ready' }))
    expect(status.plan.blocked).toContainEqual(expect.objectContaining({ change: 'consumer', requires: ['foundation'] }))
  })

  it('reopens a declared child only while its Change Group remains open', async () => {
    const root = await createReopenProject('open-group')
    runReopen(root, ['group', 'create', 'delivery', 'Deliver two slices'])
    await writeFile(join(root, '.rsp', 'changes', 'delivery', '00-brief.md'), renderReopenGroupBrief('delivery', false))
    await createReopenArchive(root, 'delivery/api', 'api pass')

    runReopen(root, ['reopen', 'delivery/api', '--reason', 'api still fails'])
    expect(existsSync(join(root, '.rsp', 'changes', 'delivery', 'api.md'))).toBe(true)
    expect(existsSync(join(root, '.rsp', 'focus.d', 'delivery', 'api'))).toBe(true)
  })

  it('does not implicitly reopen a closed Change Group', async () => {
    const root = await createReopenProject('closed-group')
    runReopen(root, ['group', 'create', 'delivery', 'Deliver two slices'])
    await writeFile(join(root, '.rsp', 'changes', 'delivery', '00-brief.md'), renderReopenGroupBrief('delivery', true))
    await createReopenArchive(root, 'delivery/api', 'api pass')
    await createReopenArchive(root, 'delivery/ui', 'ui pass')
    runReopen(root, ['group', 'close', 'delivery'])

    const result = failReopen(root, ['reopen', 'delivery/api', '--reason', 'api still fails'])
    expect(result.stderr).toContain('cannot reopen delivery/api because its Change Group is closed')
    expect(existsSync(join(root, '.rsp', 'changes', 'delivery', 'api.md'))).toBe(false)
  })

  it('fails before mutation when archive inspection is incomplete', async () => {
    const root = await createReopenProject('invalid-history')
    await createReopenArchive(root, 'valid', 'valid pass')
    await writeFile(join(root, '.rsp', 'archives', 'bad-name.md'), '# invalid archive\n')

    const result = failReopen(root, ['reopen', 'valid', '--reason', 'must inspect first'])
    expect(result.stderr).toContain('archive history inspection is incomplete')
    expect(existsSync(join(root, '.rsp', 'changes', 'valid.md'))).toBe(false)
    expect(existsSync(join(root, '.rsp', 'focus.d', 'valid'))).toBe(false)
  })

  it('rejects non-canonical required section headings before mutation', async () => {
    const root = await createReopenProject('invalid-sections')
    await writeFile(join(root, '.rsp', 'archives', `${today}_invalid-sections.md`), `---
kind: feature
---

# Change: invalid-sections

## Proposal
- Outcome: malformed archived sections

## Tasks notes
- [x] old task

## Verify notes
- [x] old verification

## Blockers
- none
`)

    const result = failReopen(root, ['reopen', 'invalid-sections', '--reason', 'must remain atomic'])
    expect(result.stderr).toContain('must contain exactly one required section: Tasks')
    expect(existsSync(join(root, '.rsp', 'changes', 'invalid-sections.md'))).toBe(false)
    expect(existsSync(join(root, '.rsp', 'focus.d', 'invalid-sections'))).toBe(false)
  })
})

async function createReopenProject(label: string): Promise<string> {
  const root = join(tmpdir(), `rsp-reopen-${label}`, randomUUID())
  await mkdir(root, { recursive: true })
  runReopen(root, ['init'])
  return root
}

function runReopen(root: string, args: string[]): string {
  return execFileSync('node', [cliPath(), ...args], { cwd: root, encoding: 'utf-8' })
}

function failReopen(root: string, args: string[]) {
  const result = spawnSync('node', [cliPath(), ...args], { cwd: root, encoding: 'utf-8' })
  expect(result.status).toBe(1)
  return result
}

async function createReopenArchive(root: string, name: string, summary: string): Promise<void> {
  runReopen(root, ['create', name, summary])
  const segments = name.split('/')
  const path = join(root, '.rsp', 'changes', ...segments.slice(0, -1), `${segments.at(-1)}.md`)
  await writeFile(path, completeReopenChange(await readFile(path, 'utf-8')))
  runReopen(root, ['archive', name])
}

function renderReopenGroupBrief(group: string, complete: boolean): string {
  return `---
kind: group
---

# Change Group: ${group}

## Goal
- Deliver two slices

## Scope
- Coordinate delivery

## Shared Constraints
- Keep slices independent

## Slices
- \`${group}/api\`: API slice
- \`${group}/ui\`: UI slice

## Completion Conditions
- [${complete ? 'x' : ' '}] Both slices work together

## Durable Outcomes
- none

## Blockers
- none
`
}

describe('typed work references', () => {
  it('keeps Group Briefs out of executable status records', async () => {
    const statusDir = await createRspFixture('rsp-status-work-ref-test')
    const groupDir = join(statusDir, '.rsp', 'changes', 'release')
    await mkdir(groupDir, { recursive: true })
    await writeFile(join(groupDir, '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))
    await writeFile(join(groupDir, 'api.md'), renderChange('release/api'))
    await writeFile(join(groupDir, 'ui.md'), renderChange('release/ui'))

    const output = execSync(`node ${cliPath()} status --json`, { cwd: statusDir, encoding: 'utf-8' })
    const result = JSON.parse(output)

    expect(result.records.map((record: { name: string }) => record.name)).toEqual(['release/api', 'release/ui'])
  })

  it('never focuses a Group Brief', async () => {
    const focusDir = await createRspFixture('rsp-focus-group-brief-test', ['specs', 'changes', 'focus.d'])
    const groupDir = join(focusDir, '.rsp', 'changes', 'release')
    await mkdir(groupDir, { recursive: true })
    await writeFile(join(groupDir, '00-brief.md'), '# Group Brief: release\n')

    const result = spawnSync('node', [cliPath(), 'focus', 'release/brief'], { cwd: focusDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('is a Group Brief and cannot be used as an executable Change')
    expect(existsSync(join(focusDir, '.rsp', 'focus.d', 'release', 'brief'))).toBe(false)

    const marker = join(focusDir, '.rsp', 'focus.d', 'release', 'brief')
    await mkdir(join(focusDir, '.rsp', 'focus.d', 'release'), { recursive: true })
    await writeFile(marker, '')
    const cleanup = spawnSync('node', [cliPath(), 'unfocus', 'release/brief'], { cwd: focusDir, encoding: 'utf-8' })

    expect(cleanup.status).toBe(0)
    expect(existsSync(marker)).toBe(false)
  })

  it('fails status visibly when the work tree is structurally invalid', async () => {
    const statusDir = await createRspFixture('rsp-status-invalid-work-ref-test')
    const nestedDir = join(statusDir, '.rsp', 'changes', 'release', 'backend')
    await mkdir(nestedDir, { recursive: true })
    await writeFile(join(nestedDir, 'api.md'), renderChange('release/backend/api'))

    const result = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.ok).toBe(false)
    expect(output.diagnostics).toContainEqual(expect.objectContaining({ code: 'unsupported_work_depth' }))
    expect(output.nextActions).toContain('Run: rsp doctor')
    expect(output.nextActions).not.toContain('Run: rsp create <name>')
  })
})

describe('change groups', () => {
  it('creates an unfocused Group Brief before child Changes', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-create-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })

    const output = execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir, encoding: 'utf-8' })
    const briefPath = join(groupDir, '.rsp', 'changes', 'release', '00-brief.md')
    const brief = await readFile(briefPath, 'utf-8')

    expect(output).toContain('Created Change Group: release')
    expect(brief).toContain('kind: group')
    expect(brief).toContain('# Change Group: release')
    expect(brief).toContain('## Goal\n- Ship the release')
    expect(brief).toContain('## Slices')
    expect(brief).toContain('## Completion Conditions')
    expect(brief).toContain('- Current facts:')
    expect(brief).toContain('- Lasting rationale:')
    expect(existsSync(join(groupDir, '.rsp', 'focus.d', 'release', 'brief'))).toBe(false)
  })

  it('documents replacement and validation semantics in the generated config template', async () => {
    const initDir = join(tmpdir(), 'rsp-config-template-test', randomUUID())
    await mkdir(initDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: initDir })

    const config = await readFile(join(initDir, '.rsp', 'config.yaml'), 'utf-8')
    expect(config).toContain('A non-empty kinds list replaces the built-in defaults; it does not extend them.')
    expect(config).toContain('Every entry must be a unique non-empty string.')
    expect(config).toContain('manage:\n  activation: auto\n  closeout: local')
    expect(config).toContain('kinds: []')
    expect(config).toContain('decisions:\n  path: .rsp/specs/decisions')
    expect(config).toContain('language:\n  default: en\n  # artifacts: zh-CN\n  # commit: zh-CN')
    expect(config).toContain('local routes a qualified clean terminal non-small boundary to one local commit but never push or publication')
    expect(config).toContain('Decision Records default to .rsp/specs/decisions.')
  })

  it('rejects a grouped Change until its Group Brief exists', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-required-brief-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })

    const result = spawnSync('node', [cliPath(), 'create', 'release/api'], { cwd: groupDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Change Group "release" requires a Group Brief')
    expect(result.stderr).toContain('rsp group create release')
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', 'api.md'))).toBe(false)
    expect(existsSync(join(groupDir, '.rsp', 'focus.d', 'release', 'api'))).toBe(false)
  })

  it('can unfocus a grouped Change after its Group Brief is lost', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-unfocus-recovery-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })
    await rm(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'))

    const result = spawnSync('node', [cliPath(), 'unfocus', 'release/api'], { cwd: groupDir, encoding: 'utf-8' })

    expect(result.status).toBe(0)
    expect(existsSync(join(groupDir, '.rsp', 'focus.d', 'release', 'api'))).toBe(false)
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', 'api.md'))).toBe(true)
  })

  it('rejects a grouped Change that is not declared by the Group Brief', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-undeclared-create-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))

    const result = spawnSync('node', [cliPath(), 'create', 'release/docs'], { cwd: groupDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('grouped Change is not declared by release/brief')
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', 'docs.md'))).toBe(false)
    expect(existsSync(join(groupDir, '.rsp', 'focus.d', 'release', 'docs'))).toBe(false)
  })

  it('rejects an undeclared grouped Change at every executable CLI seam', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-undeclared-seams-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', 'docs.md'), renderChange('release/docs'))

    for (const args of [
      ['focus', 'release/docs'],
      ['show', 'release/docs', '--json'],
      ['ready', 'release/docs', '--json'],
      ['archive', 'release/docs', '--dry-run'],
      ['archive', 'release/docs'],
    ]) {
      const result = spawnSync('node', [cliPath(), ...args], { cwd: groupDir, encoding: 'utf-8' })
      expect(result.status, args.join(' ')).toBe(1)
      expect(`${result.stdout}${result.stderr}`, args.join(' ')).toContain('grouped Change is not declared by release/brief')
    }
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', 'docs.md'))).toBe(true)
    expect(existsSync(join(groupDir, '.rsp', 'focus.d', 'release', 'docs'))).toBe(false)
  })

  it('reports an empty group directory without a Group Brief', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-empty-directory-test', randomUUID())
    await mkdir(join(groupDir, '.rsp', 'changes', 'release'), { recursive: true })
    await mkdir(join(groupDir, '.rsp', 'specs'), { recursive: true })
    await writeFile(join(groupDir, '.rsp', 'rsp-rules.md'), '# RSP\n')
    await writeFile(join(groupDir, '.rsp', 'specs', 'design.md'), '# Design\n')

    const result = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const status = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(status.diagnostics).toContainEqual(expect.objectContaining({ code: 'group_brief_missing', change: 'release' }))

    const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const doctor = JSON.parse(doctorResult.stdout)
    expect(doctorResult.status).toBe(1)
    expect(doctor.checks).toContainEqual(expect.objectContaining({ status: 'issue', label: 'Change Group contracts are valid' }))
    expect(doctor.checks).not.toContainEqual(expect.objectContaining({ status: 'ok', label: 'Change Group contracts are valid' }))
  })

  it('projects Change Group membership and completion without persisted status', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-status-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} create release/ui`, { cwd: groupDir })

    const output = execSync(`node ${cliPath()} status --json`, { cwd: groupDir, encoding: 'utf-8' })
    const status = JSON.parse(output)

    expect(status.groups).toEqual([expect.objectContaining({
      name: 'release',
      path: '.rsp/changes/release/00-brief.md',
      completion: { done: 0, total: 1 },
      blockers: false,
      readyToClose: false,
      slices: [
        expect.objectContaining({ name: 'release/api', state: 'open' }),
        expect.objectContaining({ name: 'release/ui', state: 'open' }),
      ],
    })])
    expect(status.records.map((record: { name: string }) => record.name)).toEqual(['release/api', 'release/ui'])
    expect(status.groups[0]).not.toHaveProperty('status')

    const human = execSync(`node ${cliPath()} status`, { cwd: groupDir, encoding: 'utf-8' })
    expect(human).toContain('Change Groups')
    expect(human).toContain('release')
    expect(human).toContain('0/2 archived')
  })

  it('reports Group Brief membership mismatches through check and doctor', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-membership-check-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} create release/ui`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', 'docs.md'), renderChange('release/docs'))

    const checkResult = spawnSync('node', [cliPath(), 'check', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const check = JSON.parse(checkResult.stdout)
    const doctor = JSON.parse(doctorResult.stdout)

    expect(checkResult.status).toBe(1)
    expect(check.diagnostics).toContainEqual(expect.objectContaining({ code: 'group_child_undeclared', change: 'release' }))
    expect(doctorResult.status).toBe(1)
    expect(doctor.checks).toContainEqual(expect.objectContaining({ status: 'issue', label: 'Change Group contracts are valid' }))
  })

  it('does not derive archived membership from a Change heading in another group directory', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-archive-identity-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create other "Ship the other effort"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui'], { complete: true }))
    await writeFile(join(groupDir, '.rsp', 'changes', 'other', '00-brief.md'), renderGroupBrief('other', ['other/api', 'other/ui'], { complete: true }))
    const releaseArchiveDir = join(groupDir, '.rsp', 'archives', 'release')
    await mkdir(releaseArchiveDir, { recursive: true })
    await writeFile(join(releaseArchiveDir, '2026-07-19_api.md'), renderChange('other/api'))
    await writeFile(join(releaseArchiveDir, '2026-07-19_ui.md'), renderChange('other/ui'))

    const result = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const status = JSON.parse(result.stdout)
    const other = status.groups.find((group: { name: string }) => group.name === 'other')

    expect(result.status).toBe(1)
    expect(other).toEqual(expect.objectContaining({
      readyToClose: false,
      slices: [
        expect.objectContaining({ name: 'other/api', state: 'missing' }),
        expect.objectContaining({ name: 'other/ui', state: 'missing' }),
      ],
    }))
    expect(status.diagnostics).toContainEqual(expect.objectContaining({ code: 'group_archive_identity_mismatch', change: 'release' }))
  })

  it('rejects an archived child removed from the authoritative Group Brief', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-archived-undeclared-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    const briefPath = join(groupDir, '.rsp', 'changes', 'release', '00-brief.md')
    await writeFile(briefPath, renderGroupBrief('release', ['release/api', 'release/ui', 'release/docs'], { complete: true }))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} create release/ui`, { cwd: groupDir })
    execSync(`node ${cliPath()} create release/docs`, { cwd: groupDir })
    await completeOpenChange(groupDir, 'release/api')
    await completeOpenChange(groupDir, 'release/ui')
    await completeOpenChange(groupDir, 'release/docs')
    execSync(`node ${cliPath()} archive release/docs`, { cwd: groupDir })
    await writeFile(briefPath, renderGroupBrief('release', ['release/api', 'release/ui'], { complete: true }))
    execSync(`node ${cliPath()} archive release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} archive release/ui`, { cwd: groupDir })

    const statusResult = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const status = JSON.parse(statusResult.stdout)
    const checkResult = spawnSync('node', [cliPath(), 'check', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const check = JSON.parse(checkResult.stdout)
    const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const doctor = JSON.parse(doctorResult.stdout)
    const closeResult = spawnSync('node', [cliPath(), 'group', 'close', 'release'], { cwd: groupDir, encoding: 'utf-8' })

    expect(statusResult.status).toBe(1)
    expect(status.groups[0]).toEqual(expect.objectContaining({ readyToClose: false }))
    expect(status.diagnostics).toContainEqual(expect.objectContaining({
      code: 'group_archived_child_undeclared',
      change: 'release',
      message: expect.stringContaining('release/docs'),
    }))
    expect(checkResult.status).toBe(1)
    expect(check.diagnostics).toContainEqual(expect.objectContaining({ code: 'group_archived_child_undeclared', change: 'release' }))
    expect(doctorResult.status).toBe(1)
    expect(doctor.checks).toContainEqual(expect.objectContaining({ status: 'issue', label: 'Change Group contracts are valid' }))
    expect(closeResult.status).toBe(1)
    expect(closeResult.stderr).toContain('archived child Change is not declared by the Group Brief: release/docs')
    expect(existsSync(briefPath)).toBe(true)
  })

  it('requires the Group Brief heading to match its directory identity', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-heading-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    const mismatched = renderGroupBrief('release', ['release/api', 'release/ui']).replace('# Change Group: release', '# Change Group: other')
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), mismatched)

    const result = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const status = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(status.diagnostics).toContainEqual(expect.objectContaining({ code: 'group_heading_mismatch', change: 'release' }))
  })

  it('includes the sibling Group Brief in grouped Change context', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-context-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui']))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })

    const output = execSync(`node ${cliPath()} show release/api --json`, { cwd: groupDir, encoding: 'utf-8' })
    const show = JSON.parse(output)

    expect(show.change.name).toBe('release/api')
    expect(show.contextPaths[0]).toBe('.rsp/changes/release/00-brief.md')
  })

  it('does not close a Change Group while declared children remain open', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-close-open-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui'], { complete: true }))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} create release/ui`, { cwd: groupDir })
    await completeOpenChange(groupDir, 'release/api')
    await completeOpenChange(groupDir, 'release/ui')

    const result = spawnSync('node', [cliPath(), 'group', 'close', 'release'], { cwd: groupDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Change Group "release" is not ready to close')
    expect(result.stderr).toContain('open slices: release/api, release/ui')
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'))).toBe(true)
  })

  it('closes only the Group Brief after every declared child is archived', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-close-complete-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui'], { complete: true }))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} create release/ui`, { cwd: groupDir })
    await completeOpenChange(groupDir, 'release/api')
    await completeOpenChange(groupDir, 'release/ui')
    execSync(`node ${cliPath()} archive release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} archive release/ui`, { cwd: groupDir })

    const before = JSON.parse(execSync(`node ${cliPath()} status --json`, { cwd: groupDir, encoding: 'utf-8' }))
    expect(before.groups[0]).toEqual(expect.objectContaining({
      name: 'release',
      readyToClose: true,
      slices: [
        expect.objectContaining({ name: 'release/api', state: 'archived' }),
        expect.objectContaining({ name: 'release/ui', state: 'archived' }),
      ],
    }))
    expect(before.nextActions).toContain('Run: rsp group close release')
    const humanBefore = execSync(`node ${cliPath()} status`, { cwd: groupDir, encoding: 'utf-8' })
    expect(humanBefore).toContain('2/2 archived')
    expect(humanBefore).toContain('ready to close')

    const output = execSync(`node ${cliPath()} group close release`, { cwd: groupDir, encoding: 'utf-8' })
    const archiveFiles = await readdir(join(groupDir, '.rsp', 'archives', 'release'))

    expect(output).toContain('Closed Change Group: release')
    expect(archiveFiles).toEqual(expect.arrayContaining([
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}_api\.md$/),
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}_ui\.md$/),
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}_brief\.md$/),
    ]))
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release'))).toBe(false)
    const after = JSON.parse(execSync(`node ${cliPath()} status --json`, { cwd: groupDir, encoding: 'utf-8' }))
    expect(after.groups).toEqual([])
  })

  it('reopens a closed Change Group before explicitly reopening one child', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-explicit-reopen-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui'], { complete: true }))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} create release/ui`, { cwd: groupDir })
    await completeOpenChange(groupDir, 'release/api')
    await completeOpenChange(groupDir, 'release/ui')
    execSync(`node ${cliPath()} archive release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} archive release/ui`, { cwd: groupDir })
    execSync(`node ${cliPath()} group close release`, { cwd: groupDir })

    const archiveDir = join(groupDir, '.rsp', 'archives', 'release')
    const archiveFiles = await readdir(archiveDir)
    const briefArchive = archiveFiles.find(name => name.endsWith('_brief.md'))!
    const retained = new Map(await Promise.all(archiveFiles.map(async name => [name, await readFile(join(archiveDir, name), 'utf-8')] as const)))
    const output = execSync(`node ${cliPath()} group reopen release --reason "api still fails"`, { cwd: groupDir, encoding: 'utf-8' })
    const briefPath = join(groupDir, '.rsp', 'changes', 'release', '00-brief.md')

    expect(output).toContain('Reopened Change Group: release')
    expect(await readFile(briefPath, 'utf-8')).toContain(`- [ ] Resolve reopened concern from \`.rsp/archives/release/${briefArchive}\`: api still fails`)
    expect(await readdir(archiveDir)).toEqual(archiveFiles)
    for (const [name, content] of retained)
      expect(await readFile(join(archiveDir, name), 'utf-8')).toBe(content)
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', 'api.md'))).toBe(false)
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', 'ui.md'))).toBe(false)
    expect(existsSync(join(groupDir, '.rsp', 'focus.d', 'release'))).toBe(false)

    const reopenedStatus = JSON.parse(execSync(`node ${cliPath()} status --json`, { cwd: groupDir, encoding: 'utf-8' }))
    expect(reopenedStatus.diagnostics).not.toContainEqual(expect.objectContaining({ code: 'group_identity_reopened', change: 'release' }))
    expect(reopenedStatus.groups[0]).toEqual(expect.objectContaining({
      name: 'release',
      readyToClose: false,
      slices: [
        expect.objectContaining({ name: 'release/api', state: 'archived' }),
        expect.objectContaining({ name: 'release/ui', state: 'archived' }),
      ],
    }))

    execSync(`node ${cliPath()} reopen release/api --reason "api still fails"`, { cwd: groupDir })
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', 'api.md'))).toBe(true)
    expect(existsSync(join(groupDir, '.rsp', 'focus.d', 'release', 'api'))).toBe(true)
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', 'ui.md'))).toBe(false)

    expect((await readdir(join(groupDir, '.rsp', 'changes', 'release'))).some(name => name.includes('.tmp'))).toBe(false)
    const cleanupResidue = join(groupDir, '.rsp', '.group-reopen-leftover.tmp')
    await writeFile(cleanupResidue, 'partial temporary output')
    const residueStatus = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    expect(residueStatus.status).toBe(0)
    await rm(cleanupResidue)
  })

  it('requires exact Group archive selection and rejects identity mismatches before mutation', async () => {
    const groupDir = await createClosedGroupProject('rsp-group-reopen-selection-test')
    const archiveDir = join(groupDir, '.rsp', 'archives', 'release')
    const firstBrief = (await readdir(archiveDir)).find(name => name.endsWith('_brief.md'))!
    const secondBrief = firstBrief.replace('_brief.md', '_brief-2.md')
    await cp(join(archiveDir, firstBrief), join(archiveDir, secondBrief))
    const otherArchiveDir = join(groupDir, '.rsp', 'archives', 'other')
    await mkdir(otherArchiveDir, { recursive: true })
    const otherBrief = firstBrief.replace('_brief.md', '_brief.md')
    await writeFile(join(otherArchiveDir, otherBrief), renderGroupBrief('other', ['other/api', 'other/ui'], { complete: true }))

    const ambiguous = spawnSync('node', [cliPath(), 'group', 'reopen', 'release', '--reason', 'api still fails'], { cwd: groupDir, encoding: 'utf-8' })
    expect(ambiguous.status).toBe(1)
    expect(ambiguous.stderr).toContain('multiple archives match Change Group release')
    expect(ambiguous.stderr).toContain(`.rsp/archives/release/${firstBrief}`)
    expect(ambiguous.stderr).toContain(`.rsp/archives/release/${secondBrief}`)
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release'))).toBe(false)

    const mismatch = spawnSync('node', [
      cliPath(),
      'group',
      'reopen',
      'release',
      '--from',
      `.rsp/archives/other/${otherBrief}`,
      '--reason',
      'wrong group',
    ], { cwd: groupDir, encoding: 'utf-8' })
    expect(mismatch.status).toBe(1)
    expect(mismatch.stderr).toContain('selected archived Change Group belongs to other, not release')
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release'))).toBe(false)

    execFileSync('node', [
      cliPath(),
      'group',
      'reopen',
      'release',
      '--from',
      `.rsp/archives/release/${secondBrief}`,
      '--reason',
      'api still fails',
    ], { cwd: groupDir })
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'))).toBe(true)
  })

  it('fails atomically on incomplete history, malformed sections, and an open Group collision', async () => {
    const incompleteDir = await createClosedGroupProject('rsp-group-reopen-incomplete-history-test')
    await writeFile(join(incompleteDir, '.rsp', 'archives', 'bad-name.md'), '# invalid archive\n')
    const incomplete = spawnSync('node', [cliPath(), 'group', 'reopen', 'release', '--reason', 'must inspect first'], { cwd: incompleteDir, encoding: 'utf-8' })
    expect(incomplete.status).toBe(1)
    expect(incomplete.stderr).toContain('archive history inspection is incomplete')
    expect(existsSync(join(incompleteDir, '.rsp', 'changes', 'release'))).toBe(false)

    const malformedDir = await createClosedGroupProject('rsp-group-reopen-malformed-test')
    const malformedArchiveDir = join(malformedDir, '.rsp', 'archives', 'release')
    const malformedBrief = (await readdir(malformedArchiveDir)).find(name => name.endsWith('_brief.md'))!
    const malformedPath = join(malformedArchiveDir, malformedBrief)
    await writeFile(malformedPath, `${await readFile(malformedPath, 'utf-8')}\n## Completion Conditions\n- [x] duplicate\n`)
    const malformed = spawnSync('node', [cliPath(), 'group', 'reopen', 'release', '--reason', 'must remain atomic'], { cwd: malformedDir, encoding: 'utf-8' })
    expect(malformed.status).toBe(1)
    expect(malformed.stderr).toContain('must contain exactly one canonical required section: Completion Conditions')
    expect(existsSync(join(malformedDir, '.rsp', 'changes', 'release'))).toBe(false)

    const collisionDir = await createClosedGroupProject('rsp-group-reopen-collision-test')
    execSync(`node ${cliPath()} group reopen release --reason "first concern"`, { cwd: collisionDir })
    const openBrief = join(collisionDir, '.rsp', 'changes', 'release', '00-brief.md')
    const beforeCollision = await readFile(openBrief, 'utf-8')
    const collision = spawnSync('node', [cliPath(), 'group', 'reopen', 'release', '--reason', 'must not overwrite'], { cwd: collisionDir, encoding: 'utf-8' })
    expect(collision.status).toBe(1)
    expect(collision.stderr).toContain('Change Group work subtree for release must be absent or empty')
    expect(await readFile(openBrief, 'utf-8')).toBe(beforeCollision)
  })

  it('requires empty work and focus subtrees before Group reopen', async () => {
    const emptyDir = await createClosedGroupProject('rsp-group-reopen-empty-subtrees-test')
    await mkdir(join(emptyDir, '.rsp', 'changes', 'release'), { recursive: true })
    await mkdir(join(emptyDir, '.rsp', 'focus.d', 'release'), { recursive: true })
    execSync(`node ${cliPath()} group reopen release --reason "empty directories are reusable"`, { cwd: emptyDir })
    expect(existsSync(join(emptyDir, '.rsp', 'changes', 'release', '00-brief.md'))).toBe(true)

    const orphanDir = await createClosedGroupProject('rsp-group-reopen-orphan-work-test')
    await mkdir(join(orphanDir, '.rsp', 'changes', 'release'), { recursive: true })
    await writeFile(join(orphanDir, '.rsp', 'changes', 'release', 'orphan.md'), renderChange('release/orphan'))
    const orphan = spawnSync('node', [cliPath(), 'group', 'reopen', 'release', '--reason', 'must reject orphan'], { cwd: orphanDir, encoding: 'utf-8' })
    expect(orphan.status).toBe(1)
    expect(orphan.stderr).toContain('Change Group work subtree for release must be absent or empty')
    expect(existsSync(join(orphanDir, '.rsp', 'changes', 'release', '00-brief.md'))).toBe(false)

    const focusDir = await createClosedGroupProject('rsp-group-reopen-stale-focus-test')
    await mkdir(join(focusDir, '.rsp', 'focus.d', 'release'), { recursive: true })
    await writeFile(join(focusDir, '.rsp', 'focus.d', 'release', 'api'), '')
    const staleFocus = spawnSync('node', [cliPath(), 'group', 'reopen', 'release', '--reason', 'must reject focus'], { cwd: focusDir, encoding: 'utf-8' })
    expect(staleFocus.status).toBe(1)
    expect(staleFocus.stderr).toContain('Change Group focus subtree for release must be absent or empty')
    expect(existsSync(join(focusDir, '.rsp', 'changes', 'release'))).toBe(false)

    const unsupportedDir = await createClosedGroupProject('rsp-group-reopen-unsupported-entry-test')
    await mkdir(join(unsupportedDir, '.rsp', 'changes', 'release', 'nested'), { recursive: true })
    const unsupported = spawnSync('node', [cliPath(), 'group', 'reopen', 'release', '--reason', 'must reject nested entry'], { cwd: unsupportedDir, encoding: 'utf-8' })
    expect(unsupported.status).toBe(1)
    expect(unsupported.stderr).toContain('Change Group work subtree for release must be absent or empty')
    expect(existsSync(join(unsupportedDir, '.rsp', 'changes', 'release', '00-brief.md'))).toBe(false)
  }, 15_000)

  it('rejects replayed Group reopen evidence and accepts a fresh retained snapshot', async () => {
    const groupDir = await createClosedGroupProject('rsp-group-reopen-evidence-replay-test')
    const archiveDir = join(groupDir, '.rsp', 'archives', 'release')
    const firstBrief = (await readdir(archiveDir)).find(name => name.endsWith('_brief.md'))!
    const firstArchivePath = `.rsp/archives/release/${firstBrief}`
    execFileSync('node', [cliPath(), 'group', 'reopen', 'release', '--from', firstArchivePath, '--reason', 'api still fails'], { cwd: groupDir })

    const openBrief = join(groupDir, '.rsp', 'changes', 'release', '00-brief.md')
    await writeFile(openBrief, (await readFile(openBrief, 'utf-8')).replace(
      `- [ ] Resolve reopened concern from \`${firstArchivePath}\`: api still fails`,
      `- [x] Resolve reopened concern from \`${firstArchivePath}\`: api still fails`,
    ))
    execSync(`node ${cliPath()} group close release`, { cwd: groupDir })
    const briefArchives = (await readdir(archiveDir)).filter(name => name.includes('_brief')).sort()
    expect(briefArchives).toHaveLength(2)
    const secondBrief = briefArchives.find(name => name !== firstBrief)!
    const secondArchivePath = `.rsp/archives/release/${secondBrief}`

    await mkdir(join(groupDir, '.rsp', 'changes', 'release'), { recursive: true })
    await cp(join(archiveDir, secondBrief), openBrief)
    const copiedStatus = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    expect(copiedStatus.status).toBe(1)
    expect(JSON.parse(copiedStatus.stdout).diagnostics).toContainEqual(expect.objectContaining({ code: 'group_identity_reopened', change: 'release' }))
    await rm(join(groupDir, '.rsp', 'changes', 'release'), { recursive: true })

    const replay = spawnSync('node', [cliPath(), 'group', 'reopen', 'release', '--from', firstArchivePath, '--reason', 'api still fails'], { cwd: groupDir, encoding: 'utf-8' })
    expect(replay.status).toBe(1)
    expect(replay.stderr).toContain('reopen evidence already exists in retained Change Group history')
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release'))).toBe(false)

    execFileSync('node', [cliPath(), 'group', 'reopen', 'release', '--from', secondArchivePath, '--reason', 'api still fails'], { cwd: groupDir })
    const repeated = await readFile(openBrief, 'utf-8')
    expect(repeated).toContain(`- [ ] Resolve reopened concern from \`${secondArchivePath}\`: api still fails`)
    const repeatedStatus = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    expect(repeatedStatus.status).toBe(0)
  })

  it('requires reopen evidence to reference a retained Brief path for the current Group', async () => {
    const groupDir = await createClosedGroupProject('rsp-group-reopen-evidence-source-test')
    const releaseArchiveDir = join(groupDir, '.rsp', 'archives', 'release')
    const releaseBrief = (await readdir(releaseArchiveDir)).find(name => name.endsWith('_brief.md'))!
    const releaseArchivePath = `.rsp/archives/release/${releaseBrief}`
    const openGroupDir = join(groupDir, '.rsp', 'changes', 'release')
    const openBrief = join(openGroupDir, '00-brief.md')
    await mkdir(openGroupDir, { recursive: true })
    await cp(join(releaseArchiveDir, releaseBrief), openBrief)

    const nonexistentPath = '.rsp/archives/release/2099-01-01_brief.md'
    await writeFile(openBrief, (await readFile(openBrief, 'utf-8')).replace(
      '\n## Durable Outcomes',
      `\n- [ ] Resolve reopened concern from \`${nonexistentPath}\`: fabricated source\n\n## Durable Outcomes`,
    ))
    const nonexistentStatus = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    expect(nonexistentStatus.status).toBe(1)
    expect(JSON.parse(nonexistentStatus.stdout).diagnostics).toContainEqual(expect.objectContaining({ code: 'group_identity_reopened', change: 'release' }))

    const otherArchiveDir = join(groupDir, '.rsp', 'archives', 'other')
    await mkdir(otherArchiveDir, { recursive: true })
    await writeFile(join(otherArchiveDir, releaseBrief), renderGroupBrief('other', ['other/api', 'other/ui'], { complete: true }))
    const otherArchivePath = `.rsp/archives/other/${releaseBrief}`
    await writeFile(openBrief, (await readFile(openBrief, 'utf-8')).replace(nonexistentPath, otherArchivePath))
    const otherStatus = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    expect(otherStatus.status).toBe(1)
    expect(JSON.parse(otherStatus.stdout).diagnostics).toContainEqual(expect.objectContaining({ code: 'group_identity_reopened', change: 'release' }))

    await rm(openGroupDir, { recursive: true })
    execFileSync('node', [cliPath(), 'group', 'reopen', 'release', '--from', releaseArchivePath, '--reason', 'legitimate source'], { cwd: groupDir })
    const legitimateStatus = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    expect(legitimateStatus.status).toBe(0)
  })

  it('does not close a Change Group while a stale child focus marker remains', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-close-focus-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui'], { complete: true }))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} create release/ui`, { cwd: groupDir })
    await completeOpenChange(groupDir, 'release/api')
    await completeOpenChange(groupDir, 'release/ui')
    execSync(`node ${cliPath()} archive release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} archive release/ui`, { cwd: groupDir })
    await mkdir(join(groupDir, '.rsp', 'focus.d', 'release'), { recursive: true })
    await writeFile(join(groupDir, '.rsp', 'focus.d', 'release', 'api'), '')

    const result = spawnSync('node', [cliPath(), 'group', 'close', 'release'], { cwd: groupDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('invalid focus for release/api')
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'))).toBe(true)
  })

  it('does not reopen an archived Change Group identity', async () => {
    const groupDir = join(tmpdir(), 'rsp-group-reopen-test', randomUUID())
    await mkdir(groupDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: groupDir })
    execSync(`node ${cliPath()} group create release "Ship the release"`, { cwd: groupDir })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui'], { complete: true }))
    execSync(`node ${cliPath()} create release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} create release/ui`, { cwd: groupDir })
    await completeOpenChange(groupDir, 'release/api')
    await completeOpenChange(groupDir, 'release/ui')
    execSync(`node ${cliPath()} archive release/api`, { cwd: groupDir })
    execSync(`node ${cliPath()} archive release/ui`, { cwd: groupDir })
    execSync(`node ${cliPath()} group close release`, { cwd: groupDir })

    const result = spawnSync('node', [cliPath(), 'group', 'create', 'release', 'Ship again'], { cwd: groupDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('archived Change Group cannot be reopened: release')
    expect(existsSync(join(groupDir, '.rsp', 'changes', 'release'))).toBe(false)

    await mkdir(join(groupDir, '.rsp', 'changes', 'release'), { recursive: true })
    await writeFile(join(groupDir, '.rsp', 'changes', 'release', '00-brief.md'), renderGroupBrief('release', ['release/api', 'release/ui'], { complete: true }))
    const statusResult = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: groupDir, encoding: 'utf-8' })
    const status = JSON.parse(statusResult.stdout)
    expect(statusResult.status).toBe(1)
    expect(status.diagnostics).toContainEqual(expect.objectContaining({ code: 'group_identity_reopened', change: 'release' }))
  })
})

describe('archive --dry-run', () => {
  it('delegates to the canonical human readiness projection without moving the change', async () => {
    const dryRunDir = await createRspFixture('rsp-archive-dryrun-test')
    await writeFile(join(dryRunDir, '.rsp', 'changes', 'dry-run-test.md'), renderChange('dry-run-test'))

    const ready = spawnSync('node', [cliPath(), 'ready', 'dry-run-test'], { cwd: dryRunDir, encoding: 'utf-8' })
    const archive = spawnSync('node', [cliPath(), 'archive', 'dry-run-test', '--dry-run'], { cwd: dryRunDir, encoding: 'utf-8' })
    expect(ready.status, ready.stderr).toBe(0)
    expect(archive.status, archive.stderr).toBe(0)
    expect(archive.stderr).toContain('Deprecated: use `rsp ready <name>`')
    expect(archive.stdout).toBe(ready.stdout)
    expect(archive.stdout).toContain('task item(s) still incomplete')

    // change should still be there
    expect(existsSync(join(dryRunDir, '.rsp', 'changes', 'dry-run-test.md'))).toBe(true)
  })
})
