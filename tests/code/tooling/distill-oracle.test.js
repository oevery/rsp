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
          return { exitCode: 0, stdout: JSON.stringify({ type: 'turn.completed' }), stderr: '', finalOutput: 'Local oracle control; research meaning requires independent review.' }
        },
      },
    })
  }
  finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

it.each(['maintainer-distill-retained', 'maintainer-topic-retained'])('accepts a completed %s draft while leaving meaning to semantic review', async (id) => {
  const run = await distill(id, draft => `${draft}Prefer a separate export procedure.\n`)
  expect(run.verdict.status, JSON.stringify(run.verdict)).toBe('passed')
  expect(run.task.evidence.studies).toEqual([{ path: run.caseSpec.expected.documents[0], status: 'passed', missingEvidence: [], addedEvidence: [] }])
  expect(run.task.evidence.semanticQuality).toBe('requires-independent-review')
  expect(run.semantic.status).toBe('inconclusive')
})

it.each([
  ['missing frontmatter', () => 'Prefer a separate export procedure.\n'],
  ['empty body', draft => `${draft} \n`],
  ['empty evidence', draft => `${draft.replace(/evidence:\n {2}- [a-f0-9]{64}/u, 'evidence: []')}Prefer a separate export procedure.\n`],
  ['replaced evidence', draft => `${draft.replace(/[a-f0-9]{64}/u, 'a'.repeat(64))}Prefer a separate export procedure.\n`],
  ['added nonexistent evidence', draft => `${draft.replace(/evidence:\n/u, `evidence:\n  - ${'a'.repeat(64)}\n`)}Prefer a separate export procedure.\n`],
])('rejects completed execution with %s in the research draft', async (label, update) => {
  const run = await distill('maintainer-distill-retained', update)
  expect(run.result.exitCode).toBe(0)
  expect(run.hard.status).toBe('passed')
  expect(run.task.status).toBe('failed')
  expect(run.task.evidence.studies[0].status).toBe('failed')
  expect(run.verdict).toMatchObject({ status: 'failed', category: 'task' })
})
