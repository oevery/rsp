import { readdirSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadVerificationTopology } from '../../../scripts/verification-platform.mjs'
import vitestConfig from '../../../vitest.config.js'

const root = resolve(fileURLToPath(new URL('../../..', import.meta.url)))

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
  it('uses one verification root while retaining semantic layer ownership', () => {
    const topology = loadVerificationTopology(root)

    expect(readdirSync(resolve(root, 'verification'), { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()).toEqual(['acceptance', 'artifacts', 'contracts', 'evaluations', 'fixtures', 'harness', 'scenarios', 'tests'])
    expect(topology.by_layer.test).toHaveLength(1)
    expect(topology.by_layer.evaluation).toHaveLength(56)
    expect(topology.by_layer.acceptance).toHaveLength(6)
    expect(topology.by_layer.evaluation.every(scenario => scenario.execution_mode === 'local' || scenario.execution_mode === 'fake-provider')).toBe(true)
    expect(topology.by_layer.acceptance.every(scenario => scenario.execution_mode === 'disposable-project')).toBe(true)
    expect(topology.config.provider.real_execution).toBe('disabled')
  })

  it('keeps executable tests inside the unified test boundary', () => {
    const entries = readdirSync(resolve(root, 'verification/tests'), { withFileTypes: true })

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

  it('limits Vitest collection to executable tests under the unified test boundary', () => {
    expect(vitestConfig.test?.include).toEqual(['verification/tests/**/*.test.{ts,tsx}'])
    expect(vitestConfig.test?.exclude).toEqual(expect.arrayContaining([
      'verification/tests/**/fixtures/**',
      'verification/tests/**/holdout/**',
    ]))
  })

  it('keeps only small single-owner fixtures under executable tests', () => {
    expect(findDatasetDirectories(resolve(root, 'verification/tests')).sort()).toEqual([
      'verification/tests/skills/artifact-continuation/fixtures',
      'verification/tests/status/fixtures',
    ])
  })

  it('keeps reusable datasets inside the unified evaluation boundary', () => {
    expect(readdirSync(resolve(root, 'verification/evaluations'), { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()).toEqual([
      'agent-evaluation',
      'assisted-loop',
      'daily-workflow-depth',
      'discipline-composition',
      'managed-controller',
      'native-design-composition',
      'release-behavior',
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
