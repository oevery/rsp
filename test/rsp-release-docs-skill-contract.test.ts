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
    expect(skill).toContain('Bind `ready` to the exact release commit')
    expect(skill).toContain('Never rewrite a published package or move an existing tag')
  })

  it('defers identity-bearing surfaces until release operation authority confirms them', () => {
    expect(skill).toContain('A release identity is confirmed only when the user states it or an authoritative repository release configuration already selects it')
    expect(skill).toContain('Never infer the next version from semantic-version ordering, a previous prerelease, commit contents, a planned changelog, or package-manager convention')
    expect(skill).toContain('build a version-neutral ledger while the release identity may still change')
    expect(skill).toContain('do not mutate version manifests, target changelog headings, exact-version README commands, versioned release-note paths, or tag comparisons before identity is confirmed')
    expect(skill).toContain('finalize version manifests and versioned shipped surfaces in a separate release commit')
  })

  it('uses transient release ownership by default and Changes only for durable coordination', () => {
    expect(skill).toContain('## Choose transient or durable ownership')
    expect(skill).toContain('A confirmed mechanical release does not require an RSP Change')
    expect(skill).toContain('keep the ledger, command progress, authentication state, and publication handoff transient')
    expect(skill).toContain('Use an optional Release Change only when material version/range, migration, rollback, security, compatibility, cross-repository/team, multi-stage handoff, recovery, blocker, or acceptance decisions need a persistent owner')
    expect(skill).toContain('Do not create one merely to repeat the release checklist, verification output, or prose already owned by release surfaces')
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
