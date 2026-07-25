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
    expect(skill).toContain('This Skill never executes commit, tag, push, release creation, registry publication, deployment, deletion, or approval')
    expect(outputs).toContain('archived verification labeled as historical')
    expect(outputs).toContain('no external publication implied by a draft')
  })

  it('separates audit, draft, publication finalization, and reconciliation', () => {
    expect(skill).toContain('**Audit:**')
    expect(skill).toContain('**Draft:**')
    expect(skill).toContain('**Finalize for publication:**')
    expect(skill).toContain('**Reconcile published release:**')
    expect(skill).toContain('An explicit request to create a tag, GitHub release, registry version, or equivalent public release must pass this branch')
    expect(skill).toContain('one explicitly named archived release Change afterward')
    expect(skill).toContain('only the post-archive candidate may receive the final `ready` handoff')
    expect(skill).toContain('Never rewrite a published package or move an existing tag')
  })

  it('keeps shipped prose publication-invariant and transient state with its owner', () => {
    expect(skill).toContain('## Assign surface lifetime')
    expect(skill).toContain('**publication-invariant**')
    expect(skill).toContain('Internal workflow records merely present in the source tag')
    expect(skill).toContain('exclude transient claims such as “not yet published,” “available after publication,” pending authentication, live registry state, or comparisons ending at `HEAD`')
    expect(skill).toContain('no transient release state is assigned to a shipped surface')
  })

  it('defines a checkable credential-safe publication handoff', () => {
    expect(skill).toContain('## Finalize for publication')
    expect(skill).toContain('the target changelog entry is no longer labeled `Unreleased`')
    expect(skill).toContain('stable comparison links terminate at the target tag or immutable release ref rather than `HEAD`')
    expect(skill).toContain('required lifecycle closeout is already captured by the candidate revision')
    expect(skill).toContain('one-time passwords, browser-auth URLs, device codes, and token-bearing query strings as transient credentials')
    expect(skill).toContain('stop and let the authorized human complete authentication in a trusted local terminal')
    expect(skill).toContain('never include the credential value or URL')
    expect(skill).toContain('credential-free authentication status')
  })
})
