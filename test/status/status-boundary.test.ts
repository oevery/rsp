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
import { extractChangeSummary, extractGroupSummary } from '../../src/core/work-summary.js'
import { deriveStatusView } from '../../src/status/derive.js'
import { inspectProjectStatus } from '../../src/status/inspect.js'
import { printStatusPlain } from '../../src/status/plain.js'
import { toStatusJson, toStatusJsonError } from '../../src/status/v3-json.js'

const root = fileURLToPath(new URL('../..', import.meta.url))

function record(overrides: Partial<StatusRecordOutput> & Pick<StatusRecordOutput, 'name'>): ProjectStatusSnapshot['records'][number] {
  return {
    output: {
      summary: null,
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
      incompleteRequiredVerify: 1,
      incompleteOptionalVerify: 0,
      requiredVerify: { todo: 1, progress: 0, done: 0, dropped: 0, total: 1 },
      optionalVerify: { todo: 0, progress: 0, done: 0, dropped: 0, total: 0 },
      legacyVerify: true,
      completionGate: 'blocked',
      coverageWarnings: 0,
      activeBlockers: Boolean(overrides.isBlocked),
      missingScenarios: false,
      deterministic: 'warnings',
      semantic: 'needs-review',
      archiveReady: 'no',
    },
  }
}

