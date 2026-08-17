import { Buffer } from 'node:buffer'
import { execSync, spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync, utimesSync } from 'node:fs'
import { chmod, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { RSP_DIR } from '../../src/core/config.js'
import { changesPath, cliPath, createRspFixture, renderChange, renderGeneratedIndexMetadata, renderGroupBrief } from './harness.js'

describe('check command', () => {
  it('passes on valid changes', async () => {
    const changePath = changesPath('auth', 'login.md')
    const content = await readFile(changePath, 'utf-8')
    await writeFile(changePath, content.replace('kind: "<choose: feature | fix | refactor | docs | ops | research>"', 'kind: feature'))

    const { runCheck } = await import('../../src/commands/check.js')
    const result = await runCheck()
    expect(result.ok).toBe(true)
    expect(result.summary.errors).toBe(0)
  })

  it('reports missing required sections in changes', async () => {
    await writeFile(changesPath('orphan.md'), `---
kind: fix
---

# Change: orphan

## Proposal
- Summary: orphan
- Why:
  - because
- Scope:
  - work
- Non-goals:
  - none

## Design
- Approach:
  - details
- Affected areas:
  - src/orphan.ts
- Constraints:
  - none

## Tasks
- [ ] implement orphan

## Verify
- Automated:
  - [ ] run tests
- Manual:
  - [ ] verify orphan
- Durable updates:
  - [ ] update docs if needed

## Blockers
- none
`)

    const { runCheck } = await import('../../src/commands/check.js')
    const result = await runCheck()
    expect(result.ok).toBe(false)
    expect(result.summary.errors).toBeGreaterThan(0)
  })

  it('fails when focus markers exist without matching change files', () => {
    const brokenDir = join(tmpdir(), 'rsp-check-dangling-focus-test', randomUUID())
    return (async () => {
      await mkdir(join(brokenDir, '.rsp', 'focus.d'), { recursive: true })
      await mkdir(join(brokenDir, '.rsp', 'changes'), { recursive: true })
      await writeFile(join(brokenDir, '.rsp', 'focus.d', 'dangling'), '')

      let output = ''
      let failed = false
      try {
        output = execSync(`node ${cliPath()} check`, { cwd: brokenDir, encoding: 'utf-8' })
      }
      catch (error) {
        failed = true
        output = String((error as { stdout?: string }).stdout || '')
      }

      expect(failed).toBe(true)
      expect(output).toContain('changes/dangling.md not found')
    })()
  })

  it('fails when kind still uses the template placeholder', () => {
    const placeholderDir = join(tmpdir(), 'rsp-check-kind-placeholder-test', randomUUID())
    return (async () => {
      await mkdir(join(placeholderDir, '.rsp', 'changes'), { recursive: true })
      await writeFile(join(placeholderDir, '.rsp', 'changes', 'placeholder.md'), `---
kind: "<choose: feature | fix | refactor | docs | ops | research>"
---

# Change: placeholder

## Proposal
- Summary: placeholder
- Why:
  - because
- Scope:
  - work
- Non-goals:
  - none

## Spec
### ADDED
- Requirement: placeholder
  - behavior

### Acceptance
#### Scenario: placeholder
- GIVEN x
- WHEN y
- THEN z

## Design
- Approach:
  - details
- Affected areas:
  - src/placeholder.ts
- Constraints:
  - none

## Tasks
- [ ] implement placeholder

## Verify
- Automated:
  - [ ] run tests
- Manual:
  - [ ] verify placeholder
- Durable updates:
  - [ ] update docs if needed

## Blockers
- none
`)

      let output = ''
      let failed = false
      try {
        output = execSync(`node ${cliPath()} check`, { cwd: placeholderDir, encoding: 'utf-8' })
      }
      catch (error) {
        failed = true
        output = String((error as { stdout?: string }).stdout || '')
      }

      expect(failed).toBe(true)
      expect(output).toContain('kind still uses the template placeholder')
    })()
  })

  it('warns when change content still contains template placeholders', () => {
    const placeholderDir = join(tmpdir(), 'rsp-check-template-placeholder-test', randomUUID())
    return (async () => {
      await mkdir(join(placeholderDir, '.rsp', 'changes'), { recursive: true })
      await writeFile(join(placeholderDir, '.rsp', 'changes', 'placeholder-body.md'), `---
kind: feature
---

# Change: placeholder-body

## Proposal
- Summary: placeholder body
- Why:
  - <what user need or capability gap this addresses>
- Scope:
  - ship placeholder lint
- Non-goals:
  - none

## Spec
### ADDED
- Requirement: placeholder lint
  - warn on unfinished placeholders

### Acceptance
#### Scenario: placeholder is detected
- GIVEN <context>
- WHEN rsp check runs
- THEN a warning is reported

## Design
- Approach:
  - check text lines deterministically
- Affected areas:
  - src/commands/check.ts
- Constraints:
  - warnings only

## Tasks
- [ ] implement placeholder lint

## Verify
- Automated:
  - [ ] run tests
- Manual:
  - [ ] review output
- Durable updates:
  - [ ] update docs if needed

## Blockers
- none
`)

      const output = execSync(`node ${cliPath()} check --json`, { cwd: placeholderDir, encoding: 'utf-8' })
      const result = JSON.parse(output)

      expect(result.ok).toBe(true)
      expect(result.summary.warnings).toBeGreaterThan(0)
      expect(result.diagnostics).toEqual(expect.arrayContaining([
        expect.objectContaining({ severity: 'warning', code: 'unfinished_template_placeholders' }),
      ]))
    })()
  })

  it('warns when change content contains unresolved clarification markers', () => {
    const clarificationDir = join(tmpdir(), 'rsp-check-clarification-test', randomUUID())
    return (async () => {
      await mkdir(join(clarificationDir, '.rsp', 'changes'), { recursive: true })
      await writeFile(join(clarificationDir, '.rsp', 'changes', 'clarify-me.md'), renderChange('clarify-me').replace(
        '- clarify-me behavior',
        '- [NEEDS CLARIFICATION: confirm exact behavior before implementation]',
      ))

      const output = execSync(`node ${cliPath()} check --json`, { cwd: clarificationDir, encoding: 'utf-8' })
      const result = JSON.parse(output)

      expect(result.ok).toBe(true)
      expect(result.summary.warnings).toBeGreaterThan(0)
      expect(result.diagnostics).toEqual(expect.arrayContaining([
        expect.objectContaining({ severity: 'warning', code: 'unresolved_clarifications' }),
      ]))
    })()
  })

  it('rejects legacy required_sections before validating Change content', () => {
    const configDir = join(tmpdir(), 'rsp-check-required-sections-test', randomUUID())
    return (async () => {
      await mkdir(join(configDir, '.rsp', 'changes'), { recursive: true })
      await writeFile(join(configDir, '.rsp', 'config.yaml'), 'required_sections:\n  - Proposal\n  - Spec\n')
      await writeFile(join(configDir, '.rsp', 'changes', 'orphan.md'), `---
kind: fix
---

# Change: orphan

## Proposal
- Summary: orphan
- Why:
  - because
- Scope:
  - work
- Non-goals:
  - none

## Design
- not needed: trivial example

## Tasks
- [ ] implement orphan

## Verify
- none

## Blockers
- none
`)

      const result = spawnSync('node', [cliPath(), 'check'], { cwd: configDir, encoding: 'utf-8' })

      expect(result.status).not.toBe(0)
      expect(result.stderr).toContain('config.yaml field "required_sections" is no longer supported')
      expect(result.stdout).not.toContain('missing "## Spec" section')
    })()
  })
})

describe('status commands', () => {
  it('shows focused changes separately from unfocused open changes', async () => {
    const statusDir = await createRspFixture('rsp-status-focused-test', ['specs', 'changes', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'changes', 'focused-one.md'), renderChange('focused-one'))
    await writeFile(join(statusDir, '.rsp', 'changes', 'unfocused-one.md'), renderChange('unfocused-one'))
    await writeFile(join(statusDir, '.rsp', 'focus.d', 'focused-one'), '')

    const output = execSync(`node ${cliPath()} status`, { cwd: statusDir, encoding: 'utf-8' })
    expect(output).toContain('Focused: focused-one')
    expect(output).toContain('2 change(s), 1 focused')
  })

  it('prints next actions when status has open changes but no focus', async () => {
    const statusDir = await createRspFixture('rsp-status-no-focus-test', ['specs', 'changes', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'changes', 'unfocused-one.md'), renderChange('unfocused-one'))

    const output = execSync(`node ${cliPath()} status`, { cwd: statusDir, encoding: 'utf-8' })
    expect(output).toContain('No focused change.')
    expect(output).toContain('Open changes: unfocused-one')
    expect(output).toContain('Run: rsp focus unfocused-one')
  })

  it('recommends the first declared open unblocked slice from an eligible Group', async () => {
    const statusDir = await createRspFixture('rsp-status-group-navigation-test', ['specs', 'changes', 'focus.d'])
    const groupDir = join(statusDir, '.rsp', 'changes', 'delivery')
    await mkdir(groupDir, { recursive: true })
    await writeFile(join(groupDir, '00-brief.md'), renderGroupBrief('delivery', [
      'delivery/blocked-first',
      'delivery/z-ready-second',
      'delivery/a-ready-third',
    ]))
    await writeFile(join(groupDir, 'blocked-first.md'), renderChange('delivery/blocked-first').replace('## Blockers\n- none', '## Blockers\n- waiting on authority'))
    await writeFile(join(groupDir, 'z-ready-second.md'), renderChange('delivery/z-ready-second'))
    await writeFile(join(groupDir, 'a-ready-third.md'), renderChange('delivery/a-ready-third'))

    const output = JSON.parse(execSync(`node ${cliPath()} status --json`, { cwd: statusDir, encoding: 'utf-8' }))

    expect(output.nextActions).toContain('Run: rsp focus delivery/z-ready-second')
    expect(output.nextActions).not.toContain('Run: rsp focus delivery/blocked-first')
    expect(output.nextActions).not.toContain('Run: rsp focus delivery/a-ready-third')
    expect(output.plan.ready).toEqual(['delivery/z-ready-second', 'delivery/a-ready-third'])
  })

  it('inherits a Group Brief blocker into the derived child execution plan', async () => {
    const statusDir = await createRspFixture('rsp-status-group-blocker-plan-test', ['specs', 'changes', 'archives', 'focus.d'])
    const groupDir = join(statusDir, '.rsp', 'changes', 'delivery')
    await mkdir(groupDir, { recursive: true })
    await writeFile(join(groupDir, '00-brief.md'), renderGroupBrief('delivery', [
      'delivery/api',
      'delivery/ui',
    ], { blockers: 'waiting for release authority' }))
    await writeFile(join(groupDir, 'api.md'), renderChange('delivery/api'))
    await writeFile(join(groupDir, 'ui.md'), renderChange('delivery/ui'))

    const output = JSON.parse(execSync(`node ${cliPath()} status --json`, { cwd: statusDir, encoding: 'utf-8' }))

    expect(output.plan.ready).toEqual([])
    expect(output.plan.waves).toEqual([])
    expect(output.plan.blocked).toEqual([
      { change: 'delivery/api', requires: [], external: true },
      { change: 'delivery/ui', requires: [], external: true },
    ])
    expect(output.records.every((record: { isBlocked: boolean }) => record.isBlocked)).toBe(true)
  })

  it('filters blocked changes by blockers section', async () => {
    const statusDir = await createRspFixture('rsp-status-blocked-test')
    await writeFile(join(statusDir, '.rsp', 'changes', 'blocked-one.md'), renderChange('blocked-one').replace('## Blockers\n- none', '## Blockers\n- waiting on api'))
    await writeFile(join(statusDir, '.rsp', 'changes', 'ready-one.md'), renderChange('ready-one'))

    const output = execSync(`node ${cliPath()} status --blocked`, { cwd: statusDir, encoding: 'utf-8' })
    expect(output).toContain('blocked-one')
    expect(output).not.toContain('ready-one')
  })

  it('filters stale changes by age', async () => {
    const statusDir = await createRspFixture('rsp-status-stale-test')

    const stalePath = join(statusDir, '.rsp', 'changes', 'stale-one.md')
    const freshPath = join(statusDir, '.rsp', 'changes', 'fresh-one.md')
    await writeFile(stalePath, renderChange('stale-one'))
    await writeFile(freshPath, renderChange('fresh-one'))

    const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    utimesSync(stalePath, oldDate, oldDate)

    const output = execSync(`node ${cliPath()} status --stale 14`, { cwd: statusDir, encoding: 'utf-8' })
    expect(output).toContain('stale-one')
    expect(output).not.toContain('fresh-one')
  })

  it('treats recently updated older files as fresh', async () => {
    const statusDir = await createRspFixture('rsp-status-revived-test')

    const stalePath = join(statusDir, '.rsp', 'changes', 'stale-one.md')
    const revivedPath = join(statusDir, '.rsp', 'changes', 'revived-one.md')
    await writeFile(stalePath, renderChange('stale-one'))
    await writeFile(revivedPath, renderChange('revived-one'))

    const oldDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    utimesSync(stalePath, oldDate, oldDate)
    utimesSync(revivedPath, oldDate, oldDate)

    const now = new Date()
    utimesSync(revivedPath, now, now)

    const output = execSync(`node ${cliPath()} status --stale 14`, { cwd: statusDir, encoding: 'utf-8' })
    expect(output).toContain('stale-one')
    expect(output).not.toContain('revived-one')
  })

  it('prints machine-readable JSON for status', async () => {
    const statusDir = await createRspFixture('rsp-status-json-test', ['specs', 'changes', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'changes', 'focused-one.md'), renderChange('focused-one'))
    await writeFile(join(statusDir, '.rsp', 'focus.d', 'focused-one'), '')

    const output = execSync(`node ${cliPath()} status --json`, { cwd: statusDir, encoding: 'utf-8' })
    const result = JSON.parse(output)

    expect(result.command).toBe('status')
    expect(result.ok).toBe(true)
    expect(result).toHaveProperty('runtime')
    expect(result).toHaveProperty('summary')
    expect(result.focused).toEqual(['focused-one'])
    expect(result.records[0].name).toBe('focused-one')
    expect(result.records[0].path).toBe('.rsp/changes/focused-one.md')
    expect(result.records[0].path).not.toContain('\\')
    expect(result.records[0].progress.total).toBeGreaterThan(0)
    expect(Array.isArray(result.runtime)).toBe(true)
  })

  it('derives a deterministic dependency plan from exact Change blockers', async () => {
    const statusDir = await createRspFixture('rsp-status-dependency-plan-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'changes', 'research.md'), renderChange('research'))
    await writeFile(join(statusDir, '.rsp', 'changes', 'implement.md'), renderChange('implement').replace(
      '## Blockers\n- none',
      '## Blockers\n- requires `research`: needs the accepted research model',
    ))
    await writeFile(join(statusDir, '.rsp', 'changes', 'release.md'), renderChange('release').replace(
      '## Blockers\n- none',
      '## Blockers\n- requires `implement`: needs the promoted implementation',
    ))
    await writeFile(join(statusDir, '.rsp', 'changes', 'approval.md'), renderChange('approval').replace(
      '## Blockers\n- none',
      '## Blockers\n- waiting for maintainer authority',
    ))
    await writeFile(join(statusDir, '.rsp', 'focus.d', 'implement'), '')

    const output = JSON.parse(execSync(`node ${cliPath()} status --json`, { cwd: statusDir, encoding: 'utf-8' }))
    const focused = JSON.parse(execSync(`node ${cliPath()} status --focused --json`, { cwd: statusDir, encoding: 'utf-8' }))

    expect(output.plan).toEqual({
      nodes: [
        { name: 'approval', selection: 'selected', state: 'blocked' },
        { name: 'implement', selection: 'selected', state: 'waiting' },
        { name: 'release', selection: 'selected', state: 'waiting' },
        { name: 'research', selection: 'selected', state: 'ready' },
      ],
      ready: ['research'],
      edges: [
        { change: 'implement', requires: 'research', reason: 'needs the accepted research model', state: 'open' },
        { change: 'release', requires: 'implement', reason: 'needs the promoted implementation', state: 'open' },
      ],
      blocked: [
        { change: 'approval', requires: [], external: true },
        { change: 'implement', requires: ['research'], external: false },
        { change: 'release', requires: ['implement'], external: false },
      ],
      waves: [['research'], ['implement'], ['release']],
    })
    expect(output.records.find((record: { name: string }) => record.name === 'research').isBlocked).toBe(false)
    expect(output.records.find((record: { name: string }) => record.name === 'implement').isBlocked).toBe(true)
    expect(focused.records.map((record: { name: string }) => record.name)).toEqual(['implement'])
    expect(focused.plan.edges).toEqual([
      { change: 'implement', requires: 'research', reason: 'needs the accepted research model', state: 'open' },
    ])
    expect(focused.plan.nodes).toEqual([
      { name: 'implement', selection: 'selected', state: 'waiting' },
      { name: 'research', selection: 'prerequisite', state: 'ready' },
    ])
    expect(focused.plan.blocked).toEqual([
      { change: 'implement', requires: ['research'], external: false },
    ])
    expect(focused.plan.ready).toEqual(['research'])
    expect(focused.plan.waves).toEqual([['research'], ['implement']])

    const human = execSync(`node ${cliPath()} status --focused`, { cwd: statusDir, encoding: 'utf-8' })
    expect(human).not.toContain('Dependency graph')
    expect(human).not.toContain('(parent requires children)')
    expect(human).toContain('Next action: research')

    const verboseHuman = execSync(`node ${cliPath()} status --focused --verbose`, { cwd: statusDir, encoding: 'utf-8' })
    expect(verboseHuman).toContain('Dependency graph')
    expect(verboseHuman).toContain('(parent requires children)')
    expect(verboseHuman).toMatch(/◎ implement\s+focused · waiting/)
    expect(verboseHuman).toMatch(/└── ● research\s+prerequisite · ready/)
    expect(verboseHuman).toContain('needs the accepted research model')
  })

  it('resolves an exact dependency when its prerequisite is archived', async () => {
    const statusDir = await createRspFixture('rsp-status-archived-dependency-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'changes', 'implement.md'), renderChange('implement').replace(
      '## Blockers\n- none',
      '## Blockers\n- requires `research`: needs the accepted research model',
    ))
    await writeFile(join(statusDir, '.rsp', 'archives', '2026-07-20_research.md'), renderChange('research'))

    const status = JSON.parse(execSync(`node ${cliPath()} status --json`, { cwd: statusDir, encoding: 'utf-8' }))
    const ready = JSON.parse(execSync(`node ${cliPath()} ready implement --json`, { cwd: statusDir, encoding: 'utf-8' }))

    expect(status.plan.edges).toEqual([
      { change: 'implement', requires: 'research', reason: 'needs the accepted research model', state: 'archived' },
    ])
    expect(status.plan.nodes).toEqual([
      { name: 'implement', selection: 'selected', state: 'ready' },
      { name: 'research', selection: 'prerequisite', state: 'archived' },
    ])
    expect(status.plan.ready).toEqual(['implement'])
    expect(status.plan.blocked).toEqual([])
    expect(status.records[0].isBlocked).toBe(false)
    expect(ready.readiness.activeBlockers).toBe(false)
  })

  it('does not resolve a dependency from an archive whose path and WorkRef disagree', async () => {
    const statusDir = await createRspFixture('rsp-status-invalid-archived-dependency-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'changes', 'implement.md'), renderChange('implement').replace(
      '## Blockers\n- none',
      '## Blockers\n- requires `research`: needs the accepted research model',
    ))
    await writeFile(join(statusDir, '.rsp', 'archives', '2026-07-20_wrong-name.md'), renderChange('research'))

    const result = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const status = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(status.diagnostics).toContainEqual(expect.objectContaining({ code: 'archive_identity_mismatch' }))
    expect(status.plan.edges).toContainEqual(expect.objectContaining({ change: 'implement', requires: 'research', state: 'missing' }))
    expect(status.plan.ready).toEqual([])
    expect(status.records[0].isBlocked).toBe(true)
  })

  it('renders a shared prerequisite once and references repeated graph nodes', async () => {
    const statusDir = await createRspFixture('rsp-status-shared-prerequisite-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'changes', 'research.md'), renderChange('research'))
    for (const name of ['implement-a', 'implement-b']) {
      await writeFile(join(statusDir, '.rsp', 'changes', `${name}.md`), renderChange(name).replace(
        '## Blockers\n- none',
        '## Blockers\n- requires `research`: needs the shared research model',
      ))
      await writeFile(join(statusDir, '.rsp', 'focus.d', name), '')
    }

    const json = JSON.parse(execSync(`node ${cliPath()} status --focused --json`, { cwd: statusDir, encoding: 'utf-8' }))
    expect(json.plan.nodes).toEqual([
      { name: 'implement-a', selection: 'selected', state: 'waiting' },
      { name: 'implement-b', selection: 'selected', state: 'waiting' },
      { name: 'research', selection: 'prerequisite', state: 'ready' },
    ])
    expect(json.plan.ready).toEqual(['research'])
    expect(json.plan.waves).toEqual([['research'], ['implement-a', 'implement-b']])

    const human = execSync(`node ${cliPath()} status --focused --verbose`, { cwd: statusDir, encoding: 'utf-8' })
    expect(human.match(/● research/g)).toHaveLength(2)
    expect(human.match(/↩ shared/g)).toHaveLength(1)
    expect(human).toContain('Next action: research')
  })

  it('fails check and doctor on invalid structured dependency graphs', async () => {
    const statusDir = await createRspFixture('rsp-invalid-dependency-plan-test', ['specs', 'changes', 'archives', 'focus.d'])
    const blockerChange = (name: string, blocker: string) => renderChange(name).replace('## Blockers\n- none', `## Blockers\n- ${blocker}`)
    await writeFile(join(statusDir, '.rsp', 'changes', 'missing.md'), blockerChange('missing', 'requires `ghost`: target does not exist'))
    await writeFile(join(statusDir, '.rsp', 'changes', 'self.md'), blockerChange('self', 'requires `self`: invalid self dependency'))
    await writeFile(join(statusDir, '.rsp', 'changes', 'cycle-a.md'), blockerChange('cycle-a', 'requires `cycle-b`: cycle'))
    await writeFile(join(statusDir, '.rsp', 'changes', 'cycle-b.md'), blockerChange('cycle-b', 'requires `cycle-a`: cycle'))
    await writeFile(join(statusDir, '.rsp', 'changes', 'malformed.md'), blockerChange('malformed', 'requires ghost: missing exact WorkRef ticks'))
    await writeFile(join(statusDir, '.rsp', 'changes', 'aggregate.md'), blockerChange('aggregate', 'requires `delivery/brief`: Group Briefs are not executable dependencies'))
    await writeFile(join(statusDir, '.rsp', 'focus.d', 'cycle-b'), '')

    const checkResult = spawnSync('node', [cliPath(), 'check', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const focusedCheckResult = spawnSync('node', [cliPath(), 'check', '--focused', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const statusResult = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const check = JSON.parse(checkResult.stdout)
    const focusedCheck = JSON.parse(focusedCheckResult.stdout)
    const doctor = JSON.parse(doctorResult.stdout)
    const status = JSON.parse(statusResult.stdout)

    expect(checkResult.status).toBe(1)
    expect(check.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'dependency_syntax_invalid', change: 'malformed' }),
      expect.objectContaining({ code: 'dependency_target_invalid', change: 'aggregate' }),
      expect.objectContaining({ code: 'dependency_target_missing', change: 'missing' }),
      expect.objectContaining({ code: 'dependency_self_reference', change: 'self' }),
      expect.objectContaining({ code: 'dependency_cycle' }),
    ]))
    expect(focusedCheckResult.status).toBe(1)
    expect(focusedCheck.diagnostics).toContainEqual(expect.objectContaining({ code: 'dependency_cycle', change: 'cycle-b' }))
    expect(doctorResult.status).toBe(1)
    expect(doctor.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      label: 'Change dependency graph is valid',
    }))
    expect(statusResult.status).toBe(1)
    expect(status.plan.ready).toEqual([])
    expect(status.plan.waves).toEqual([])
    expect(status.nextActions).toEqual(['Run: rsp doctor'])
  })

  it('renders the dependency plan and shares resolved blocker truth across read commands', async () => {
    const statusDir = await createRspFixture('rsp-dependency-read-commands-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'changes', 'implement.md'), renderChange('implement').replace(
      '## Blockers\n- none',
      '## Blockers\n- requires `research`: needs the accepted research model',
    ))
    await writeFile(join(statusDir, '.rsp', 'archives', '2026-07-20_research.md'), renderChange('research'))

    const status = execSync(`node ${cliPath()} status --verbose`, { cwd: statusDir, encoding: 'utf-8' })
    const show = JSON.parse(execSync(`node ${cliPath()} show implement --json`, { cwd: statusDir, encoding: 'utf-8' }))
    const archive = execSync(`node ${cliPath()} archive implement --dry-run`, { cwd: statusDir, encoding: 'utf-8' })

    expect(status).toContain('Dependency graph')
    expect(status).toMatch(/◎ implement\s+open · ready/)
    expect(status).toMatch(/└── ✓ research\s+prerequisite · resolved — needs the accepted research model/)
    expect(status).toContain('Next action: implement')
    expect(show.change.blockers).toBe(false)
    expect(show.change.readiness.activeBlockers).toBe(false)
    expect(archive).not.toContain('active blockers are present')
  })

  it('ignores Blockers comments across dependency and readiness consumers', async () => {
    const statusDir = await createRspFixture('rsp-commented-blockers-test', ['specs', 'changes', 'archives', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'changes', 'commented.md'), renderChange('commented', `<!--
- requires \`ignored\`: example only
operator guidance
-->`))

    const status = JSON.parse(execSync(`node ${cliPath()} status --json`, { cwd: statusDir, encoding: 'utf-8' }))
    const show = JSON.parse(execSync(`node ${cliPath()} show commented --json`, { cwd: statusDir, encoding: 'utf-8' }))
    const ready = JSON.parse(execSync(`node ${cliPath()} ready commented --json`, { cwd: statusDir, encoding: 'utf-8' }))
    const archive = execSync(`node ${cliPath()} archive commented --dry-run`, { cwd: statusDir, encoding: 'utf-8' })

    expect(status.records[0].isBlocked).toBe(false)
    expect(status.plan.edges).toEqual([])
    expect(show.change.blockers).toBe(false)
    expect(show.change.readiness.activeBlockers).toBe(false)
    expect(ready.readiness.activeBlockers).toBe(false)
    expect(archive).not.toContain('active blockers are present')
  })

  it('tolerates punctuated none variants across dependency and readiness consumers', async () => {
    const statusDir = await createRspFixture('rsp-none-blocker-variant-test', ['specs', 'changes', 'archives', 'focus.d'])
    const content = renderChange('complete')
      .replaceAll('- [ ]', '- [x]')
      .replace('## Blockers\n- none', '## Blockers\n- None.')
    await writeFile(join(statusDir, '.rsp', 'changes', 'complete.md'), content)

    const status = JSON.parse(execSync(`node ${cliPath()} status --json`, { cwd: statusDir, encoding: 'utf-8' }))
    const show = JSON.parse(execSync(`node ${cliPath()} show complete --json`, { cwd: statusDir, encoding: 'utf-8' }))
    const ready = JSON.parse(execSync(`node ${cliPath()} ready complete --json`, { cwd: statusDir, encoding: 'utf-8' }))

    expect(status.records[0].isBlocked).toBe(false)
    expect(status.plan.blocked).toEqual([])
    expect(show.change.blockers).toBe(false)
    expect(show.change.readiness.activeBlockers).toBe(false)
    expect(ready.readiness.activeBlockers).toBe(false)
    expect(ready.readiness.completionGate).toBe('pass')
    expect(ready.warnings).not.toContain('active blockers are present in the change file')
  })

  it('prints status JSON next actions when no focus exists', async () => {
    const statusDir = await createRspFixture('rsp-status-json-no-focus-test')
    await writeFile(join(statusDir, '.rsp', 'changes', 'unfocused-json.md'), renderChange('unfocused-json'))

    const output = execSync(`node ${cliPath()} status --json`, { cwd: statusDir, encoding: 'utf-8' })
    const result = JSON.parse(output)
    expect(result.focused).toEqual([])
    expect(result.nextActions).toContain('Run: rsp focus unfocused-json')
  })

  it('fails closed instead of following a symlinked changes root', async () => {
    const statusDir = await createRspFixture('rsp-status-symlinked-changes-test', ['specs', 'changes', 'focus.d'])
    const externalDir = join(tmpdir(), 'rsp-status-external-changes-test', randomUUID())
    await mkdir(externalDir, { recursive: true })
    await writeFile(join(externalDir, 'external.md'), renderChange('external'))
    await rm(join(statusDir, '.rsp', 'changes'), { recursive: true })
    await symlink(externalDir, join(statusDir, '.rsp', 'changes'))

    const result = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.ok).toBe(false)
    expect(output.records).toEqual([])
    expect(output.diagnostics).toContainEqual(expect.objectContaining({ code: 'invalid_work_root' }))
  })

  it('fails status and check when dependency archive inspection is incomplete', async () => {
    const statusDir = await createRspFixture('rsp-status-symlinked-archives-test', ['specs', 'changes', 'archives', 'focus.d'])
    const externalDir = join(tmpdir(), 'rsp-status-external-archives-test', randomUUID())
    await mkdir(externalDir, { recursive: true })
    await writeFile(join(statusDir, '.rsp', 'changes', 'current.md'), renderChange('current'))
    await rm(join(statusDir, '.rsp', 'archives'), { recursive: true })
    await symlink(externalDir, join(statusDir, '.rsp', 'archives'))

    const statusResult = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const checkResult = spawnSync('node', [cliPath(), 'check', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const ready = JSON.parse(execSync(`node ${cliPath()} ready current --json`, { cwd: statusDir, encoding: 'utf-8' }))
    const show = JSON.parse(execSync(`node ${cliPath()} show current --json`, { cwd: statusDir, encoding: 'utf-8' }))
    const archiveResult = spawnSync('node', [cliPath(), 'archive', 'current', '--dry-run'], { cwd: statusDir, encoding: 'utf-8' })
    const status = JSON.parse(statusResult.stdout)
    const check = JSON.parse(checkResult.stdout)

    expect(statusResult.status).toBe(1)
    expect(status.ok).toBe(false)
    expect(status.diagnostics).toContainEqual(expect.objectContaining({ code: 'invalid_archive_root' }))
    expect(status.plan.ready).toEqual([])
    expect(checkResult.status).toBe(1)
    expect(check.diagnostics).toContainEqual(expect.objectContaining({ code: 'invalid_archive_root' }))
    expect(ready.readiness.activeBlockers).toBe(true)
    expect(ready.readiness.archiveReady).toBe('no')
    expect(show.change.blockers).toBe(true)
    expect(archiveResult.status).toBe(0)
    expect(archiveResult.stderr).toContain('Deprecated: use `rsp ready <name>`')
    expect(archiveResult.stdout).toContain('Archive ready: no')
    expect(archiveResult.stdout).toContain('active blockers are present in the change file')
  })

  it('fails closed when the changes root is missing', async () => {
    const statusDir = join(tmpdir(), 'rsp-status-missing-changes-root-test', randomUUID())
    await mkdir(statusDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: statusDir })
    await rm(join(statusDir, '.rsp', 'changes'), { recursive: true })

    const statusResult = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const status = JSON.parse(statusResult.stdout)
    const doctor = JSON.parse(doctorResult.stdout)

    expect(statusResult.status).toBe(1)
    expect(status.ok).toBe(false)
    expect(status.diagnostics).toContainEqual(expect.objectContaining({ code: 'invalid_work_root' }))
    expect(doctorResult.status).toBe(1)
    expect(doctor.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      label: 'open work uses supported WorkRef shapes',
    }))

    const repairedOutput = execSync(`node ${cliPath()} doctor --fix --json`, { cwd: statusDir, encoding: 'utf-8' })
    const repaired = JSON.parse(repairedOutput)
    expect(repaired.ok).toBe(true)
    expect(repaired.fixed).toContain('changes/ directory restored')
    expect(existsSync(join(statusDir, '.rsp', 'changes', '.gitkeep'))).toBe(true)
  })

  it('fails status when a focus marker points to a missing Change', async () => {
    const statusDir = await createRspFixture('rsp-status-missing-focused-change-test', ['specs', 'changes', 'focus.d'])
    await writeFile(join(statusDir, '.rsp', 'focus.d', 'ghost'), '')

    const result = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.ok).toBe(false)
    expect(output.diagnostics).toContainEqual(expect.objectContaining({ code: 'focused_change_missing', change: 'ghost' }))
    expect(output.nextActions).toEqual(['Run: rsp doctor'])
  })

  it('does not interpret a symlinked focus group as a marker', async () => {
    const statusDir = await createRspFixture('rsp-status-symlinked-focus-group-test', ['specs', 'changes', 'focus.d'])
    const externalDir = join(tmpdir(), 'rsp-status-symlinked-focus-group-external-test', randomUUID())
    await mkdir(externalDir, { recursive: true })
    await writeFile(join(statusDir, '.rsp', 'changes', 'release.md'), renderChange('release'))
    await symlink(externalDir, join(statusDir, '.rsp', 'focus.d', 'release'))

    const result = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: statusDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.ok).toBe(false)
    expect(output.focused).toEqual([])
    expect(output.diagnostics).toContainEqual(expect.objectContaining({ code: 'invalid_focus_path', change: 'release' }))
  })

  it('fails status when an open Change cannot be read', async () => {
    const statusDir = await createRspFixture('rsp-status-unreadable-change-test', ['specs', 'changes', 'focus.d'])
    const changePath = join(statusDir, '.rsp', 'changes', 'unreadable.md')
    await writeFile(changePath, renderChange('unreadable'))
    await chmod(changePath, 0o000)

    try {
      const result = spawnSync('node', [cliPath(), 'status', '--json'], { cwd: statusDir, encoding: 'utf-8' })
      const output = JSON.parse(result.stdout)

      expect(result.status).toBe(1)
      expect(output.ok).toBe(false)
      expect(output.diagnostics).toContainEqual(expect.objectContaining({ code: 'change_read_failed', change: 'unreadable' }))
    }
    finally {
      await chmod(changePath, 0o600)
    }
  })

  it('keeps status JSON error shape compatible on invalid stale filter', () => {
    const statusDir = join(tmpdir(), 'rsp-status-json-error-test', randomUUID())
    return (async () => {
      await mkdir(statusDir, { recursive: true })

      let output = ''
      let failed = false
      try {
        output = execSync(`node ${cliPath()} status --json --stale nope`, { cwd: statusDir, encoding: 'utf-8' })
      }
      catch (error) {
        failed = true
        output = String((error as { stdout?: string }).stdout || '')
      }

      const result = JSON.parse(output)
      expect(failed).toBe(true)
      expect(result.command).toBe('status')
      expect(result.ok).toBe(false)
      expect(result).toHaveProperty('runtime')
      expect(result).toHaveProperty('summary')
      expect(result.diagnostics).toEqual([])
      expect(result.nextActions).toEqual([])
      expect(result.error.code).toBe('invalid_stale_filter')
    })()
  })

  it('prints verbose diagnostics for malformed frontmatter in status', async () => {
    const statusDir = await createRspFixture('rsp-status-verbose-test')
    await writeFile(join(statusDir, '.rsp', 'changes', 'broken.md'), `---\nkind: [broken\n---\n\n# Change: broken\n`)

    const output = execSync(`node ${cliPath()} status --verbose 2>&1`, { cwd: statusDir, encoding: 'utf-8', shell: '/bin/zsh' })
    expect(output).toContain('[verbose] parseFrontmatter')
    expect(output).toContain('RSP status')
  })
})

