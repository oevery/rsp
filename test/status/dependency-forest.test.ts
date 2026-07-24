import type { ChangeDependencyPlanOutput } from '../../src/types.js'
import { describe, expect, it } from 'vitest'
import { projectDependencyForest } from '../../src/status/dependency-forest.js'

describe('dependency forest projection', () => {
  it('projects transitive prerequisites once and marks later occurrences as shared', () => {
    const plan: ChangeDependencyPlanOutput = {
      nodes: [
        { name: 'delivery/api', selection: 'selected', state: 'waiting' },
        { name: 'delivery/ui', selection: 'selected', state: 'blocked' },
        { name: 'foundation', selection: 'prerequisite', state: 'waiting' },
        { name: 'setup', selection: 'prerequisite', state: 'archived' },
      ],
      ready: [],
      edges: [
        { change: 'delivery/api', requires: 'foundation', reason: 'API needs foundation', state: 'open' },
        { change: 'delivery/ui', requires: 'foundation', reason: 'UI needs foundation', state: 'open' },
        { change: 'foundation', requires: 'setup', reason: 'foundation needs setup', state: 'archived' },
      ],
      blocked: [{ change: 'delivery/ui', requires: ['foundation'], external: false }],
      waves: [['setup'], ['foundation'], ['delivery/api', 'delivery/ui']],
    }

    expect(projectDependencyForest(plan, ['delivery/api', 'delivery/ui'])).toEqual([
      {
        name: 'delivery/api',
        selection: 'selected',
        state: 'waiting',
        shared: false,
        children: [{
          name: 'foundation',
          selection: 'prerequisite',
          state: 'waiting',
          reason: 'API needs foundation',
          edgeState: 'open',
          shared: false,
          children: [{
            name: 'setup',
            selection: 'prerequisite',
            state: 'archived',
            reason: 'foundation needs setup',
            edgeState: 'archived',
            shared: false,
            children: [],
          }],
        }],
      },
      {
        name: 'delivery/ui',
        selection: 'selected',
        state: 'blocked',
        shared: false,
        children: [{
          name: 'foundation',
          selection: 'prerequisite',
          state: 'waiting',
          reason: 'UI needs foundation',
          edgeState: 'open',
          shared: true,
          children: [],
        }],
      },
    ])
  })
})
