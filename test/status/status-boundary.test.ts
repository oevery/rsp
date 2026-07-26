import type { ProjectStatusSnapshot } from '../../src/status/model.js'
import type { ChangeDependencyPlanOutput, StatusRecordOutput } from '../../src/types.js'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'

import { clearConfigCache } from '../../src/core/config.js'
import { deriveStatusView } from '../../src/status/derive.js'
import { inspectProjectStatus } from '../../src/status/inspect.js'
import { printStatusPlain } from '../../src/status/plain.js'
import { toStatusJson, toStatusJsonError } from '../../src/status/v3-json.js'

const root = fileURLToPath(new URL('../..', import.meta.url))

function record(overrides: Partial<StatusRecordOutput> & Pick<StatusRecordOutput, 'name'>): ProjectStatusSnapshot['records'][number] {
  return {
    output: {
      kind: 'feature',
      progress: { done: 0, total: 1 },
      ageDays: 2,
      isFocused: false,
      isBlocked: false,
      path: `.rsp/changes/${overrides.name}.md`,
      ...overrides,
    },
    progressKnown: true,
    title: overrides.name,
    blockerEntries: [],
    readiness: {
      incompleteTasks: 1,
      incompleteVerify: 1,
      activeBlockers: Boolean(overrides.isBlocked),
      missingScenarios: false,
      deterministic: 'warnings',
      semantic: 'needs-review',
      archiveReady: overrides.isBlocked ? 'no' : 'judgment',
    },
  }
}

function snapshot(records: ProjectStatusSnapshot['records'] = [], plan: ChangeDependencyPlanOutput = { nodes: [], ready: [], edges: [], blocked: [], waves: [] }): ProjectStatusSnapshot {
  return {
    manage: { activation: 'explicit', closeout: 'local' },
    focused: records.filter(item => item.output.isFocused).map(item => item.output.name),
    records,
    groups: [],
    plan,
    archiveTrend: [],
    diagnostics: [],
    runtime: [],
  }
}

