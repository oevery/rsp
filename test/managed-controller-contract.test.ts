import { execFileSync } from 'node:child_process'
import { existsSync, lstatSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { evaluateManagedController, loadManagedControllerCases, prepareManagedControllerRun, readManagedControllerFlag, scoreManagedControllerOutput } from '../scripts/managed-controller-eval.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const candidate = join(root, 'research', 'candidates', 'skills', 'rsp-manage')

function readSkill(): { body: string, frontmatter: Record<string, any> } {
  const content = readFileSync(join(candidate, 'SKILL.md'), 'utf8')
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  expect(match).not.toBeNull()
  return { body: match![2]!, frontmatter: parseYaml(match![1]!) as Record<string, any> }
}

describe('rsp-manage research candidate', () => {
  it('stays compact, explicit-only, host-neutral, and outside the stable suite', () => {
    const { body, frontmatter } = readSkill()

    expect(frontmatter.name).toBe(basename(candidate))
    expect(frontmatter.description).toEqual(expect.any(String))
    expect(frontmatter['disable-model-invocation']).toBeUndefined()
    expect(frontmatter.license).toBe('MIT')
    expect(frontmatter.metadata).toMatchObject({ author: 'oevery', version: expect.stringMatching(/^\d{4}\.\d{2}\.\d{2}(?:\.\d+)?$/) })
    expect(body.trim().split(/\s+/).length).toBeLessThanOrEqual(600)
    expect(lstatSync(join(candidate, 'SKILL.md')).isSymbolicLink()).toBe(false)
    expect(body).not.toMatch(/Codex|Claude|ChatGPT|GitHub Actions|session id|thread id/i)
    expect(body).toContain('Use only when the user explicitly authorizes managed continuation')
    expect(body).not.toContain('**direct:**')
    expect(body).not.toContain('**assisted:**')
    expect(existsSync(join(candidate, 'agents', 'openai.yaml'))).toBe(false)
  })

  it('executes archive only under explicit lifecycle-closeout authority', () => {
    const { body } = readSkill()

    expect(body).toContain('explicit lifecycle-closeout authority')
    expect(body).toContain('run `rsp archive <work-ref>`')
    expect(body).toContain('stop with the advisory archive action')
    expect(body).toContain('never infer Git staging or commit authority')
  })

  it('satisfies every deterministic controller contract fixture', () => {
    const cases = loadManagedControllerCases(root)
    expect(cases.map(item => item.id)).toEqual([
      'authority-stop',
      'dispatch-envelope',
      'explicit-eligibility',
      'fresh-return',
      'interruption-recovery',
      'ordinary-restraint',
    ])
    expect(evaluateManagedController(root)).toEqual(cases.map(item => ({ id: item.id, missing: [], passed: true })))
  })

  it('fails closed when an evaluation flag has no value', () => {
    expect(readManagedControllerFlag(['--model', 'gpt-5.6-terra'], '--output-root')).toBeUndefined()
    expect(() => readManagedControllerFlag(['--output-root', '--model', 'gpt-5.6-terra'], '--output-root'))
      .toThrow('--output-root requires a value')
  })

  it('prepares an explicit decline holdout without granting mutation scope', ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-decline-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))

    const prepared = prepareManagedControllerRun({
      caseId: 'ordinary-restraint',
      outputRoot,
      root,
      variant: 'candidate',
    })

    expect(prepared.manifest.expected_mode).toBe('decline')
    expect(prepared.manifest.allowed_changes).toEqual([])
    expect(prepared.prompt).toContain('Use $rsp-manage')
  })

  it('scores human-facing boundaries in the requested language', () => {
    const manifest = {
      expected_output: ['人工验收', '尚未执行'],
      forbidden_output: ['人工验收已通过'],
    }
    expect(scoreManagedControllerOutput(manifest, '物理设备人工验收尚未执行。')).toEqual({
      expected_missing: [],
      forbidden_present: [],
    })
  })

  it('scores a declined managed request by its boundary and direct next path', () => {
    const manifest = {
      expected_output: ['rsp-manage', '普通'],
      forbidden_output: ['Dispatch Envelope', 'Management Receipt'],
    }
    expect(scoreManagedControllerOutput(
      manifest,
      '未执行改动：该工作未通过 rsp-manage 资格门；下一步走普通 Implement 路径。',
    )).toEqual({ expected_missing: [], forbidden_present: [] })
  })

  it('replays the retained language rescore from sanitized evidence', () => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-rescore-'))
    try {
      const stdout = execFileSync(process.execPath, [
        join(root, 'scripts', 'managed-controller-eval.mjs'),
        'rescore',
        join(root, 'research', 'evaluations', 'rsp-manage', '2026-07-21', 'matrix.json'),
        '--output-root',
        outputRoot,
      ], { encoding: 'utf8' })
      const result = JSON.parse(stdout) as { result: string, runs: Array<{ retained_hash_matches: boolean }> }
      expect(result.result).toBe('passed')
      expect(result.runs.every(run => run.retained_hash_matches)).toBe(true)
    }
    finally {
      rmSync(outputRoot, { force: true, recursive: true })
    }
  })
})
