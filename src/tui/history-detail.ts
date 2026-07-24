import type { HistoryDetailOutput } from '../types.js'
import { appendHistoryTruncationMarker, formatHistoryEvidenceLines } from './history-display.js'

export type HistoryEvidenceKey = keyof HistoryDetailOutput['evidence']

export interface ProjectedHistoryEvidence {
  key: HistoryEvidenceKey
  heading: string
  lines: string[]
  truncated: boolean
}

export interface HistoryEvidenceProjectionOptions {
  height: number
  width: number
  dynamicRows?: number
  headings: Record<HistoryEvidenceKey, string>
  none: string
  truncationMarker: string
}

const EVIDENCE_KEYS: HistoryEvidenceKey[] = ['tasks', 'verify', 'blockers']
const HISTORY_DETAIL_FIXED_ROWS = 9
const HISTORY_EVIDENCE_MIN_ROWS = EVIDENCE_KEYS.length * 2
export const HISTORY_DETAIL_MIN_HEIGHT = 12

export function projectHistoryEvidence(evidence: HistoryDetailOutput['evidence'], options: HistoryEvidenceProjectionOptions): ProjectedHistoryEvidence[] {
  const { dynamicRows = 0, headings, height, none, truncationMarker, width } = options
  const rowBudget = Math.max(0, height - HISTORY_DETAIL_FIXED_ROWS - dynamicRows)
  if (rowBudget < HISTORY_EVIDENCE_MIN_ROWS)
    return []

  const formatted = new Map(EVIDENCE_KEYS.map(key => [key, formatHistoryEvidenceLines(evidence[key].items, none, width)]))
  const allocations = new Map(EVIDENCE_KEYS.map(key => [key, 1]))
  let remaining = rowBudget - HISTORY_EVIDENCE_MIN_ROWS
  let cursor = 0
  while (remaining > 0) {
    const key = Array.from({ length: EVIDENCE_KEYS.length }, (_, offset) => EVIDENCE_KEYS[(cursor + offset) % EVIDENCE_KEYS.length])
      .find(candidate => (allocations.get(candidate) ?? 1) < (formatted.get(candidate)?.length ?? 1))
    if (!key)
      break
    allocations.set(key, (allocations.get(key) ?? 1) + 1)
    cursor = (EVIDENCE_KEYS.indexOf(key) + 1) % EVIDENCE_KEYS.length
    remaining -= 1
  }

  return EVIDENCE_KEYS.map((key) => {
    const value = evidence[key]
    const allLines = formatted.get(key) ?? []
    const lines = allLines.slice(0, allocations.get(key))
    const truncated = value.truncated || lines.length < allLines.length
    if (truncated && lines.length > 0)
      lines[lines.length - 1] = appendHistoryTruncationMarker(lines[lines.length - 1], truncationMarker, width)
    return { key, heading: headings[key], lines, truncated }
  })
}
