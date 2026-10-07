import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { loadCase } from '../../skills/runner/core/cases.mjs'
import { runCase } from '../../skills/runner/core/execute.mjs'

async function distill(id, update) {
  const root = process.cwd()
  const entry = loadCase(root, id)
  const directory = mkdtempSync(join(tmpdir(), 'rsp-distill-oracle-'))
  try {
    return await runCase(entry, root, {
      outputRoot: directory,
      adapter: {
        id: 'local-test',
        settings: { provider: 'local-test', model: 'none', effort: 'none' },
        async run({ workspace }) {
          const path = join(workspace, entry.manifest.expected.documents[0])
          writeFileSync(path, update(readFileSync(path, 'utf8')))
          return { exitCode: 0, stdout: JSON.stringify({ type: 'turn.completed' }), stderr: '', finalOutput: 'Local oracle control; meaning requires independent review.' }
        },
      },
    })
  }
  finally { rmSync(directory, { recursive: true, force: true }) }
}

it.each(['maintainer-distill-retained', 'maintainer-topic-retained', 'maintainer-explore-retained'])('accepts an ordinary %s report without managed metadata', async (id) => {
  const run = await distill(id, report => `${report}\nPrefer a separate export procedure.\n`)
  expect(run.verdict.status, JSON.stringify(run.verdict)).toBe('passed')
  expect(run.task.evidence.reports).toEqual([{ path: run.caseSpec.expected.documents[0], status: 'passed', missingSources: [] }])
  expect(run.task.evidence.semanticQuality).toBe('requires-independent-review')
  expect(run.semantic.status).toBe('inconclusive')
})

it.each([
  ['unchanged report', report => report],
  ['empty report', () => ''],
  ['removed source citation', report => `${report.replace(/\]\([^)]+\)/, '](missing.md)')}\nPrefer a separate procedure.\n`],
])('rejects completed execution with %s', async (label, update) => {
  const run = await distill('maintainer-distill-retained', update)
  expect(run.result.exitCode).toBe(0)
  expect(run.task.status).toBe('failed')
  expect(run.verdict.status).toBe('failed')
})
