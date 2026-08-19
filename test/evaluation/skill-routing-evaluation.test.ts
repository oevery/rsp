import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { evaluateSkillRouting, loadPublishedSkillCatalog, loadSkillRoutingManifest, MINIMUM_CASES_PER_OWNER, runSkillRoutingEvaluation } from '../../scripts/skill-routing-evaluation.mjs'

const root = fileURLToPath(new URL('../..', import.meta.url))

describe('deterministic cross-Skill routing evaluation', () => {
  it('covers the selected overlapping owners and the complete published catalog', () => {
    const catalog = loadPublishedSkillCatalog(root)
    const manifest = loadSkillRoutingManifest(root, catalog)
    const result = evaluateSkillRouting({ catalog, manifest })

    expect(manifest.owners).toEqual([
      'rsp-review',
      'rsp-resolve-findings',
      'rsp-implement',
      'rsp-tdd',
    ])
    expect(manifest.owners.every(owner => manifest.positive.filter(item => item.expected_owner === owner).length >= MINIMUM_CASES_PER_OWNER)).toBe(true)
    expect(manifest.owners.every(owner => manifest.hard_negative.filter(item => item.excluded_owner === owner).length >= MINIMUM_CASES_PER_OWNER)).toBe(true)
    expect(result.scope.published_skills).toBe(catalog.length)
    expect(result.collisions).toEqual([])
    expect(result.cases.filter(item => !item.passed)).toEqual([])
    expect(result.result).toBe('passed')
  })

  it('reports identical short descriptions without diluting them with Skill names', () => {
    const catalog = loadPublishedSkillCatalog(root)
    const manifest = loadSkillRoutingManifest(root, catalog)
    const weakened = catalog.map(item => ['rsp-review', 'rsp-resolve-findings'].includes(item.name)
      ? { ...item, description: 'Review.' }
      : item)
    const result = evaluateSkillRouting({ catalog: weakened, manifest })
    const failure = result.collisions.find(item => item.left === 'rsp-resolve-findings' || item.right === 'rsp-resolve-findings')

    expect(result.result).toBe('failed')
    expect(failure).toMatchObject({
      score: 1,
      threshold: manifest.collision_threshold,
    })
  })

  it('keeps the executable diagnostic result aligned with the registered manifest', () => {
    const registered = runSkillRoutingEvaluation(root)

    expect(registered.limitations).toContain('does not prove host or provider trigger behavior')
    expect(registered.result).toBe('passed')
  })
})
