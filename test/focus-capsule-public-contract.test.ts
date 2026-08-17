import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const read = (path: string) => readFileSync(join(root, path), 'utf8')

describe('focus capsule public contract', () => {
  const cliSpec = read('.rsp/specs/cli-contracts.md')
  const english = read('docs/site/en/reference/cli.md')
  const chinese = read('docs/site/zh-CN/reference/cli.md')
  const authoredFallback = read('rules/rsp-rules.md')

  it('documents strict new writes, warning-only legacy reads, and bounded show projection', () => {
    for (const surface of [cliSpec, english, chinese]) {
      expect(surface).toContain('<!-- rsp-focus:v1 -->')
      expect(surface).toContain('Current')
      expect(surface).toContain('Evidence')
      expect(surface).toContain('Next')
      expect(surface).toContain('Resume check')
      expect(surface).toContain('focus_capsule_legacy')
      expect(surface).toContain('recovery: null')
      expect(surface).toContain('authoritative: false')
      expect(surface).toContain('4096')
    }
    expect(cliSpec).toContain('fail before atomic replacement and preserve the prior marker')
    expect(english).toContain('Unknown non-empty lines or fields')
    expect(chinese).toContain('未知非空行或字段')
  })

  it('keeps the fallback compact while matching outer receipt and recovery semantics', () => {
    expect(authoredFallback).toContain('one outer `ControlOutcome`')
    expect(authoredFallback).toContain('`mode: solo | delegated | coordinated`')
    expect(authoredFallback).toContain('`status: running | waiting | completed`')
    expect(authoredFallback).toContain('`running -> waiting | completed` and `waiting -> running | completed`')
    expect(authoredFallback).toContain('route, topology, lane result, acceptance, and closeout remain nested details or gates rather than peer statuses')
    expect(authoredFallback).toContain('unknown non-empty lines or fields are invalid')
    expect(authoredFallback).toContain('Legacy unversioned content is warning-only compatibility')
    expect(authoredFallback).toContain('does not emulate Manage qualification, worker dispatch, topology selection, Assignment inheritance, acceptance, or closeout')
  })

  it('keeps the self-hosted fallback synchronized from the authored source', () => {
    expect(read('.rsp/rsp-rules.md')).toBe(authoredFallback)
  })
})