describe('init and doctor', () => {
  it('does not initialize through a symlinked AGENTS.md file', async () => {
    const initDir = join(tmpdir(), 'rsp-init-agents-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-init-agents-symlink-external-test', randomUUID())
    await mkdir(initDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    await writeFile(join(externalDir, 'AGENTS.md'), 'external sentinel\n')
    await symlink(join(externalDir, 'AGENTS.md'), join(initDir, 'AGENTS.md'))

    const result = spawnSync('node', [cliPath(), 'init'], { cwd: initDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(`${result.stdout}${result.stderr}`).toContain('AGENTS.md must be a regular file')
    expect(await readFile(join(externalDir, 'AGENTS.md'), 'utf-8')).toBe('external sentinel\n')
    expect(existsSync(join(initDir, '.rsp'))).toBe(false)
  })

  it('reports and preserves a symlinked AGENTS.md file', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-agents-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-update-agents-symlink-external-test', randomUUID())
    await mkdir(updateDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await writeFile(join(updateDir, '.rsp', 'rsp-rules.md'), 'stale local rules\n')
    await rm(join(updateDir, 'AGENTS.md'))
    await writeFile(join(externalDir, 'AGENTS.md'), 'external sentinel\n')
    await symlink(join(externalDir, 'AGENTS.md'), join(updateDir, 'AGENTS.md'))

    const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: updateDir, encoding: 'utf-8' })
    const updateResult = spawnSync('node', [cliPath(), 'update'], { cwd: updateDir, encoding: 'utf-8' })
    const doctor = JSON.parse(doctorResult.stdout)

    expect(doctorResult.status).toBe(1)
    expect(doctor.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      label: 'AGENTS.md is a regular managed file',
    }))
    expect(updateResult.status).toBe(1)
    expect(`${updateResult.stdout}${updateResult.stderr}`).toContain('AGENTS.md must be a regular file')
    expect(await readFile(join(externalDir, 'AGENTS.md'), 'utf-8')).toBe('external sentinel\n')
    expect(await readFile(join(updateDir, '.rsp', 'rsp-rules.md'), 'utf-8')).toBe('stale local rules\n')
  })

  it('reports and preserves a symlinked fallback protocol file', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-fallback-file-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-update-fallback-file-external-test', randomUUID())
    await mkdir(updateDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await rm(join(updateDir, '.rsp', 'rsp-rules.md'))
    await writeFile(join(externalDir, 'rules.md'), 'external sentinel\n')
    await symlink(join(externalDir, 'rules.md'), join(updateDir, '.rsp', 'rsp-rules.md'))

    const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: updateDir, encoding: 'utf-8' })
    const updateResult = spawnSync('node', [cliPath(), 'update'], { cwd: updateDir, encoding: 'utf-8' })
    const doctor = JSON.parse(doctorResult.stdout)

    expect(doctorResult.status).toBe(1)
    expect(doctor.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      label: 'rsp-rules.md is a regular managed file',
    }))
    expect(updateResult.status).toBe(1)
    expect(`${updateResult.stdout}${updateResult.stderr}`).toContain('fallback protocol must be a regular file')
    expect(await readFile(join(externalDir, 'rules.md'), 'utf-8')).toBe('external sentinel\n')
    expect(existsSync(join(updateDir, '.rsp', '.lock'))).toBe(false)
  })

  it('does not reinitialize through a symlinked managed directory', async () => {
    const initDir = join(tmpdir(), 'rsp-init-managed-root-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-init-managed-root-external-test', randomUUID())
    await mkdir(initDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: initDir })
    await rm(join(initDir, '.rsp', 'focus.d'), { recursive: true })
    await symlink(externalDir, join(initDir, '.rsp', 'focus.d'))

    const result = spawnSync('node', [cliPath(), 'init'], { cwd: initDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(`${result.stdout}${result.stderr}`).toContain('focus root must be a real directory')
    expect(existsSync(join(externalDir, '.gitkeep'))).toBe(false)
    expect(existsSync(join(initDir, '.rsp', '.lock'))).toBe(false)
  })

  it('does not expose removed project-rules CLI surfaces', () => {
    const initHelp = execSync(`node ${cliPath()} init --help`, { encoding: 'utf-8' })
    const removedCommand = spawnSync('node', [cliPath(), 'add', 'rules', 'project-rules'], { encoding: 'utf-8' })

    expect(initHelp).not.toContain('with-project-rules')
    expect(removedCommand.status).toBe(1)
    expect(`${removedCommand.stdout}${removedCommand.stderr}`).toContain('Unknown command rules')
  })

  it('creates the canonical fallback protocol without a rules directory by default', async () => {
    const initDir = join(tmpdir(), 'rsp-init-canonical-fallback-test', randomUUID())
    await mkdir(initDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: initDir })

    expect(existsSync(join(initDir, '.rsp', 'rsp-rules.md'))).toBe(true)
    expect(existsSync(join(initDir, '.rsp', 'rules'))).toBe(false)
  })

  it('removes a recognized legacy generated Archive Index when init repairs an existing project', async () => {
    const initDir = join(tmpdir(), 'rsp-init-recognized-archive-index-test', randomUUID())
    await mkdir(initDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: initDir })
    const indexPath = join(initDir, '.rsp', 'archives', 'INDEX.md')
    await writeFile(indexPath, renderGeneratedIndexMetadata('archives'))

    execSync(`node ${cliPath()} init`, { cwd: initDir })

    expect(existsSync(indexPath)).toBe(false)
  })

  it('preserves a project-owned Archive INDEX byte-for-byte when init repairs an existing project', async () => {
    const initDir = join(tmpdir(), 'rsp-init-project-owned-archive-index-test', randomUUID())
    await mkdir(initDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: initDir })
    const indexPath = join(initDir, '.rsp', 'archives', 'INDEX.md')
    const projectOwned = Buffer.from('# Project-owned archive notes\r\n\r\nKeep this exact spacing.  \r\n')
    await writeFile(indexPath, projectOwned)

    execSync(`node ${cliPath()} init`, { cwd: initDir })

    expect(await readFile(indexPath)).toEqual(projectOwned)
  })

  it('scaffolds changes/ and project setup output', async () => {
    const initDir = join(tmpdir(), 'rsp-init-test', randomUUID())
    await mkdir(initDir, { recursive: true })

    const output = execSync(`node ${cliPath()} init --with-project-setup`, { cwd: initDir, encoding: 'utf-8' })
    expect(existsSync(join(initDir, '.rsp', 'changes', '.gitkeep'))).toBe(true)
    expect(existsSync(join(initDir, '.rsp', 'changes', 'project-setup.md'))).toBe(true)
    expect(output).toContain('Next: fill .rsp/changes/project-setup.md')
  })

  it('reports a healthy setup', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    const output = execSync(`node ${cliPath()} doctor`, { cwd: doctorDir, encoding: 'utf-8' })
    expect(output).toContain('RSP setup looks healthy')
  })

  it('prints machine-readable JSON for doctor', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-json-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    let output = ''
    try {
      output = execSync(`node ${cliPath()} doctor --json`, { cwd: doctorDir, encoding: 'utf-8' })
    }
    catch (error) {
      output = String((error as { stdout?: string }).stdout || '')
    }
    const result = JSON.parse(output)

    expect(result.command).toBe('doctor')
    expect(result.ok).toBe(true)
    expect(result).toHaveProperty('runtime')
    expect(result).toHaveProperty('summary')
    expect(result.summary.issues).toBe(0)
    expect(result.checks.some((check: { label: string }) => check.label === '.rsp exists')).toBe(true)
  })

  it('repairs safe deterministic drift with doctor --fix', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-fix-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await writeFile(join(doctorDir, 'AGENTS.md'), '# Custom Agents\n\nmanual content\n')
    await writeFile(join(doctorDir, '.rsp', 'specs', '00-index.md'), renderGeneratedIndexMetadata('specs'))

    const output = execSync(`node ${cliPath()} doctor --fix --json`, { cwd: doctorDir, encoding: 'utf-8' })
    const result = JSON.parse(output)
    const agents = await readFile(join(doctorDir, 'AGENTS.md'), 'utf-8')

    expect(result.command).toBe('doctor')
    expect(result.ok).toBe(true)
    expect(result.fixed).toContain('AGENTS.md managed block refreshed')
    expect(result.fixed).toContain('generated Specs indexes removed: .rsp/specs/00-index.md')
    expect(agents).toContain('<!-- rsp:begin -->')
    expect(existsSync(join(doctorDir, '.rsp', 'specs', '00-index.md'))).toBe(false)
    expect(result.checks).not.toContainEqual(expect.objectContaining({
      code: 'generated_specs_indexes_require_migration',
    }))
  })

  it('does not report fixed actions for healthy doctor --fix', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-fix-idempotent-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    execSync(`node ${cliPath()} doctor --fix`, { cwd: doctorDir })

    const output = execSync(`node ${cliPath()} doctor --fix --json`, { cwd: doctorDir, encoding: 'utf-8' })
    const result = JSON.parse(output)

    expect(result.ok).toBe(true)
    expect(result.fixed).toEqual([])
  })

  it('prints no safe fixes needed for healthy doctor --fix', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-fix-human-idempotent-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    execSync(`node ${cliPath()} doctor --fix`, { cwd: doctorDir })

    const output = execSync(`node ${cliPath()} doctor --fix`, { cwd: doctorDir, encoding: 'utf-8' })
    expect(output).toContain('No safe fixes needed.')
    expect(output).not.toContain('Fixed:')
  })

  it('flags owner-controlled reserved Specs content and ignores an unrecognized legacy Archive Index', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-generated-index-metadata-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await writeFile(join(doctorDir, RSP_DIR, 'specs', '00-index.md'), '# Specs Index\n')
    await writeFile(join(doctorDir, RSP_DIR, 'archives', 'INDEX.md'), renderGeneratedIndexMetadata('specs'))

    let output = ''
    try {
      output = execSync(`node ${cliPath()} doctor --json`, { cwd: doctorDir, encoding: 'utf-8' })
    }
    catch (error) {
      output = String((error as { stdout?: string }).stdout || '')
    }
    const result = JSON.parse(output)

    expect(result.ok).toBe(false)
    expect(result.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: 'issue', label: 'Specs tree is directly queryable' }),
    ]))
    expect(result.checks.some((check: { label: string }) => check.label.includes('archives/INDEX.md'))).toBe(false)
  })

  it('prints the resulting AGENTS.md content in print mode', async () => {
    const initDir = join(tmpdir(), 'rsp-init-print-test', randomUUID())
    await mkdir(initDir, { recursive: true })

    const output = execSync(`node ${cliPath()} init --agents-mode print`, { cwd: initDir, encoding: 'utf-8' })
    const agents = await readFile(join(initDir, 'AGENTS.md'), 'utf-8')

    expect(agents).toContain('<!-- rsp:begin -->')
    expect(agents).toContain('RSP tracks current work, stable specs, and archives under `.rsp/`.')
    expect(agents).toContain('1. Nearest `AGENTS.md` for project or module instructions.')
    expect(agents).toContain('2. Root `CONTEXT-MAP.md` if present, then the relevant nearest `CONTEXT.md`.')
    expect(agents).toContain('3. Use the project `rsp` Skill at `.agents/skills/rsp/SKILL.md`; hosts may load it through Skill discovery or read it directly.')
    expect(agents).toContain('Only when it is absent or cannot be used, read `.rsp/rsp-rules.md` as the fallback protocol.')
    expect(agents).toContain('4. `.rsp/focus.d/`; marker paths select work, while optional bounded Markdown content is recovery guidance only. For grouped work read the sibling Group Brief, then the explicitly selected focused Change.')
    expect(agents).toContain('5. Only the relevant Specs and Decision Records under the configured authoritative path.')
    expect(agents).toContain('If `.rsp/focus.d/` is empty and the user has not provided a concrete task, ask what to work on or suggest `npx -y @oevery/rsp create <name>` for tracked work.')
    expect(agents).toContain('Do not treat `.rsp/specs/` or `.rsp/changes/` as replacements for nearest `AGENTS.md` or `CONTEXT.md`.')
    expect(output).toContain('## RSP Entry')
  })

  it('rejects an unmigrated fallback path and reports update guidance', async () => {
    const legacyDir = join(tmpdir(), 'rsp-legacy-fallback-test', randomUUID())
    await mkdir(join(legacyDir, '.rsp', 'rules'), { recursive: true })
    await mkdir(join(legacyDir, '.rsp', 'specs'), { recursive: true })
    await mkdir(join(legacyDir, '.rsp', 'changes'), { recursive: true })
    await mkdir(join(legacyDir, '.rsp', 'focus.d'), { recursive: true })
    await mkdir(join(legacyDir, '.rsp', 'archives'), { recursive: true })
    await writeFile(join(legacyDir, '.rsp', 'rules', 'rsp-rules.md'), '# legacy fallback\n')
    await writeFile(join(legacyDir, '.rsp', 'specs', 'design.md'), '# design\n')
    await writeFile(join(legacyDir, '.rsp', 'specs', 'INDEX.md'), renderGeneratedIndexMetadata('specs'))
    await writeFile(join(legacyDir, '.rsp', 'archives', 'INDEX.md'), renderGeneratedIndexMetadata('archives'))
    await writeFile(join(legacyDir, 'AGENTS.md'), '<!-- rsp:begin -->\n## RSP Entry\n<!-- rsp:end -->\n')

    const createResult = spawnSync('node', [cliPath(), 'create', 'legacy-change', '--kind', 'docs', 'Migration required'], { cwd: legacyDir, encoding: 'utf-8' })
    const doctorResult = spawnSync('node', [cliPath(), 'doctor'], { cwd: legacyDir, encoding: 'utf-8' })

    expect(createResult.status).toBe(1)
    expect(createResult.stderr).toContain('RSP project requires an update')
    expect(createResult.stderr).toContain('Run: rsp update')
    expect(existsSync(join(legacyDir, '.rsp', 'changes', 'legacy-change.md'))).toBe(false)
    expect(doctorResult.status).toBe(1)
    expect(doctorResult.stdout).toContain('obsolete fallback protocol path')
    expect(doctorResult.stdout).toContain('Run: rsp update')
  })

  it('reports missing AGENTS.md as an issue', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-missing-agents-test', randomUUID())
    await mkdir(join(doctorDir, RSP_DIR, 'specs'), { recursive: true })
    await mkdir(join(doctorDir, RSP_DIR, 'archives'), { recursive: true })
    await writeFile(join(doctorDir, RSP_DIR, 'rsp-rules.md'), '# rules\n')
    await writeFile(join(doctorDir, RSP_DIR, 'specs', 'design.md'), '# design\n')
    await writeFile(join(doctorDir, RSP_DIR, 'specs', 'INDEX.md'), renderGeneratedIndexMetadata('specs'))
    await writeFile(join(doctorDir, RSP_DIR, 'archives', 'INDEX.md'), renderGeneratedIndexMetadata('archives'))

    let output = ''
    try {
      output = execSync(`node ${cliPath()} doctor`, { cwd: doctorDir, encoding: 'utf-8' })
    }
    catch (error) {
      output = String((error as { stdout?: string }).stdout || '')
    }

    expect(output).toContain('AGENTS.md missing')
  })

  it('reports unfocused open changes as informational output', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-unfocused-change-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await writeFile(join(doctorDir, '.rsp', 'changes', 'unfocused-one.md'), renderChange('unfocused-one').replace('kind: feature', 'kind: docs'))

    const output = execSync(`node ${cliPath()} doctor`, { cwd: doctorDir, encoding: 'utf-8' })
    expect(output).toContain('Info: unfocused open changes: unfocused-one')
  })

  it('reports unsupported open-work structure as a doctor issue', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-work-ref-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    const nestedDir = join(doctorDir, '.rsp', 'changes', 'release', 'backend')
    await mkdir(nestedDir, { recursive: true })
    await writeFile(join(nestedDir, 'api.md'), renderChange('release/backend/api'))

    const result = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      label: 'open work uses supported WorkRef shapes',
    }))
  })

  it('reports a symlinked archive group as a doctor issue', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-archive-group-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-doctor-archive-group-external-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await symlink(externalDir, join(doctorDir, '.rsp', 'archives', 'release'))

    const result = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.ok).toBe(false)
    expect(output.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      label: 'archives use supported managed paths',
      message: expect.stringContaining('release'),
    }))
  })

  it('does not migrate archive state through a symlinked root', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-archive-root-symlink-test', randomUUID())
    const externalDir = join(tmpdir(), 'rsp-update-archive-root-external-test', randomUUID())
    await mkdir(updateDir, { recursive: true })
    await mkdir(externalDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await rm(join(updateDir, '.rsp', 'archives'), { recursive: true })
    await symlink(externalDir, join(updateDir, '.rsp', 'archives'))

    const result = spawnSync('node', [cliPath(), 'update'], { cwd: updateDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    expect(`${result.stdout}${result.stderr}`).toContain('archive root must be a real directory')
    expect(existsSync(join(externalDir, 'INDEX.md'))).toBe(false)
    expect(existsSync(join(updateDir, '.rsp', '.lock'))).toBe(false)
  })

  it('reports a non-directory changes root as a doctor issue', async () => {
    const doctorDir = await createRspFixture('rsp-doctor-invalid-changes-root-test', ['specs'])
    await writeFile(join(doctorDir, '.rsp', 'changes'), 'not a directory')

    const result = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.ok).toBe(false)
    expect(output.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      label: 'open work uses supported WorkRef shapes',
      message: expect.stringContaining('must be a real directory'),
    }))
  })

  it('reports an empty recursive work directory as a doctor issue', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-empty-work-depth-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await mkdir(join(doctorDir, '.rsp', 'changes', 'release', 'backend'), { recursive: true })

    const result = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      label: 'open work uses supported WorkRef shapes',
      message: expect.stringContaining('release/backend'),
    }))
  })

  it('flags legacy required_sections config as an issue', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-required-sections-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await writeFile(join(doctorDir, '.rsp', 'config.yaml'), 'required_sections:\n  - Proposal\n  - Spec\n')

    let output = ''
    try {
      output = execSync(`node ${cliPath()} doctor`, { cwd: doctorDir, encoding: 'utf-8' })
    }
    catch (error) {
      output = String((error as { stdout?: string }).stdout || '')
    }

    expect(output).toContain('config.yaml field "required_sections" is no longer supported')

    const jsonResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const jsonOutput = JSON.parse(jsonResult.stdout)
    expect(jsonOutput.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      code: 'invalid_config',
      message: 'config.yaml field "required_sections" is no longer supported',
    }))
  })

  it('fails a normal config consumer with structured invalid_config output', async () => {
    const checkDir = join(tmpdir(), 'rsp-check-invalid-config-test', randomUUID())
    await mkdir(checkDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: checkDir })
    await writeFile(join(checkDir, '.rsp', 'config.yaml'), 'kindz: [fix]\n')

    const result = spawnSync('node', [cliPath(), 'check', '--json'], { cwd: checkDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).not.toBe(0)
    expect(output.ok).toBe(false)
    expect(output.diagnostics).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'invalid_config',
      message: 'config.yaml field "kindz" is not supported',
    }))
  })

  it('fails a non-structured config consumer with the shared validation issue', async () => {
    const addSpecDir = join(tmpdir(), 'rsp-add-spec-invalid-config-test', randomUUID())
    await mkdir(addSpecDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: addSpecDir })
    await writeFile(join(addSpecDir, '.rsp', 'config.yaml'), 'kindz: [fix]\n')

    const result = spawnSync('node', [cliPath(), 'add', 'spec', 'architecture'], { cwd: addSpecDir, encoding: 'utf-8' })

    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('config.yaml field "kindz" is not supported')
    expect(existsSync(join(addSpecDir, '.rsp', 'specs', 'architecture.md'))).toBe(false)
  })

  it('reports invalid config YAML as structured doctor output', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-invalid-yaml-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await writeFile(join(doctorDir, '.rsp', 'config.yaml'), 'decisions: [\n')

    const result = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const checkResult = spawnSync('node', [cliPath(), 'check', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)
    const checkOutput = JSON.parse(checkResult.stdout)

    expect(result.status).not.toBe(0)
    expect(output.ok).toBe(false)
    expect(output.checks).toContainEqual(expect.objectContaining({
      status: 'issue',
      code: 'invalid_config',
      message: checkOutput.diagnostics[0].message,
    }))
  })

  it('does not partially scaffold when an existing config is invalid', async () => {
    const initDir = join(tmpdir(), 'rsp-init-invalid-existing-config-test', randomUUID())
    await mkdir(join(initDir, '.rsp'), { recursive: true })
    await writeFile(join(initDir, '.rsp', 'config.yaml'), 'decisions:\n  path: .rsp/changes\n')

    const result = spawnSync('node', [cliPath(), 'init'], { cwd: initDir, encoding: 'utf-8' })

    expect(result.status).not.toBe(0)
    expect(existsSync(join(initDir, '.rsp', 'rsp-rules.md'))).toBe(false)
    expect(existsSync(join(initDir, '.rsp', 'specs'))).toBe(false)
  })

  it('keeps doctor --fix JSON structured when invalid config prevents repair', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-fix-invalid-config-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await writeFile(join(doctorDir, '.rsp', 'config.yaml'), 'decisions: [\n')

    const result = spawnSync('node', [cliPath(), 'doctor', '--fix', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).not.toBe(0)
    expect(output.ok).toBe(false)
    expect(output.fixed).toEqual([])
    expect(output.checks.some((check: { message?: string }) => check.message?.includes('safe deterministic repair could not run'))).toBe(true)

    const human = spawnSync('node', [cliPath(), 'doctor', '--fix'], { cwd: doctorDir, encoding: 'utf-8' })
    expect(human.stdout).toContain('safe deterministic repair could not run')
    expect(human.stdout).not.toContain('No safe fixes needed.')
  })

  it('does not partially repair managed files when the Decision Record target is not a directory', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-fix-decision-file-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await mkdir(join(doctorDir, 'docs'), { recursive: true })
    await writeFile(join(doctorDir, 'docs', 'adr'), 'not a directory\n')
    await writeFile(join(doctorDir, '.rsp', 'config.yaml'), 'decisions:\n  path: docs/adr\n')
    await writeFile(join(doctorDir, '.rsp', 'rsp-rules.md'), '# stale rules\n')

    const result = spawnSync('node', [cliPath(), 'doctor', '--fix', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).not.toBe(0)
    expect(output.fixed).toEqual([])
    expect(await readFile(join(doctorDir, '.rsp', 'rsp-rules.md'), 'utf-8')).toBe('# stale rules\n')
    expect(output.checks.some((check: { message?: string }) => check.message?.includes('must be a directory'))).toBe(true)
  })

  it('rejects additional Decision Record configuration fields', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-decision-fields-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await writeFile(join(doctorDir, '.rsp', 'config.yaml'), 'decisions:\n  path: docs/adr\n  fallback: .rsp/specs/decisions\n')

    const result = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).not.toBe(0)
    expect(output.checks.some((check: { message?: string }) => check.message?.includes('supports only "path"'))).toBe(true)
  })

  it('reports unreadable AGENTS.md as an issue instead of crashing', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-unreadable-agents-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await chmod(join(doctorDir, 'AGENTS.md'), 0o000)

    let output = ''
    try {
      output = execSync(`node ${cliPath()} doctor --json`, { cwd: doctorDir, encoding: 'utf-8' })
    }
    catch (error) {
      output = String((error as { stdout?: string }).stdout || '')
    }
    finally {
      await chmod(join(doctorDir, 'AGENTS.md'), 0o644)
    }

    const result = JSON.parse(output)
    expect(result.command).toBe('doctor')
    expect(result.ok).toBe(false)
    expect(result.summary.issues).toBeGreaterThan(0)
    expect(result.checks.some((check: { message?: string }) => check.message === 'AGENTS.md could not be read')).toBe(true)
  })

  it('prints machine-readable JSON for check and exits non-zero on errors', () => {
    const checkDir = join(tmpdir(), 'rsp-check-json-test', randomUUID())
    return (async () => {
      await mkdir(join(checkDir, '.rsp', 'changes'), { recursive: true })
      await writeFile(join(checkDir, '.rsp', 'changes', 'broken.md'), `---\nkind: fix\n---\n\n# Change: broken\n\n## Proposal\n- none\n`)

      let output = ''
      let failed = false
      try {
        output = execSync(`node ${cliPath()} check --json`, { cwd: checkDir, encoding: 'utf-8' })
      }
      catch (error) {
        failed = true
        output = String((error as { stdout?: string }).stdout || '')
      }

      const result = JSON.parse(output)
      expect(failed).toBe(true)
      expect(result.command).toBe('check')
      expect(result.ok).toBe(false)
      expect(result).toHaveProperty('runtime')
      expect(result).toHaveProperty('summary')
      expect(result.summary.errors).toBeGreaterThan(0)
      expect(result.diagnostics.some((diag: { code: string }) => diag.code === 'missing_section')).toBe(true)
    })()
  })

  it('reports unreadable focus markers as structured check errors', () => {
    const checkDir = join(tmpdir(), 'rsp-check-unreadable-focus-test', randomUUID())
    return (async () => {
      await mkdir(join(checkDir, '.rsp', 'focus.d'), { recursive: true })
      await mkdir(join(checkDir, '.rsp', 'changes'), { recursive: true })
      await writeFile(join(checkDir, '.rsp', 'focus.d', 'broken-focus'), '')
      await writeFile(join(checkDir, '.rsp', 'changes', 'broken-focus.md'), renderChange('broken-focus'))
      await chmod(join(checkDir, '.rsp', 'focus.d', 'broken-focus'), 0o000)

      let output = ''
      try {
        output = execSync(`node ${cliPath()} check --json`, { cwd: checkDir, encoding: 'utf-8' })
      }
      catch (error) {
        output = String((error as { stdout?: string }).stdout || '')
      }
      finally {
        await chmod(join(checkDir, '.rsp', 'focus.d', 'broken-focus'), 0o644)
      }

      const result = JSON.parse(output)
      expect(result.command).toBe('check')
      expect(result.ok).toBe(false)
      expect(result.summary.errors).toBeGreaterThan(0)
      expect(result.diagnostics.some((diag: { code: string }) => diag.code === 'focus_marker_read_failed')).toBe(true)
      expect(result.runtime.some((diag: { code: string }) => diag.code === 'focus_marker_read_failed')).toBe(true)
    })()
  })

  it('accepts bounded focus capsules and rejects oversized capsule content', async () => {
    const checkDir = await createRspFixture('rsp-check-focus-capsule-test', ['specs', 'changes', 'focus.d'])
    await writeFile(join(checkDir, '.rsp', 'changes', 'capsule.md'), renderChange('capsule'))
    const marker = join(checkDir, '.rsp', 'focus.d', 'capsule')
    await writeFile(marker, '<!-- rsp-focus:v1 -->\n\nCurrent: accepted lane\nEvidence: verified\nNext: continue\n')

    const accepted = JSON.parse(execSync(`node ${cliPath()} check --json`, { cwd: checkDir, encoding: 'utf-8' }))
    expect(accepted.diagnostics).not.toContainEqual(expect.objectContaining({ code: 'focus_marker_not_empty' }))
    expect(accepted.diagnostics).not.toContainEqual(expect.objectContaining({ code: 'focus_capsule_too_large' }))

    await writeFile(marker, 'x'.repeat(4097))
    const rejected = spawnSync('node', [cliPath(), 'check', '--json'], { cwd: checkDir, encoding: 'utf-8' })
    expect(rejected.status).toBe(1)
    expect(JSON.parse(rejected.stdout).diagnostics).toContainEqual(expect.objectContaining({
      code: 'focus_capsule_too_large',
      change: 'capsule',
    }))
  })

  it('keeps bounded unversioned Markdown readable with one stable warning', async () => {
    const checkDir = await createRspFixture('rsp-check-unversioned-focus-capsule-test', ['specs', 'changes', 'focus.d'])
    await writeFile(join(checkDir, '.rsp', 'changes', 'capsule.md'), renderChange('capsule'))
    await writeFile(join(checkDir, '.rsp', 'focus.d', 'capsule'), '# Current\n\nInvestigate rsp-focus behavior and continue the accepted lane.\n')

    const result = JSON.parse(execSync(`node ${cliPath()} check --json`, { cwd: checkDir, encoding: 'utf-8' }))
    expect(result.ok).toBe(true)
    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      severity: 'warning',
      code: 'focus_capsule_legacy',
      change: 'capsule',
      message: 'legacy focus capsule has no structured recovery projection',
    }))
  })

  it('rejects malformed v1 focus capsules during structural inspection', async () => {
    const checkDir = await createRspFixture('rsp-check-invalid-v1-focus-capsule-test', ['specs', 'changes', 'focus.d'])
    await writeFile(join(checkDir, '.rsp', 'changes', 'capsule.md'), renderChange('capsule'))
    await writeFile(join(checkDir, '.rsp', 'focus.d', 'capsule'), '<!-- rsp-focus:v1 -->\n\nCurrent: incomplete\nNext: continue\n')

    const rejected = spawnSync('node', [cliPath(), 'check', '--json'], { cwd: checkDir, encoding: 'utf-8' })
    expect(rejected.status).toBe(1)
    expect(JSON.parse(rejected.stdout).diagnostics).toContainEqual(expect.objectContaining({
      code: 'focus_capsule_invalid_v1',
      change: 'capsule',
    }))
  })

  it('rejects unknown non-empty lines and fields in v1 focus capsules', async () => {
    const checkDir = await createRspFixture('rsp-check-unknown-v1-focus-capsule-test', ['specs', 'changes', 'focus.d'])
    await writeFile(join(checkDir, '.rsp', 'changes', 'capsule.md'), renderChange('capsule'))
    const marker = join(checkDir, '.rsp', 'focus.d', 'capsule')

    for (const content of [
      '<!-- rsp-focus:v1 -->\n\nCurrent: lane\nEvidence: verified\nNext: continue\nUnexpected prose\n',
      '<!-- rsp-focus:v1 -->\n\nCurrent: lane\nEvidence: verified\nNext: continue\nOwner: manager\n',
    ]) {
      await writeFile(marker, content)
      const rejected = spawnSync('node', [cliPath(), 'check', '--json'], { cwd: checkDir, encoding: 'utf-8' })
      expect(rejected.status).toBe(1)
      expect(JSON.parse(rejected.stdout).diagnostics).toContainEqual(expect.objectContaining({
        code: 'focus_capsule_invalid_v1',
        change: 'capsule',
      }))
    }
  })

  it('rejects unsupported or damaged focus capsule version declarations', async () => {
    const checkDir = await createRspFixture('rsp-check-invalid-focus-version-test', ['specs', 'changes', 'focus.d'])
    await writeFile(join(checkDir, '.rsp', 'changes', 'capsule.md'), renderChange('capsule'))
    const marker = join(checkDir, '.rsp', 'focus.d', 'capsule')

    for (const content of [
      '<!-- rsp-focus:v2 -->\n\nCurrent: lane\nEvidence: verified\nNext: continue\n',
      '<!-- rsp-focus:v1\n\nCurrent: lane\nEvidence: verified\nNext: continue\n',
    ]) {
      await writeFile(marker, content)
      const rejected = spawnSync('node', [cliPath(), 'check', '--json'], { cwd: checkDir, encoding: 'utf-8' })
      expect(rejected.status).toBe(1)
      expect(JSON.parse(rejected.stdout).diagnostics).toContainEqual(expect.objectContaining({
        code: 'focus_capsule_invalid_v1',
        change: 'capsule',
      }))
    }
  })

  it('rejects malformed UTF-8 already present in a focus capsule', async () => {
    const checkDir = await createRspFixture('rsp-check-invalid-focus-capsule-test', ['specs', 'changes', 'focus.d'])
    await writeFile(join(checkDir, '.rsp', 'changes', 'capsule.md'), renderChange('capsule'))
    await writeFile(join(checkDir, '.rsp', 'focus.d', 'capsule'), Buffer.from([0xC3, 0x28]))

    const rejected = spawnSync('node', [cliPath(), 'check', '--json'], { cwd: checkDir, encoding: 'utf-8' })
    expect(rejected.status).toBe(1)
    expect(JSON.parse(rejected.stdout).diagnostics).toContainEqual(expect.objectContaining({
      code: 'focus_capsule_invalid_utf8',
      change: 'capsule',
    }))
  })

  it('repairs a missing AGENTS managed block during update', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-agents-repair-test', randomUUID())
    await mkdir(updateDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await writeFile(join(updateDir, 'AGENTS.md'), '# Custom Agents\n\nmanual content\n')

    const output = execSync(`node ${cliPath()} update`, { cwd: updateDir, encoding: 'utf-8' })
    const agents = await readFile(join(updateDir, 'AGENTS.md'), 'utf-8')
    expect(agents).toContain('<!-- rsp:begin -->')
    expect(output).toContain('rsp skills install --dry-run')
    expect(output).toContain('rsp skills install --force')
  })

  it('recreates AGENTS.md during update without writing [object Promise]', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-recreate-agents-test', randomUUID())
    await mkdir(updateDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await rm(join(updateDir, 'AGENTS.md'))

    execSync(`node ${cliPath()} update`, { cwd: updateDir })
    const agents = await readFile(join(updateDir, 'AGENTS.md'), 'utf-8')
    expect(agents).not.toContain('[object Promise]')
    expect(agents).toContain('<!-- rsp:begin -->')
  })

  it('restores the canonical fallback protocol during update', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-missing-rules-test', randomUUID())
    await mkdir(updateDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await mkdir(join(updateDir, '.rsp', 'rules'))
    await rm(join(updateDir, '.rsp', 'rsp-rules.md'))

    execSync(`node ${cliPath()} update`, { cwd: updateDir })
    const rules = await readFile(join(updateDir, '.rsp', 'rsp-rules.md'), 'utf-8')
    expect(rules).toContain('minimal fallback protocol')
    expect(existsSync(join(updateDir, '.rsp', 'rules'))).toBe(false)
  })

  it('removes only a recognized legacy generated Archive Index during update', async () => {
    const recognizedDir = join(tmpdir(), 'rsp-update-recognized-archive-index-test', randomUUID())
    const customDir = join(tmpdir(), 'rsp-update-custom-archive-index-test', randomUUID())
    await mkdir(recognizedDir, { recursive: true })
    await mkdir(customDir, { recursive: true })
    execSync(`node ${cliPath()} init`, { cwd: recognizedDir })
    execSync(`node ${cliPath()} init`, { cwd: customDir })
    await writeFile(join(recognizedDir, '.rsp', 'archives', 'INDEX.md'), renderGeneratedIndexMetadata('archives'))
    await writeFile(join(customDir, '.rsp', 'archives', 'INDEX.md'), '# Project-owned archive notes\n')

    const recognized = execSync(`node ${cliPath()} update`, { cwd: recognizedDir, encoding: 'utf-8' })
    execSync(`node ${cliPath()} update`, { cwd: customDir })

    expect(recognized).toContain('legacy Archive Index removed')
    expect(existsSync(join(recognizedDir, '.rsp', 'archives', 'INDEX.md'))).toBe(false)
    expect(await readFile(join(customDir, '.rsp', 'archives', 'INDEX.md'), 'utf-8')).toBe('# Project-owned archive notes\n')
  })

  it('migrates and removes the old generated fallback while preserving custom rules', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-legacy-fallback-test', randomUUID())
    const obsoleteGeneratedContent = '# obsolete generated fallback\n'
    await mkdir(join(updateDir, '.rsp', 'rules'), { recursive: true })
    await mkdir(join(updateDir, '.rsp', 'specs'), { recursive: true })
    await mkdir(join(updateDir, '.rsp', 'archives'), { recursive: true })
    await writeFile(join(updateDir, '.rsp', 'rules', 'rsp-rules.md'), obsoleteGeneratedContent)
    await writeFile(join(updateDir, '.rsp', 'rules', 'custom.md'), '# custom legacy rule\n')
    await writeFile(join(updateDir, '.rsp', 'specs', 'design.md'), '# design\n')
    await writeFile(join(updateDir, '.rsp', 'specs', 'INDEX.md'), renderGeneratedIndexMetadata('specs'))
    await writeFile(join(updateDir, '.rsp', 'archives', 'INDEX.md'), renderGeneratedIndexMetadata('archives'))

    const updateOutput = execSync(`node ${cliPath()} update`, { cwd: updateDir, encoding: 'utf-8' })

    expect(existsSync(join(updateDir, '.rsp', 'rules', 'rsp-rules.md'))).toBe(false)
    expect(await readFile(join(updateDir, '.rsp', 'rules', 'custom.md'), 'utf-8')).toBe('# custom legacy rule\n')
    expect(await readFile(join(updateDir, '.rsp', 'rsp-rules.md'), 'utf-8')).toContain('minimal fallback protocol')
    expect(updateOutput).toContain('custom.md')
    expect(updateOutput).toContain('no longer read by RSP')
    expect(updateOutput).toContain('Run: rsp doctor')

    const doctorResult = spawnSync('node', [cliPath(), 'doctor'], { cwd: updateDir, encoding: 'utf-8' })
    expect(doctorResult.status).toBe(1)
    expect(doctorResult.stdout).toContain('unsupported .rsp/rules/ entries')
  })

  it('fails update and doctor when obsolete rules cannot be inspected', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-unreadable-rules-test', randomUUID())
    await mkdir(updateDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await mkdir(join(updateDir, '.rsp', 'rules'))
    await writeFile(join(updateDir, '.rsp', 'rules', 'custom.md'), '# custom rule\n')
    await chmod(join(updateDir, '.rsp', 'rules'), 0o000)

    try {
      const updateResult = spawnSync('node', [cliPath(), 'update'], { cwd: updateDir, encoding: 'utf-8' })
      const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: updateDir, encoding: 'utf-8' })
      const doctor = JSON.parse(doctorResult.stdout)

      expect(updateResult.status).toBe(1)
      expect(`${updateResult.stdout}${updateResult.stderr}`).toContain('migration inspection incomplete')
      expect(doctorResult.status).toBe(1)
      expect(doctor.ok).toBe(false)
      expect(doctor.checks.some((check: { label: string }) => check.label === 'unable to inspect .rsp/rules/')).toBe(true)
      expect(doctor.runtime.some((diagnostic: { code: string }) => diagnostic.code === 'walk_failed')).toBe(true)
    }
    finally {
      await chmod(join(updateDir, '.rsp', 'rules'), 0o755)
    }
  })

  it('reports every residual rules entry regardless of file extension or visibility', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-non-markdown-rules-test', randomUUID())
    await mkdir(updateDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await mkdir(join(updateDir, '.rsp', 'rules'))
    await writeFile(join(updateDir, '.rsp', 'rules', 'custom.txt'), 'custom rule\n')
    await writeFile(join(updateDir, '.rsp', 'rules', '.hidden-rule'), 'hidden rule\n')

    const updateOutput = execSync(`node ${cliPath()} update`, { cwd: updateDir, encoding: 'utf-8' })
    const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--json'], { cwd: updateDir, encoding: 'utf-8' })
    const doctor = JSON.parse(doctorResult.stdout)

    expect(updateOutput).toContain('custom.txt')
    expect(updateOutput).toContain('.hidden-rule')
    expect(updateOutput).toContain('manual migration remains')
    expect(doctorResult.status).toBe(1)
    expect(doctor.checks.some((check: { label: string }) => check.label === 'unsupported .rsp/rules/ entries')).toBe(true)
  })

  it('removes a rules directory tree that contains only empty directories', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-empty-rules-tree-test', randomUUID())
    await mkdir(updateDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    await mkdir(join(updateDir, '.rsp', 'rules', 'nested', 'empty'), { recursive: true })

    const updateOutput = execSync(`node ${cliPath()} update`, { cwd: updateDir, encoding: 'utf-8' })

    expect(existsSync(join(updateDir, '.rsp', 'rules'))).toBe(false)
    expect(updateOutput).toContain('empty rules directory tree removed')
  })

  it('migrates the generated fallback through doctor --fix while retaining custom rules as an issue', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-fix-rules-migration-test', randomUUID())
    await mkdir(join(doctorDir, '.rsp', 'rules'), { recursive: true })
    await mkdir(join(doctorDir, '.rsp', 'specs'), { recursive: true })
    await writeFile(join(doctorDir, '.rsp', 'rules', 'rsp-rules.md'), '# obsolete generated fallback\n')
    await writeFile(join(doctorDir, '.rsp', 'rules', 'custom.md'), '# custom rule\n')
    await writeFile(join(doctorDir, '.rsp', 'specs', 'design.md'), '# design\n')

    const doctorResult = spawnSync('node', [cliPath(), 'doctor', '--fix', '--json'], { cwd: doctorDir, encoding: 'utf-8' })
    const doctor = JSON.parse(doctorResult.stdout)

    expect(doctorResult.status).toBe(1)
    expect(doctor.fixed).toContain('rsp-rules.md updated')
    expect(doctor.fixed).toContain('obsolete rules/rsp-rules.md removed')
    expect(doctor.ok).toBe(false)
    expect(existsSync(join(doctorDir, '.rsp', 'rsp-rules.md'))).toBe(true)
    expect(existsSync(join(doctorDir, '.rsp', 'rules', 'rsp-rules.md'))).toBe(false)
    expect(existsSync(join(doctorDir, '.rsp', 'rules', 'custom.md'))).toBe(true)
    expect(doctor.checks.some((check: { label: string }) => check.label === 'unsupported .rsp/rules/ entries')).toBe(true)
  })

  it('completes an old generated fallback migration through doctor --fix', async () => {
    const doctorDir = join(tmpdir(), 'rsp-doctor-fix-generated-fallback-test', randomUUID())
    await mkdir(doctorDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: doctorDir })
    await mkdir(join(doctorDir, '.rsp', 'rules'))
    await writeFile(join(doctorDir, '.rsp', 'rules', 'rsp-rules.md'), '# obsolete generated fallback\n')
    await rm(join(doctorDir, '.rsp', 'rsp-rules.md'))

    const output = execSync(`node ${cliPath()} doctor --fix --json`, { cwd: doctorDir, encoding: 'utf-8' })
    const doctor = JSON.parse(output)

    expect(doctor.ok).toBe(true)
    expect(doctor.fixed).toContain('rsp-rules.md updated')
    expect(doctor.fixed).toContain('obsolete rules/rsp-rules.md removed')
    expect(doctor.fixed).toContain('empty rules directory removed')
    expect(existsSync(join(doctorDir, '.rsp', 'rsp-rules.md'))).toBe(true)
    expect(existsSync(join(doctorDir, '.rsp', 'rules'))).toBe(false)
  })

  it('prints the skill refresh hint even when update is already up to date', async () => {
    const updateDir = join(tmpdir(), 'rsp-update-skill-hint-test', randomUUID())
    await mkdir(updateDir, { recursive: true })

    execSync(`node ${cliPath()} init`, { cwd: updateDir })
    const output = execSync(`node ${cliPath()} update`, { cwd: updateDir, encoding: 'utf-8' })

    expect(output).toContain('Already up to date.')
    expect(output).toContain('rsp skills install --dry-run')
    expect(output).toContain('rsp skills install --force')
  })

  it('reports invalid archive naming conventions using change wording', async () => {
    const brokenDir = join(tmpdir(), 'rsp-doctor-archive-name-test', randomUUID())
    await mkdir(join(brokenDir, RSP_DIR, 'specs'), { recursive: true })
    await mkdir(join(brokenDir, RSP_DIR, 'archives'), { recursive: true })
    await writeFile(join(brokenDir, RSP_DIR, 'rsp-rules.md'), '# rules\n')
    await writeFile(join(brokenDir, RSP_DIR, 'specs', 'design.md'), '# design\n')
    await writeFile(join(brokenDir, RSP_DIR, 'specs', 'INDEX.md'), renderGeneratedIndexMetadata('specs'))
    await writeFile(join(brokenDir, RSP_DIR, 'archives', 'INDEX.md'), renderGeneratedIndexMetadata('archives'))
    await writeFile(join(brokenDir, RSP_DIR, 'archives', 'bad-name.md'), '# archived\n')
    await writeFile(join(brokenDir, 'AGENTS.md'), '<!-- rsp:begin -->\n## RSP Entry\n<!-- rsp:end -->\n')

    let output = ''
    try {
      output = execSync(`node ${cliPath()} doctor`, { cwd: brokenDir, encoding: 'utf-8' })
    }
    catch (error) {
      output = String((error as { stdout?: string }).stdout || '')
    }

    expect(output).toContain('archived change files with invalid names: bad-name.md')
  })
})