describe('project status boundary', () => {
  it('derives filters, prerequisite closure, summaries, and recommendations without I/O', () => {
    const input = snapshot([
      record({ name: 'implement', isFocused: true, isBlocked: true, ageDays: 5 }),
      record({ name: 'research', ageDays: 10 }),
      record({ name: 'unrelated', ageDays: 1 }),
    ], {
      nodes: [
        { name: 'implement', selection: 'selected', state: 'waiting' },
        { name: 'research', selection: 'selected', state: 'ready' },
        { name: 'unrelated', selection: 'selected', state: 'ready' },
      ],
      ready: ['research', 'unrelated'],
      edges: [{ change: 'implement', requires: 'research', reason: 'required first', state: 'open' }],
      blocked: [{ change: 'implement', requires: ['research'], external: false }],
      waves: [['research', 'unrelated'], ['implement']],
    })

    const view = deriveStatusView(input, { focused: true, stale: 3 })

    expect(view.records.map(item => item.output.name)).toEqual(['implement'])
    expect(view.summary).toEqual({ total: 1, focused: 1, blocked: 1 })
    expect(view.plan.nodes).toEqual([
      { name: 'implement', selection: 'selected', state: 'waiting' },
      { name: 'research', selection: 'prerequisite', state: 'ready' },
    ])
    expect(view.plan.ready).toEqual(['research'])
    expect(view.nextActions).toEqual([])
  })

  it('keeps the public v3 success and command-error envelopes exact', () => {
    const view = deriveStatusView(snapshot([record({ name: 'alpha' })]))
    expect(toStatusJson(view)).toEqual({
      command: 'status',
      ok: true,
      manage: { activation: 'explicit', closeout: 'local' },
      filters: { focused: false, blocked: false, stale: null },
      focused: [],
      records: [record({ name: 'alpha' }).output],
      groups: [],
      plan: { nodes: [], ready: [], edges: [], blocked: [], waves: [] },
      summary: { total: 1, focused: 0, blocked: 0 },
      nextActions: ['Open changes: alpha', 'Run: rsp focus alpha', 'Or run: rsp create <name>'],
      archiveTrend: [],
      diagnostics: [],
      runtime: [],
    })
    expect(toStatusJsonError({ code: 'invalid_stale_filter', message: 'invalid' }, { focused: true, blocked: false })).toEqual({
      command: 'status',
      ok: false,
      manage: { activation: 'explicit', closeout: 'manual' },
      filters: { focused: true, blocked: false, stale: null },
      focused: [],
      records: [],
      groups: [],
      plan: { nodes: [], ready: [], edges: [], blocked: [], waves: [] },
      summary: { total: 0, focused: 0, blocked: 0 },
      archiveTrend: [],
      nextActions: [],
      diagnostics: [],
      runtime: [],
      error: { code: 'invalid_stale_filter', message: 'invalid' },
    })
  })

  it('preserves the empty-project plain presentation', () => {
    const output: string[] = []
    const log = vi.spyOn(console, 'log').mockImplementation((value = '') => output.push(String(value)))
    try {
      printStatusPlain(deriveStatusView(snapshot()))
    }
    finally {
      log.mockRestore()
    }

    expect(output).toEqual([
      '',
      '  RSP status',
      '',
      '  Manage: activation explicit · closeout local',
      '',
      '  No focused change.',
      '    Run: rsp create <name>',
      '',
      '  Dependency graph',
      '  (parent requires children)',
      '  none',
      '  Next action: none',
      '  Legend: ◎ focused/open  ● ready  ○ waiting  ✓ resolved prerequisite  ! blocked',
      '',
      '  No executable changes found. Run: rsp create <name>\n',
    ])
  })

  it('inspects configured Manage policy and fails closed visibly for invalid config', async () => {
    const projectDir = join(tmpdir(), 'rsp-status-manage-policy-test', randomUUID())
    await mkdir(join(projectDir, '.rsp', 'changes'), { recursive: true })
    await mkdir(join(projectDir, '.rsp', 'focus.d'), { recursive: true })
    await mkdir(join(projectDir, '.rsp', 'archives'), { recursive: true })
    const configPath = join(projectDir, '.rsp', 'config.yaml')
    const cwd = process.cwd()
    process.chdir(projectDir)

    try {
      await writeFile(configPath, 'manage:\n  activation: auto\n  closeout: lifecycle\n')
      clearConfigCache()
      const configured = await inspectProjectStatus()
      expect(configured.manage).toEqual({ activation: 'auto', closeout: 'lifecycle' })
      expect(configured.diagnostics).not.toContainEqual(expect.objectContaining({ code: 'invalid_config' }))

      await writeFile(configPath, 'manage:\n  activation: always\n  closeout: local\n')
      clearConfigCache()
      const invalid = await inspectProjectStatus()
      expect(invalid.manage).toEqual({ activation: 'explicit', closeout: 'manual' })
      expect(invalid.diagnostics).toContainEqual(expect.objectContaining({
        code: 'invalid_config',
        path: '.rsp/config.yaml',
      }))
      const output: string[] = []
      const log = vi.spyOn(console, 'log').mockImplementation((value = '') => output.push(String(value)))
      try {
        printStatusPlain(deriveStatusView(invalid))
      }
      finally {
        log.mockRestore()
      }
      expect(output).toContain('  Manage: activation explicit · closeout manual')

      await writeFile(configPath, 'manage: [\n')
      clearConfigCache()
      const malformed = await inspectProjectStatus()
      expect(malformed.manage).toEqual({ activation: 'explicit', closeout: 'manual' })
      expect(malformed.diagnostics).toContainEqual(expect.objectContaining({ code: 'invalid_config' }))
    }
    finally {
      process.chdir(cwd)
      clearConfigCache()
    }
  })

  it('enforces one-way imports for status modules', () => {
    const sources = Object.fromEntries(['model.ts', 'derive.ts', 'inspect.ts', 'v3-json.ts', 'plain.ts'].map(name => [
      name,
      readFileSync(join(root, 'src', 'status', name), 'utf8'),
    ]))

    expect(`${sources['model.ts']}\n${sources['derive.ts']}`).not.toMatch(/node:fs|node:tty|picocolors|commands\/|tui\//)
    expect(sources['inspect.ts']).not.toMatch(/plain\.js|v3-json\.js|commands\/|tui\//)
    expect(`${sources['v3-json.ts']}\n${sources['plain.ts']}`).not.toMatch(/node:fs|commands\/|tui\//)

    const statusSources = [
      'src/commands/status.ts',
      ...Object.keys(sources).map(name => `src/status/${name}`),
    ].map(path => readFileSync(join(root, path), 'utf8')).join('\n')
    expect(statusSources).not.toMatch(/from ['"][^'"]*tui\//)

    const cliSource = readFileSync(join(root, 'src', 'cli.ts'), 'utf8')
    expect(cliSource).toContain('await import(\'./tui/entry.js\')')
    expect(cliSource).not.toMatch(/^import .*tui\/entry/m)
  })
})
