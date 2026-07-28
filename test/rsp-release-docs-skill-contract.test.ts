import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string) => readFileSync(join(root, path), 'utf8')
const skill = read('skills/rsp-release-docs/SKILL.md')
const conventions = read('skills/rsp-release-docs/references/convention-discovery.md')
const evidence = read('skills/rsp-release-docs/references/evidence-and-surfaces.md')
const outputs = read('skills/rsp-release-docs/references/output-contracts.md')
const publication = read('skills/rsp-release-docs/references/publication-lifecycle.md')

const includesAny = (body: string, terms: string[]) => terms.some(term => body.includes(term))

describe('rsp-release-docs Skill contract', () => {
  it('keeps the entrypoint compact and routes detailed references conditionally', () => {
    expect(skill).toContain('name: rsp-release-docs')

    const routes = [
      ['references/convention-discovery.md', /when repository, personal, tool, or historical conventions/],
      ['references/evidence-and-surfaces.md', /before drafting the ledger, classifying statement lifetime, or deciding exclusions/],
      ['references/output-contracts.md', /before introducing a format, preparing a major\/breaking release, or producing multiple surfaces/],
      ['references/publication-lifecycle.md', /before a publication handoff or post-publication reconciliation/],
    ] as const
    for (const [path, trigger] of routes) {
      expect(skill).toContain(`](${path})`)
      expect(skill).toMatch(trigger)
      expect(read(`skills/rsp-release-docs/${path}`).length).toBeGreaterThan(100)
    }
  })

  it('selects exactly one lifecycle branch and preserves identity ownership', () => {
    for (const branch of ['**Audit:**', '**Draft:**', '**Finalize for publication:**', '**Reconcile published release:**']) {
      expect(skill).toContain(branch)
    }
    expect(skill).toContain('Exactly one branch is active')
    expect(skill).toMatch(/release identity is confirmed only by explicit user instruction or authoritative repository release configuration/i)
    expect(skill).toContain('Never infer it from semantic-version ordering')
    expect(skill).toContain('Bind `ready` to the exact release commit')
    expect(skill).toContain('Never rewrite a published package or move a tag')
  })

  it('uses one net-release ledger with explicit coverage and surface lifetimes', () => {
    expect(skill).toContain('Build evidence before prose')
    expect(skill).toContain('Every relevant commit and work item must map to a net outcome or explicit exclusion')
    expect(evidence).toContain('## Evidence ledger')
    expect(evidence).toContain('## Surface lifetime')
    expect(evidence).toContain('## References')
    expect(includesAny(evidence, ['publication-invariant'])).toBe(true)
    expect(evidence).toMatch(/Transient release state[\s\S]+never shipped prose/)
    expect(outputs).not.toContain('## Release evidence ledger')
    expect(outputs).not.toContain('## Reference rules')
    expect(outputs).toContain('## Migration contract')
  })

  it('adapts output without inventing repository configuration', () => {
    expect(skill).toMatch(/user scope, audience, language, format, references, and mutation authority/)
    expect(conventions).toContain('Discover; do not introduce a new configuration file')
    expect(conventions).toContain('Personal preferences refine the project format where compatible')
    expect(conventions).toContain('| Language | Explicit request, nearest project instruction, target artifact, prior published releases, conversation |')
  })

  it('makes finalization checkable and credential-safe', () => {
    expect(publication).toContain('## Finalization gate')
    expect(publication).toMatch(/target changelog entry is not labeled `Unreleased`/)
    expect(publication).toMatch(/target tag or immutable ref, not `HEAD`/)
    expect(publication).toMatch(/package inventory and release checks are fresh/)
    expect(publication).toMatch(/lifecycle closeout is in the candidate revision/)
    expect(skill).toContain('credential-free status')
    expect(skill).not.toMatch(/(?:print|return|record) (?:the )?(?:token|password|device code|browser-auth URL)/i)
  })

  it('preserves release and external-action ownership boundaries', () => {
    expect(skill).toContain('A confirmed mechanical release does not require an RSP Change')
    expect(skill).toContain('Use an optional Release Change only when material')
    expect(skill).toContain('Do not create one for a checklist')
    expect(skill).toMatch(/never executes or grants authority for commit, tag, push, hosted release creation, registry publication, deployment, deletion, approval/)
    expect(publication).toMatch(/never move tags or rewrite packages/)
    expect(outputs).toContain('no external publication implied by a draft')
  })
})
