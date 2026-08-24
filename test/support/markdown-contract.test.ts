import { describe, expect, it } from 'vitest'
import { markdownHeadings, markdownLinks, mutateSemanticUnit, orderedMarkers, satisfiesSemanticContract, semanticUnits } from './markdown-contract'

describe('markdown contract helpers', () => {
  it('ignores fenced examples when extracting Markdown structure', () => {
    const markdown = [
      '```md',
      '## Example heading',
      '[Example link](example.md)',
      'first marker',
      'second marker',
      '```',
      '## Real heading',
      '[Real link](real.md)',
    ].join('\n')

    expect(markdownHeadings(markdown)).toEqual(['Real heading'])
    expect(markdownLinks(markdown)).toEqual(['real.md'])
    expect(orderedMarkers(markdown, ['first marker', 'second marker'])).toBe(false)
  })

  it('mutates a wrapped semantic unit instead of silently returning the source', () => {
    const markdown = [
      '- Required verification remains mandatory',
      '  after every accepted correction.',
      '',
      '- Optional coverage remains advisory.',
    ].join('\n')

    expect(semanticUnits(markdown)).toEqual([
      '- Required verification remains mandatory after every accepted correction.',
      '- Optional coverage remains advisory.',
    ])
    expect(mutateSemanticUnit(
      markdown,
      [/Required verification/u, /accepted correction/u],
      unit => unit.replace('mandatory', 'optional'),
    )).toContain('- Required verification remains optional after every accepted correction.')
  })

  it('requires positive and negative terms to hold within the same semantic unit', () => {
    const markdown = [
      'Core may mutate only control-plane state.',
      '',
      'Product mutation belongs to Implement.',
    ].join('\n')

    expect(satisfiesSemanticContract(markdown, [
      { all: [/Core/u, /control-plane/u], none: [/Product mutation/u] },
      { all: [/Product mutation/u, /Implement/u] },
    ])).toBe(true)
    expect(satisfiesSemanticContract(markdown, [
      { all: [/Core/u, /Implement/u] },
    ])).toBe(false)
  })
})
