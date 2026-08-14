import { describe, expect, it } from 'vitest'
import { displayWidth } from '../../src/tui/display.js'
import { markdownLineText, projectMarkdownLines, projectMarkdownViewport } from '../../src/tui/markdown-presentation.js'

describe('terminal Markdown presentation', () => {
  it('projects supported Markdown into readable styled lines while hiding frontmatter', () => {
    const markdown = [
      '---',
      'kind: feature',
      '---',
      '# Project Design',
      '',
      'Paragraph with **strong**, *emphasis*, `inline()`, and [docs](https://example.test/docs).',
      '',
      '- first',
      '- [x] complete',
      '',
      '> quoted context',
      '',
      '```ts',
      'const answer = 42',
      '```',
      '',
      '---',
      '',
      '<b>inert html</b>',
    ].join('\n')
    const lines = projectMarkdownLines(markdown, 80)
    const text = lines.map(markdownLineText)

    expect(text.join('\n')).not.toContain('kind: feature')
    expect(text).toContain('◆ Project Design')
    expect(text).toContain('• first')
    expect(text).toContain('☑ complete')
    expect(text).toContain('│ quoted context')
    expect(text).toContain('  const answer = 42')
    expect(text.join('\n')).toContain('docs (https://example.test/docs)')
    expect(text).toContain('<b>inert html</b>')
    expect(lines.find(line => markdownLineText(line) === '◆ Project Design')?.spans.some(span => span.bold)).toBe(true)
    expect(lines.some(line => line.spans.some(span => span.text === 'strong' && span.bold))).toBe(true)
    expect(lines.some(line => line.spans.some(span => span.text === 'emphasis' && span.italic))).toBe(true)
    expect(lines.some(line => line.spans.some(span => span.text === 'inline()' && span.code))).toBe(true)
  })

  it('sanitizes terminal controls and wraps every rendered physical line by display cells', () => {
    const lines = projectMarkdownLines(`# Safe \u001B[31mred\u001B[0m\n\n${'接口'.repeat(12)}`, 12)

    expect(lines.map(markdownLineText).join('')).not.toContain('\u001B')
    expect(lines.every(line => displayWidth(markdownLineText(line)) <= 12)).toBe(true)
    expect(lines.length).toBeGreaterThan(3)
  })

  it('calculates the viewport from rendered physical lines', () => {
    const content = ['# Title', '', ...Array.from({ length: 6 }, (_, index) => `line ${index + 1}`)].join('\n')
    const viewport = projectMarkdownViewport(content, { width: 40, height: 2, offset: 2 })

    expect(viewport.lines.map(markdownLineText)).toEqual(['line 1', 'line 2'])
    expect(viewport).toEqual(expect.objectContaining({ start: 2, end: 4, total: 8, hasPrevious: true, hasNext: true }))
  })

  it('projects GFM tables responsively and only allowlisted RSP metavariables as code', () => {
    const markdown = [
      '| Contract | Owner |',
      '| --- | --- |',
      '| WorkerEnvelope | rsp-manage |',
      '',
      'Use <change-work-ref> and <reason>, but keep <b>HTML</b> inert.',
    ].join('\n')
    const wide = projectMarkdownLines(markdown, 60)
    const narrow = projectMarkdownLines(markdown, 24)

    expect(wide.map(markdownLineText)).toContain('Contract       │ Owner     ')
    expect(wide.map(markdownLineText)).toContain('WorkerEnvelope │ rsp-manage')
    expect(narrow.map(markdownLineText)).toEqual(expect.arrayContaining(['Contract: WorkerEnvelope', 'Owner: rsp-manage']))
    expect(wide.some(line => line.spans.some(span => span.text === 'change-work-ref' && span.code))).toBe(true)
    expect(wide.some(line => line.spans.some(span => span.text === 'reason' && span.code))).toBe(true)
    expect(wide.map(markdownLineText).join('\n')).toContain('<b>HTML</b>')
    expect(narrow.every(line => displayWidth(markdownLineText(line)) <= 24)).toBe(true)
  })
})
