import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { evaluateSkillRouting, loadPublishedSkillCatalog, loadSkillRoutingManifest } from '../../../scripts/skill-routing-evaluation.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))

describe('deterministic cross-Skill routing evaluation', () => {
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
})
