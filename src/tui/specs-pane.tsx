import type { SpecsSearchMatch } from '../specs/model.js'
import type { TuiMessages } from './i18n/messages.js'
import type { MarkdownViewport } from './markdown-presentation.js'
import type { SpecsTreeDisplayRow } from './specs-display.js'
import type { DashboardSpecsState } from './state.js'
import { Box, Text } from 'ink'
import { truncateDisplay } from './display.js'
import { formatHistoryDiagnostic } from './history-display.js'
import { formatSpecsSearchRow, formatSpecsTreeRow } from './specs-display.js'

export type SpecsListRow = SpecsTreeDisplayRow | SpecsSearchMatch

export function specsSelectionKey(row: SpecsListRow): string {
  return 'line' in row ? `${row.path}:${row.line}` : row.key
}

export function SpecsList({ filterActive, listWidth, messages, rows, searchLoading, selectedKey, status, wide }: {
  filterActive: boolean
  listWidth: number
  messages: TuiMessages
  rows: SpecsListRow[]
  searchLoading: boolean
  selectedKey: string | null
  status: DashboardSpecsState['status']
  wide: boolean
}) {
  return (
    <Box flexDirection="column" width={listWidth} marginRight={wide ? 2 : 0}>
      {rows.map((row) => {
        const key = specsSelectionKey(row)
        return (
          <Text key={key} inverse={key === selectedKey}>
            {key === selectedKey ? '›' : ' '}
            {' '}
            {'line' in row
              ? formatSpecsSearchRow(row, Math.max(1, listWidth - 2))
              : formatSpecsTreeRow(row, Math.max(1, listWidth - 2))}
          </Text>
        )
      })}
      {rows.length === 0 && status !== 'loading' && !searchLoading && (
        <Text dimColor>{filterActive ? messages.noMatches : messages.noSpecs}</Text>
      )}
    </Box>
  )
}

export function SpecsSummary({ row, match, messages, width }: { row?: SpecsTreeDisplayRow, match?: SpecsSearchMatch, messages: TuiMessages, width: number }) {
  if (match) {
    return (
      <Box flexDirection="column" paddingLeft={1} width={width}>
        <Text bold>{truncateDisplay(match.title, width)}</Text>
        <Text>{truncateDisplay(`${messages.path}: ${match.path}`, width)}</Text>
        <Text>{truncateDisplay(`${messages.kind}: ${match.kind}`, width)}</Text>
        {match.heading && <Text>{truncateDisplay(match.heading, width)}</Text>}
        <Text>{truncateDisplay(match.excerpt, width)}</Text>
      </Box>
    )
  }
  if (!row)
    return <Text dimColor>{messages.noSpecs}</Text>
  const label = row.type === 'root' ? row.label : row.type === 'directory' ? row.name : row.title
  return (
    <Box flexDirection="column" paddingLeft={1} width={width}>
      <Text bold>{truncateDisplay(label, width)}</Text>
      <Text>{truncateDisplay(`${messages.path}: ${row.path}`, width)}</Text>
      {row.type === 'document' && (
        <>
          <Text>{truncateDisplay(`${messages.kind}: ${row.kind}`, width)}</Text>
          {row.summary && <Text>{truncateDisplay(`${messages.summary}: ${row.summary}`, width)}</Text>}
        </>
      )}
    </Box>
  )
}

export function SpecsDetail({ messages, specs, viewport, width }: { messages: TuiMessages, specs: DashboardSpecsState, viewport: MarkdownViewport, width: number }) {
  const detail = specs.detail.record
  if (specs.detail.loadingPath)
    return <Text>{messages.specsDetailLoading}</Text>
  if (specs.detail.error)
    return <Text color="red">{formatHistoryDiagnostic(messages.specsDetailFailed, specs.detail.error, width)}</Text>
  if (!detail)
    return <Text dimColor>{messages.noSpecs}</Text>
  return <MarkdownDocumentDetail contentTruncated={detail.document.contentTruncated} kind={detail.document.kind} messages={messages} path={detail.document.path} title={detail.document.title} viewport={viewport} width={width} />
}

export function MarkdownDocumentDetail({ contentTruncated = false, kind, messages, path, title, viewport, width }: { contentTruncated?: boolean, kind: string, messages: TuiMessages, path: string, title: string, viewport: MarkdownViewport, width: number }) {
  const contentWidth = Math.max(8, width - 1)
  return (
    <Box flexDirection="column" width={width}>
      <Text bold>{truncateDisplay(title, contentWidth)}</Text>
      <Text>{truncateDisplay(`${messages.path}: ${path}`, contentWidth)}</Text>
      <Text>{truncateDisplay(`${messages.kind}: ${kind}`, contentWidth)}</Text>
      <RenderedDetailViewport contentTruncated={contentTruncated} messages={messages} viewport={viewport} />
    </Box>
  )
}

export function RenderedDetailViewport({ contentTruncated = false, messages, viewport }: { contentTruncated?: boolean, messages: TuiMessages, viewport: MarkdownViewport }) {
  return (
    <>
      {viewport.lines.map((line, index) => (
        <Text key={viewport.start + index}>
          {line.spans.length === 0
            ? ' '
            : line.spans.map((span, spanIndex) => (
                <Text
                  key={spanIndex}
                  bold={span.bold}
                  italic={span.italic}
                  underline={span.underline}
                  dimColor={span.dim}
                  color={span.color}
                >
                  {span.text || ' '}
                </Text>
              ))}
        </Text>
      ))}
      <Text dimColor>
        {viewport.start + 1}
        –
        {Math.max(viewport.start + 1, viewport.end)}
        /
        {viewport.total}
        {contentTruncated ? ` · ${messages.truncated}` : ''}
      </Text>
    </>
  )
}