describe('show command', () => {
  it('shows change context for a named change', async () => {
    const showDir = await createRspFixture('rsp-show-test')
    await writeFile(join(showDir, '.rsp', 'changes', 'display-me.md'), renderChange('display-me'))

    const output = execSync(`node ${cliPath()} show display-me`, { cwd: showDir, encoding: 'utf-8' })
    expect(output).toContain('display-me')
    expect(output).toContain('Kind:')
    expect(output).toContain('Progress:')
    expect(output).toContain('Blockers:')
    expect(output).toContain('Scenarios:')
    expect(output).toContain('Readiness:')
    expect(output).toContain('Context paths')
  })

  it('shows focused change with --focused flag', async () => {
    const showDir = await createRspFixture('rsp-show-focused-test', ['specs', 'changes', 'focus.d'])
    await writeFile(join(showDir, '.rsp', 'changes', 'focused-show.md'), renderChange('focused-show'))
    await writeFile(join(showDir, '.rsp', 'focus.d', 'focused-show'), '')

    const output = execSync(`node ${cliPath()} show --focused`, { cwd: showDir, encoding: 'utf-8' })
    expect(output).toContain('focused-show')
    expect(output).toContain('Focused:')
  })

  it('does not print an archive action before Core durable review', async () => {
    const showDir = await createRspFixture('rsp-show-ready-human-test')
    await writeFile(join(showDir, '.rsp', 'changes', 'complete.md'), renderChange('complete').replaceAll('- [ ]', '- [x]'))

    const output = execSync(`node ${cliPath()} show complete`, { cwd: showDir, encoding: 'utf-8' })

    expect(output).not.toContain('Run: rsp archive complete')
  })

  it('emits machine-readable JSON with readiness and context paths', async () => {
    const showDir = await createRspFixture('rsp-show-json-test')
    await writeFile(join(showDir, '.rsp', 'changes', 'json-test.md'), renderChange('json-test'))

    const output = execSync(`node ${cliPath()} show json-test --json`, { cwd: showDir, encoding: 'utf-8' })
    const result = JSON.parse(output)
    expect(result.command).toBe('show')
    expect(result.ok).toBe(true)
    expect(result.change.name).toBe('json-test')
    expect(result.change.kind).toBe('feature')
    expect(result.change.progress).toHaveProperty('done')
    expect(result.change.progress).toHaveProperty('total')
    expect(result.change.blockers).toBe(false)
    expect(result.change.scenarioCount).toBe(1)
    expect(result.change.readiness.incompleteTasks).toBe(1)
    expect(result.change.readiness.incompleteVerify).toBe(4)
    expect(result.change.readiness).toHaveProperty('activeBlockers')
    expect(result.change.readiness).toHaveProperty('missingScenarios')
    expect(result.change.readiness.deterministic).toBe('warnings')
    expect(result.change.readiness.semantic).toBe('needs-review')
    expect(result.change.readiness.archiveReady).toBe('no')
    expect(result.change.readiness.completionGate).toBe('blocked')
    expect(Array.isArray(result.contextPaths)).toBe(true)
    expect(result.contextPaths).toContain('.rsp/specs/design.md')
    expect(result.contextPaths).not.toContain('.rsp/specs/00-index.md')
    expect(result.contextPaths).not.toContain('.rsp/rules/rsp-rules.md')
    expect(result.durableReview.required).toBe(true)
    expect(result.durableReview.factCandidateTargets).toEqual(['.rsp/specs/design.md'])
    expect(result.contextPaths).toContain(result.durableReview.decisionRecordsPath)
    expect(result).not.toHaveProperty('nextActions')
  })

  it('projects a valid focused v1 capsule as bounded non-authoritative recovery JSON', async () => {
    const showDir = await createRspFixture('rsp-show-focus-recovery-test', ['specs', 'changes', 'focus.d'])
    await writeFile(join(showDir, '.rsp', 'changes', 'focused-show.md'), renderChange('focused-show'))
    await writeFile(join(showDir, '.rsp', 'focus.d', 'focused-show'), '<!-- rsp-focus:v1 -->\n\nCurrent: verify login\nEvidence: targeted test passed\nNext: inspect diff\nResume check: inspect before repeat\n')

    const result = JSON.parse(execSync(`node ${cliPath()} show --focused --json`, { cwd: showDir, encoding: 'utf-8' }))

    expect(result.recovery).toEqual({
      version: 'v1',
      current: 'verify login',
      evidence: 'targeted test passed',
      next: 'inspect diff',
      resumeCheck: 'inspect before repeat',
      authoritative: false,
    })
    expect(result.warnings).toEqual([])
  })

  it('reports legacy focused content without claiming structured recovery', async () => {
    const showDir = await createRspFixture('rsp-show-legacy-focus-recovery-test', ['specs', 'changes', 'focus.d'])
    await writeFile(join(showDir, '.rsp', 'changes', 'focused-show.md'), renderChange('focused-show'))
    await writeFile(join(showDir, '.rsp', 'focus.d', 'focused-show'), '# Current\n\nInvestigate rsp-focus behavior and continue the accepted lane.\n')

    const result = JSON.parse(execSync(`node ${cliPath()} show --focused --json`, { cwd: showDir, encoding: 'utf-8' }))

    expect(result.recovery).toBeNull()
    expect(result.warnings).toContainEqual(expect.objectContaining({
      code: 'focus_capsule_legacy',
      message: 'legacy focus capsule has no structured recovery projection',
    }))
  })

  it('fails show for malformed versioned focus content without projecting recovery', async () => {
    const showDir = await createRspFixture('rsp-show-invalid-focus-recovery-test', ['specs', 'changes', 'focus.d'])
    await writeFile(join(showDir, '.rsp', 'changes', 'focused-show.md'), renderChange('focused-show'))
    await writeFile(join(showDir, '.rsp', 'focus.d', 'focused-show'), '<!-- rsp-focus:v2 -->\n\nCurrent: lane\nEvidence: stale\nNext: stop\n')

    const rejected = spawnSync('node', [cliPath(), 'show', '--focused', '--json'], { cwd: showDir, encoding: 'utf-8' })
    expect(rejected.status).toBe(1)
    const result = JSON.parse(rejected.stdout)
    expect(result.ok).toBe(false)
    expect(result.error.code).toBe('focus_capsule_invalid_v1')
    expect(result).not.toHaveProperty('recovery')
  })

  it('keeps shown readiness advisory before Core durable review', async () => {
    const showDir = await createRspFixture('rsp-show-next-actions-test')
    await writeFile(join(showDir, '.rsp', 'changes', 'complete.md'), renderChange('complete').replaceAll('- [ ]', '- [x]'))

    const output = execSync(`node ${cliPath()} show complete --json`, { cwd: showDir, encoding: 'utf-8' })
    const result = JSON.parse(output)

    expect(result.change.readiness.archiveReady).toBe('yes')
    expect(result).not.toHaveProperty('nextActions')
  })

  it('emits machine-readable JSON errors when requested', async () => {
    const showDir = await createRspFixture('rsp-show-json-error-test')

    let output = ''
    let failed = false
    try {
      output = execSync(`node ${cliPath()} show --focused --json`, { cwd: showDir, encoding: 'utf-8' })
    }
    catch (error) {
      failed = true
      output = String((error as { stdout?: string }).stdout || '')
    }

    const result = JSON.parse(output)
    expect(failed).toBe(true)
    expect(result.command).toBe('show')
    expect(result.ok).toBe(false)
    expect(result.error.code).toBe('no_focused_change')
    expect(result.nextActions).toContain('Run: rsp status')
    expect(result.nextActions).toContain('Run: rsp focus <name>')
  })

  it('rejects Group Briefs as executable Changes with a machine-readable error', async () => {
    const showDir = await createRspFixture('rsp-show-group-brief-test')
    await mkdir(join(showDir, '.rsp', 'changes', 'release'), { recursive: true })
    await writeFile(join(showDir, '.rsp', 'changes', 'release', '00-brief.md'), '# Group Brief: release\n')

    const result = spawnSync('node', [cliPath(), 'show', 'release/brief', '--json'], { cwd: showDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    const output = JSON.parse(result.stdout)
    expect(output.error.code).toBe('non_executable_work_ref')
  })
})

describe('check --focused', () => {
  it('fails closed when the work root cannot be inspected', async () => {
    const focusedCheckDir = await createRspFixture('rsp-check-focused-invalid-root-test', ['specs', 'focus.d'])
    await writeFile(join(focusedCheckDir, '.rsp', 'changes'), 'not a directory')

    const result = spawnSync('node', [cliPath(), 'check', '--focused', '--json'], { cwd: focusedCheckDir, encoding: 'utf-8' })
    const output = JSON.parse(result.stdout)

    expect(result.status).toBe(1)
    expect(output.ok).toBe(false)
    expect(output.diagnostics).toContainEqual(expect.objectContaining({ code: 'invalid_work_root' }))
  })

  it('only validates focused changes', async () => {
    const focusedCheckDir = await createRspFixture('rsp-check-focused-test', ['specs', 'changes', 'focus.d'])

    // Focused change is valid
    await writeFile(join(focusedCheckDir, '.rsp', 'changes', 'focused-valid.md'), renderChange('focused-valid'))
    await writeFile(join(focusedCheckDir, '.rsp', 'focus.d', 'focused-valid'), '')

    // Unfocused change has missing Spec section
    await writeFile(join(focusedCheckDir, '.rsp', 'changes', 'unfocused-broken.md'), `---
kind: fix
---

# Change: unfocused-broken

## Proposal
- none

## Design
- not needed: trivial

## Tasks
- [ ] fix

## Verify
- none

## Blockers
- none
`)
    const unsupportedDir = join(focusedCheckDir, '.rsp', 'changes', 'unfocused', 'nested')
    await mkdir(unsupportedDir, { recursive: true })
    await writeFile(join(unsupportedDir, 'ignored.md'), renderChange('unfocused/nested/ignored'))

    const output = execSync(`node ${cliPath()} check --focused`, { cwd: focusedCheckDir, encoding: 'utf-8' })
    // focused check should pass because only the focused change is validated
    expect(output).toContain('All 1 change file(s) valid')
  })

  it('fails when focused change has errors', async () => {
    const focusedCheckDir = await createRspFixture('rsp-check-focused-fail-test', ['specs', 'changes', 'focus.d'])

    // Focused change has errors (placeholder kind)
    await writeFile(join(focusedCheckDir, '.rsp', 'changes', 'focused-broken.md'), `---
kind: "<choose: feature | fix | refactor | docs | ops | research>"
---

# Change: focused-broken

## Proposal
- none

## Spec
### ADDED
- Requirement: x

### Acceptance
#### Scenario: x
- GIVEN x
- WHEN y
- THEN z

## Design
- none

## Tasks
- [ ] task

## Verify
- none

## Blockers
- none
`)
    await writeFile(join(focusedCheckDir, '.rsp', 'focus.d', 'focused-broken'), '')

    let output = ''
    let failed = false
    try {
      output = execSync(`node ${cliPath()} check --focused`, { cwd: focusedCheckDir, encoding: 'utf-8' })
    }
    catch (error) {
      failed = true
      output = String((error as { stdout?: string }).stdout || '')
    }
    expect(failed).toBe(true)
    expect(output).toContain('kind still uses the template placeholder')
  })

  it('reports unsupported recursive work paths as structured diagnostics', async () => {
    const checkDir = await createRspFixture('rsp-check-work-depth-test')
    const nestedDir = join(checkDir, '.rsp', 'changes', 'release', 'backend')
    await mkdir(nestedDir, { recursive: true })
    await writeFile(join(nestedDir, 'api.md'), renderChange('release/backend/api'))

    const result = spawnSync('node', [cliPath(), 'check', '--json'], { cwd: checkDir, encoding: 'utf-8' })

    expect(result.status).toBe(1)
    const output = JSON.parse(result.stdout)
    expect(output.diagnostics).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'unsupported_work_depth',
      change: 'release/backend',
    }))
  })
})
