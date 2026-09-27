import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadCase } from '../../evals/runner/cases.mjs'
import { compareCase } from '../../evals/runner/compare.mjs'
import { createLocalAdapter } from '../../evals/runner/execute.mjs'

const root = fileURLToPath(new URL('../..', import.meta.url))

describe('paired evaluation comparison', () => {
  it('balances seeded pair order while judging candidate boundaries independently', async () => {
    const entry = loadCase(root, 'preserve-user-files')
    const result = await compareCase(entry, root, {
      adapter: createLocalAdapter(process.execPath, [`${root}/tests/engine/fixtures/provider.mjs`]),
      candidateComposition: `${root}/skills`,
      repetitions: 2,
      seed: 'comparison-regression',
    })

    expect(result.scheduling).toEqual({ order: 'seeded-balanced-pairs', seed: 'comparison-regression', concurrency: 1 })
    expect(result.runs[0].arm).not.toBe(result.runs[1].arm)
    expect(result.runs[0].arm).toBe(result.runs[3].arm)
    expect(result.runs[1].arm).toBe(result.runs[2].arm)
    expect(result.summary).toMatchObject({
      candidate: { passed: 2, failed: 0 },
      status: 'passed',
      regression: 'not-observed',
    })
  })
})
