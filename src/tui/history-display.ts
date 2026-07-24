import type { HistoryRecordOutput } from '../types.js'
import { displayWidth, truncateDisplay, wrapDisplay } from './display.js'

export function formatHistoryRow(record: HistoryRecordOutput, width: number): string {
  const boundedWidth = Math.max(1, width)
  if (boundedWidth < 24)
    return truncateDisplay(`${record.date} ${record.workRef} [${record.kind}] ${record.summary}`, boundedWidth)

  const date = truncateDisplay(record.date, Math.min(10, boundedWidth))
  const remaining = Math.max(3, boundedWidth - displayWidth(date) - 4)
  const workRefWidth = Math.ceil(remaining / 3)
  const kindWidth = Math.ceil((remaining - workRefWidth) / 2)
  const summaryWidth = Math.max(1, remaining - workRefWidth - kindWidth)
  const kind = truncateDisplay(record.kind, Math.max(1, kindWidth - 2))
  const summary = `${record.summary}${record.summaryTruncated ? '…' : ''}`
  return `${date}  ${truncateDisplay(record.workRef, workRefWidth)} [${kind}] ${truncateDisplay(summary, summaryWidth)}`
}

export function formatHistoryField(label: string, value: string, width: number): string {
  return truncateDisplay(`${label}: ${value}`, Math.max(1, width))
}

export function formatHistoryDiagnostic(label: string, diagnostic: string, width: number): string {
  return truncateDisplay(`${label} ${diagnostic}`, Math.max(1, width))
}

const CHECKBOX_MARKERS = {
  'x': '✓',
  ' ': '○',
  '/': '◐',
  '-': '−',
} as const

function projectEvidenceItem(value: string): { marker: string, text: string } {
  const trimmed = value.trimStart()
  const checkboxPrefix = trimmed.match(/^(?:[-*][ \t]+)?\[([x /-])\][ \t]*/i)
  if (checkboxPrefix) {
    const state = checkboxPrefix[1].toLowerCase() as keyof typeof CHECKBOX_MARKERS
    return { marker: CHECKBOX_MARKERS[state], text: trimmed.slice(checkboxPrefix[0].length) }
  }
  const bulletPrefix = trimmed.match(/^[-*][ \t]+/)
  return bulletPrefix ? { marker: '•', text: trimmed.slice(bulletPrefix[0].length) } : { marker: '•', text: value }
}

export function formatHistoryEvidenceLines(items: string[], none: string, width: number): string[] {
  if (items.length === 0)
    return [truncateDisplay(`  ${none}`, Math.max(1, width))]

  return items.flatMap((value) => {
    const item = projectEvidenceItem(value)
    const prefix = `  ${item.marker} `
    return wrapDisplay(item.text, width, prefix, ' '.repeat(displayWidth(prefix)))
  })
}

export function appendHistoryTruncationMarker(line: string, marker: string, width: number): string {
  const suffix = ` ${marker}`
  const contentWidth = Math.max(1, width - displayWidth(suffix))
  return `${truncateDisplay(line, contentWidth)}${suffix}`
}
