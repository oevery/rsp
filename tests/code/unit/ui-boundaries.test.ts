import { describe, expect, it } from 'vitest'
import { resolveUiLocale } from '../../../src/tui/i18n/locale.js'
import { markdownLineText, projectMarkdownLines } from '../../../src/tui/markdown-presentation.js'
import { isInteractiveTerminal, shouldAutoLaunchUi, validateUiArgs as validateRouteArgs } from '../../../src/tui/route.js'

describe('terminal boundaries', () => {
  it('renders body Markdown and code literals without exposing metadata or comment hints', () => {
    const markdown = '---\r\ntitle: Metadata only\r\n...\r\n# Visible\r\n<!-- Hidden hint --> Still visible.\r\nLiteral `<!-- hint -->`.\r\n'
    const rendered = projectMarkdownLines(markdown, 80).map(markdownLineText).join('\n')
    expect(rendered).toContain('Visible')
    expect(rendered).toContain('Still visible.')
    expect(rendered).toContain('<!-- hint -->')
    expect(rendered).not.toContain('Metadata only')
    expect(rendered).not.toContain('Hidden hint')
  })

  it('launches UI only for a real interactive terminal', () => {
    const terminal = { stdinTty: true, stdoutTty: true, term: 'xterm', ci: undefined }
    expect(isInteractiveTerminal(terminal)).toBe(true)
    expect(shouldAutoLaunchUi([], terminal)).toBe(true)
    expect(shouldAutoLaunchUi([], { ...terminal, ci: 'true' })).toBe(false)
    expect(shouldAutoLaunchUi([], { ...terminal, term: 'dumb' })).toBe(false)
  })

  it('validates locale arguments at the route boundary', () => {
    expect(validateRouteArgs([])).toEqual({ lang: 'auto' })
    expect(validateRouteArgs(['--lang', 'zh-CN'])).toEqual({ lang: 'zh-CN' })
    expect(() => validateRouteArgs(['--lang', 'fr'])).toThrow('auto, en, or zh-CN')
  })

  it('resolves an explicit locale before environment fallbacks', () => {
    expect(resolveUiLocale('zh-CN', 'en-US', 'en-US')).toBe('zh-CN')
    expect(resolveUiLocale('auto', 'zh-CN', 'en-US')).toBe('zh-CN')
  })
})
