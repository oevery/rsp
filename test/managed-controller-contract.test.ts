import { execFileSync } from 'node:child_process'
import { lstatSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'
import { evaluateManagedController, loadManagedControllerCases, readManagedControllerFlag, scoreManagedControllerOutput } from '../scripts/managed-controller-eval.mjs'

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
    expect(frontmatter['disable-model-invocation']).toBe(true)
    expect(frontmatter.license).toBe('MIT')
    expect(frontmatter.metadata).toMatchObject({ author: 'oevery', version: expect.stringMatching(/^\d{4}\.\d{2}\.\d{2}(?:\.\d+)?$/) })
    expect(body.trim().split(/\s+/).length).toBeLessThanOrEqual(800)
    expect(lstatSync(join(candidate, 'SKILL.md')).isSymbolicLink()).toBe(false)
    expect(body).not.toMatch(/Codex|Claude|ChatGPT|GitHub Actions|session id|thread id/i)
    expect(readFileSync(join(candidate, 'agents', 'openai.yaml'), 'utf8')).toContain('allow_implicit_invocation: false')
  })

  it('satisfies every deterministic controller contract fixture', () => {
    const cases = loadManagedControllerCases(root)
    expect(cases.map(item => item.id)).toEqual([
      'authority-stop',
      'depth-selection',
      'dispatch-envelope',
      'fresh-return',
      'interruption-recovery',
    ])
    expect(evaluateManagedController(root)).toEqual(cases.map(item => ({ id: item.id, missing: [], passed: true })))
  })

  it('fails closed when an evaluation flag has no value', () => {
    expect(readManagedControllerFlag(['--model', 'gpt-5.6-terra'], '--output-root')).toBeUndefined()
    expect(() => readManagedControllerFlag(['--output-root', '--model', 'gpt-5.6-terra'], '--output-root'))
      .toThrow('--output-root requires a value')
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
