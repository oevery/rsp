import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, expect, it } from 'vitest'

const cli = fileURLToPath(new URL('../../../scripts/scan-skill-context.mjs', import.meta.url))
const temporary = []
afterEach(() => temporary.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })))

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'rsp-context-cli-'))
  temporary.push(root)
  const write = (path, content) => {
    const target = join(root, path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
  const invoke = (...args) => spawnSync(process.execPath, [cli, '--root', root, '--json', ...args], {
    cwd: tmpdir(),
    encoding: 'utf8',
    timeout: 5000,
  })
  const scan = (...args) => {
    const result = invoke(...args)
    expect(result.status, result.stderr).toBe(0)
    return JSON.parse(result.stdout)
  }
  return { root, write, invoke, scan }
}

it('follows used CommonMark references and cycles while excluding metadata, examples and unused definitions', () => {
  const { root, write, scan } = fixture()
  const prefix = 'skills/example/'
  const repeated = 'A shared readable paragraph is a diagnostic clue, never an automatic removal instruction.'
  const ignored = 'This long example appears only in metadata or code and must never become repeated prose.'
  const tick = String.fromCharCode(96)
  write(`${prefix}SKILL.md`, [
    '---',
    `description: ${ignored}`,
    'metadata: "[not navigation](refs/meta.md)"',
    '---',
    '',
    '[Inline](refs/inline.md "Optional title")',
    '[Balanced](refs/with(paren).md#section)',
    '[Encoded](refs/space%20name.md?mode=read#section)',
    '[Angle](<refs/angle (name).md> "Title")',
    '[Reference][Read Me] [Collapsed][] [Shortcut]',
    '[Anchor](#local) [Missing](refs/missing.md)',
    `[Outside](../other/private.md) [Absolute](${join(root, 'outside.md')})`,
    '[Linked](refs/linked.md) [Remote](https://example.invalid/remote.md)',
    '[Distribution](NOTICE.md)',
    '',
    repeated,
    '',
    `Run the selected command ${tick}foo${tick} only after confirming the exact authorized target.`,
    '',
    'Consult the specific [remote guide](https://example.invalid/first) before starting this operation.',
    '',
    `${tick}[Inline example](refs/inline-fake.md)${tick}`,
    '',
    tick + ignored + tick,
    '',
    '~~~md',
    '[Fenced example](refs/fenced-fake.md)',
    ignored,
    '~~~',
    '',
    '[Read Me]: refs/reference.md "A title"',
    '[read me]: refs/shadow.md',
    '[Collapsed]: refs/collapsed.md',
    '[Shortcut]: refs/shortcut.md',
    '[Unused]: refs/unused.md',
  ].join('\n'))
  write(`${prefix}refs/inline.md`, [
    '---',
    `description: ${ignored}`,
    '---',
    '',
    '[Cycle](cycle.md)',
    '',
    repeated,
    '',
    '~~~',
    ignored,
    '~~~',
    '',
    `Run the selected command ${tick}bar${tick} only after confirming the exact authorized target.`,
    '',
    'Consult the specific [remote guide](https://example.invalid/second) before starting this operation.',
    '',
  ].join('\n'))
  write(`${prefix}refs/cycle.md`, '[Again](inline.md) [Entry](../SKILL.md)')
  for (const name of ['with(paren)', 'space name', 'angle (name)', 'reference', 'collapsed', 'shortcut', 'meta', 'inline-fake', 'fenced-fake', 'unused', 'shadow'])
    write(`${prefix}refs/${name}.md`, `Resource: ${name}`)
  write(`${prefix}NOTICE.md`, repeated)
  write('skills/other/SKILL.md', 'Other entry')
  write('skills/other/private.md', 'Not part of example')
  write('outside.md', 'External sentinel')
  symlinkSync(join(root, 'outside.md'), join(root, prefix, 'refs/linked.md'))
  const result = scan('--package', 'skills/example')
  const [item] = result.packages
  expect(result.diagnostics_only).toBe(true)
  expect(item.reachable_markdown).toEqual([
    'SKILL.md',
    'refs/angle (name).md',
    'refs/collapsed.md',
    'refs/cycle.md',
    'refs/inline.md',
    'refs/reference.md',
    'refs/shortcut.md',
    'refs/space name.md',
    'refs/with(paren).md',
  ].map(path => prefix + path).sort())
  expect(item.unreachable_markdown.slice().sort()).toEqual([
    'fenced-fake',
    'inline-fake',
    'meta',
    'shadow',
    'unused',
  ].map(name => `${prefix}refs/${name}.md`).sort())
  expect(result.repeated_prose).toEqual([{ text: repeated, paths: [`${prefix}SKILL.md`, `${prefix}refs/inline.md`].sort() }])
  expect(readFileSync(join(root, 'outside.md'), 'utf8')).toBe('External sentinel')
})

it('discovers canonical packages, selects paths relative to root, and rejects unknown or projected targets', () => {
  const { root, write, invoke, scan } = fixture()
  write('skills/published/SKILL.md', 'Published')
  write('.agents/skills/internal/SKILL.md', 'Internal')
  write('skills/no-entry/note.md', 'Not a package')
  write('elsewhere/SKILL.md', 'Not a canonical location')
  symlinkSync(join(root, 'skills/published'), join(root, '.agents/skills/projected'), 'dir')
  mkdirSync(join(root, 'skills/linked-entry'))
  symlinkSync(join(root, 'skills/published/SKILL.md'), join(root, 'skills/linked-entry/SKILL.md'))
  expect(scan().packages.map(item => [item.name, item.kind])).toEqual([
    ['internal', 'maintainer'],
    ['published', 'published'],
  ])
  expect(scan('--package', '.agents/skills/internal').packages.map(item => item.name)).toEqual(['internal'])
  expect(scan('--package', 'skills/published', '--package', '.agents/skills/internal').packages).toHaveLength(2)
  for (const target of ['unknown', 'skills/no-entry', '.agents/skills/projected', 'skills/linked-entry', 'elsewhere']) {
    const result = invoke('--package', target)
    expect(result.status).toBe(1)
    expect(result.stdout).toBe('')
    expect(result.stderr).toContain('Unknown or non-canonical package:')
  }
  const incomplete = invoke('--package')
  expect(incomplete.status).toBe(1)
  expect(incomplete.stdout).toBe('')
})

it('separates entrypoint, reference and distribution text without counting a terminal newline as a line', () => {
  const { write, scan } = fixture()
  write('skills/counts/SKILL.md', 'one two\n')
  write('skills/counts/refs/note.md', 'three\n\nfour')
  write('skills/counts/refs/empty.md', '')
  write('skills/counts/NOTICE.md', 'notice\n')
  write('skills/counts/LICENSE', 'license text\n')
  write('skills/counts/task.mjs', 'Not document statistics')
  const [item] = scan().packages
  expect(item.distribution_markdown).toEqual(['skills/counts/NOTICE.md'])
  expect(item.distribution_files.slice().sort()).toEqual(['skills/counts/LICENSE', 'skills/counts/NOTICE.md'])
  expect(item.diagnostics).toEqual({ markdown_files: 4, words: 5, bytes: 26, lines: 5 })
  expect(item.diagnostics_by_role).toEqual({
    total: { files: 5, markdown_files: 4, words: 7, bytes: 39, lines: 6 },
    entrypoint: { files: 1, markdown_files: 1, words: 2, bytes: 8, lines: 1 },
    references: { files: 2, markdown_files: 2, words: 2, bytes: 11, lines: 3 },
    distribution: { files: 2, markdown_files: 1, words: 3, bytes: 20, lines: 2 },
  })
})

it('retains horizontal-rule body links and paragraphs while excluding YAML mapping frontmatter', () => {
  const { write, scan } = fixture()
  const repeated = 'This ordinary body paragraph remains visible between horizontal rules in a reference document.'
  const metadata = 'This metadata description is shared but must not be mistaken for navigable body prose.'
  write('skills/document/SKILL.md', [
    '---',
    'name: document',
    `description: ${metadata}`,
    'note: "[Hidden](refs/hidden.md)"',
    '---',
    '[Prose](refs/prose.md) [Metadata](refs/metadata.md)',
  ].join('\n'))
  write('skills/document/refs/prose.md', [
    '---',
    '',
    '[Read the guide](guide.md)',
    '',
    repeated,
    '',
    '---',
    '',
    'Retained tail.',
  ].join('\n'))
  write('skills/document/refs/peer.md', repeated)
  write('skills/document/refs/metadata.md', [
    '---',
    'title: A reference document',
    `description: ${metadata}`,
    'note: "[Hidden](hidden.md)"',
    '...',
    '[Body](public.md)',
  ].join('\n'))
  write('skills/document/refs/guide.md', 'The guide.')
  write('skills/document/refs/public.md', 'Public body target.')
  write('skills/document/refs/hidden.md', 'Metadata-only target.')
  const result = scan('--package', 'skills/document')
  expect(result.packages[0].reachable_markdown).toEqual([
    'skills/document/SKILL.md',
    'skills/document/refs/guide.md',
    'skills/document/refs/metadata.md',
    'skills/document/refs/prose.md',
    'skills/document/refs/public.md',
  ])
  expect(result.repeated_prose).toEqual([{
    text: repeated,
    paths: ['skills/document/refs/peer.md', 'skills/document/refs/prose.md'],
  }])
})

it('normalizes repository-root aliases for relative and absolute selection without accepting package projections', () => {
  const { root, write, invoke, scan } = fixture()
  write('skills/published/SKILL.md', 'Published')
  write('.agents/skills/internal/SKILL.md', 'Internal')
  const alias = join(root, 'root-alias')
  symlinkSync(root, alias, 'dir')
  symlinkSync(join(root, 'skills/published'), join(root, '.agents/skills/projected'), 'dir')
  const canonical = realpathSync(root)
  const expected = scan('--package', 'skills/published')
  for (const selectedRoot of [root, canonical, alias]) {
    for (const target of ['skills/published', join(root, 'skills/published'), join(canonical, 'skills/published'), join(alias, 'skills/published')])
      expect(scan('--root', selectedRoot, '--package', target)).toEqual(expected)
  }
  const outside = fixture()
  outside.write('skills/published/SKILL.md', 'Outside package')
  for (const target of ['.agents/skills/projected', join(alias, '.agents/skills/projected'), join(outside.root, 'skills/published')]) {
    const result = invoke('--root', alias, '--package', target)
    expect(result.status).toBe(1)
    expect(result.stdout).toBe('')
    expect(result.stderr).toContain('Unknown or non-canonical package:')
  }
})
