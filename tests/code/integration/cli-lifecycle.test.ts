import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const cli = join(root, 'dist', 'cli.mjs')
const projects: string[] = []

afterEach(() => {
  for (const project of projects.splice(0))
    rmSync(project, { force: true, recursive: true })
})

function run(project: string, ...args: string[]): string {
  return execFileSync(process.execPath, [cli, ...args], { cwd: project, encoding: 'utf8' })
}

function project(): string {
  const directory = mkdtempSync(join(tmpdir(), 'rsp-cli-contract-'))
  projects.push(directory)
  run(directory, 'init')
  return directory
}

function commitProject(unborn = false) {
  const directory = mkdtempSync(join(tmpdir(), 'rsp-commit-integrity-'))
  projects.push(directory)
  const git = (...args: string[]) => execFileSync('git', args, { cwd: directory, encoding: 'utf8' }).trimEnd()
  git('init', '--quiet')
  git('config', 'user.name', 'Integrity fixture')
  git('config', 'user.email', 'integrity@example.invalid')
  git('config', 'commit.gpgsign', 'false')
  git('config', 'core.hooksPath', join(directory, '.git/hooks'))
  if (!unborn) {
    writeFileSync(join(directory, 'selected.txt'), 'before\n')
    git('add', 'selected.txt')
    git('commit', '--quiet', '-m', 'baseline')
  }
  writeFileSync(join(directory, 'selected.txt'), 'reviewed\n')
  git('add', 'selected.txt')
  const head = unborn ? 'unborn' : git('rev-parse', 'HEAD')
  const tree = git('write-tree')
  const message = join(directory, '.git/prepared-message')
  writeFileSync(message, 'fix: reviewed delivery\n\nExact body.\n')
  const invoke = (...args: string[]) => {
    const result = spawnSync(process.execPath, [cli, 'commit', '--message-file', message, '--json', ...args], { cwd: directory, encoding: 'utf8' })
    return { status: result.status, receipt: JSON.parse(result.stdout) }
  }
  const hook = (name: string, body: string) => {
    const path = join(directory, '.git/hooks', name)
    writeFileSync(path, `#!/bin/sh\nset -eu\n${body}\n`)
    chmodSync(path, 0o755)
  }
  return { directory, git, head, tree, invoke, hook }
}

function completeChange(directory: string, name: string, blocker = '- none'): string {
  run(directory, 'create', name, 'Preserve the user-owned note', '--kind', 'fix')
  const file = join(directory, '.rsp', 'changes', `${name}.md`)
  const content = [
    '---',
    'kind: fix',
    '---',
    `# Change: ${name}`,
    '## Proposal',
    '- Outcome: Preserve the user-owned note during a local update.',
    '## Spec',
    '### MODIFIED',
    '- Requirement: The note remains unchanged.',
    '### Acceptance',
    '#### Scenario: User note preservation',
    '- GIVEN an existing user note',
    '- WHEN the local update runs',
    '- THEN the note remains unchanged',
    '## Design',
    'Update only managed content. Current facts and rationale need no durable update.',
    '## Tasks',
    '- [x] Preserve the note.',
    '## Verify',
    '### Required',
    '- [x] Compare note contents before and after.',
    '### Optional',
    '- [ ] Manual environment check.',
    '## Blockers',
    blocker,
    '',
  ].join('\n')
  writeFileSync(file, content)
  return file
}

