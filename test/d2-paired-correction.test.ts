import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { evaluateD2Pairs, scoreDesignReturn } from '../scripts/d2-paired-correction-eval.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const sha256 = (content: string | Uint8Array) => createHash('sha256').update(content).digest('hex')

describe('d2 paired deterministic correction evidence', () => {
  it('requires every project-design return-envelope field', () => {
    const score = scoreDesignReturn('未决问题：owner?\n权威输入：CONTEXT.md')

    expect(score.missing_fields).toEqual([
      'expected-artifact',
      'mutation-boundary',
      'same-returning-work-ref',
    ])
    expect(score.deterministic_correction_requests).toBe(3)
  })

  it('shows fewer deterministic correction requests for both paired cases', () => {
    const result = evaluateD2Pairs(root)
    const retained = JSON.parse(readFileSync(`${root}/research/evaluations/rsp-daily-workflow-depth/2026-07-21/real-runs/d2-paired.json`, 'utf8'))

    expect(result.passed).toBe(true)
    expect(retained).toEqual(result)
    expect(result.metric).toBe('deterministic-correction-requests')
    expect(result.definition).toContain('not a count of natural user conversation turns')
    expect(result.cases.map(entry => ({
      baseline: entry.baseline.score.deterministic_correction_requests,
      candidate: entry.candidate.score.deterministic_correction_requests,
      id: entry.id,
    }))).toEqual([
      { baseline: 4, candidate: 0, id: 'domain-language' },
      { baseline: 1, candidate: 0, id: 'module-seam' },
    ])
  })

  it('keeps the retained seven-Skill J1 and J2 baseline sanitized and frozen', () => {
    const directories = ['j1-ambiguous-intent', 'j2-domain-language']
    const runs = directories.map((name) => {
      const base = `${root}/research/evaluations/rsp-daily-workflow-depth/2026-07-21/real-runs/${name}`
      const runText = readFileSync(`${base}/run.json`, 'utf8')
      const eventsText = readFileSync(`${base}/events.json`, 'utf8')
      const final = readFileSync(`${base}/final.json`)
      return { eventsText, final, run: JSON.parse(runText), runText }
    })

    expect(new Set(runs.map(entry => entry.run.candidate_package.sha256)).size).toBe(1)
    const frozenPackageHash = '7d64fab954b7366688db5bccf3e38db86c9ad0a671df1669d0e833495c368011'
    const frozenShapeHash = 'e92158292d4dc8f3dc6556b34832bba457e7e9b7a73749567bb7d6860eafcb50'
    const frozenDeepReferenceHash = 'ac3367ef3832c83b96ce86aa2c59a038e4451adb0ae80d93754f79a2b3e8618f'
    for (const { eventsText, final, run, runText } of runs) {
      expect(run.qualification).toBe('qualified')
      expect(run.candidate_package.source).toBe('local tarball built from the current repository')
      expect(run.candidate_package.sha256).toBe(frozenPackageHash)
      expect(run.candidate_package.rsp_shape_skill_sha256).toBe(frozenShapeHash)
      expect(run.git_observation.status_after).toEqual([])
      expect(run.git_observation.before_head).toBe(run.git_observation.after_head)
      expect(run.git_observation.before_tree).toBe(run.git_observation.after_tree)
      expect(run.output.human_facing_language).toBe('zh-CN')
      expect(run.output.canonical_identifiers_preserved).toBe(true)
      expect(run.output.persisted_final_sha256).toBe(sha256(final))
      expect(`${runText}\n${eventsText}`).not.toMatch(/\/Users\/|\/tmp\//u)
    }
    expect(runs[0].run.candidate_package.deep_clarification_sha256).toBe(frozenDeepReferenceHash)
  })
})