function snapshot(records: ProjectStatusSnapshot['records'] = [], plan: ChangeDependencyPlanOutput = { nodes: [], ready: [], edges: [], blocked: [], waves: [] }): ProjectStatusSnapshot {
  return {
    manage: { activation: 'explicit', closeout: 'local' },
    workspace: { activation: 'auto' },
    language: { artifacts: null, commit: null },
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
    const view = deriveStatusView(snapshot([record({ name: 'alpha', summary: '可读结果' })]))
    expect(toStatusJson(view)).toEqual({
      command: 'status',
      ok: true,
      manage: { activation: 'explicit', closeout: 'local' },
      workspace: { activation: 'auto' },
      activeWorkspaces: [],
      language: { artifacts: null, commit: null },
      filters: { focused: false, blocked: false, stale: null },
      focused: [],
      records: [record({ name: 'alpha', summary: '可读结果' }).output],
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
      workspace: { activation: 'disabled' },
      activeWorkspaces: [],
      language: { artifacts: null, commit: null },
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

    const grouped = snapshot()
    grouped.groups = [{
      name: 'delivery',
      summary: '交付 API 与 UI',
      path: '.rsp/changes/delivery/00-brief.md',
      slices: [],
      completion: { done: 0, total: 1 },
      blockers: false,
      readyToClose: false,
      warnings: [],
    }]
    expect(toStatusJson(deriveStatusView(grouped)).groups).toEqual([expect.objectContaining({
      name: 'delivery',
      summary: '交付 API 与 UI',
    })])
  })

  it('extracts presentation-neutral Change and Group summaries with placeholder-safe precedence', () => {
    expect(extractChangeSummary(`---
kind: feature
summary: Frontmatter summary
---

# Change: alpha

## Proposal
- Outcome: Outcome summary
- Summary: Legacy summary
`)).toBe('Frontmatter summary')
    expect(extractChangeSummary(`# Change: alpha

## Proposal
- Outcome: <…>
- Summary: Legacy summary
`)).toBe('Legacy summary')
    expect(extractChangeSummary(`# Change: alpha

## Proposal
- Outcome: <…>
- Summary:
`)).toBeNull()
    expect(extractGroupSummary(`# Change Group: delivery

## Goal
- <…>
- 交付 API 与 UI
`)).toBe('交付 API 与 UI')
    expect(extractGroupSummary(`# Change Group: delivery

## Goal
- <…>
`)).toBeNull()
  })

  it('preserves the compact empty-project plain presentation', () => {
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
      '  No focused change.',
      '    Run: rsp create <name>',
      '',
      '  No executable changes found. Run: rsp create <name>\n',
    ])
  })

  it('keeps advanced dependency presentation behind verbose status', () => {
    const output: string[] = []
    const log = vi.spyOn(console, 'log').mockImplementation((value = '') => output.push(String(value)))
    try {
      printStatusPlain(deriveStatusView(snapshot()), { verbose: true })
    }
    finally {
      log.mockRestore()
    }

    expect(output).toContain('  Manage: activation explicit · closeout local')
    expect(output).toContain('  Workspace: activation auto')
    expect(output).toContain('  Dependency graph')
    expect(output).toContain('  Legend: ◎ focused/open  ● ready  ○ waiting  ✓ resolved prerequisite  ! blocked')
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
      expect(configured.workspace).toEqual({ activation: 'explicit' })
      expect(configured.language).toEqual({ artifacts: null, commit: null })
      expect(configured.diagnostics).not.toContainEqual(expect.objectContaining({ code: 'invalid_config' }))

      await writeFile(configPath, 'manage:\n  activation: always\n  closeout: local\n')
      clearConfigCache()
      const invalid = await inspectProjectStatus()
      expect(invalid.manage).toEqual({ activation: 'explicit', closeout: 'manual' })
      expect(invalid.workspace).toEqual({ activation: 'disabled' })
      expect(invalid.language).toEqual({ artifacts: null, commit: null })
      expect(invalid.diagnostics).toContainEqual(expect.objectContaining({
        code: 'invalid_config',
        path: '.rsp/config.yaml',
      }))
      const output: string[] = []
      const log = vi.spyOn(console, 'log').mockImplementation((value = '') => output.push(String(value)))
      try {
        printStatusPlain(deriveStatusView(invalid), { verbose: true })
      }
      finally {
        log.mockRestore()
      }
      expect(output).toContain('  Manage: activation explicit · closeout manual')
      expect(output).toContain('  Workspace: activation disabled')

      await writeFile(configPath, 'manage: [\n')
      clearConfigCache()
      const malformed = await inspectProjectStatus()
      expect(malformed.manage).toEqual({ activation: 'explicit', closeout: 'manual' })
      expect(malformed.workspace).toEqual({ activation: 'disabled' })
      expect(malformed.diagnostics).toContainEqual(expect.objectContaining({ code: 'invalid_config' }))
    }
    finally {
      process.chdir(cwd)
      clearConfigCache()
    }
  })

  it('projects configured effective language values through JSON and plain status', async () => {
    const projectDir = join(tmpdir(), 'rsp-status-language-policy-test', randomUUID())
    await mkdir(join(projectDir, '.rsp', 'changes'), { recursive: true })
    await mkdir(join(projectDir, '.rsp', 'focus.d'), { recursive: true })
    await mkdir(join(projectDir, '.rsp', 'archives'), { recursive: true })
    await writeFile(join(projectDir, '.rsp', 'config.yaml'), 'language:\n  default: zh-CN\n  artifacts: en\n  commit: zh-CN\n')
    const cwd = process.cwd()
    process.chdir(projectDir)

    try {
      clearConfigCache()
      const inspected = await inspectProjectStatus()
      expect(inspected.language).toEqual({ artifacts: 'en', commit: 'zh-CN' })
      const view = deriveStatusView(inspected)
      expect(toStatusJson(view).language).toEqual({ artifacts: 'en', commit: 'zh-CN' })

      const output: string[] = []
      const log = vi.spyOn(console, 'log').mockImplementation((value = '') => output.push(String(value)))
      try {
        printStatusPlain(view, { verbose: true })
      }
      finally {
        log.mockRestore()
      }
      expect(output).toContain('  Language: artifacts en · commit zh-CN')
    }
    finally {
      process.chdir(cwd)
      clearConfigCache()
    }
  })

  it('projects configured workspace activation through JSON and verbose plain status', async () => {
    const projectDir = join(tmpdir(), 'rsp-status-workspace-policy-test', randomUUID())
    await mkdir(join(projectDir, '.rsp', 'changes'), { recursive: true })
    await mkdir(join(projectDir, '.rsp', 'focus.d'), { recursive: true })
    await mkdir(join(projectDir, '.rsp', 'archives'), { recursive: true })
    await writeFile(join(projectDir, '.rsp', 'config.yaml'), 'workspace:\n  activation: explicit\n')
    const cwd = process.cwd()
    process.chdir(projectDir)

    try {
      clearConfigCache()
      const inspected = await inspectProjectStatus()
      expect(inspected.workspace).toEqual({ activation: 'explicit' })
      const view = deriveStatusView(inspected)
      expect(toStatusJson(view).workspace).toEqual({ activation: 'explicit' })

      const output: string[] = []
      const log = vi.spyOn(console, 'log').mockImplementation((value = '') => output.push(String(value)))
      try {
        printStatusPlain(view, { verbose: true })
      }
      finally {
        log.mockRestore()
      }
      expect(output).toContain('  Workspace: activation explicit')
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
