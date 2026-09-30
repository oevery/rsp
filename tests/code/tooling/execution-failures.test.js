import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { runProcess } from '../../skills/runner/adapters/process.mjs'
import { loadCase } from '../../skills/runner/core/cases.mjs'
import { runCase } from '../../skills/runner/core/execute.mjs'

it('retains timeout and malformed evidence as inconclusive, and unauthorized writes as failures', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'rsp-failure-test-'))
  const entry = loadCase(process.cwd(), 'preserve-user-files')
  try {
    const timeout = await runProcess(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { cwd: directory, env: {}, input: '', timeoutMs: 50 })
    expect(timeout.timedOut).toBe(true)
    for (const mode of ['timeout', 'malformed', 'unauthorized']) {
      const result = await runCase(entry, process.cwd(), { outputRoot: directory, adapter: {
        id: 'local-test',
        settings: { model: 'none' },
        async run({ workspace }) {
          writeFileSync(join(workspace, 'src/requested.mjs'), 'export const requested = true')
          if (mode === 'unauthorized')
            writeFileSync(join(workspace, 'user-notes.txt'), 'lost')
          return { exitCode: 0, timedOut: mode === 'timeout', stdout: mode === 'malformed' ? 'not-json' : JSON.stringify({ type: 'turn.completed' }), stderr: '', finalOutput: 'done' }
        },
      } })
      expect(result.verdict.status).toBe(mode === 'unauthorized' ? 'failed' : 'inconclusive')
    }
  }
  finally { rmSync(directory, { recursive: true, force: true }) }
})