describe('public CLI lifecycle', () => {
  it.each([false, true])('returns exact tree, parents and unusual paths for guarded delivery (unborn=%s)', (unborn) => {
    const fixture = commitProject(unborn)
    const unusual = 'quote"tab\tline\nbreak.txt'
    writeFileSync(join(fixture.directory, unusual), 'content\n')
    fixture.git('add', unusual)
    const tree = fixture.git('write-tree')
    const result = fixture.invoke('--expected-head', fixture.head, '--expected-tree', tree)
    expect(result.status).toBe(0)
    expect(result.receipt).toMatchObject({ ok: true, stagedTree: tree, committedTree: tree, parents: unborn ? [] : [fixture.head], attempt: 'succeeded', creation: 'confirmed' })
    expect(result.receipt.committedPaths).toEqual([unusual, 'selected.txt'])
    expect(result.receipt.commit).toBe(fixture.git('rev-parse', 'HEAD'))
  })

  it('rejects malformed pairs and reviewed snapshot drift without invoking hooks or changing the index', () => {
    const fixture = commitProject()
    fixture.hook('pre-commit', 'touch .git/hook-ran')
    for (const args of [
      ['--expected-head', fixture.head],
      ['--expected-tree', fixture.tree],
      ['--expected-head', 'HEAD', '--expected-tree', fixture.tree],
      ['--expected-head', fixture.head, '--expected-tree', 'abc'],
    ]) {
      expect(fixture.invoke(...args)).toMatchObject({ status: 1, receipt: { code: 'invalid_expected_snapshot', attempt: 'not_attempted' } })
    }
    writeFileSync(join(fixture.directory, 'selected.txt'), 'drifted\n')
    fixture.git('add', 'selected.txt')
    expect(fixture.invoke('--expected-head', fixture.head, '--expected-tree', fixture.tree)).toMatchObject({ status: 1, receipt: { code: 'expected_snapshot_mismatch', attempt: 'not_attempted' } })
    fixture.git('commit', '--quiet', '--no-verify', '-m', 'competing commit')
    writeFileSync(join(fixture.directory, 'selected.txt'), 'reviewed\n')
    fixture.git('add', 'selected.txt')
    const changedHead = fixture.git('rev-parse', 'HEAD')
    expect(fixture.invoke('--expected-head', fixture.head, '--expected-tree', fixture.tree)).toMatchObject({ status: 1, receipt: { code: 'expected_snapshot_mismatch', attempt: 'not_attempted' } })
    expect(fixture.git('rev-parse', 'HEAD')).toBe(changedHead)
    expect(fixture.git('write-tree')).toBe(fixture.tree)
    expect(existsSync(join(fixture.directory, '.git/hook-ran'))).toBe(false)
  })

  it.each(['content', 'message', 'parent'])('reports created commits changed by a real %s hook without retrying', (effect) => {
    const fixture = commitProject()
    if (effect === 'content')
      fixture.hook('pre-commit', 'printf "hook content\\n" > selected.txt\ngit add selected.txt')
    else if (effect === 'message')
      fixture.hook('commit-msg', 'printf "hook message\\n" > "$1"')
    else
      fixture.hook('post-commit', 'parent=$(printf "competing parent\\n" | git commit-tree HEAD~1^{tree} -p HEAD~1)\nchanged=$(git log -1 --format=%B | git commit-tree HEAD^{tree} -p "$parent")\ngit update-ref HEAD "$changed"')
    const result = fixture.invoke()
    expect(result.status).toBe(1)
    expect(result.receipt).toMatchObject({ ok: false, code: effect === 'message' ? 'message_mismatch' : 'commit_boundary_mismatch', attempt: 'succeeded', creation: 'confirmed', stagedTree: fixture.tree })
    expect(result.receipt.commit).toBe(fixture.git('rev-parse', 'HEAD'))
    expect(result.receipt.committedTree).toBe(fixture.git('rev-parse', 'HEAD^{tree}'))
    expect(result.receipt.parents).toEqual(fixture.git('show', '-s', '--format=%P', 'HEAD').split(' '))
    expect(Number(fixture.git('rev-list', '--count', 'HEAD'))).toBe(effect === 'parent' ? 3 : 2)
  })

  it('distinguishes a failed hook from observed history effects without claiming no write after an attempt', () => {
    const fixture = commitProject()
    fixture.hook('pre-commit', 'exit 1')
    expect(fixture.invoke()).toMatchObject({ status: 1, receipt: { code: 'git_commit_failed', attempt: 'failed', creation: 'unknown' } })
    expect(fixture.git('rev-parse', 'HEAD')).toBe(fixture.head)
    fixture.hook('pre-commit', 'created=$(printf "hook commit\\n" | git commit-tree $(git write-tree) -p HEAD)\ngit update-ref HEAD "$created"\nexit 1')
    const result = fixture.invoke()
    expect(result).toMatchObject({ status: 1, receipt: { code: 'commit_boundary_mismatch', attempt: 'failed', creation: 'unknown' } })
    expect(result.receipt.commit).toBe(fixture.git('rev-parse', 'HEAD'))
    expect(result.receipt.commit).not.toBe(fixture.head)
  })

  it('fails closed on invalid HEAD inspection before or after Git without misclassifying it as unborn', () => {
    const before = commitProject()
    before.hook('pre-commit', 'touch .git/hook-ran')
    const headRef = before.git('symbolic-ref', 'HEAD')
    writeFileSync(join(before.directory, '.git', headRef), 'invalid-object-id\n')
    expect(before.invoke('--expected-head', 'unborn', '--expected-tree', before.tree)).toMatchObject({ status: 1, receipt: { code: 'receipt_observation_failed', attempt: 'not_attempted', creation: 'not_attempted' } })
    expect(existsSync(join(before.directory, '.git/hook-ran'))).toBe(false)
    expect(before.git('write-tree')).toBe(before.tree)

    const after = commitProject()
    after.hook('post-commit', 'printf "invalid-object-id\\n" > "$(git rev-parse --git-path "$(git symbolic-ref HEAD)")"')
    // Git itself exits nonzero when its final summary observes the corrupted ref,
    // even though the reflog confirms creation. The CLI must report uncertainty.
    expect(after.invoke()).toMatchObject({ status: 1, receipt: { code: 'receipt_observation_failed', attempt: 'failed', creation: 'unknown' } })
    expect(readFileSync(join(after.directory, '.git/logs/HEAD'), 'utf8')).toContain('commit: fix: reviewed delivery')
  })

  it('commits only the staged boundary and leaves invalid attempts and unstaged work untouched', () => {
    const directory = mkdtempSync(join(tmpdir(), 'rsp-commit-boundary-'))
    projects.push(directory)
    const git = (...args: string[]) => execFileSync('git', args, { cwd: directory, encoding: 'utf8' })
    git('init', '--quiet')
    git('config', 'user.name', 'Boundary fixture')
    git('config', 'user.email', 'boundary@example.invalid')
    git('config', 'commit.gpgsign', 'false')
    git('config', 'core.hooksPath', '/dev/null')
    writeFileSync(join(directory, 'selected.txt'), 'before\n')
    writeFileSync(join(directory, 'notes.txt'), 'original note\n')
    git('add', 'selected.txt', 'notes.txt')
    git('commit', '--quiet', '-m', 'initial fixture')
    const originalHead = git('rev-parse', 'HEAD')
    const message = join(directory, 'message.txt')
    writeFileSync(message, 'fix: selected change\n\nPreserve the unrelated note.\n')
    const commit = (messageFile = message) => spawnSync(process.execPath, [cli, 'commit', '--message-file', messageFile, '--json'], { cwd: directory, encoding: 'utf8' })
    expect(JSON.parse(commit().stdout).code).toBe('no_staged_boundary')
    writeFileSync(join(directory, 'selected.txt'), 'after\n')
    writeFileSync(join(directory, 'notes.txt'), 'unstaged user note\n')
    git('add', 'selected.txt')
    const stagedTree = git('write-tree')
    const refused = commit(join(directory, 'missing-message.txt'))
    expect(refused.status).not.toBe(0)
    expect(JSON.parse(refused.stdout)).toMatchObject({ code: 'message_file_read_failed', attempt: 'not_attempted', creation: 'not_attempted' })
    expect(git('rev-parse', 'HEAD')).toBe(originalHead)
    expect(git('write-tree')).toBe(stagedTree)
    const prepared = 'fix: selected change\n\nPreserve the unrelated note and document literal \\n without decoding it.\n'
    writeFileSync(message, prepared)
    const accepted = commit()
    expect(accepted.status).toBe(0)
    expect(JSON.parse(accepted.stdout)).toMatchObject({ ok: true, storedMessage: prepared, committedPaths: ['selected.txt'] })
    expect(git('show', 'HEAD:selected.txt')).toBe('after\n')
    expect(git('show', 'HEAD:notes.txt')).toBe('original note\n')
    expect(readFileSync(join(directory, 'notes.txt'), 'utf8')).toBe('unstaged user note\n')
    expect(git('show', '-s', '--format=%B', 'HEAD').trimEnd()).toBe(prepared.trimEnd())
    expect(git('diff', '--cached', '--name-only')).toBe('')
  })

  it('closes a declared Group only after its child is archived and keeps history discoverable', () => {
    const directory = project()
    run(directory, 'group', 'create', 'delivery', 'Deliver the requested export')
    const brief = join(directory, '.rsp/changes/delivery/00-brief.md')
    writeFileSync(brief, [
      '---',
      'kind: group',
      '---',
      '# Change Group: delivery',
      '## Goal',
      '- Deliver the requested export.',
      '## Scope',
      '- Only the requested module.',
      '## Shared Constraints',
      '- Preserve user notes.',
      '## Slices',
      `- ${String.fromCharCode(96)}delivery/flag${String.fromCharCode(96)}: Enable the export.`,
      `- ${String.fromCharCode(96)}delivery/notes${String.fromCharCode(96)}: Verify note preservation.`,
      '## Completion Conditions',
      '- [x] Integration: export is enabled and user notes preserved.',
      '## Durable Outcomes',
      '- Current facts: none.',
      '- Lasting rationale: none.',
      '## Blockers',
      '- none',
      '',
    ].join('\n'))
    completeChange(directory, 'delivery/flag')
    completeChange(directory, 'delivery/notes')
    const premature = spawnSync(process.execPath, [cli, 'group', 'close', 'delivery'], { cwd: directory, encoding: 'utf8' })
    expect(premature.status).not.toBe(0)
    expect(existsSync(brief)).toBe(true)
    run(directory, 'archive', 'delivery/flag')
    const stillOpen = spawnSync(process.execPath, [cli, 'group', 'close', 'delivery'], { cwd: directory, encoding: 'utf8' })
    expect(stillOpen.status).not.toBe(0)
    run(directory, 'archive', 'delivery/notes')
    run(directory, 'group', 'close', 'delivery')
    expect(existsSync(brief)).toBe(false)
    const history = JSON.parse(run(directory, 'history', '--group', 'delivery', '--json'))
    expect(history.records.map((record: { workRef: string }) => record.workRef).sort()).toEqual(['delivery/flag', 'delivery/notes'])
    expect(JSON.parse(run(directory, 'history', 'delivery/flag', '--json')).record.workRef).toBe('delivery/flag')
  })

  it('rejects an invalid recovery capsule without replacing the existing focus pointer', () => {
    const directory = project()
    completeChange(directory, 'recovery')
    const capsule = join(directory, 'capsule.md')
    const valid = '<!-- rsp-focus:v1 -->\nCurrent: Finish verification.\nEvidence: Required checks pass.\nNext: Review durable updates.\n'
    writeFileSync(capsule, valid)
    run(directory, 'focus', 'recovery', '--capsule-file', capsule)
    writeFileSync(capsule, '<!-- rsp-focus:v1 -->\nUnknown: unsupported field\n')
    const rejected = spawnSync(process.execPath, [cli, 'focus', 'recovery', '--capsule-file', capsule], { cwd: directory, encoding: 'utf8' })
    expect(rejected.status).not.toBe(0)
    expect(readFileSync(join(directory, '.rsp/focus.d/recovery'), 'utf8')).toBe(valid)
  })

  it('searches Specs literally, rejects path escape and reports invalid configuration without repairing it', () => {
    const directory = project()
    writeFileSync(join(directory, '.rsp/specs/billing.md'), '# Billing\nThe [billing] marker is literal.\n')
    const search = JSON.parse(run(directory, 'specs', '--search', '[billing]', '--json'))
    expect(search.matches.some((match: { path: string }) => match.path === '.rsp/specs/billing.md')).toBe(true)
    const escaped = spawnSync(process.execPath, [cli, 'specs', '../outside.md', '--json'], { cwd: directory, encoding: 'utf8' })
    expect(escaped.status).not.toBe(0)
    expect(JSON.parse(escaped.stdout).ok).toBe(false)
    const config = join(directory, '.rsp/config.yaml')
    const invalid = 'manage:\n  activation: unsupported-value\n'
    writeFileSync(config, invalid)
    const rejected = spawnSync(process.execPath, [cli, 'config', '--json'], { cwd: directory, encoding: 'utf8' })
    expect(rejected.status).not.toBe(0)
    expect(JSON.parse(rejected.stdout).ok).toBe(false)
    expect(readFileSync(config, 'utf8')).toBe(invalid)
  })

  it('blocks unfinished archive, permits completed work with optional coverage, and preserves history on reopen', () => {
    const directory = project()
    run(directory, 'create', 'lifecycle', 'Preserve note', '--kind', 'fix')
    const unfinished = spawnSync(process.execPath, [cli, 'archive', 'lifecycle'], { cwd: directory, encoding: 'utf8' })
    expect(unfinished.status).not.toBe(0)
    expect(existsSync(join(directory, '.rsp/changes/lifecycle.md'))).toBe(true)
    completeChange(directory, 'completed')
    const ready = JSON.parse(run(directory, 'ready', 'completed', '--json'))
    expect(ready.readiness).toMatchObject({ completionGate: 'pass', archiveReady: 'yes', incompleteOptionalVerify: 1 })
    run(directory, 'focus', 'completed')
    run(directory, 'archive', 'completed')
    expect(existsSync(join(directory, '.rsp/changes/completed.md'))).toBe(false)
    expect(existsSync(join(directory, '.rsp/focus.d/completed'))).toBe(false)
    const archived = readdirSync(join(directory, '.rsp/archives')).find(name => name.endsWith('_completed.md'))!
    const archivedPath = join(directory, '.rsp/archives', archived)
    const original = readFileSync(archivedPath, 'utf8')
    run(directory, 'reopen', 'completed', '--reason', 'Additional verification needed')
    expect(readFileSync(archivedPath, 'utf8')).toBe(original)
    expect(JSON.parse(run(directory, 'ready', 'completed', '--json')).readiness.archiveReady).toBe('no')
  })

  it('keeps dependent completion blocked until its prerequisite is archived', () => {
    const directory = project()
    completeChange(directory, 'prerequisite')
    completeChange(directory, 'dependent', `- requires ${String.fromCharCode(96)}prerequisite${String.fromCharCode(96)}: result required`)
    expect(JSON.parse(run(directory, 'ready', 'dependent', '--json')).readiness.activeBlockers).toBe(true)
    run(directory, 'archive', 'prerequisite')
    const ready = JSON.parse(run(directory, 'ready', 'dependent', '--json'))
    expect(ready.readiness.archiveReady).toBe('yes')
  })

  it('preserves user instructions and notes during update and refuses managed-path symlinks', () => {
    const directory = project()
    const agents = join(directory, 'AGENTS.md')
    writeFileSync(agents, `${readFileSync(agents, 'utf8')}\n## User policy\nKeep this exact paragraph.\n`)
    const note = join(directory, '.rsp/specs/user-owned.md')
    const existingSpec = '# Existing Spec\n\n## Stable Facts\nUser-authored contract.\n'
    writeFileSync(note, existingSpec)
    expect(JSON.parse(run(directory, 'doctor', '--json')).checks.some((check: { code?: string }) => check.code === 'legacy_context_map')).toBe(false)
    const legacyMap = join(directory, 'CONTEXT-MAP.md')
    writeFileSync(legacyMap, '# Domains\nOrdering hands off to billing.\n')
    expect(run(directory, 'update')).toContain('CONTEXT-MAP.md')
    expect(readFileSync(agents, 'utf8')).toContain('Keep this exact paragraph.')
    expect(readFileSync(note, 'utf8')).toBe(existingSpec)
    expect(readFileSync(legacyMap, 'utf8')).toBe('# Domains\nOrdering hands off to billing.\n')
    expect(readFileSync(agents, 'utf8')).toContain('Root `CONTEXT.md`')
    expect(readFileSync(agents, 'utf8')).toContain('CONTEXT-MAP.md')
    const context = join(directory, 'CONTEXT.md')
    expect(existsSync(context)).toBe(false)
    // Coexistence is not evidence of semantic migration, and --fix must not merge either file.
    const currentContext = '# Context\nBilling owns invoice issuance.\n'
    writeFileSync(context, currentContext)
    const doctor = JSON.parse(run(directory, 'doctor', '--fix', '--json'))
    expect(doctor).toMatchObject({ ok: true, fixed: [], summary: { issues: 0 } })
    expect(doctor.checks).toContainEqual(expect.objectContaining({ code: 'legacy_context_map', status: 'info' }))
    expect(readFileSync(context, 'utf8')).toBe(currentContext)
    expect(readFileSync(legacyMap, 'utf8')).toBe('# Domains\nOrdering hands off to billing.\n')
    const external = join(directory, 'external.md')
    writeFileSync(external, 'Never overwrite this file.\n')
    rmSync(agents)
    symlinkSync(external, agents)
    const rejected = spawnSync(process.execPath, [cli, 'update'], { cwd: directory, encoding: 'utf8' })
    expect(rejected.status).not.toBe(0)
    expect(readFileSync(external, 'utf8')).toBe('Never overwrite this file.\n')
  })

  it('refuses mutation while another live process owns the lock', () => {
    const directory = project()
    const lock = join(directory, '.rsp/.lock')
    const content = `${process.pid}\nuser-operation\n2026-01-01T00:00:00Z`
    writeFileSync(lock, content)
    const rejected = spawnSync(process.execPath, [cli, 'create', 'locked', 'Must not create'], { cwd: directory, encoding: 'utf8' })
    expect(rejected.status).not.toBe(0)
    expect(existsSync(join(directory, '.rsp/changes/locked.md'))).toBe(false)
    expect(readFileSync(lock, 'utf8')).toBe(content)
  })

  it('initializes a project, creates work, and reports machine-readable state', () => {
    const project = mkdtempSync(join(tmpdir(), 'rsp-cli-lifecycle-'))
    projects.push(project)

    run(project, 'init')
    run(project, 'add', 'spec', 'billing')
    const spec = readFileSync(join(project, '.rsp/specs/billing.md'), 'utf8')
    expect(spec.match(/^## .+$/gm)).toEqual(['## Purpose', '## Boundaries', '## Contracts', '## Scenarios', '## Constraints'])
    const design = readFileSync(join(project, '.rsp/specs/design.md'), 'utf8')
    expect(design.match(/^## .+$/gm)).toEqual(['## Purpose', '## Boundaries', '## Contracts', '## Structure', '## Constraints'])
    run(project, 'create', 'sample-change', 'A sample change', '--kind', 'fix')
    const status = JSON.parse(run(project, 'status', '--json')) as { records?: Array<{ name: string }> }

    expect(readFileSync(join(project, '.rsp', 'changes', 'sample-change.md'), 'utf8')).toContain('A sample change')
    expect(status.records?.map(record => record.name)).toContain('sample-change')
  })

  it.each(['guided-change', 'project-setup'])('keeps %s scaffold hints inert while unfinished work still blocks completion', (name) => {
    const directory = project()
    run(directory, 'create', name, 'Preserve the note', '--kind', 'fix')
    const file = join(directory, '.rsp/changes', `${name}.md`)
    const generated = readFileSync(file, 'utf8')
    expect(generated).toContain('<!--')
    const unfinished = JSON.parse(run(directory, 'check', '--json'))
    expect(unfinished.diagnostics.some((item: { code: string }) => item.code === 'unfinished_template_placeholders')).toBe(true)
    expect(JSON.parse(run(directory, 'ready', name, '--json')).readiness.archiveReady).toBe('no')

    const filled = generated.replaceAll('<…>', 'Concrete note-preservation behavior').replaceAll('- [ ]', '- [x]')
    writeFileSync(file, filled)
    const withHints = JSON.parse(run(directory, 'ready', name, '--json')).readiness
    const diagnostics = JSON.parse(run(directory, 'check', '--json')).diagnostics
    expect(withHints).toMatchObject({ archiveReady: 'yes', completionGate: 'pass', activeBlockers: false })
    expect(diagnostics.some((item: { severity: string }) => item.severity === 'error' || item.severity === 'warning')).toBe(false)

    writeFileSync(file, filled.replace(/<!--[\s\S]*?-->/g, ''))
    expect(JSON.parse(run(directory, 'ready', name, '--json')).readiness).toEqual(withHints)
    expect(JSON.parse(run(directory, 'check', '--json')).diagnostics).toEqual(diagnostics)
  })

  it('keeps non-interactive UI explicit and fail-closed', () => {
    const project = mkdtempSync(join(tmpdir(), 'rsp-cli-ui-'))
    projects.push(project)
    const result = (() => {
      try {
        run(project, 'ui')
        return null
      }
      catch (error) {
        return error as { status?: number, stderr?: string }
      }
    })()

    expect(result?.status).toBe(1)
    expect(result?.stderr).toContain('requires an interactive terminal')
  })
})
