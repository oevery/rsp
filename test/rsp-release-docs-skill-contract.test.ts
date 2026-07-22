import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8')
}

describe('rsp-release-docs Skill contract', () => {
  const skill = read('skills/rsp-release-docs/SKILL.md')
  const conventions = read('skills/rsp-release-docs/references/convention-discovery.md')
  const outputs = read('skills/rsp-release-docs/references/output-contracts.md')

  it('uses the canonical suite name and broad release-documentation trigger', () => {
    expect(skill).toContain('name: rsp-release-docs')
    expect(skill).toContain('changelogs, release notes, and migration notes')
  })

  it('adapts to user and repository authority without inventing configuration', () => {
    expect(skill).toContain('user\'s explicit scope, audience, language, format, reference, and mutation requirements')
    expect(skill).toContain('existing release-tool configuration')
    expect(skill).toContain('target artifact\'s current structure, terminology, and language')
    expect(conventions).toContain('Discover; do not introduce a new configuration file')
    expect(conventions).toContain('Personal preferences refine the project format where compatible')
    expect(conventions).toContain('| Language | Explicit request, nearest project instruction, target artifact, prior published releases, conversation |')
    expect(conventions).toContain('For language specifically, apply the table order without reordering it')
  })

  it('projects one net-release ledger into distinct artifacts', () => {
    expect(skill).toContain('Build the release ledger')
    expect(skill).toContain('Collapse multiple commits into one outcome')
    expect(skill).toContain('Omit changes added and reverted within the same range')
    expect(skill).toContain('Do not merely duplicate the changelog')
    expect(outputs).toContain('## Release evidence ledger')
    expect(outputs).toContain('## Migration contract')
  })

  it('uses useful references and preserves external-action boundaries', () => {
    expect(skill).toContain('Prefer PR links for implementation context')
    expect(skill).toContain('Use commit links when no better semantic anchor exists')
    expect(skill).toContain('Do not force a reference onto every bullet')
    expect(skill).toContain('Preparing prose never grants commit, tag, push, release creation, registry publication, deployment, deletion, or approval authority')
    expect(outputs).toContain('archived verification labeled as historical')
    expect(outputs).toContain('no external publication implied by a draft')
  })
})
