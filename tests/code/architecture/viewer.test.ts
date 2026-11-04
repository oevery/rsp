import type { Element, Root } from 'hast'
import { Buffer } from 'node:buffer'
import { execFileSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fromHtml } from 'hast-util-from-html'
import { afterEach, describe, expect, it } from 'vitest'
import { documentHeadings, parseArchitecture, queryArchitecture, resolveHeading, selectArchitecture } from '../../../src/architecture/model.js'
import { clearConfigCache } from '../../../src/core/config.js'
import { readAsset, renderDocument } from '../../../src/viewer/documents.js'
import { layoutArchitecture } from '../../../src/viewer/layout.js'
import { viewerRuntime } from '../../../src/viewer/runtime.js'
import { createViewerService, IDLE_MS, ReadingActivity, WORKSPACE_GRACE_MS } from '../../../src/viewer/service.js'
import { describeWorkspace } from '../../../src/viewer/workspaces.js'

const temporary: string[] = []
const shutdown: (() => Promise<void>)[] = []
const model = () => ({ schemaVersion: 1, nodes: [{ id: 'root', title: 'Root', description: 'Owns contracts' }, { id: 'child', title: 'Child', description: 'Reads contracts', parent: 'root' }, { id: 'external', title: 'External', description: 'Outside' }, { id: 'beyond', title: 'Beyond', description: 'Not incident' }], relations: [{ id: 'read', source: 'child', target: 'external', type: 'read', description: 'reads' }, { id: 'next', source: 'external', target: 'beyond', type: 'call', description: 'calls' }], views: [{ id: 'root', title: 'Root view', node: 'root', include: ['child'] }, { id: 'second', title: 'Second view', node: 'root', include: ['external'] }], bindings: [{ node: 'root', file: 'docs/shared.md', headings: ['Contract'], scope: 'subtree' }, { node: 'root', file: 'docs/whole.md' }, { node: 'child', file: 'docs/shared.md' }] })
async function fixture(title = 'Root') {
  const root = await mkdtemp(join(tmpdir(), 'rsp-viewer-'))
  temporary.push(root)
  await mkdir(join(root, '.rsp'))
  await mkdir(join(root, 'docs'))
  const input = model()
  input.nodes[0]!.title = title
  await writeFile(join(root, '.rsp/architecture.json'), JSON.stringify(input))
  await writeFile(join(root, 'docs/shared.md'), `# Shared\n\n## Contract\n\nSECRET BODY ${'long complete body '.repeat(1500)}\n\n[Other](whole.md#whole)\n\n![Local](image.png)\n\n![External](https://example.com/tracker.png)\n\n<script>globalThis.pwned=true</script>\n`)
  await writeFile(join(root, 'docs/whole.md'), '# Whole\n\nReference [link][other].\n\n[other]: shared.md#contract\n')
  await writeFile(join(root, 'docs/image.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgaGD4DwAChAGA+gVWHQAAAABJRU5ErkJggg==', 'base64'))
  return root
}
afterEach(async () => {
  await Promise.all(shutdown.splice(0).map(close => close()))
  await Promise.all(temporary.splice(0).map(root => rm(root, { recursive: true, force: true })))
  clearConfigCache()
})
describe('architecture contract', () => {
  it('describes main, linked and detached workspaces without merging identities or requiring Git', async () => {
    const root = await fixture()
    const git = (...args: string[]) => execFileSync('git', ['-C', root, ...args], { stdio: 'pipe' })
    expect((await describeWorkspace({ id: 'plain', root })).git).toBeUndefined()
    git('init', '-q', '-b', 'main')
    git('add', '.')
    git('-c', 'user.name=Viewer Test', '-c', 'user.email=viewer@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'fixture')
    const linked = join(root, 'linked')
    git('worktree', 'add', '-qb', 'feature/viewer', linked)
    const main = await describeWorkspace({ id: 'main-id', root })
    const worktree = await describeWorkspace({ id: 'linked-id', root: linked })
    expect(main.git).toMatchObject({ linked: false, branch: 'main' })
    expect(worktree.git).toMatchObject({ repository: main.git!.repository, linked: true, branch: 'feature/viewer' })
    execFileSync('git', ['-C', linked, 'checkout', '--detach', '-q'], { stdio: 'pipe' })
    const detached = await describeWorkspace({ id: 'linked-id', root: linked })
    expect(detached.git?.branch).toBeUndefined()
    expect(detached.git?.commit).toMatch(/^[a-f0-9]+$/)
    git('switch', '-c', 'renamed')
    expect((await describeWorkspace({ id: 'main-id', root })).git?.branch).toBe('renamed')
    const sameName = join(root, 'separate', 'linked')
    await mkdir(sameName, { recursive: true })
    execFileSync('git', ['-C', sameName, 'init', '-q', '-b', 'main'], { stdio: 'pipe' })
    const unrelated = await describeWorkspace({ id: 'unrelated-id', root: sameName })
    expect(unrelated.title).toBe(worktree.title)
    expect(unrelated.git).toMatchObject({ linked: false, branch: 'main' })
    expect(unrelated.git?.repository).not.toBe(worktree.git?.repository)
  })
  it('keeps an empty authored view empty even when its owner has children and relationships', async () => {
    const root = await fixture()
    const input = model()
    input.views[0]!.include = []
    await writeFile(join(root, '.rsp/architecture.json'), JSON.stringify(input))
    const architecture = await queryArchitecture({ root })
    const selected = await queryArchitecture({ root, view: 'root' })
    expect(selected.nodes).toEqual([])
    expect(selected.relations).toEqual([])
    const layout = await layoutArchitecture(architecture, 'empty-view')
    const view = layout.data.views[layout.viewNames.root! as keyof typeof layout.data.views]!
    expect(view.nodes).toEqual([])
    expect(view.edges).toEqual([])
  })
  it('pins startup assets and version while rejecting missing or mismatched installation inputs', async () => {
    const root = await mkdtemp(join(tmpdir(), 'rsp-runtime-snapshot-'))
    temporary.push(root)
    await cp(join(process.cwd(), 'dist'), join(root, 'dist'), { recursive: true })
    await cp(join(process.cwd(), 'package.json'), join(root, 'package.json'))
    const runtime = await viewerRuntime(root)
    const options = { root, identity: runtime.identity, adminToken: 'admin-secret', readToken: 'read-secret' }
    const service = await createViewerService(options)
    shutdown.push(service.close)
    const base = `http://127.0.0.1:${service.port}`
    const js = await readFile(join(root, 'dist/viewer/app.js'), 'utf8')
    const css = await readFile(join(root, 'dist/viewer/app.css'), 'utf8')
    await writeFile(join(root, 'dist/viewer/app.js'), 'replacement')
    await writeFile(join(root, 'dist/viewer/app.css'), 'replacement')
    await writeFile(join(root, 'package.json'), JSON.stringify({ version: '999.0.0' }))
    expect(await (await fetch(`${base}/app.js`)).text()).toBe(js)
    expect(await (await fetch(`${base}/app.css`)).text()).toBe(css)
    const project = await fixture()
    await writeFile(join(project, '.rsp/version'), runtime.version)
    const register = () => fetch(`${base}/control/register`, { method: 'POST', headers: { Authorization: 'Bearer admin-secret' }, body: JSON.stringify({ root: project }) })
    expect((await register()).status).toBe(200)
    await writeFile(join(project, '.rsp/version'), '999.0.0')
    expect((await register()).status).toBe(409)
    expect((await viewerRuntime(root)).identity).not.toBe(runtime.identity)
    await expect(createViewerService(options)).rejects.toThrow('changed during startup')
    const changed = await viewerRuntime(root)
    await expect(createViewerService({ ...options, identity: changed.identity })).rejects.toThrow('assets do not match')
    await rm(join(root, 'dist/viewer/app.css'))
    await expect(createViewerService({ ...options, identity: changed.identity })).rejects.toThrow('assets do not match')
    await writeFile(join(root, 'dist/viewer/app.js'), js)
    await writeFile(join(root, 'dist/viewer/app.css'), css)
    const newer = await createViewerService({ ...options, identity: changed.identity })
    shutdown.push(newer.close)
    expect(newer.port).not.toBe(service.port)
    expect((await fetch(`http://127.0.0.1:${newer.port}/control/register`, { method: 'POST', headers: { Authorization: 'Bearer admin-secret' }, body: JSON.stringify({ root: project }) })).status).toBe(200)
    expect((await register()).status).toBe(409)
  })
  it('projects complete and selected structure without bodies and keeps binding origins', async () => {
    const root = await fixture()
    const full = await queryArchitecture({ root })
    expect(full.nodes).toHaveLength(4)
    expect(full.relations).toHaveLength(2)
    expect(JSON.stringify(full)).not.toContain('SECRET BODY')
    const selected = await queryArchitecture({ root, node: 'child' })
    expect(selected.nodes.map(node => [node.id, node.boundary])).toEqual([['child', false], ['external', true]])
    expect(selected.relations.map(edge => edge.id)).toEqual(['read'])
    expect(selected.nodes[0]!.bindings).toEqual(expect.arrayContaining([expect.objectContaining({ origin: 'root', inherited: true, anchor: 'contract' }), expect.objectContaining({ origin: 'child', inherited: false })]))
    expect(selected.nodes[0]!.bindings.some(binding => binding.file === 'docs/whole.md')).toBe(false)
    expect((await queryArchitecture({ root, view: 'root' })).selection).toEqual({ kind: 'view', id: 'root' })
    await expect(queryArchitecture({ root, node: 'child', view: 'root' })).rejects.toThrow('mutually exclusive')
    await expect(queryArchitecture({ root, view: 'unknown' })).rejects.toThrow('Unknown')
    await expect(queryArchitecture({ root, node: '' })).rejects.toThrow('non-empty')
  })
  it('rejects schema, identity, reference and cycle failures and reports absence explicitly', async () => {
    for (const mutate of [
      (value: any) => {
        value.schemaVersion = 2
      },
      (value: any) => value.nodes.push(value.nodes[0]),
      (value: any) => {
        value.nodes[0].parent = 'child'
      },
      (value: any) => {
        value.relations[0].target = 'missing'
      },
      (value: any) => {
        value.bindings[0].scope = 'all'
      },
      (value: any) => {
        value.bindings[0].file = '../secret.md'
      },
    ]) {
      const value = model()
      mutate(value)
      expect(() => parseArchitecture(JSON.stringify(value))).toThrow()
    }
    const root = await fixture()
    await rm(join(root, '.rsp/architecture.json'))
    expect((await queryArchitecture({ root })).configured).toBe(false)
  })
  it('resolves heading hierarchy from syntax without stored lines and diagnoses ambiguity', async () => {
    const root = await fixture()
    await writeFile(join(root, 'docs/shared.md'), '# Parent\n\n## Contract\n\nfirst\n\n# Another\n\n## Contract\n\nsecond\n')
    expect((await queryArchitecture({ root })).diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'chapter_unresolved' })]))
    const headings = documentHeadings('# Parent\n\n## Contract\n\n# Another\n\n## Contract\n')
    expect(resolveHeading(headings, ['Parent', 'Contract']).anchor).toBe('contract')
    expect(() => resolveHeading(headings, ['Contract'])).toThrow('Ambiguous')
    expect(() => resolveHeading(headings, ['Missing'])).toThrow('Missing')
  })
  it('reads complete safe Markdown, definitions, links and images, with no executable HTML', async () => {
    const root = await fixture()
    const architecture = await queryArchitecture({ root })
    const doc = await renderDocument(root, architecture, 'docs/shared.md')
    expect(doc.html.length).toBeGreaterThan(12000)
    expect(doc.html).toContain('data-asset="docs/image.png"')
    expect(doc.html).toContain('file=docs%2Fwhole.md')
    expect(doc.html).not.toContain('<script>')
    expect(doc.html).not.toContain('src="https:')
    expect((await renderDocument(root, architecture, 'docs/whole.md')).html).toContain('file=docs%2Fshared.md')
    expect((await readAsset(root, architecture, 'docs/image.png')).type).toBe('image/png')
    await expect(renderDocument(root, architecture, '.rsp/config.yaml')).rejects.toThrow()
    await expect(renderDocument(root, architecture, '../secret.md')).rejects.toThrow()
    await symlink(join(root, 'docs/shared.md'), join(root, 'docs/escape.md'))
    await expect(renderDocument(root, architecture, 'docs/escape.md')).rejects.toThrow()
    await symlink(join(root, 'docs/image.png'), join(root, 'docs/escape.png'))
    await expect(readAsset(root, architecture, 'docs/escape.png')).rejects.toThrow()
  })
  it('preserves table headers/alignment and identical inline/reference link behavior', async () => {
    const root = await fixture()
    await writeFile(join(root, 'docs/shared.md'), [
      '# Contract',
      '| Name | Count | State | Default |\n| :--- | ---: | :---: | --- |\n| **Items** | 12 | `ready` | <script> |',
      '[Inline](https://example.com/docs?a=1&b=2)',
      '[Reference][external]',
      '[external]: https://example.com/docs?a=1&b=2',
      '[Mail][mail]\n\n[mail]: mailto:hello@example.com',
      '[Unsafe][unsafe]\n\n[unsafe]: javascript:alert(1)',
    ].join('\n\n'))
    const document = await renderDocument(root, await queryArchitecture({ root }), 'docs/shared.md')
    const html = fromHtml(document.html, { fragment: true })
    const elements = (parent: Root | Element, tag: string): Element[] => parent.children.flatMap(node => node.type === 'element' && node.tagName === tag ? [node] : [])
    const table = elements(html, 'table')[0]!
    const headers = elements(elements(elements(table, 'thead')[0]!, 'tr')[0]!, 'th')
    const cells = elements(elements(elements(table, 'tbody')[0]!, 'tr')[0]!, 'td')
    expect(headers.map(cell => cell.children)).toEqual(['Name', 'Count', 'State', 'Default'].map(value => [expect.objectContaining({ type: 'text', value })]))
    expect(cells).toHaveLength(4)
    for (const [index, alignment] of ['left', 'right', 'center', 'left'].entries()) {
      expect(headers[index]!.properties.scope).toBe('col')
      for (const cell of [headers[index]!, cells[index]!])
        expect(cell.properties.style).toMatch(new RegExp(`(?:^|;)\\s*text-align\\s*:\\s*${alignment}\\s*(?:;|$)`))
    }
    expect(elements(cells[0]!, 'strong')[0]!.children).toEqual([expect.objectContaining({ type: 'text', value: 'Items' })])
    expect(cells[1]!.children).toEqual([expect.objectContaining({ type: 'text', value: '12' })])
    expect(elements(cells[2]!, 'code')[0]!.children).toEqual([expect.objectContaining({ type: 'text', value: 'ready' })])
    const links = elements(html, 'p').flatMap(paragraph => elements(paragraph, 'a'))
    expect(links).toHaveLength(3)
    for (const label of ['Inline', 'Reference']) {
      const link = links.find(link => link.children.some(node => node.type === 'text' && node.value === label))!
      expect(link.properties).toMatchObject({ href: 'https://example.com/docs?a=1&b=2', target: '_blank', rel: expect.arrayContaining(['noopener', 'noreferrer']) })
    }
    const mail = links.find(link => link.properties.href === 'mailto:hello@example.com')!
    expect(mail.children).toEqual([expect.objectContaining({ type: 'text', value: 'Mail' })])
    expect(mail.properties.rel).toEqual(expect.arrayContaining(['noopener', 'noreferrer']))
    expect(mail.properties.target).toBeUndefined()
    expect(document.html).not.toContain('javascript:')
    expect(document.html).not.toContain('<script>')
  })
  it('resolves nested link and local-image definitions in source order with the first definition winning', async () => {
    const root = await fixture()
    await writeFile(join(root, 'docs/shared.md'), [
      '# References',
      '[Nested link][Read Me]',
      '![Nested image][Picture]',
      '[Root first][Root]',
      '> [read me]: whole.md#whole\n>\n> [picture]: image.png',
      '[READ ME]: ignored.md',
      '[picture]: ignored.png',
      '[root]: shared.md#contract',
      '- Definitions\n\n  [ROOT]: ignored.md',
      '- Image definition\n\n  [list image]: image.png',
      '![List image][list image]',
    ].join('\n\n'))
    const architecture = await queryArchitecture({ root })
    const document = await renderDocument(root, architecture, 'docs/shared.md')
    expect(document.html).toContain('href="/?file=docs%2Fwhole.md&amp;anchor=whole"')
    expect(document.html).toContain('href="/?file=docs%2Fshared.md&amp;anchor=contract"')
    expect(document.html).toContain('data-asset="docs/image.png" alt="Nested image"')
    expect(document.html).toContain('data-asset="docs/image.png" alt="List image"')
    expect(document.html).not.toContain('ignored.')
    expect((await readAsset(root, architecture, 'docs/image.png')).type).toBe('image/png')
  })
  it('authorizes current relative Markdown/image chains across directories without exposing arbitrary project files', async () => {
    const root = await fixture()
    await mkdir(join(root, 'docs/specs'))
    await mkdir(join(root, 'docs/images'))
    await mkdir(join(root, 'notes'))
    await mkdir(join(root, '.hidden'))
    await mkdir(join(root, 'secrets'))
    const input = model()
    input.bindings = [{ node: 'root', file: 'docs/specs/api.md', headings: ['Contract'], scope: 'subtree' }]
    await writeFile(join(root, '.rsp/architecture.json'), JSON.stringify(input))
    await writeFile(join(root, 'docs/specs/api.md'), '# Contract\n\n[Guide](../../notes/guide.md)\n\n![Diagram](../images/a.png)\n\n[Hidden](../../.hidden/leak.md)\n\n[Credentials](../../secrets/credentials.md)')
    await writeFile(join(root, 'notes/guide.md'), '# Guide\n\n[Back](../docs/specs/api.md)\n\n[Next](next.md)')
    await writeFile(join(root, 'notes/next.md'), '# Next')
    await writeFile(join(root, 'notes/unlinked.md'), '# Not authorized')
    await writeFile(join(root, '.hidden/leak.md'), '# Hidden')
    await writeFile(join(root, 'secrets/credentials.md'), '# Credentials')
    await writeFile(join(root, 'docs/images/a.png'), Buffer.from('image'))
    await writeFile(join(root, 'docs/images/unlinked.png'), Buffer.from('unlinked'))
    const architecture = await queryArchitecture({ root })
    const doc = await renderDocument(root, architecture, 'docs/specs/api.md')
    expect(doc.html).toContain('data-asset="docs/images/a.png"')
    expect(doc.html).toContain('file=notes%2Fguide.md')
    const renderedText = doc.html.replace(/<[^>]+>/g, '')
    expect(renderedText).toContain('Hidden (unavailable link)')
    expect(renderedText).toContain('Credentials (unavailable link)')
    expect((await renderDocument(root, architecture, 'notes/next.md')).html).toContain('Next')
    expect((await readAsset(root, architecture, 'docs/images/a.png')).content.toString()).toBe('image')
    for (const file of ['notes/unlinked.md', '.hidden/leak.md', 'secrets/credentials.md'])
      await expect(renderDocument(root, architecture, file)).rejects.toThrow()
    await expect(readAsset(root, architecture, 'docs/images/unlinked.png')).rejects.toThrow()
    await symlink(join(root, 'notes'), join(root, 'linked-notes'))
    await writeFile(join(root, 'docs/specs/api.md'), '# Contract\n\n[Symlink](../../linked-notes/guide.md)')
    await expect(renderDocument(root, architecture, 'linked-notes/guide.md')).rejects.toThrow()
    await expect(renderDocument(root, architecture, 'notes/next.md')).rejects.toThrow('not reachable')
    await expect(readAsset(root, architecture, 'docs/images/a.png')).rejects.toThrow('not reachable')
  })
  it('assigns globally unique heading anchors and binds a suffixed title to its own rendered chapter', async () => {
    const root = await fixture()
    const input = model()
    input.bindings = [{ node: 'root', file: 'docs/shared.md', headings: ['API-1'], scope: 'node' }]
    await writeFile(join(root, '.rsp/architecture.json'), JSON.stringify(input))
    for (const titles of [['API', 'API', 'API-1', 'API', 'API-1-1'], ['API-1', 'API', 'API', 'API-1', 'API-1-1']]) {
      const content = titles.map(title => `# ${title}\n\n${title} body\n`).join('\n')
      await writeFile(join(root, 'docs/shared.md'), content)
      const architecture = await queryArchitecture({ root })
      const doc = await renderDocument(root, architecture, 'docs/shared.md')
      expect(new Set(doc.headings.map(heading => heading.anchor)).size).toBe(titles.length)
      if (titles.filter(title => title === 'API-1').length === 1) {
        const binding = architecture.nodes[0]!.bindings[0]!
        expect(doc.html).toContain(`<h1 id="${binding.anchor}">API-1</h1>`)
      }
      else {
        expect(architecture.diagnostics.some(item => item.code === 'chapter_unresolved')).toBe(true)
      }
    }
  })
  it('lays out parent/child, ancestor and self relationships through explicit native endpoint references', async () => {
    const root = await fixture()
    const input = model()
    input.relations.push(
      { id: 'parent-child', source: 'root', target: 'child', type: 'owns', description: 'Owns child' },
      { id: 'child-parent', source: 'child', target: 'root', type: 'uses', description: 'Uses parent' },
      { id: 'self', source: 'child', target: 'child', type: 'retries', description: 'Retries itself' },
      { id: 'shared-target', source: 'root', target: 'external', type: 'writes', description: 'Parent writes external' },
      { id: 'parallel', source: 'child', target: 'external', type: 'observes', description: 'Also observes external' },
      { id: 'container-self', source: 'root', target: 'root', type: 'retry', description: 'Retries container' },
    )
    await writeFile(join(root, '.rsp/architecture.json'), JSON.stringify(input))
    const architecture = await queryArchitecture({ root })
    const layout = await layoutArchitecture(architecture, 'test')
    const relations = Object.values(layout.data.relations)
    expect(relations.map(edge => edge.title)).toEqual(input.relations.map(edge => edge.type))
    expect(relations.map(edge => edge.description)).toEqual(input.relations.map(edge => ({ txt: edge.description })))
    expect(layout.data.elements[layout.names.child!]).toBeDefined()
    expect(relations.filter(edge => layout.relationIds[edge.id] === 'self')).toHaveLength(1)
    const fullView = layout.data.views[layout.viewNames['']!]!
    expect(fullView.edges.some(edge => edge.relations.some(id => layout.relationIds[id] === 'self'))).toBe(true)
    for (const relation of relations) {
      const edge = fullView.edges.find(edge => edge.relations.includes(relation.id))!
      expect(edge, `Missing native relation: ${relation.title}`).toBeDefined()
      expect(edge.source).toBe(relation.source.model)
      expect(edge.target).toBe(relation.target.model)
      expect(edge.relations).toEqual([relation.id])
      const authored = input.relations.find(item => item.id === layout.relationIds[relation.id])!
      const original = (name: string) => layout.references[name] ?? Object.keys(layout.names).find(id => layout.names[id] === name)
      expect(original(edge.source)).toBe(authored.source)
      expect(original(edge.target)).toBe(authored.target)
    }
  }, 30_000)
  it('uses the CLI exact view selection in native diagrams without ancestor aggregation or boundary expansion', async () => {
    const root = await fixture()
    const input = model()
    input.nodes.push({ id: 'outside', title: 'Outside', description: 'Another boundary' })
    input.relations.push(
      { id: 'root-outside', source: 'root', target: 'outside', type: 'calls', description: 'root calls outside' },
      { id: 'boundary-only', source: 'beyond', target: 'outside', type: 'calls', description: 'boundary only' },
    )
    input.views.push({ id: 'exact', title: 'Exact view', node: 'root', include: ['root', 'external'] })
    await writeFile(join(root, '.rsp/architecture.json'), JSON.stringify(input))
    const selected = await queryArchitecture({ root, view: 'exact' })
    const layout = await layoutArchitecture(await queryArchitecture({ root }), 'exact')
    const view = layout.data.views[layout.viewNames.exact!]!
    const edges = view.edges
    const modelEdges = edges.flatMap(edge => edge.relations.map(id => layout.data.relations[id]!))
    expect(modelEdges.map(edge => layout.relationIds[edge.id]).sort()).toEqual(selected.relations.map(edge => edge.id).sort())
    const read = edges.find(edge => edge.relations.some(id => layout.relationIds[id] === 'read'))!
    expect(read.source).toBe(layout.names.child)
    expect(read.target).toBe(layout.names.external)
    expect(view.nodes.find(node => node.id === layout.names.child)?.title).toContain('[boundary]')
    expect(selected.nodes.find(node => node.id === 'child')?.boundary).toBe(true)
  }, 30_000)
  it('focuses only direct mixed relationships, keeps self identities and differs from subtree selection', async () => {
    const root = await fixture()
    const input = model()
    input.relations.push(
      { id: 'start', source: 'root', target: 'child', type: 'lifecycle', description: 'Starts child' },
      { id: 'retry', source: 'root', target: 'root', type: 'retry', description: 'Retries itself' },
    )
    await writeFile(join(root, '.rsp/architecture.json'), JSON.stringify(input))
    const architecture = await queryArchitecture({ root })
    const focus = selectArchitecture(architecture, { kind: 'focus', id: 'root' })
    expect([...focus.selected]).toEqual(['root'])
    expect([...focus.visible].sort()).toEqual(['child', 'root'])
    expect(focus.relations.map(edge => edge.id)).toEqual(['start', 'retry'])
    expect((await queryArchitecture({ root, node: 'root' })).relations.map(edge => edge.id)).toEqual(['read', 'start', 'retry'])
    const layout = await layoutArchitecture(architecture, 'focus', 'root')
    const view = layout.data.views[layout.focusView!]!
    expect(view.edges.flatMap(edge => edge.relations.map(id => layout.relationIds[id])).sort()).toEqual(['retry', 'start'])
    expect(new Set(view.edges.flatMap(edge => edge.relations)).size).toBe(2)
    const original = (name: string) => layout.references[name] ?? Object.keys(layout.names).find(id => layout.names[id] === name)!
    expect([...new Set(view.nodes.map(node => original(node.id)))].sort()).toEqual(['child', 'root'])
    expect(view.nodes.every(node => !node.parent)).toBe(true)
    expect(architecture.nodes.find(node => node.id === 'child')?.parent).toBe('root')
    expect(() => selectArchitecture(architecture, { kind: 'focus', id: 'missing' })).toThrow('Unknown architecture node')
  }, 30_000)
  it('cLI full/plain/compact commands work without importing the viewer dependency graph', async () => {
    const root = await fixture()
    const cli = join(process.cwd(), 'dist/cli.mjs')
    const run = (args: string[]) => execFileSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' })
    const compact = run(['architecture', '--json', '--compact'])
    expect(compact.trim().split('\n')).toHaveLength(1)
    expect(JSON.parse(compact).nodes).toHaveLength(4)
    const full = run(['architecture'])
    expect(full).toContain('child: Child — Reads contracts (parent: root)')
    expect(full).toContain('Relation read: child -> external [read]: reads')
    expect(full).toContain('View root: Root view (owner: root; include: child)')
    expect(full).toContain('docs/shared.md > Contract (scope: subtree; direct on root)')
    const child = run(['architecture', '--node', 'child'])
    expect(child).toContain('[boundary] external')
    expect(child).toContain('parent: root')
    expect(child).toContain('scope: subtree; inherited from root')
    expect(child).not.toContain('Relation next:')
    const view = run(['architecture', '--view', 'root'])
    expect(view).toContain('Selection: view root')
    expect(view).toContain('[boundary] external')
    expect(view).not.toContain('Relation next:')
    expect(() => run(['architecture', '--compact'])).toThrow()
    // The loader rejects viewer packages: structural commands must remain usable.
    await writeFile(join(root, 'loader.mjs'), 'export async function resolve(specifier, context, next) { if (specifier.startsWith("@likec4/")) throw Error("viewer imported"); return next(specifier, context); }')
    const output = execFileSync(process.execPath, ['--no-warnings', '--experimental-loader', join(root, 'loader.mjs'), cli, 'architecture', '--json'], { cwd: root, encoding: 'utf8' })
    expect(JSON.parse(output).configured).toBe(true)
  })
})
describe('local service isolation and updates', () => {
  it('keeps two Git projects and a real worktree isolated, reuses document-only layout and recovers invalid models', async () => {
    const first = await fixture('First project')
    const second = await fixture('Second project')
    for (const root of [first, second]) {
      execFileSync('git', ['init', '-q'], { cwd: root })
      execFileSync('git', ['add', '.'], { cwd: root })
      execFileSync('git', ['-c', 'user.name=Viewer Test', '-c', 'user.email=viewer@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'fixture'], { cwd: root })
    }
    const worktree = `${first}-worktree`
    temporary.push(worktree)
    execFileSync('git', ['worktree', 'add', '-q', '--detach', worktree], { cwd: first })
    const service = await createViewerService({ ...await viewerRuntime(process.cwd()), adminToken: 'admin-secret', readToken: 'read-secret' })
    shutdown.push(service.close)
    const base = `http://127.0.0.1:${service.port}`
    const control = async (path: string, body?: unknown) => fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: 'Bearer admin-secret' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    const read = (workspace: string, path: string) => fetch(`${base}/api/workspaces/${workspace}/${path}`, { headers: { Authorization: 'Bearer read-secret' } })
    expect((await fetch(`${base}/control/register`, { method: 'POST', body: JSON.stringify({ root: first }) })).status).toBe(403)
    expect((await fetch(`${base}/control/status`, { headers: { Authorization: 'Bearer admin-secret', Origin: 'https://attacker.invalid' } })).status).toBe(403)
    const ids = []
    for (const root of [first, second, worktree]) ids.push((await (await control('/control/register', { root })).json()).workspace)
    expect(new Set(ids).size).toBe(3)
    const results = await Promise.all(ids.map(id => read(id, 'model').then(response => response.json())))
    expect(results.map(result => result.architecture.nodes[0].title)).toEqual(['First project', 'Second project', 'First project'])
    const before = results[0]
    await writeFile(join(first, 'docs/shared.md'), '# Shared\n\n## Contract\n\nUPDATED COMPLETE BODY\n')
    const after = await (await read(ids[0], 'model')).json()
    expect(after.revision).not.toBe(before.revision)
    expect(after.graphRevision).toBe(before.graphRevision)
    expect((await (await read(ids[0], 'document?file=docs/shared.md')).json()).html).toContain('UPDATED COMPLETE BODY')
    for (const id of [ids[1], ids[2]]) {
      const document = await (await read(id, 'document?file=docs/shared.md')).json()
      expect(document.html).toContain('Shared')
      expect(document.html).not.toContain('UPDATED COMPLETE BODY')
    }
    await writeFile(join(first, '.rsp/architecture.json'), '{bad')
    expect((await read(ids[0], 'model')).status).toBe(409)
    expect((await read(ids[1], 'model')).status).toBe(200)
    await writeFile(join(first, '.rsp/architecture.json'), JSON.stringify(model()))
    expect((await read(ids[0], 'model')).status).toBe(200)
    await writeFile(join(first, '.rsp/config.yaml'), 'workflow:\n  delegation: invalid\n')
    expect((await read(ids[0], 'model')).status).toBe(409)
    await rm(join(first, '.rsp/config.yaml'))
    expect((await read(ids[0], 'model')).status).toBe(200)
    expect((await read(ids[0], 'document?file=../secret.md')).status).toBe(409)
    expect((await fetch(`${base}/api/workspaces/${ids[0]}/model`)).status).toBe(403)
    expect((await control('/control/status')).status).toBe(200)
  }, 60_000)
  it('retains background reading and expires service/workspace resources on the controlled clock', () => {
    const activity = new ReadingActivity(0)
    activity.heartbeat('a', 0)
    expect(activity.expired(IDLE_MS - 1)).toBe(false)
    expect(activity.inactive('a', WORKSPACE_GRACE_MS)).toBe(true)
    activity.heartbeat('background', IDLE_MS - 1)
    expect(activity.expired(IDLE_MS)).toBe(false)
    expect(activity.expired(IDLE_MS * 2 - 1)).toBe(true)
  })
})
