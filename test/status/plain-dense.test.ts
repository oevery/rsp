import type { ProjectStatusView } from '../../src/status/model.js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { printStatusPlain } from '../../src/status/plain.js'

afterEach(() => vi.restoreAllMocks())

describe('dense plain status', () => {
  it('stacks long WorkRefs, names focus semantics, and does not repeat blockers', () => {
    const lines: string[] = []
    vi.spyOn(console, 'log').mockImplementation((value = '') => lines.push(String(value)))
    const previousColumns = process.stdout.columns
    Object.defineProperty(process.stdout, 'columns', { configurable: true, value: 60 })
    const longName = 'cli-machine-output/a-very-long-work-reference-that-does-not-fit'
    const view: ProjectStatusView = {
      manage: { activation: 'auto', closeout: 'lifecycle' },
      language: { artifacts: null, commit: null },
      query: { focused: false, blocked: false, stale: null },
      focused: [longName],
      records: [{
        output: { name: longName, summary: 'Readable completed outcome', kind: 'feature', progress: { done: 12, total: 12 }, ageDays: 0, isFocused: true, isBlocked: true, path: `.rsp/changes/${longName}.md` },
        progressKnown: true,
        title: longName,
        blockerEntries: ['waiting for owner'],
        readiness: { incompleteTasks: 0, incompleteVerify: 0, incompleteRequiredVerify: 0, incompleteOptionalVerify: 0, requiredVerify: { todo: 0, progress: 0, done: 0, dropped: 0, total: 0 }, optionalVerify: { todo: 0, progress: 0, done: 0, dropped: 0, total: 0 }, legacyVerify: false, completionGate: 'blocked', coverageWarnings: 0, activeBlockers: true, missingScenarios: false, deterministic: 'pass', semantic: 'needs-review', archiveReady: 'no' },
      }],
      groups: [],
      plan: {
        nodes: [{ name: longName, selection: 'selected', state: 'blocked' }],
        ready: [],
        edges: [],
        blocked: [{ change: longName, requires: [], external: true }],
        waves: [],
      },
      summary: { total: 1, focused: 1, blocked: 1 },
      nextActions: [],
      archiveTrend: [],
      diagnostics: [],
      runtime: [],
      hasExecutableChanges: true,
      ok: true,
    }
    printStatusPlain(view, { verbose: true })
    Object.defineProperty(process.stdout, 'columns', { configurable: true, value: previousColumns })
    const output = lines.join('\n')
    expect(output).toContain('focused · blocked')
    expect(output).not.toContain('selected')
    expect(output.match(/External blockers:/g)).toHaveLength(1)
    expect(output).not.toContain('Blocked:')
    expect(output).toContain(`Change: ${longName}`)
    expect(output).toContain('Summary: Readable completed outcome')
  })
})
