import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string) => readFileSync(join(root, path), 'utf8')
const skill = read('skills/rsp/SKILL.md')
const fallback = read('rules/rsp-rules.md')

function headings(markdown: string): string[] {
  const prose = markdown.replace(/```[\s\S]*?```/g, '')
  return [...prose.matchAll(/^#{2,3} (.+)$/gm)].map(match => match[1])
}

function expectSemanticGroup(body: string, alternatives: string[][]): void {
  for (const group of alternatives) {
    expect(group.some(term => body.includes(term)), `missing semantic group: ${group.join(' | ')}`).toBe(true)
  }
}

describe('rsp core routing contract', () => {
  it('keeps a compact routing entrypoint and conditionally loaded procedures', () => {
    expect(headings(skill)).toEqual([
      'Scope',
      'Derive one next action',
      'Implementation evidence',
      'Release operations',
      'Operate the selected Change',
      'Ownership and safety',
      'Durable decision output',
    ])

    for (const path of [
      'references/setup-repair.md',
      'references/groups-dependencies.md',
      'references/conflict-handling.md',
      'references/durable-review.md',
    ]) {
      expect(skill).toContain(`](${path})`)
      expect(read(`skills/rsp/${path}`)).toMatch(/Load this reference only|Load this reference before/)
    }
    expect(skill.trim().split(/\s+/).length).toBeLessThanOrEqual(1800)
  })

  it('derives one evidence-backed action with capability and owner boundaries', () => {
    expectSemanticGroup(skill, [
      ['user intent'],
      ['`rsp status --json`'],
      ['readiness'],
      ['fresh verification evidence'],
      ['blockers'],
      ['Name at most one optional capability'],
      ['host\'s loaded Skill inventory'],
      ['manual fallback'],
      ['returned owner'],
    ])
    expect(skill).toContain('Stages are derived guidance, never persisted state')
    expect(skill).toContain('Do not preload, enumerate, or recursively invoke optional capabilities')
  })

  it('routes implementation by explained risk instead of by fix labels', () => {
    expect(headings(skill)).toContain('Implementation evidence')
    expectSemanticGroup(skill, [
      ['`rsp-diagnose`'],
      ['unexplained'],
      ['`rsp-tdd`'],
      ['explicitly required'],
      ['concrete changed risk'],
      ['mere testability or being a fix does not'],
      ['Ordinary implementation by default'],
      ['cheapest decisive check'],
      ['same Change'],
    ])
  })

  it('routes design, managed work, and release operations without granting authority', () => {
    expectSemanticGroup(skill, [
      ['one isolated material domain, module/seam, or evidence-seeking design question'],
      ['`rsp-design`'],
      ['explicit managed-completion', 'managed-continuation request'],
      ['one focused ready Change'],
      ['genuinely independent slices'],
      ['Managed routing is never implicit'],
      ['explicitly requests release documentation, finalization, publication, or reconciliation'],
      ['confirmed identity or range'],
      ['A selected Change is not required'],
      ['`rsp-release-docs`'],
      ['Never infer it from version order'],
      ['credential-free `ready` or `not ready`'],
    ])
    expect(skill).toMatch(/never executes or grants commit, tag, push, release creation, publication, deployment, or approval authority/)
    expect(fallback).toMatch(/Route release documentation only for an explicit release operation with a confirmed identity or range/)
  })

  it('resolves an explicit managed owner before Manage qualification', () => {
    for (const body of [skill, fallback]) {
      const resolveOwner = body.indexOf('resolve the smallest sufficient owner before testing Manage eligibility')
      const qualifyManage = body.indexOf('Only after that preflight')

      expect(resolveOwner).toBeGreaterThanOrEqual(0)
      expect(qualifyManage).toBeGreaterThan(resolveOwner)
      expectSemanticGroup(body, [
        ['Reuse one unambiguous selected ready owner'],
        ['tiny settled work'],
        ['without a synthetic Change or controller artifact'],
        ['clear non-trivial work'],
        ['in-scope RSP planning artifacts'],
        ['unless the user requests no edits'],
        ['re-evaluate', 're-evaluate this route'],
        ['without another authorization round'],
        ['single highest-impact owner decision'],
        ['no implementation or controller artifact'],
        ['explicit report-only review or release operation'],
      ])
    }
    expect(skill).toContain('For a material owner decision inside an explicit managed request, continue to the Shape preflight')
  })

  it('keeps persistent artifacts convergent and domain-owned', () => {
    expectSemanticGroup(skill, [
      ['sibling Group Brief when grouped'],
      ['relevant Specs and Decision Records'],
      ['convergent snapshot'],
      ['Replace superseded content'],
      ['routine attempts, RED/GREEN chronology'],
      ['domain, system, user, or operator language'],
      ['actual product actors or constraints'],
      ['planned design to the selected Change'],
      ['stable implemented facts'],
      ['lasting rationale'],
      ['temporary continuation to the response'],
    ])
  })

  it('preserves localized continuation and durable-decision structures', () => {
    const continuationFields = ['WorkRef', 'Authority', 'Current state', 'Changed artifacts', 'Fresh verification', 'Blockers', 'Next action']
    let cursor = -1
    for (const field of continuationFields) {
      const next = skill.indexOf(`\`${field}\``)
      expect(next).toBeGreaterThan(cursor)
      cursor = next
    }

    expect(skill).toContain('Response-only Continuation and Durable Decision labels are not canonical artifact headings')
    expect(skill).toContain('`决策记录（Decision Record）`')
    expect(skill).toContain('<No current-fact update needed | Update existing spec or scoped instruction | Create a new durable spec>')
    expect(skill).toContain('<yes | no>')
  })

  it('prohibits inferred delivery and lifecycle actions', () => {
    expect(skill).toContain('Do not infer implementation, review, Git, publication, or approval authority')
    expect(skill).toMatch(/does not execute archive or grant staging, commit, push, publication, deletion, deployment, approval, or human-acceptance authority/)
    expect(skill).not.toMatch(/automatically (?:commit|push|publish|archive)/i)
  })
})
