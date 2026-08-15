import { describe, expect, it } from 'vitest'

import { inspectChangeDocument } from '../src/core/change-document-inspection.js'
import { DEFAULT_REQUIRED_SECTIONS, VALID_KINDS } from '../src/core/config.js'
import { renderChange } from './integration/harness.js'

const options = {
  name: 'example',
  validKinds: VALID_KINDS,
  requiredSections: DEFAULT_REQUIRED_SECTIONS,
}

describe('strict Change document inspection', () => {
  it('accepts one valid canonical Change document', () => {
    expect(inspectChangeDocument(renderChange('example'), options)).toEqual([])
  })

  it('reports missing and duplicate canonical sections', () => {
    const content = renderChange('example')
      .replace(/## Design\n[\s\S]*?(?=\n## Tasks)/, '')
      .replace('## Tasks', '## Tasks\n- [x] first\n\n## Tasks')

    const diagnostics = inspectChangeDocument(content, options)

    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'missing_section', message: expect.stringContaining('Design') }))
    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'duplicate_section', message: expect.stringContaining('Tasks') }))
  })

  it('reports invalid frontmatter, kind, and title identity', () => {
    const malformed = renderChange('wrong-name')
      .replace('kind: feature', 'kind: unsupported')
      .replace('# Change: wrong-name', '# Change: wrong-name\n# Change: example')

    const diagnostics = inspectChangeDocument(malformed, options)

    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'invalid_kind' }))
    expect(diagnostics).toContainEqual(expect.objectContaining({ code: 'duplicate_heading' }))
  })
})
