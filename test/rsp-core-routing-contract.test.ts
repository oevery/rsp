import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const skillPath = join(root, 'skills', 'rsp', 'SKILL.md')

describe('rsp core routing contract', () => {
  it('derives one evidence-backed next action with an explicit fallback and owner', () => {
    const body = readFileSync(skillPath, 'utf8')

    expect(body).toContain('## Derive one next action')
    expect(body).toContain('user intent')
    expect(body).toContain('`rsp status --json`')
    expect(body).toContain('readiness')
    expect(body).toContain('verification evidence')
    expect(body).toContain('blockers')
    expect(body).toContain('at most one available optional capability')
    expect(body).toContain('Only name an optional capability when it is the one next action')
    expect(body).toContain('host\'s loaded skill inventory')
    expect(body).toContain('manual fallback')
    expect(body).toContain('returned owner')
  })

  it('keeps stages derived and preserves optional capability boundaries', () => {
    const body = readFileSync(skillPath, 'utf8')

    expect(body).toContain('Stages are derived guidance, never persisted state')
    expect(body).toContain('Do not preload, enumerate, or recursively invoke optional capabilities')
    expect(body).toContain('Do not infer implementation, review, Git, publication, or approval authority')
  })
})
