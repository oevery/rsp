import { execFileSync, spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { generateChangeContent, parseFrontmatter } from '../src/core/helpers.js'
import { parseIssueRelationships } from '../src/core/issue-relationship.js'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const cli = join(repoRoot, 'dist', 'cli.mjs')
const roots: string[] = []

async function fixture(name: string): Promise<string> {
  const root = join(tmpdir(), `${name}-${randomUUID()}`)
  roots.push(root)
  await Promise.all(['changes', 'focus.d', 'archives', 'specs'].map(path => mkdir(join(root, '.rsp', path), { recursive: true })))
  await writeFile(join(root, '.rsp', 'rsp-rules.md'), '# RSP\n')
  await writeFile(join(root, '.rsp', 'specs', 'design.md'), '# Design\n')
  return root
}

afterAll(async () => {
  await Promise.all(roots.map(root => rm(root, { recursive: true, force: true })))
})

describe('change issue relationships', () => {
  it('keeps absence compatible and normalizes valid relationships', () => {
    expect(parseIssueRelationships(parseFrontmatter(generateChangeContent('plain', 'plain', 'fix')))).toEqual([])
    expect(parseIssueRelationships({
      issues: [
        { url: 'HTTPS://GitHub.com:443/acme/app/issues/1', relation: 'relates' },
        { url: 'http://example.com:80/issues/2?view=full', relation: 'closes' },
      ],
    })).toEqual([
      { url: 'https://github.com/acme/app/issues/1', relation: 'relates' },
      { url: 'http://example.com/issues/2?view=full', relation: 'closes' },
    ])
  })

  it.each([
    [{ issues: {} }, 'invalid_issue_shape'],
    [{ issues: [{ url: '/issues/1', relation: 'relates' }] }, 'invalid_issue_url'],
    [{ issues: [{ url: 'https://user:secret@example.com/issues/1', relation: 'relates' }] }, 'unsafe_issue_url'],
    [{ issues: [{ url: 'https://example.com/issues/1#comment', relation: 'relates' }] }, 'unsafe_issue_url'],
    [{ issues: [{ url: 'https://example.com/issues/1', relation: 'blocks' }] }, 'unsupported_issue_relation'],
    [{ issues: [{ url: 'https://example.com/issues/1', relation: 'relates', title: 'invented' }] }, 'unsupported_issue_field'],
    [{ issues: [
      { url: 'https://example.com:443/issues/1', relation: 'relates' },
      { url: 'https://EXAMPLE.com/issues/1', relation: 'closes' },
    ] }, 'duplicate_issue_url'],
  ])('rejects invalid metadata with stable code %s', (frontmatter, code) => {
    expect(() => parseIssueRelationships(frontmatter)).toThrowError(expect.objectContaining({ code }))
  })

  it('creates issue-linked Changes offline and projects them through open and archive reads', async () => {
    const root = await fixture('rsp-issue-linked')
    const issue = 'https://github.com/acme/app/issues/123'
    execFileSync('node', [cli, 'create', 'linked', 'Linked outcome', '--kind', 'fix', '--issue', issue, '--issue-relation', 'closes'], { cwd: root })

    const changePath = join(root, '.rsp', 'changes', 'linked.md')
    const content = await readFile(changePath, 'utf8')
    expect(parseIssueRelationships(parseFrontmatter(content))).toEqual([{ url: issue, relation: 'closes' }])

    const status = JSON.parse(execFileSync('node', [cli, 'status', '--json'], { cwd: root, encoding: 'utf8' }))
    const show = JSON.parse(execFileSync('node', [cli, 'show', 'linked', '--json'], { cwd: root, encoding: 'utf8' }))
    expect(status.records[0].issues).toEqual([{ url: issue, relation: 'closes' }])
    expect(show.change.issues).toEqual([{ url: issue, relation: 'closes' }])
    expect(execFileSync('node', [cli, 'show', 'linked'], { cwd: root, encoding: 'utf8' })).toContain(`closes ${issue}`)

    await writeFile(join(root, '.rsp', 'archives', '2026-07-29_linked.md'), content)
    const history = JSON.parse(execFileSync('node', [cli, 'history', 'linked', '--json'], { cwd: root, encoding: 'utf8' }))
    expect(history.record.issues).toEqual([{ url: issue, relation: 'closes' }])
    expect(execFileSync('node', [cli, 'history', 'linked'], { cwd: root, encoding: 'utf8' })).toContain(`closes ${issue}`)
  })

  it('validates create input before Change or focus mutation', async () => {
    const root = await fixture('rsp-issue-create-rollback')
    const result = spawnSync('node', [cli, 'create', 'unsafe', '--issue', 'https://user:secret@example.com/issues/1'], { cwd: root, encoding: 'utf8' })
    const relationOnly = spawnSync('node', [cli, 'create', 'relation-only', '--issue-relation', 'closes'], { cwd: root, encoding: 'utf8' })

    expect(result.status).not.toBe(0)
    expect(relationOnly.status).not.toBe(0)
    expect(existsSync(join(root, '.rsp', 'changes', 'unsafe.md'))).toBe(false)
    expect(existsSync(join(root, '.rsp', 'focus.d', 'unsafe'))).toBe(false)
    expect(existsSync(join(root, '.rsp', 'changes', 'relation-only.md'))).toBe(false)
  })

  it('rejects issue options for an existing Change without update semantics', async () => {
    const root = await fixture('rsp-issue-existing-create')
    execFileSync('node', [cli, 'create', 'existing', 'Original outcome', '--kind', 'fix'], { cwd: root })
    const changePath = join(root, '.rsp', 'changes', 'existing.md')
    const before = await readFile(changePath, 'utf8')

    const result = spawnSync('node', [cli, 'create', 'existing', '--issue', 'https://example.com/issues/2'], { cwd: root, encoding: 'utf8' })

    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('Change already exists; --issue cannot update existing')
    expect(await readFile(changePath, 'utf8')).toBe(before)
  })

  it('keeps history and status usable while omitting absent or non-v1 legacy archive issue metadata', async () => {
    const root = await fixture('rsp-issue-legacy-archive')
    const absent = generateChangeContent('legacy-absent', 'absent legacy issue metadata', 'fix')
    const scalar = generateChangeContent('legacy-scalar', 'scalar legacy issue', 'fix').replace(
      'kind: "fix"',
      'kind: "fix"\nissues: GH-123',
    )
    const list = generateChangeContent('legacy-list', 'list legacy issue', 'fix').replace(
      'kind: "fix"',
      'kind: "fix"\nissues:\n  - https://example.com/issues/456',
    )
    await writeFile(join(root, '.rsp', 'archives', '2026-07-27_legacy-absent.md'), absent)
    await writeFile(join(root, '.rsp', 'archives', '2026-07-28_legacy-scalar.md'), scalar)
    await writeFile(join(root, '.rsp', 'archives', '2026-07-29_legacy-list.md'), list)

    const history = JSON.parse(execFileSync('node', [cli, 'history', '--json'], { cwd: root, encoding: 'utf8' }))
    const status = JSON.parse(execFileSync('node', [cli, 'status', '--json'], { cwd: root, encoding: 'utf8' }))

    expect(history.ok).toBe(true)
    expect(history.records.map((record: { workRef: string }) => record.workRef)).toEqual(['legacy-list', 'legacy-scalar', 'legacy-absent'])
    expect(history.records.every((record: { issues?: unknown }) => !('issues' in record))).toBe(true)
    const detail = JSON.parse(execFileSync('node', [cli, 'history', 'legacy-absent', '--json'], { cwd: root, encoding: 'utf8' }))
    expect(detail.record).not.toHaveProperty('issues')
    expect(status.ok).toBe(true)
    expect(status.archiveTrend).toEqual([{ month: '2026-07', count: 3 }])
  })

  it('fails check closed on invalid authored issue metadata', async () => {
    const root = await fixture('rsp-issue-check')
    const content = generateChangeContent('invalid-issue', 'outcome', 'fix').replace(
      'kind: "fix"',
      'kind: "fix"\nissues:\n  - url: "https://example.com/issues/1#fragment"\n    relation: relates',
    )
    await writeFile(join(root, '.rsp', 'changes', 'invalid-issue.md'), content)
    const result = spawnSync('node', [cli, 'check', '--json'], { cwd: root, encoding: 'utf8' })
    const check = JSON.parse(result.stdout)
    expect(result.status).not.toBe(0)
    expect(check.ok).toBe(false)
    expect(check.diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'unsafe_issue_url' })]))
  })
})
