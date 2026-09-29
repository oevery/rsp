import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { loadTaskOracle } from '../../evals/graders/task-result.mjs'
import { loadCase } from '../../evals/runner/cases.mjs'

const temporary = []
afterEach(() => {
  for (const path of temporary.splice(0))
    rmSync(path, { recursive: true, force: true })
})

describe('documentation evaluation evidence', () => {
  it('uses the same factual corpus and quality dimensions for writing and review', () => {
    const writer = loadCase(process.cwd(), 'doc-write-grounded')
    const reviewer = loadCase(process.cwd(), 'doc-review-grounded')
    for (const path of ['export.mjs', 'project-brief.md', 'user-notes.txt']) {
      expect(readFileSync(join(writer.directory, 'fixture', path), 'utf8'))
        .toBe(readFileSync(join(reviewer.directory, 'fixture', path), 'utf8'))
    }
    expect(writer.manifest.rubric.map(item => item.name)).toEqual(reviewer.manifest.rubric.map(item => item.name))
    const directory = mkdtempSync(join(tmpdir(), 'rsp-doc-corpus-'))
    temporary.push(directory)
    const output = join(directory, 'snapshot.json')
    const script = join(writer.directory, 'fixture/export.mjs')
    const run = tenant => spawnSync(process.execPath, [script, output], { env: { EXPORT_TENANT: tenant }, encoding: 'utf8' })
    expect(run('').status).toBe(2)
    expect(run('demo').status).toBe(0)
    const original = readFileSync(output, 'utf8')
    expect(JSON.parse(original)).toEqual({ tenant: 'demo', job: 'daily', records: [{ id: 1 }] })
    expect(run('other').status).toBe(3)
    expect(readFileSync(output, 'utf8')).toBe(original)
  })

  it('rejects missing or out-of-scope writing without treating nonempty prose as semantic acceptance', async () => {
    const entry = loadCase(process.cwd(), 'doc-write-grounded')
    const oracle = await loadTaskOracle(entry)
    const observation = {
      changedPaths: ['README.md'],
      artifacts: Object.fromEntries(entry.manifest.expected.documents.map(path => [path, 'Unjudged prose.'])),
    }
    const verify = patch => oracle.verify({ case: entry.manifest, result: { exitCode: 0, finalOutput: 'Edited documents.' }, observation: { ...observation, ...patch } })
    expect(await verify({})).toMatchObject({ status: 'passed', evidence: { semanticQuality: 'requires-independent-review' } })
    expect(await verify({ artifacts: {} })).toMatchObject({ status: 'failed' })
    expect(await verify({ changedPaths: ['README.md', 'export.mjs'] })).toMatchObject({ status: 'failed' })
    expect(await verify({ changedPaths: [] })).toMatchObject({ status: 'failed' })
  })
})
