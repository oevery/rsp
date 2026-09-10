import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { evaluationExitCode, executeEvaluation, listEvaluationCases, main, planEvaluation } from '../../harness/evaluate.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))

describe('explicit provider evaluation', () => {
  it('lists and plans co-located cases without starting a provider or writing a run', () => {
    for (const kind of ['behavior', 'workflow']) {
      const cases = listEvaluationCases(root, kind)
      expect(cases.length).toBeGreaterThan(0)
      for (const caseId of cases) {
        const plan = planEvaluation(root, kind, caseId)
        expect(plan.execution).toBe('not-run')
        expect(plan.acceptance).toBe('inconclusive')
        expect(plan.verification.length).toBeGreaterThan(0)
      }
    }
    const executed = spawnSync(process.execPath, [join(root, 'verification/harness/evaluate.mjs'), 'behavior', '--case', 'preserve-user-files', '--plan', '--codex-bin', 'does-not-exist'], { encoding: 'utf8' })
    expect(executed.status, executed.stderr).toBe(0)
    expect(JSON.parse(executed.stdout)).toMatchObject({ execution: 'not-run', case: 'preserve-user-files' })
  })

  it('requires explicit selection and isolated provider settings before live execution', async () => {
    await expect(main(['behavior', '--run'], root)).rejects.toThrow('--case')
    await expect(main(['behavior', '--case', 'preserve-user-files', '--run', '--plan'], root)).rejects.toThrow('--run')
    await expect(main(['behavior', '--case', 'preserve-user-files', '--run'], root)).rejects.toThrow('--model')
    expect(() => planEvaluation(root, 'behavior', '../workflows')).toThrow('Unknown')
  })

  it('keeps partial observations separate from behavior failure', () => {
    expect(evaluationExitCode([{ execution: 'completed', acceptance: 'passed' }])).toBe(0)
    expect(evaluationExitCode([{ execution: 'completed', acceptance: 'failed' }])).toBe(1)
    expect(evaluationExitCode([{ execution: 'infrastructure-failed', acceptance: 'inconclusive' }])).toBe(2)
    expect(evaluationExitCode([{ execution: 'completed', acceptance: 'inconclusive' }])).toBe(2)
  })

  it('executes selected samples serially, stops on failure, and preserves the report', async ({ onTestFinished }) => {
    const project = mkdtempSync(join(tmpdir(), 'rsp-evaluation-command-'))
    onTestFinished(() => rmSync(project, { recursive: true, force: true }))
    const destination = join(project, 'verification/evaluations/behaviors/preserve-user-files')
    mkdirSync(destination, { recursive: true })
    cpSync(join(root, 'verification/evaluations/behaviors/preserve-user-files'), destination, { recursive: true })
    let calls = 0
    let active = false
    const result = await executeEvaluation({ root: project, kind: 'behavior', caseId: 'preserve-user-files', repetitions: 3, runner: async (options) => {
      expect(active).toBe(false)
      active = true
      expect(options.evaluationMode).toBe('outcome')
      expect(options.caseDirectory).toBe(destination)
      calls++
      await Promise.resolve()
      active = false
      return { outcome: { execution: 'completed', acceptance: calls === 1 ? 'passed' : 'failed', warnings: [] } }
    } })
    expect(calls).toBe(2)
    expect(result).toMatchObject({ planned: 3, executed: 2, exitCode: 1 })
    expect(JSON.parse(readFileSync(join(project, result.report), 'utf8')).runs).toHaveLength(2)
    const unavailable = await executeEvaluation({ root: project, kind: 'behavior', caseId: 'preserve-user-files', runner: async () => {
      throw new Error('private provider diagnostic')
    } })
    expect(unavailable.exitCode).toBe(2)
    const saved = readFileSync(join(project, unavailable.report), 'utf8')
    expect(saved).not.toContain('private provider diagnostic')
    expect(unavailable.report).not.toBe(result.report)
  })
})
