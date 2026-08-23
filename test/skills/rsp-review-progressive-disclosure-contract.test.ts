import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { markdownLinks, mutateSemanticUnit, orderedMarkers, satisfiesSemanticContract } from '../support/markdown-contract'

const root = fileURLToPath(new URL('../..', import.meta.url))
const read = (path: string) => readFileSync(join(root, path), 'utf8')
const review = read('skills/rsp-review/SKILL.md')
const codeReview = read('skills/rsp-review/references/code-review.md')
const documentReview = read('skills/rsp-review/references/document-review.md')

const classificationContract = [
  { all: [/Do not read a pipeline reference/iu, /scope and authority/iu, /fixed/iu] },
  { all: [/Code review/u, /only if Code applies/iu] },
  { all: [/Document review/u, /only if Document applies/iu] },
  { all: [/mixed review/iu, /loads both/iu, /authority-only artifacts/iu, /trigger neither/iu] },
]

describe('rsp-review progressive disclosure contract', () => {
  it('fixes scope and authority before classifying and loading pipelines', () => {
    expect(orderedMarkers(review, [
      '## Fix scope and authority',
      '## Classify before loading',
      '[Code review](references/code-review.md)',
      '[Document review](references/document-review.md)',
      '## Report',
    ])).toBe(true)
    expect(markdownLinks(review)).toEqual(expect.arrayContaining([
      'references/code-review.md',
      'references/document-review.md',
    ]))
    expect(satisfiesSemanticContract(review, classificationContract)).toBe(true)

    const eagerPipelines = mutateSemanticUnit(
      review,
      [/Do not read a pipeline reference/iu, /scope and authority/iu],
      unit => unit.replace(/Do not read a pipeline reference/iu, 'Read both pipeline references'),
    )
    expect(satisfiesSemanticContract(eagerPipelines, classificationContract)).toBe(false)
  })

  it('keeps authority-only, mixed, and skipped semantics in the eager kernel', () => {
    const scopeContract = [
      { all: [/authority or evidence/iu, /authority-only/iu, /not reviewed artifacts/iu] },
      { all: [/no reviewed artifacts/iu, /`skipped`/u, /never `clean`/iu] },
      { all: [/missing, ambiguous, or conflicting authority/iu, /Review Scope/iu, /Coverage/iu, /Verdict/iu, /not as a Finding/iu, /skipped pipeline/iu] },
      { all: [/same underlying issue/iu, /one cross-artifact finding/iu] },
    ]
    expect(satisfiesSemanticContract(review, scopeContract)).toBe(true)

    const authorityTriggersReview = mutateSemanticUnit(
      review,
      [/mixed review/iu, /authority-only artifacts/iu, /trigger neither/iu],
      unit => unit.replace(/trigger neither/iu, 'trigger both'),
    )
    expect(satisfiesSemanticContract(authorityTriggersReview, classificationContract)).toBe(false)
  })

  it('keeps detailed Code and Document judgment behind their owning references', () => {
    const codePipelineContract = [
      { all: [/Load this reference only/iu, /fixed reviewed artifacts/iu, /Code pipeline applicable/iu] },
      { all: [/Safety and correctness/iu, /reachable bugs/iu, /data loss/iu, /security violations/iu] },
      { all: [/Production reachability/iu, /hard gate/iu, /real production entry chain/iu] },
    ]
    const documentPipelineContract = [
      { all: [/Load this reference only/iu, /fixed reviewed artifacts/iu, /Document pipeline applicable/iu] },
      { all: [/Authority and traceability/iu, /claims and decisions/iu] },
      { all: [/unresolved product/iu, /ambiguity Finding/iu, /owner judgment/iu] },
      { all: [/unresolved choice/iu, /resolving authority/iu, /ambiguity Finding/iu] },
    ]
    expect(satisfiesSemanticContract(review, codePipelineContract)).toBe(false)
    expect(satisfiesSemanticContract(review, documentPipelineContract)).toBe(false)
    expect(satisfiesSemanticContract(codeReview, codePipelineContract)).toBe(true)
    expect(satisfiesSemanticContract(documentReview, documentPipelineContract)).toBe(true)
  })

  it('preserves fixed-scope read-only findings and resolution authority', () => {
    expect(satisfiesSemanticContract(review, [
      { all: [/Review one fixed change scope/iu, /without modifying/iu, /Code and Document judgment/iu, /deduplicated report/iu] },
      { all: [/Return a report only/iu, /Do not edit files/iu, /apply fixes/iu, /commit/iu, /publish/iu, /approve/iu] },
      { all: [/Later actions/iu, /separate explicit authority/iu] },
    ])).toBe(true)
  })
})
