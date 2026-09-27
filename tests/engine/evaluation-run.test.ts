import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { loadCase } from '../../evals/runner/cases.mjs'
import { runCase } from '../../evals/runner/execute.mjs'

const root = fileURLToPath(new URL('../..', import.meta.url))

describe('evaluation execution boundary', () => {
  it('observes an adapter change through the isolated workspace and oracle', async () => {
    const entry = loadCase(root, 'preserve-user-files')
    const result = await runCase(entry, root, {
      command: process.execPath,
      args: [
        '--eval',
        'require(\'node:fs\').writeFileSync(\'src/requested.mjs\', \'export const requested = true\\n\'); console.log(JSON.stringify({type:"item.completed",item:{type:"agent_message",text:"Changed requested export; no tests run."}})); console.log(JSON.stringify({type:"turn.completed"}))',
      ],
    })

    expect(result.result?.exitCode).toBe(0)
    expect(result.observation?.changedPaths).toEqual(['src/requested.mjs'])
    expect(result.verdict.status).toBe('passed')
  })
})
