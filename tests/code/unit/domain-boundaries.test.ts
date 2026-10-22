import { describe, expect, it } from 'vitest'
import { parseFrontmatter } from '../../../src/core/content.js'
import { isCanonicalExecutableWorkRef, normalizeExecutableWorkRef } from '../../../src/core/work-ref.js'

describe('domain boundaries', () => {
  it('parses frontmatter without confusing body content for metadata', () => {
    expect(parseFrontmatter('---\nkind: fix\n---\n# Change: sample\n')).toEqual({ kind: 'fix' })
    expect(parseFrontmatter('# Change: sample\n')).toBeNull()
    expect(parseFrontmatter('---\r\nkind: fix\r\nsummary: |\r\n  # Change: metadata only\r\n...\r\n# Change: sample\r\n')).toEqual({ kind: 'fix', summary: '# Change: metadata only\n' })
    expect(() => parseFrontmatter('---\nkind: fix\nkind: docs\n---\n')).toThrow('unique')
  })

  it('normalizes only safe executable identities', () => {
    expect(normalizeExecutableWorkRef('safe-name')).toBe('safe-name')
    expect(isCanonicalExecutableWorkRef('safe-name')).toBe(true)
    expect(() => normalizeExecutableWorkRef('../escape')).toThrow()
  })
})
