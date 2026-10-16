import type { ChangeDashboardItem } from '../../../src/tui/state.js'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { inspectProjectStatus } from '../../../src/status/inspect.js'
import { en } from '../../../src/tui/i18n/messages.js'
import { markdownLineText } from '../../../src/tui/markdown-presentation.js'
import { projectWorkDetailLines } from '../../../src/tui/work-pane.js'

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

function groupProject(): { directory: string, brief: string } {
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
    '- `delivery/flag`: Enable the export.',
    '- `delivery/notes`: Verify note preservation.',
    '## Completion Conditions',
    '- [x] Integration: export is enabled and user notes preserved.',
    '## Durable Outcomes',
    '- Current facts: none.',
    '- Lasting rationale: none.',
    '## Blockers',
    '- none',
    '',
  ].join('\n'))
  return { directory, brief }
}

function archiveGroupChildren(directory: string): void {
  completeChange(directory, 'delivery/flag')
  completeChange(directory, 'delivery/notes')
  run(directory, 'archive', 'delivery/flag')
  run(directory, 'archive', 'delivery/notes')
}

describe('public CLI lifecycle', () => {
  it('does not advertise or dispatch the removed commit command', () => {
    const directory = project()
    expect(run(directory, '--help')).not.toMatch(/^\s+commit\s/m)
    const result = spawnSync(process.execPath, [cli, 'commit', '--message-file', 'message.txt', '--json'], { cwd: directory, encoding: 'utf8' })
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('Unknown command')
  })

  it('requires archived children before Group close and keeps their history discoverable', () => {
    const { directory, brief } = groupProject()
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

  // This preservation matrix launches many real CLI subprocesses sequentially.
  it('rejects hidden Group declarations and missing visible completion content without mutation', () => {
    const { directory, brief } = groupProject()
    const declaredBrief = readFileSync(brief, 'utf8')
    const hiddenSlice = declaredBrief.replace(
      '- `delivery/notes`: Verify note preservation.',
      '<!--\n- `delivery/notes`: Verify note preservation.\n-->',
    )
    writeFileSync(brief, hiddenSlice)
    const undeclared = spawnSync(process.execPath, [cli, 'create', 'delivery/notes'], { cwd: directory, encoding: 'utf8' })
    expect(undeclared.status).not.toBe(0)
    expect(existsSync(join(directory, '.rsp/changes/delivery/notes.md'))).toBe(false)
    expect(readFileSync(brief, 'utf8')).toBe(hiddenSlice)
    writeFileSync(brief, declaredBrief)
    archiveGroupChildren(directory)
    const completedBrief = readFileSync(brief, 'utf8')
    const hiddenCompletion = completedBrief.replace(
      '- [x] Integration: export is enabled and user notes preserved.',
      'Integration evidence has not been recorded.\n<!--\n- [x] Integration: export is enabled and user notes preserved.\n-->',
    )
    writeFileSync(brief, hiddenCompletion)
    const incomplete = JSON.parse(run(directory, 'status', '--json'))
    expect(incomplete.groups[0].completion).toEqual({ done: 0, total: 0 })
    expect(incomplete.groups[0].readyToClose).toBe(false)
    const pending = spawnSync(process.execPath, [cli, 'group', 'close', 'delivery'], { cwd: directory, encoding: 'utf8' })
    expect(pending.status).not.toBe(0)
    expect(readFileSync(brief, 'utf8')).toBe(hiddenCompletion)
    for (const hint of ['<!-- Writing guidance only -->', '- <!-- Writing guidance only -->', '> <!-- Writing guidance only -->', '> ~~~md\n> Illustrative evidence only.\n> ~~~']) {
      const emptyOutcomes = completedBrief.replace('- Current facts: none.\n- Lasting rationale: none.', hint)
      writeFileSync(brief, emptyOutcomes)
      const inspected = spawnSync(process.execPath, [cli, 'status', '--json'], { cwd: directory, encoding: 'utf8' })
      expect(inspected.status).not.toBe(0)
      const invalid = JSON.parse(inspected.stdout)
      expect(invalid.groups[0].readyToClose).toBe(false)
      expect(invalid.diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'group_section_missing', severity: 'error' })]))
      const rejected = spawnSync(process.execPath, [cli, 'group', 'close', 'delivery'], { cwd: directory, encoding: 'utf8' })
      expect(rejected.status).not.toBe(0)
      expect(readFileSync(brief, 'utf8')).toBe(emptyOutcomes)
      expect(readdirSync(join(directory, '.rsp/archives/delivery')).some(name => name.endsWith('_brief.md'))).toBe(false)
    }
    const hiddenSection = completedBrief.replace(
      '## Completion Conditions\n- [x] Integration: export is enabled and user notes preserved.',
      '<!--\n## Completion Conditions\n- [x] Integration: export is enabled and user notes preserved.\n-->',
    )
    writeFileSync(brief, hiddenSection)
    const hiddenHeading = spawnSync(process.execPath, [cli, 'status', '--json'], { cwd: directory, encoding: 'utf8' })
    expect(hiddenHeading.status).not.toBe(0)
    expect(JSON.parse(hiddenHeading.stdout).groups[0].readyToClose).toBe(false)
    expect(spawnSync(process.execPath, [cli, 'group', 'close', 'delivery'], { cwd: directory, encoding: 'utf8' }).status).not.toBe(0)
    expect(readFileSync(brief, 'utf8')).toBe(hiddenSection)
    writeFileSync(brief, completedBrief
      .replace('## Durable Outcomes', '## Durable Outcomes\n<!-- Optional writing guidance. -->')
      .replace('## Completion Conditions', '## Completion Conditions\n<!--\n- [ ] Historical note, not a completion requirement.\n-->'))
    run(directory, 'group', 'close', 'delivery')
    expect(existsSync(brief)).toBe(false)
  }, 15000)

  it('requires fresh visible Group recovery evidence and refuses archive replay', () => {
    const { directory, brief } = groupProject()
    archiveGroupChildren(directory)
    run(directory, 'group', 'close', 'delivery')
    const archiveDirectory = join(directory, '.rsp/archives/delivery')
    const archivedBrief = join(archiveDirectory, readdirSync(archiveDirectory).find(name => name.endsWith('_brief.md'))!)
    const retained = readFileSync(archivedBrief, 'utf8')
    const hintOnlyBrief = retained.replace(
      '- Current facts: none.\n- Lasting rationale: none.',
      '<!-- Writing guidance only.\nRecord current facts and lasting rationale here. -->',
    )
    writeFileSync(archivedBrief, hintOnlyBrief)
    const recovery = spawnSync(process.execPath, [cli, 'group', 'reopen', 'delivery', '--reason', 'Fresh acceptance gap'], { cwd: directory, encoding: 'utf8' })
    expect(recovery.status).not.toBe(0)
    expect(existsSync(brief)).toBe(false)
    expect(readFileSync(archivedBrief, 'utf8')).toBe(hintOnlyBrief)
    writeFileSync(archivedBrief, retained)
    const hiddenReason = spawnSync(process.execPath, [cli, 'group', 'reopen', 'delivery', '--reason', '<!-- Hidden concern -->'], { cwd: directory, encoding: 'utf8' })
    expect(hiddenReason.status).not.toBe(0)
    expect(existsSync(brief)).toBe(false)
    expect(readFileSync(archivedBrief, 'utf8')).toBe(retained)
    const reason = 'Fix `<!-- hint -->` rendering'
    run(directory, 'group', 'reopen', 'delivery', '--reason', reason)
    expect(existsSync(brief)).toBe(true)
    expect(readFileSync(archivedBrief, 'utf8')).toBe(retained)
    const reopened = readFileSync(brief, 'utf8')
    expect(reopened).toContain(reason)
    expect(JSON.parse(run(directory, 'status', '--json')).diagnostics).toEqual([])
    const hiddenRecovery = reopened.replace(/^(- \[[ /x-]\] Resolve reopened concern from .+)$/m, '<!--\n$1\n-->')
    writeFileSync(brief, hiddenRecovery)
    const unproven = spawnSync(process.execPath, [cli, 'status', '--json'], { cwd: directory, encoding: 'utf8' })
    expect(unproven.status).not.toBe(0)
    expect(JSON.parse(unproven.stdout).diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'group_identity_reopened' })]))
    expect(readFileSync(brief, 'utf8')).toBe(hiddenRecovery)
    expect(readFileSync(archivedBrief, 'utf8')).toBe(retained)
    writeFileSync(brief, reopened.replace('- [ ] Resolve reopened concern', '- [x] Resolve reopened concern'))
    run(directory, 'group', 'close', 'delivery')
    const replay = spawnSync(process.execPath, [cli, 'group', 'reopen', 'delivery', '--from', `.rsp/archives/delivery/${archivedBrief.split('/').at(-1)}`, '--reason', reason], { cwd: directory, encoding: 'utf8' })
    expect(replay.status).not.toBe(0)
    expect(existsSync(brief)).toBe(false)
    expect(readFileSync(archivedBrief, 'utf8')).toBe(retained)
  })

  it('ignores hidden and example Change structure without losing visible required evidence', () => {
    const directory = project()
    const file = completeChange(directory, 'syntax')
    const source = readFileSync(file, 'utf8')
    const examples = '<!--\n# Change: fake-comment\n## Tasks\n- [ ] Hidden work.\n-->\n~~~md\n# Change: fake-example\n## Tasks\n- [ ] Example work.\n~~~\n> # Change: quoted-example\n> ## Tasks\n> - [ ] Quoted example work.\n'
    const completed = source.replace('# Change: syntax', `${examples}# Change: syntax`)
      .replace('- [x] Preserve the note.', '- [x] Preserve the literal `[ ]` and `<!-- hint -->` note.')
      .replace('## Blockers\n- none', '## Blockers\n~~~md\n- requires `missing-example`: illustrative only.\n~~~\n- none')
    writeFileSync(file, completed)
    const ready = JSON.parse(run(directory, 'ready', 'syntax', '--json'))
    expect(ready.readiness).toMatchObject({ completionGate: 'pass', archiveReady: 'yes', incompleteTasks: 0 })
    const status = JSON.parse(run(directory, 'status', '--json'))
    expect(status.records[0].progress).toEqual({ done: 2, total: 2 })
    expect(status.plan.edges).toEqual([])
    expect(JSON.parse(run(directory, 'check', '--json')).ok).toBe(true)
    const incomplete = completed.replace('### Required', '### Required\n<!--\n### Optional\n-->\n> ### Optional')
      .replace('- [x] Preserve', '- [/] Preserve')
      .replace('- [x] Compare note contents before and after.', '- [ ] Compare note contents before and after.')
    writeFileSync(file, incomplete)
    const blocked = JSON.parse(run(directory, 'ready', 'syntax', '--json'))
    expect(blocked.readiness).toMatchObject({ completionGate: 'blocked', incompleteTasks: 1, incompleteRequiredVerify: 1, incompleteOptionalVerify: 1 })
    expect(readFileSync(file, 'utf8')).toBe(incomplete)
    writeFileSync(file, incomplete.replace('- [/] Preserve', '- [-] Preserve').replace('- [ ] Compare', '- [-] Compare'))
    expect(JSON.parse(run(directory, 'ready', 'syntax', '--json')).readiness).toMatchObject({ archiveReady: 'yes', requiredVerify: { dropped: 1, total: 1 } })
    writeFileSync(file, completed.replace('# Change: syntax', ' # Change: syntax'))
    expect(JSON.parse(run(directory, 'ready', 'syntax', '--json')).readiness.archiveReady).toBe('no')
  })

  it('preserves compact task and Required Verify states without weakening archive gates', () => {
    const directory = project()
    const file = completeChange(directory, 'compact-states')
    const source = readFileSync(file, 'utf8')
    for (const [taskState, verifyState] of [[' ', '/'], ['/', ' ']]) {
      const pending = source.replace('- [x] Preserve the note.', `- [${taskState}]Preserve the note.`)
        .replace('- [x] Compare note contents before and after.', `- [${verifyState}]Compare note contents before and after.`)
      writeFileSync(file, pending)
      expect(JSON.parse(run(directory, 'ready', 'compact-states', '--json')).readiness).toMatchObject({ incompleteTasks: 1, incompleteRequiredVerify: 1, completionGate: 'blocked', archiveReady: 'no' })
      const rejected = spawnSync(process.execPath, [cli, 'archive', 'compact-states'], { cwd: directory, encoding: 'utf8' })
      expect(rejected.status).not.toBe(0)
      expect(readFileSync(file, 'utf8')).toBe(pending)
      expect(existsSync(join(directory, '.rsp/focus.d/compact-states'))).toBe(true)
    }
    const completed = source.replace('- [x] Preserve the note.', '- [x]Preserve the note.')
      .replace('- [x] Compare note contents before and after.', '- [-]Compare note contents before and after.')
    writeFileSync(file, completed)
    expect(JSON.parse(run(directory, 'ready', 'compact-states', '--json')).readiness).toMatchObject({ incompleteTasks: 0, archiveReady: 'yes', requiredVerify: { dropped: 1, total: 1 } })
    expect(JSON.parse(run(directory, 'status', '--json')).records[0].progress.total).toBe(2)
    run(directory, 'archive', 'compact-states')
    const archived = readdirSync(join(directory, '.rsp/archives')).find(name => name.endsWith('_compact-states.md'))!
    expect(readFileSync(join(directory, '.rsp/archives', archived), 'utf8')).toBe(completed)
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
    writeFileSync(join(directory, '.rsp/specs/billing.md'), '# Billing\n<!--\n# Hidden title\n-->\n~~~md\n# Example title\n~~~\nThe [billing] marker is literal.\n')
    const search = JSON.parse(run(directory, 'specs', '--search', '[billing]', '--json'))
    expect(search.matches.some((match: { path: string }) => match.path === '.rsp/specs/billing.md')).toBe(true)
    const billing = search.matches.find((match: { path: string }) => match.path === '.rsp/specs/billing.md')
    expect(billing).toMatchObject({ title: 'Billing', heading: 'Billing' })
    const escaped = spawnSync(process.execPath, [cli, 'specs', '../outside.md', '--json'], { cwd: directory, encoding: 'utf8' })
    expect(escaped.status).not.toBe(0)
    expect(JSON.parse(escaped.stdout).ok).toBe(false)
    const config = join(directory, '.rsp/config.yaml')
    const invalid = 'workflow:\n  delegation: unsupported-value\n'
    writeFileSync(config, invalid)
    const rejected = spawnSync(process.execPath, [cli, 'config', '--json'], { cwd: directory, encoding: 'utf8' })
    expect(rejected.status).not.toBe(0)
    expect(JSON.parse(rejected.stdout).ok).toBe(false)
    expect(readFileSync(config, 'utf8')).toBe(invalid)
  })

  it('exposes independent workflow defaults and refuses legacy policy without mutation', () => {
    const directory = project()
    const config = join(directory, '.rsp/config.yaml')
    expect(JSON.parse(run(directory, 'config', '--json')).workflow).toEqual({ delegation: 'off', closeout: 'ask' })
    writeFileSync(config, 'kinds: []\n')
    expect(JSON.parse(run(directory, 'config', '--json')).workflow).toEqual({ delegation: 'off', closeout: 'ask' })
    run(directory, 'update')
    expect(readFileSync(config, 'utf8')).toContain('delegation: off')
    writeFileSync(config, 'workflow:\n  delegation: auto\n  closeout: manual\n')
    run(directory, 'update')
    expect(JSON.parse(run(directory, 'config', '--json')).workflow).toEqual({ delegation: 'auto', closeout: 'manual' })
    for (const invalid of [
      'manage:\n  activation: auto\n  closeout: local\n',
      'workflow:\n  delegation: auto\n  closeout: local\n',
      'workflow:\n  delegation: false\n',
      'workflow:\n  maxWorkers: 3\n',
      'manage: {}\nworkflow:\n  delegation: auto\n',
    ]) {
      writeFileSync(config, invalid)
      const beforeRules = readFileSync(join(directory, '.rsp/rsp-rules.md'), 'utf8')
      const rejected = spawnSync(process.execPath, [cli, 'config', '--json'], { cwd: directory, encoding: 'utf8' })
      expect(rejected.status).not.toBe(0)
      expect(JSON.parse(rejected.stdout).ok).toBe(false)
      if (invalid.startsWith('manage:'))
        expect(rejected.stdout).toContain('explicit migration')
      const update = spawnSync(process.execPath, [cli, 'update'], { cwd: directory, encoding: 'utf8' })
      expect(update.status).not.toBe(0)
      expect(readFileSync(config, 'utf8')).toBe(invalid)
      expect(readFileSync(join(directory, '.rsp/rsp-rules.md'), 'utf8')).toBe(beforeRules)
    }
    writeFileSync(config, 'workflow:\n  closeout: auto\n')
    completeChange(directory, 'keep-open')
    const before = readFileSync(join(directory, '.rsp/changes/keep-open.md'), 'utf8')
    run(directory, 'ready', 'keep-open', '--json')
    run(directory, 'status', '--json')
    expect(readFileSync(join(directory, '.rsp/changes/keep-open.md'), 'utf8')).toBe(before)
    expect(JSON.parse(run(directory, 'config', '--json')).workflow).toEqual({ delegation: 'off', closeout: 'auto' })
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

  it('refuses an unreadable archive before moving the Change or clearing its focus', () => {
    const directory = project()
    const file = completeChange(directory, 'missing-summary')
    const source = readFileSync(file, 'utf8')
    run(directory, 'focus', 'missing-summary')
    const focus = join(directory, '.rsp/focus.d/missing-summary')
    const focusContent = readFileSync(focus, 'utf8')
    const archives = readdirSync(join(directory, '.rsp/archives'))
    for (const proposal of ['Completed the requested work.', '- Outcome: <!-- hidden only -->\n- Summary:']) {
      const content = source.replace('- Outcome: Preserve the user-owned note during a local update.', proposal)
      writeFileSync(file, content)
      const ready = JSON.parse(run(directory, 'ready', 'missing-summary', '--json'))
      expect(ready.readiness).toMatchObject({ completionGate: 'blocked', archiveReady: 'no', incompleteTasks: 0, incompleteRequiredVerify: 0 })
      expect(ready.warnings).toContain('archived Change must contain frontmatter summary, Proposal Outcome, or Proposal Summary')
      const rejected = spawnSync(process.execPath, [cli, 'archive', 'missing-summary'], { cwd: directory, encoding: 'utf8' })
      expect(rejected.status).not.toBe(0)
      expect(readFileSync(file, 'utf8')).toBe(content)
      expect(readFileSync(focus, 'utf8')).toBe(focusContent)
      expect(readdirSync(join(directory, '.rsp/archives'))).toEqual(archives)
    }
    const repaired = readFileSync(file, 'utf8').replace('kind: fix', 'kind: fix\nsummary: Preserved the note.')
    writeFileSync(file, repaired)
    expect(JSON.parse(run(directory, 'ready', 'missing-summary', '--json')).readiness.archiveReady).toBe('yes')
    run(directory, 'archive', 'missing-summary')
    expect(JSON.parse(run(directory, 'history', 'missing-summary', '--json')).record.summary).toBe('Preserved the note.')
    expect(JSON.parse(run(directory, 'status', '--json')).diagnostics).toEqual([])
    expect(existsSync(file)).toBe(false)
    expect(existsSync(focus)).toBe(false)
    const archived = readdirSync(join(directory, '.rsp/archives')).find(name => name.endsWith('_missing-summary.md'))!
    expect(readFileSync(join(directory, '.rsp/archives', archived), 'utf8')).toBe(repaired)
  })

  it('projects visible Change and Group summaries while retaining literals and archive bytes', () => {
    const { directory, brief } = groupProject()
    completeChange(directory, 'delivery/flag')
    completeChange(directory, 'delivery/notes')
    writeFileSync(brief, readFileSync(brief, 'utf8').replace(
      '- Deliver the requested export.',
      '- <!-- Hidden Goal hint -->\n- Deliver `<!-- literal -->` export. <!-- Hidden inline hint -->',
    ))
    const file = completeChange(directory, 'summary-view')
    const source = readFileSync(file, 'utf8')
    const cases = [
      ['- Outcome: <!-- Hidden hint -->\n- Summary: Visible fallback.', 'Visible fallback.'],
      ['- Outcome: Visible result. <!-- Hidden hint -->', 'Visible result.'],
      ['- Outcome: Fix `<!-- literal -->` rendering. <!-- Hidden hint -->', 'Fix `<!-- literal -->` rendering.'],
    ]
    for (const [proposal, expected] of cases) {
      writeFileSync(file, source.replace('- Outcome: Preserve the user-owned note during a local update.', proposal))
      const status = JSON.parse(run(directory, 'status', '--json'))
      expect(status.records.find((record: { name: string }) => record.name === 'summary-view').summary).toBe(expected)
      expect(JSON.parse(run(directory, 'ready', 'summary-view', '--json')).readiness.archiveReady).toBe('yes')
    }
    expect(JSON.parse(run(directory, 'status', '--json')).groups[0].summary).toBe('Deliver `<!-- literal -->` export.')
    const retained = readFileSync(file, 'utf8')
    run(directory, 'archive', 'summary-view')
    expect(JSON.parse(run(directory, 'history', 'summary-view', '--json')).record.summary).toBe('Fix `<!-- literal -->` rendering.')
    const archived = readdirSync(join(directory, '.rsp/archives')).find(name => name.endsWith('_summary-view.md'))!
    expect(readFileSync(join(directory, '.rsp/archives', archived), 'utf8')).toBe(retained)
  })

  it('keeps dependencies and visible blocker continuations active until resolved', () => {
    const directory = project()
    completeChange(directory, 'prerequisite')
    const dependency = `- requires ${String.fromCharCode(96)}prerequisite${String.fromCharCode(96)}: result required`
    const file = completeChange(directory, 'dependent', dependency)
    const source = readFileSync(file, 'utf8')
    expect(JSON.parse(run(directory, 'ready', 'dependent', '--json')).readiness.activeBlockers).toBe(true)
    run(directory, 'archive', 'prerequisite')
    const ready = JSON.parse(run(directory, 'ready', 'dependent', '--json'))
    expect(ready.readiness.archiveReady).toBe('yes')
    for (const blockers of ['- none\n  Waiting for owner approval.', `${dependency}\n\n  Waiting for owner approval.`, '- `<!-- approval -->` remains unresolved.']) {
      const blockedSource = source.replace(dependency, blockers)
      writeFileSync(file, blockedSource)
      expect(JSON.parse(run(directory, 'ready', 'dependent', '--json')).readiness).toMatchObject({ activeBlockers: true, completionGate: 'blocked', archiveReady: 'no' })
      const archive = spawnSync(process.execPath, [cli, 'archive', 'dependent'], { cwd: directory, encoding: 'utf8' })
      expect(archive.status).not.toBe(0)
      expect(readFileSync(file, 'utf8')).toBe(blockedSource)
      expect(existsSync(join(directory, '.rsp/focus.d/dependent'))).toBe(true)
    }
    const hiddenSource = source.replace(dependency, '- <!-- Writing hint only -->\n- ~~~md\n  - requires `missing-example`: illustrative only.\n  ~~~\n\n> <!-- Quoted writing hint -->\n\n> ~~~md\n> - requires `quoted-example`: illustrative only.\n> ~~~\n\n- none\n  <!-- Hidden continuation -->')
    writeFileSync(file, hiddenSource)
    expect(JSON.parse(run(directory, 'ready', 'dependent', '--json')).readiness).toMatchObject({ activeBlockers: false, completionGate: 'pass', archiveReady: 'yes' })
    expect(JSON.parse(run(directory, 'status', '--json')).plan.edges).toEqual([])
    run(directory, 'archive', 'dependent')
    expect(existsSync(file)).toBe(false)
    const archived = readdirSync(join(directory, '.rsp/archives')).find(name => name.endsWith('_dependent.md'))!
    expect(readFileSync(join(directory, '.rsp/archives', archived), 'utf8')).toBe(hiddenSource)
  })

  it('keeps blocker state, TUI explanations and historical evidence consistent', async () => {
    const directory = project()
    completeChange(directory, 'prerequisite')
    run(directory, 'archive', 'prerequisite')
    const file = completeChange(directory, 'blocker-view')
    const source = readFileSync(file, 'utf8')
    const dependency = '- requires `prerequisite`: result required'
    const cases: Array<[string, boolean, string]> = [
      ['- none.', false, 'none'],
      ['- <!-- Hidden hint -->\n- none', false, 'none'],
      ['- none\n  Waiting for owner approval.', true, 'Waiting for owner approval.'],
      [`${dependency} <!-- Hidden hint -->`, false, 'none'],
    ]
    const originalCwd = process.cwd()
    try {
      process.chdir(directory)
      for (const [blockers, blocked, explanation] of cases) {
        writeFileSync(file, source.replace('## Blockers\n- none', `## Blockers\n${blockers}`))
        const snapshot = await inspectProjectStatus()
        const record = snapshot.records.find(item => item.output.name === 'blocker-view')!
        const item: ChangeDashboardItem = { type: 'change', key: 'blocker-view', workRef: 'blocker-view', title: record.title, searchable: record.title, record }
        const rendered = projectWorkDetailLines(item, snapshot, en, 120).map(markdownLineText)
        expect(record.output.isBlocked).toBe(blocked)
        expect(rendered).toContain(`Blockers: ${explanation}`)
        expect(rendered.join('\n')).not.toContain('Hidden hint')
      }
    }
    finally {
      process.chdir(originalCwd)
    }
    const retained = source.replace('## Blockers\n- none', `## Blockers\n${dependency}\n- <!-- Hidden hint -->\n- none.`)
    writeFileSync(file, retained)
    run(directory, 'archive', 'blocker-view')
    const history = JSON.parse(run(directory, 'history', 'blocker-view', '--json'))
    expect(history.record.evidence.blockers.items).toEqual([dependency])
    const archived = readdirSync(join(directory, '.rsp/archives')).find(name => name.endsWith('_blocker-view.md'))!
    expect(readFileSync(join(directory, '.rsp/archives', archived), 'utf8')).toBe(retained)
  })

  it('preserves user instructions and notes during update and refuses managed-path symlinks', () => {
    const directory = project()
    const agents = join(directory, 'AGENTS.md')
    const markerExample = '~~~md\n<!-- rsp:begin -->\nUser-owned example; preserve exactly.\n<!-- rsp:end -->\n~~~\n\n'
    const config = join(directory, '.rsp/config.yaml')
    writeFileSync(config, '# User-owned configuration.\nkinds: [] # Keep this comment.\nworkflow:\n  delegation: off\n  closeout: manual\n')
    const oldEntry = readFileSync(agents, 'utf8')
      .replace('<!-- rsp:begin -->', '<!-- User-owned prefix --> <!-- rsp:begin -->')
      .replace('## RSP Entry', '## Outdated RSP Entry')
      .replace('<!-- rsp:end -->', '<!-- rsp:end --> Keep this exact adjacent policy.\n<!-- User-owned suffix -->')
    writeFileSync(agents, `${markerExample}${oldEntry}\n## User policy\nKeep this exact paragraph.\n`)
    const note = join(directory, '.rsp/specs/user-owned.md')
    const existingSpec = '# Existing Spec\n\n## Stable Facts\nUser-authored contract.\n'
    writeFileSync(note, existingSpec)
    const beforeUpdate = JSON.parse(spawnSync(process.execPath, [cli, 'doctor', '--json'], { cwd: directory, encoding: 'utf8' }).stdout)
    expect(beforeUpdate.checks.some((check: { code?: string }) => check.code === 'legacy_context_map')).toBe(false)
    expect(beforeUpdate.checks).toEqual(expect.arrayContaining([expect.objectContaining({ label: 'AGENTS.md contains managed RSP block', status: 'ok' })]))
    const legacyMap = join(directory, 'CONTEXT-MAP.md')
    writeFileSync(legacyMap, '# Domains\nOrdering hands off to billing.\n')
    expect(run(directory, 'update')).toContain('CONTEXT-MAP.md')
    const updatedConfig = readFileSync(config, 'utf8')
    expect(updatedConfig).toContain('# User-owned configuration.')
    expect(updatedConfig).toContain('# Keep this comment.')
    expect(JSON.parse(run(directory, 'config', '--json')).workflow).toEqual({ delegation: 'off', closeout: 'manual' })
    run(directory, 'update')
    expect(readFileSync(config, 'utf8')).toBe(updatedConfig)
    expect(readFileSync(agents, 'utf8')).toContain('Keep this exact paragraph.')
    expect(readFileSync(agents, 'utf8').startsWith(markerExample)).toBe(true)
    expect(readFileSync(agents, 'utf8')).toContain('<!-- User-owned prefix --> <!-- rsp:begin -->')
    expect(readFileSync(agents, 'utf8')).toContain('<!-- rsp:end --> Keep this exact adjacent policy.\n<!-- User-owned suffix -->')
    expect(readFileSync(agents, 'utf8')).not.toContain('Outdated RSP Entry')
    expect(readFileSync(agents, 'utf8').split('<!-- rsp:begin -->')).toHaveLength(3)
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
