import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, expect, it } from 'vitest'

const cli = fileURLToPath(new URL('../../../dist/cli.mjs', import.meta.url))
const roots: string[] = []
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })))

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'rsp-doctor-architecture-'))
  roots.push(root)
  execFileSync(process.execPath, [cli, 'init'], { cwd: root, stdio: 'pipe' })
  const model = {
    schemaVersion: 1,
    nodes: [{ id: 'app', title: 'Application', description: 'Owns the application' }],
    relations: [{ id: 'self', source: 'app', target: 'app', type: 'retry', description: 'Retries' }],
    views: [{ id: 'empty', title: 'Empty view', node: 'app', include: [] }],
    bindings: [{ node: 'app', file: 'contract.md', headings: ['Contract'] }],
  }
  const save = () => writeFileSync(join(root, '.rsp/architecture.json'), JSON.stringify(model))
  const run = (...args: string[]) => spawnSync(process.execPath, [cli, 'doctor', ...args], { cwd: root, encoding: 'utf8', timeout: 10000 })
  return { root, model, save, run }
}

it('keeps models optional and reports valid structure and bindings through doctor', () => {
  const { root, save, run } = fixture()
  const absent = run('--json', '--compact')
  expect(absent.status, absent.stderr).toBe(0)
  expect(JSON.parse(absent.stdout)).toMatchObject({
    ok: true,
    summary: { issues: 0 },
    checks: expect.arrayContaining([expect.objectContaining({ code: 'architecture_not_configured', status: 'info' })]),
  })
  writeFileSync(join(root, 'contract.md'), '# Contract\n\nCurrent behavior.\n')
  save()
  const valid = run('--json')
  expect(valid.status, valid.stderr).toBe(0)
  expect(JSON.parse(valid.stdout)).toMatchObject({
    ok: true,
    summary: { issues: 0 },
    checks: expect.arrayContaining([expect.objectContaining({ code: 'architecture_valid', status: 'ok' })]),
  })
})

it('retains configuration errors without attributing them to an absent architecture model', () => {
  const { root, run } = fixture()
  writeFileSync(join(root, '.rsp/config.yaml'), 'kinds: 7\n')
  const result = run('--json')
  expect(result.status, result.stderr).toBe(1)
  const report = JSON.parse(result.stdout)
  expect(report.ok).toBe(false)
  expect(report.checks.filter((check: { code?: string }) => check.code === 'invalid_config')).toEqual([
    expect.objectContaining({
      status: 'issue',
      code: 'invalid_config',
      message: expect.stringContaining('kinds'),
    }),
  ])
  expect(report.checks.some((check: { code?: string }) => check.code?.startsWith('architecture_'))).toBe(false)
})

it.each([
  ['missing document', null, 'architecture_document_unavailable'],
  ['missing chapter', '# Renamed\n', 'architecture_chapter_unresolved'],
  ['ambiguous chapter', '# Contract\n\n# Contract\n', 'architecture_chapter_unresolved'],
])('fails doctor for a %s and retains its location and reason', (_, content, code) => {
  const { root, save, run } = fixture()
  if (content !== null)
    writeFileSync(join(root, 'contract.md'), content)
  save()
  const result = run('--json')
  expect(result.status).toBe(1)
  expect(JSON.parse(result.stdout)).toMatchObject({
    ok: false,
    summary: { issues: 1 },
    checks: expect.arrayContaining([expect.objectContaining({
      status: 'issue',
      code,
      label: expect.stringContaining('contract.md'),
      message: expect.any(String),
    })]),
  })
  const text = run()
  expect(text.status).toBe(1)
  expect(text.stdout).toContain('contract.md')
  expect(text.stdout).toContain('1 issue(s)')
})

it('reports malformed JSON and invalid relations without losing other doctor results', () => {
  const { root, model, save, run } = fixture()
  for (const invalid of ['json', 'relation']) {
    if (invalid === 'json') {
      writeFileSync(join(root, '.rsp/architecture.json'), '{')
    }
    else {
      model.relations[0]!.target = 'unknown'
      save()
    }
    const result = run('--json')
    expect(result.status).toBe(1)
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: false,
      checks: expect.arrayContaining([
        expect.objectContaining({ code: 'architecture_inspection_failed', status: 'issue', label: '.rsp/architecture.json' }),
        expect.objectContaining({ code: 'project_cli_version', status: 'ok' }),
      ]),
    })
  }
})
