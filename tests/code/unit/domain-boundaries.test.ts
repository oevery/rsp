import { describe, expect, it } from 'vitest'
import { generateChangeContent } from '../../../src/core/artifacts.js'
import { classifyVerifyCheckboxes, parseFrontmatter } from '../../../src/core/content.js'
import { CHANGE_DOCUMENT_SCHEMA, getDocumentSectionBody, parseRspDocument } from '../../../src/core/document-model.js'
import { isPathContained } from '../../../src/core/path-identity.js'
import { isCanonicalExecutableWorkRef, normalizeExecutableWorkRef } from '../../../src/core/work-ref.js'

describe('domain boundaries', () => {
  it('parses frontmatter without confusing body content for metadata', () => {
    expect(parseFrontmatter('---\nkind: fix\n---\n# Change: sample\n')).toEqual({ kind: 'fix' })
    expect(parseFrontmatter('# Change: sample\n')).toBeNull()
  })

  it('keeps required and optional verification evidence separate', () => {
    const summary = classifyVerifyCheckboxes('### Required\n- [ ] build\n### Optional\n- [ ] manual\n')
    expect(summary.required.todo).toBe(1)
    expect(summary.optional.todo).toBe(1)
    expect(summary.legacy).toBe(false)
  })

  it('parses the public Change shape and exposes its section body', () => {
    const source = generateChangeContent('domain-boundary', 'test boundary', 'fix')
    const document = parseRspDocument(source, CHANGE_DOCUMENT_SCHEMA)
    expect(document.title).toBe('domain-boundary')
    expect(document.missingSections).toEqual([])
    expect(getDocumentSectionBody(document, 'proposal')).toContain('test boundary')
  })

  it('normalizes only safe executable identities and contains paths', () => {
    expect(normalizeExecutableWorkRef('safe-name')).toBe('safe-name')
    expect(isCanonicalExecutableWorkRef('safe-name')).toBe(true)
    expect(() => normalizeExecutableWorkRef('../escape')).toThrow()
    expect(isPathContained('/tmp/project', '/tmp/project/src/index.ts')).toBe(true)
    expect(isPathContained('/tmp/project', '/tmp/project-elsewhere/file')).toBe(false)
  })
})
