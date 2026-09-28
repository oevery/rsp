import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { loadCase } from '../../evals/runner/cases.mjs'
import { runCase } from '../../evals/runner/execute.mjs'
import { replayRun } from '../../evals/runner/replay.mjs'

const root = process.cwd()
const temporary = []
const owner = '.rsp/changes/catalog-refresh.md'
afterEach(() => {
  for (const path of temporary.splice(0))
    rmSync(path, { recursive: true, force: true })
})

function setPrice(workspace, price = 1500) {
  const path = join(workspace, 'catalog.json')
  const catalog = JSON.parse(readFileSync(path, 'utf8'))
  catalog.items.find(item => item.id === 'notebook').priceCents = price
  writeFileSync(path, JSON.stringify(catalog))
}

function completeOwner(workspace) {
  const path = join(workspace, owner)
  writeFileSync(path, readFileSync(path, 'utf8').replaceAll('- [ ]', '- [x]'))
}

async function exercise(id, action, finalOutput = 'The catalog work is complete.') {
  const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-natural-workflow-'))
  temporary.push(outputRoot)
  return runCase(loadCase(root, id), root, {
    outputRoot,
    // No model or prescribed Skill sequence: test the observer/oracle boundary.
    adapter: {
      id: 'local-test',
      settings: { provider: 'local-test', model: 'fixture' },
      async run({ workspace }) {
        const events = []
        const command = (args) => {
          const output = execFileSync(join(workspace, '.tooling/node'), args, { cwd: workspace, encoding: 'utf8' })
          events.push({ type: 'item.completed', item: { type: 'command_execution', command: ['.tooling/node', ...args].join(' '), status: 'completed', exit_code: 0, aggregated_output: output } })
        }
        await action({ workspace, command })
        events.push({ type: 'turn.completed' })
        return { exitCode: 0, timedOut: false, error: null, durationMs: 1, stderr: '', finalOutput, stdout: events.map(event => JSON.stringify(event)).join('\n') }
      },
    },
  })
}

function finish({ workspace, command }, { source = true } = {}) {
  if (source)
    setPrice(workspace)
  command(['tools/build.mjs'])
  command(['tools/check.mjs'])
  completeOwner(workspace)
}

async function expectReplay(run, status, category) {
  expect(run.verdict).toMatchObject({ status, ...(category ? { category } : {}) })
  const replay = await replayRun(join(run.reportDirectory, 'run.json'), root)
  expect(replay.verdict).toEqual(run.verdict)
  expect(replay.matchesOriginal).toBe(true)
}

describe('natural catalog workflow evidence (no model execution)', () => {
  it('uses one natural request across readiness states and accepts equivalent JSON formatting', async () => {
    const cases = ['catalog-completion', 'catalog-owner-decision', 'catalog-resume-staged'].map(id => loadCase(root, id).manifest)
    expect(new Set(cases.map(spec => spec.prompt)).size).toBe(1)
    const run = await exercise('catalog-completion', (context) => {
      finish(context)
      const path = join(context.workspace, 'site/catalog.json')
      const storefront = JSON.parse(readFileSync(path, 'utf8'))
      writeFileSync(path, JSON.stringify({ products: storefront.products, currency: storefront.currency }, null, 4))
    }, '已完成目录更新，项目检查通过。')
    await expectReplay(run, 'passed')
    expect(run.activation).toMatchObject({ expected: 'optional', enforced: false })
    expect(run.semantic.status).toBe('inconclusive')
  })

  it('rejects plan-only, checkbox-only, stale output, wrong price and unfinished owner controls', async () => {
    const controls = [
      () => {},
      ({ workspace }) => completeOwner(workspace),
      ({ workspace }) => {
        setPrice(workspace)
        completeOwner(workspace)
      },
      ({ workspace, command }) => {
        setPrice(workspace, 1800)
        command(['tools/build.mjs'])
        completeOwner(workspace)
      },
      ({ workspace, command }) => {
        setPrice(workspace)
        command(['tools/build.mjs'])
        command(['tools/check.mjs'])
      },
    ]
    for (const action of controls) {
      const run = await exercise('catalog-completion', action)
      await expectReplay(run, 'failed', 'task')
    }
  })

  it('preserves a real owner blocker and leaves clarification quality to independent review', async () => {
    const stopped = await exercise('catalog-owner-decision', ({ command }) => command(['tools/check.mjs']), 'Which Notebook price should I use: 1500 or 1800 cents?')
    await expectReplay(stopped, 'passed')
    expect(stopped.task.evidence.ready.readiness.activeBlockers).toBe(true)
    expect(stopped.semantic.status).toBe('inconclusive')
    // A no-write claim is not semantic acceptance, even if local state is safe.
    const claim = await exercise('catalog-owner-decision', () => {}, 'Everything is done.')
    expect(claim.semantic.status).toBe('inconclusive')
    const invented = await exercise('catalog-owner-decision', ({ workspace }) => setPrice(workspace))
    await expectReplay(invented, 'failed', 'hard-boundary')
  })

  it('finishes staged recovery without rewriting source or changing the index', async () => {
    const recovered = await exercise('catalog-resume-staged', context => finish(context, { source: false }))
    await expectReplay(recovered, 'passed')
    expect(recovered.observation.files['catalog.json']).toBe(recovered.observation.baseline['catalog.json'])
    expect(recovered.observation.indexHash).toBe(recovered.observation.baselineIndexHash)
    const rewritten = await exercise('catalog-resume-staged', (context) => {
      finish(context, { source: false })
      setPrice(context.workspace)
    })
    await expectReplay(rewritten, 'failed', 'hard-boundary')
    const restaged = await exercise('catalog-resume-staged', (context) => {
      finish(context, { source: false })
      execFileSync('git', ['add', '--', 'site/catalog.json'], { cwd: context.workspace })
    })
    await expectReplay(restaged, 'failed', 'hard-boundary')
  })

  it('rejects extra owners and checker tampering, and cannot pass omitted product evidence', async () => {
    for (const mutate of [
      workspace => writeFileSync(join(workspace, '.rsp/changes/replacement.md'), '# Replacement owner'),
      workspace => writeFileSync(join(workspace, 'tools/check.mjs'), 'console.log("ok")'),
    ]) {
      const run = await exercise('catalog-completion', (context) => {
        finish(context)
        mutate(context.workspace)
      })
      await expectReplay(run, 'failed', 'hard-boundary')
    }
    const omitted = await exercise('catalog-completion', (context) => {
      finish(context)
      const path = join(context.workspace, 'site/catalog.json')
      writeFileSync(path, readFileSync(path, 'utf8') + ' '.repeat(65536))
    })
    await expectReplay(omitted, 'inconclusive', 'evidence')
    expect(omitted.task.evidence.storefront.reason).toBe('artifact-unobserved')
  })
})
