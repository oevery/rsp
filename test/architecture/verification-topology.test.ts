import { readdirSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import vitestConfig from '../../vitest.config.js'

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)))

function findDatasetDirectories(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (!entry.isDirectory())
      return []
    const path = resolve(directory, entry.name)
    const nested = findDatasetDirectories(path)
    return ['fixtures', 'holdout', 'beta'].includes(entry.name)
      ? [relative(root, path), ...nested]
      : nested
  })
}

describe('verification topology', () => {
  it('separates source-owner tests from workflow-owner contracts', () => {
    const entries = readdirSync(resolve(root, 'test'), { withFileTypes: true })

    expect(entries.filter(entry => entry.isFile() && /\.test\.(?:ts|tsx)$/u.test(entry.name))).toEqual([])
    expect(entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()).toEqual([
      'architecture',
      'cli',
      'commands',
      'core',
      'evaluation',
      'history',
      'integration',
      'release',
      'skills',
      'specs',
      'status',
      'support',
      'tooling',
      'tui',
    ])
  })

  it('limits Vitest collection to executable tests under the test boundary', () => {
    expect(vitestConfig.test?.include).toEqual(['test/**/*.test.{ts,tsx}'])
    expect(vitestConfig.test?.exclude).toEqual(expect.arrayContaining([
      'test/**/fixtures/**',
      'test/**/holdout/**',
    ]))
  })

  it('keeps only small single-owner fixtures under executable tests', () => {
    expect(findDatasetDirectories(resolve(root, 'test')).sort()).toEqual([
      'test/skills/artifact-continuation/fixtures',
      'test/status/fixtures',
    ])
  })

  it('keeps reusable Skill and agent datasets under the evaluation boundary', () => {
    expect(readdirSync(resolve(root, 'evaluation'), { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()).toEqual([
      'assisted-loop',
      'daily-workflow-depth',
      'discipline-composition',
      'managed-controller',
      'native-design-composition',
      'rsp-design-behavior',
      'rsp-diagnose',
      'rsp-shape-depth',
      'rsp-tdd-behavior',
      'rsp-tdd-forward',
      'skill-behavior',
      'skill-restraint-eval',
      'skill-routing',
      'structural-audit',
    ])
  })
})
