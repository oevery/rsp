import type { HistoryDetailOutput } from '../../src/types.js'
import { describe, expect, it } from 'vitest'
import { displayWidth, wrapDisplay } from '../../src/tui/display.js'
import { projectHistoryEvidence } from '../../src/tui/history-detail.js'
import { appendHistoryTruncationMarker, formatHistoryEvidenceLines, formatHistoryField, formatHistoryRow } from '../../src/tui/history-display.js'

const evidence: HistoryDetailOutput['evidence'] = {
  tasks: { items: ['task-1', 'task-2', 'task-3', 'task-4'], truncated: true },
  verify: { items: ['verify-1', 'verify-2', 'verify-3', 'verify-4'], truncated: true },
  blockers: { items: ['blocker-1', 'blocker-2', 'blocker-3', 'blocker-4'], truncated: true },
}

const projectionOptions = {
  width: 40,
  headings: { tasks: 'Tasks: 4/4', verify: 'Verify: 4/4', blockers: 'Blockers:' },
  none: 'none',
  truncationMarker: '(truncated)',
}

describe('history detail viewport projection', () => {
  it.each([[16, [2, 1, 1]], [20, [3, 3, 2]]] as const)('shares the actual remaining content-row budget across all evidence sections at height %i', (height, expectedLines) => {
    const projected = projectHistoryEvidence(evidence, { ...projectionOptions, height })
    const rowBudget = height - 9
    expect(projected.map(section => section.key)).toEqual(['tasks', 'verify', 'blockers'])
    expect(projected.map(section => section.heading)).toEqual(['Tasks: 4/4', 'Verify: 4/4', 'Blockers:'])
    expect(projected.every(section => section.lines.length >= 1 && section.truncated)).toBe(true)
    expect(projected.map(section => section.lines.length)).toEqual(expectedLines)
    expect(projected.reduce((rows, section) => rows + 1 + section.lines.length, 0)).toBeLessThanOrEqual(rowBudget)
  })

  it('deducts one dynamic History loading or error row from the height 20 evidence budget', () => {
    const wrapped = Object.fromEntries(Object.entries(evidence).map(([key, value]) => [key, { ...value, items: [`[x] ${value.items.join(' ')} ${'宽字符'.repeat(20)}`] }])) as HistoryDetailOutput['evidence']
    const projected = projectHistoryEvidence(wrapped, { ...projectionOptions, height: 20, dynamicRows: 1 })
    expect(projected.map(section => section.lines.length)).toEqual([3, 2, 2])
    expect(projected.reduce((rows, section) => rows + 1 + section.lines.length, 0)).toBeLessThanOrEqual(10)
    expect(projected.every(section => section.lines.at(-1)?.includes('(truncated)'))).toBe(true)
    expect(projected.flatMap(section => section.lines).every(line => displayWidth(line) <= 40)).toBe(true)
  })

  it('hides all evidence sections when the viewport cannot fund each heading plus one content row', () => {
    expect(projectHistoryEvidence(evidence, { ...projectionOptions, height: 14 })).toEqual([])
  })
})

describe('history display budgets', () => {
  it('truncates the complete row and detail field when kind contains wide characters', () => {
    const kind = '类型'.repeat(40)
    const record = { date: '2026-07-24', workRef: 'work-reference-long', group: null, kind, summary: 'summary-visible-long', summaryTruncated: false, path: '.rsp/archives/2026-07-24_work-ref.md' }
    const row = formatHistoryRow(record, 38)
    const field = formatHistoryField('Kind', kind, 24)
    expect(displayWidth(row)).toBeLessThanOrEqual(38)
    expect(displayWidth(field)).toBeLessThanOrEqual(24)
    expect(row).not.toContain(kind)
    expect(field).not.toContain(kind)
    expect(`${row}${field}`).toContain('…')
    expect(row).toContain('2026-07-24')
    expect(row).toContain('work')
    expect(row).toContain('类型')
    expect(row).toContain('summary')
  })

  it('maps only RSP checkbox and bullet prefixes to textual markers while preserving Markdown punctuation', () => {
    const lines = formatHistoryEvidenceLines([
      '[x] done `code`',
      '[ ] todo **literal**',
      '[/] in-progress _literal_',
      '[-] dropped ~~literal~~',
      '- ordinary [link](target)',
    ], 'none', 80)
    expect(lines).toEqual([
      '  ✓ done `code`',
      '  ○ todo **literal**',
      '  ◐ in-progress _literal_',
      '  − dropped ~~literal~~',
      '  • ordinary [link](target)',
    ])
  })

  it('wraps long ASCII and CJK evidence by display cells with a hanging indent', () => {
    const item = `[x] ${'ascii'.repeat(6)}${'宽字符'.repeat(8)}` + ' keep `code`'
    const lines = formatHistoryEvidenceLines([item], 'none', 24)
    expect(lines.length).toBeGreaterThan(2)
    expect(lines[0]).toMatch(/^ {2}✓ /)
    expect(lines.slice(1).every(line => line.startsWith('    '))).toBe(true)
    expect(lines.every(line => displayWidth(line) <= 24)).toBe(true)
    expect(lines.join('\n').match(/`/g)).toHaveLength(2)
  })

  it('prefers the nearest whitespace boundary so ordinary configure and version words stay intact', () => {
    expect(wrapDisplay('configure release version safely', 20, '  ✓ ', '    ')).toEqual([
      '  ✓ configure',
      '    release version',
      '    safely',
    ])
    expect(wrapDisplay('configure 配置 version 版本', 20, '  ✓ ', '    ')).toEqual([
      '  ✓ configure 配置',
      '    version 版本',
    ])
  })

  it('falls back to grapheme wrapping for an unbroken long token and CJK text', () => {
    const lines = wrapDisplay(`${'configuration'.repeat(5)}${'版本'.repeat(12)}`, 20, '  ✓ ', '    ')
    expect(lines.length).toBeGreaterThan(2)
    expect(lines.slice(1).every(line => line.startsWith('    '))).toBe(true)
    expect(lines.every(line => displayWidth(line) <= 20)).toBe(true)
  })

  it('keeps empty evidence as the existing none row', () => {
    expect(formatHistoryEvidenceLines([], 'none', 40)).toEqual(['  none'])
  })

  it.each([39, 79])('keeps wrapped and truncation-marked content within the supported %i-cell detail width', (width) => {
    const lines = wrapDisplay(`${'ascii'.repeat(20)}${'宽字符'.repeat(20)}`, width, '  ✓ ', '    ')
    const marked = appendHistoryTruncationMarker(lines.at(-1) ?? '', '(truncated)', width)
    expect(lines.every(line => displayWidth(line) <= width)).toBe(true)
    expect(displayWidth(marked)).toBeLessThanOrEqual(width)
    expect(marked).toContain('(truncated)')
  })
})
