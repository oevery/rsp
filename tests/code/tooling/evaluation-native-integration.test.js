import { chmodSync, copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { verify as verifyCompletion } from '../../skills/cases/native-coordination/completion/oracle.mjs'
import { verify as verifyResume } from '../../skills/cases/native-coordination/resume/oracle.mjs'
import { verify as verifyUnavailable } from '../../skills/cases/native-coordination/verification-failure/oracle.mjs'
import { createNativeOpenCodexAdapter, createOpenCodexAdapter } from '../../skills/runner/adapters/opencodex.mjs'
import { gradeNativeCoordination } from '../../skills/runner/graders/native-coordination.mjs'
import { createReviewPacket } from '../../skills/runner/graders/packet.mjs'

const temporary = []
afterEach(() => {
  for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true })
})

describe('native evaluation integration', () => {
  it.each([['completion', verifyCompletion], ['resume', verifyResume]])('grades actual retained checkout artifacts in the isolated %s oracle', async (_name, verify) => {
    const observation = {
      checks: { rspReady: { result: { ok: true, readiness: { archiveReady: 'yes' } } } },
      artifacts: {
        'src/pricing.mjs': 'export function lineTotal({ unitCents, quantity, discountPercent }) { return Math.round(unitCents * quantity * (100 - discountPercent) / 100) }',
        'src/checkout.mjs': `import { lineTotal } from "./pricing.mjs"
export function checkout(tenant, lines) {
  const subtotalCents = lines.reduce((sum, line) => sum + lineTotal(line), 0)
  const shippingCents = subtotalCents >= 2000 ? 0 : 250
  return { tenant, subtotalCents, shippingCents, totalCents: subtotalCents + shippingCents }
}`,
        'tools/check.mjs': readFileSync('tests/skills/projects/complex/checkout/tools/check.mjs', 'utf8'),
      },
    }
    expect((await verify({ observation })).status).toBe('passed')
    observation.artifacts['src/pricing.mjs'] = 'export function lineTotal() { return 0 }'
    expect((await verify({ observation })).status).toBe('failed')
  })

  it.each(['false # tools/check.mjs', 'echo tools/check.mjs; false', 'false && .tooling/node tools/check.mjs'])('does not mistake a path mention for checker execution: %s', async (command) => {
    const observation = { checks: { rspReady: { result: { ok: true, readiness: { archiveReady: 'no', incompleteRequiredVerify: 1 } } } } }
    const events = { commands: [{ command, status: 'completed', exitCode: 1 }] }
    expect((await verifyUnavailable({ observation, events })).status).toBe('failed')
    events.commands[0].command = '.tooling/node tools/check.mjs'
    expect((await verifyUnavailable({ observation, events })).status).toBe('passed')
  })

  it('requires explicit native selection and restricts commit permission to the fixture Git directory', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'rsp-native-preflight-'))
    temporary.push(dir)
    const codexBin = join(dir, 'provider')
    copyFileSync('tests/code/tooling/fixtures/provider.mjs', codexBin)
    chmodSync(codexBin, 0o755)
    const configFile = join(dir, 'provider.toml')
    writeFileSync(configFile, 'model_provider = "fixture-provider"')
    const authFile = join(dir, 'auth.json')
    writeFileSync(authFile, JSON.stringify({ token: 'synthetic-fixture-credential' }))
    const options = { codexBin, configFile, authFile }
    expect(createOpenCodexAdapter(options).preflight().status).toBe('passed')
    expect(() => createOpenCodexAdapter({ ...options, requireWorker: true })).toThrow('Required-worker mode unavailable')
    const native = createNativeOpenCodexAdapter(options)
    expect(native.id).toBe('opencodex-native-v1')
    expect(native.preflight()).toMatchObject({ status: 'passed', providerInvocations: 0, requiredWorkerAvailable: 'unknown' })
    expect(native.settings.nativePolicyHash).toBeTruthy()
    const standard = createOpenCodexAdapter(options)
    const ordinary = await standard.run({ workspace: dir, prompt: 'isolation-probe' })
    const allowed = await standard.run({ workspace: dir, prompt: 'isolation-probe', writableGit: true })
    expect(JSON.parse(ordinary.finalOutput).writableGit).toBeNull()
    expect(JSON.parse(allowed.finalOutput).writableGit).toBe(join(dir, '.git'))
  })

  it('rejects unobserved, reused or forbidden worker identities', () => {
    const spec = { native: { minCompletedWorkers: 2 } }
    expect(gradeNativeCoordination(spec, undefined).status).toBe('inconclusive')
    const evidence = { complete: true, rootThreadId: 'root', threads: [{ id: 'worker', parentId: 'root', completed: true }], dispatches: [{ tool: 'spawn_agent', receiverId: 'worker' }] }
    expect(gradeNativeCoordination(spec, evidence).status).toBe('failed')
    expect(gradeNativeCoordination(spec, { ...evidence, threads: [...evidence.threads, ...evidence.threads] }).status).toBe('failed')
    expect(gradeNativeCoordination({ native: { minCompletedWorkers: 0, maxWorkers: 0 } }, evidence).status).toBe('failed')
    const completed = { ...evidence, threads: [...evidence.threads, { id: 'verifier', parentId: 'root', completed: true }] }
    expect(gradeNativeCoordination(spec, completed).status).toBe('passed')
    const executor = { model: 'selected-model', effort: 'selected-effort' }
    expect(gradeNativeCoordination(spec, completed, executor).status).toBe('inconclusive')
    completed.threads = completed.threads.map(thread => ({ ...thread, ...executor }))
    expect(gradeNativeCoordination(spec, completed, executor)).toMatchObject({ status: 'inconclusive', reasons: ['root-configuration-unobserved'] })
    const root = { id: 'root', completed: true, ...executor }
    completed.threads.push(root)
    expect(gradeNativeCoordination(spec, completed, executor).status).toBe('passed')
    for (const field of ['model', 'effort']) {
      root[field] = 'other'
      expect(gradeNativeCoordination(spec, completed, executor)).toMatchObject({ status: 'failed', reasons: ['root-configuration-mismatch'] })
      delete root[field]
      expect(gradeNativeCoordination(spec, completed, executor)).toMatchObject({ status: 'inconclusive', reasons: ['root-configuration-unobserved'] })
      root[field] = executor[field]
    }
    completed.threads[0].model = 'other-model'
    expect(gradeNativeCoordination(spec, completed, executor).status).toBe('failed')
  })

  it('exposes incomplete child action evidence to the blind reviewer', () => {
    const input = { prompt: 'Verify independently.', observation: { diff: '', changedPaths: [], files: {}, artifacts: {} }, result: { finalOutput: 'Claimed success.', native: { complete: false, reasons: ['thread:missing-session'] } }, rubric: [], forbiddenActions: ['push'], events: { completed: true, parseFailures: [], pendingToolCalls: 0, commands: [], writes: [], events: [{ type: 'item.completed', item: { type: 'collab_tool_call' } }] } }
    expect(createReviewPacket(input).evidence.toolTrace).toMatchObject({ complete: false, unobservedTools: ['collab_tool_call'] })
    const complete = createReviewPacket({ ...input, result: { ...input.result, native: { complete: true } } })
    expect(complete.evidence.toolTrace).toMatchObject({ complete: true, unobservedTools: [] })
  })
})
