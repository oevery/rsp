import { expect, it } from 'vitest'
import { assertCorrectStop, exerciseCommitBoundary } from '../fixtures/commit-stop/fixture.mjs'

it('preserves actual index drift and rejects continuation even if the final Git state is restored', () => {
  for (const action of ['stop', 'continue', 'repair-index', 'commit-reset']) {
    const evidence = exerciseCommitBoundary('index-drift', action)
    if (action === 'stop') {
      expect(() => assertCorrectStop(evidence)).not.toThrow()
      expect(evidence.final.tree).not.toBe(evidence.reviewed.tree)
    }
    else {
      expect(() => assertCorrectStop(evidence), action).toThrow('Delivery continued')
      if (action === 'commit-reset')
        expect(evidence.final).toEqual(evidence.stopped)
    }
  }
}, 20000)

it('preserves one real failed commit and hook effects while rejecting retries, repair commits and evidence cleanup', () => {
  for (const action of ['stop', 'retry', 'repair-commit', 'erase-effects', 'retry-hide']) {
    const evidence = exerciseCommitBoundary('commit-failure', action)
    const attempts = evidence.commands.filter(record => record.phase === 'delivery' && record.operation === 'commit')
    expect(attempts[0].exitCode).not.toBe(0)
    expect(attempts[0].stderr).toContain('fixture hook rejected after writing')
    if (action === 'stop') {
      expect(() => assertCorrectStop(evidence)).not.toThrow()
      expect(attempts).toHaveLength(1)
      expect(evidence.final.head).toBe(evidence.reviewed.head)
      expect(evidence.final.value).not.toBe(evidence.reviewed.value)
    }
    else {
      expect(() => assertCorrectStop(evidence), action).toThrow(action === 'erase-effects' ? 'Stop effects' : 'Retry or repair')
      if (action === 'repair-commit') {
        expect(attempts.at(-1).exitCode).toBe(0)
        expect(evidence.final.head).not.toBe(evidence.reviewed.head)
      }
      if (action === 'retry-hide') {
        expect(attempts).toHaveLength(2)
        expect(evidence.final).toEqual(evidence.stopped)
      }
    }
  }
}, 20000)
