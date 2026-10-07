import { Buffer } from 'node:buffer'
import { execFile, execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import { afterEach, expect, it } from 'vitest'
import { parse, stringify } from 'yaml'

const cli = fileURLToPath(new URL('../../../scripts/research.mjs', import.meta.url))
const temporary = []
afterEach(() => temporary.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })))

function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'rsp-research-')))
  temporary.push(root)
  const repository = join(root, 'origin')
  mkdirSync(repository)
  const git = (...args) => execFileSync('git', args, { cwd: repository, encoding: 'utf8', stdio: 'pipe' }).trim()
  git('init', '-b', 'main')
  git('config', 'user.name', 'Fixture')
  git('config', 'user.email', 'fixture@example.test')
  const commit = (path, content) => {
    mkdirSync(dirname(join(repository, path)), { recursive: true })
    writeFileSync(join(repository, path), content)
    git('add', '--', path)
    git('commit', '-m', path)
    return git('rev-parse', 'HEAD')
  }
  const registry = { version: 1, sources: { sample: { repository, ref: 'main', paths: ['core/**'] } } }
  mkdirSync(join(root, 'research/legacy/upstreams'), { recursive: true })
  writeFileSync(join(root, 'research/sources.yaml'), stringify(registry))
  writeFileSync(join(root, 'upstreams.yaml'), 'Invalid retired registry; never read\n')
  // Invalid old records prove that the new engine never ingests them.
  writeFileSync(join(root, 'research/legacy/upstreams/upstreams.lock'), 'Frozen invalid legacy lock\n')
  mkdirSync(join(root, 'research/upstreams/sample'), { recursive: true })
  writeFileSync(join(root, 'research/upstreams/sample/legacy.md'), 'Frozen unrelated report\n')
  const invoke = (args, expected = 0, env = {}) => {
    const result = spawnSync(process.execPath, [cli, ...args, '--json'], { cwd: root, encoding: 'utf8', timeout: 20000, env: { ...process.env, ...env } })
    expect(result.status, result.stderr || result.stdout).toBe(expected)
    return JSON.parse(result.stdout)
  }
  const draft = study => join(root, 'research/studies', study, 'draft.md')
  const edit = (study, body, changeMetadata = value => value) => {
    const matched = /^---\n([\s\S]*?)\n---\n/.exec(readFileSync(draft(study), 'utf8'))
    const metadata = changeMetadata(parse(matched[1]))
    writeFileSync(draft(study), `---\n${stringify(metadata)}---\n${body}\n`)
  }
  const importText = (name, text) => {
    writeFileSync(join(root, name), text)
    return invoke(['import', '--file', name, '--origin', 'fixture execution', '--limitations', 'local simulation']).id
  }
  const sealedPath = ref => join(root, 'research/studies', ref.split('@')[0], 'revisions', `${ref.split('@')[1]}.md`)
  return { root, repository, git, commit, invoke, draft, edit, importText, sealedPath }
}

it('supports independent questions and scopes on one snapshot, retaining bytes after deleting Git', () => {
  const { root, commit, invoke, edit } = fixture()
  commit('core/task.md', 'source procedure\n')
  const revision = commit('docs/guide.md', 'source guide\n')
  expect(invoke(['capture', 'sample'], 1).error.kind).toBe('unavailable')
  expect(invoke(['sync', 'sample'])).toMatchObject({ revision, acquisition: 'explicit-sync' })
  const first = invoke(['capture', 'sample'])
  const second = invoke(['capture', 'sample', '--revision', revision, '--path', 'docs/**'])
  expect(first.id).not.toBe(second.id)
  expect(first.manifest.origin.revision).toBe(second.manifest.origin.revision)
  expect(first.manifest.files.map(file => file.path)).toEqual(['core/task.md'])
  expect(invoke(['capture', 'sample']).created).toBe(false)
  for (const study of ['procedures', 'navigation']) {
    invoke(['new', study, '--question', `How does ${study} work?`, '--evidence', first.id, '--evidence', second.id])
    expect(invoke(['show', study])).toMatchObject({ integrity: 'not-checked', body: '\n' })
    expect(invoke(['seal', study], 1).error.kind).toBe('invalid')
    edit(study, `Observed ${study}; a simulation remains unrun.`)
    const sealed = invoke(['seal', study])
    expect(sealed).toMatchObject({ created: true, semanticApproval: false, integrity: 'valid' })
    expect(invoke(['seal', study])).toMatchObject({ ref: sealed.ref, created: false })
    expect(invoke(['check', sealed.ref])).toMatchObject({ checkedEvidence: [first.id, second.id], integrity: 'valid' })
  }
  const listing = invoke(['list'])
  expect(listing.studies).toHaveLength(2)
  expect(listing.integrity).toBe('not-checked')
  expect(listing.evidence.find(item => item.id === first.id)).toEqual({ id: first.id, origin: first.manifest.origin, fileCount: 1, integrity: 'not-checked' })
  expect(invoke(['show', first.id]).manifest).toEqual(first.manifest)
  rmSync(join(root, '.cache'), { recursive: true })
  rmSync(join(root, 'origin'), { recursive: true })
  for (const study of listing.studies) {
    expect(invoke(['check', study.revisions[0]]).integrity).toBe('valid')
    expect(invoke(['show', study.revisions[0]]).integrity).toBe('not-checked')
  }
  expect(invoke(['check', first.id]).integrity).toBe('valid')
  expect(readFileSync(join(root, 'research/legacy/upstreams/upstreams.lock'), 'utf8')).toBe('Frozen invalid legacy lock\n')
  expect(readFileSync(join(root, 'research/upstreams/sample/legacy.md'), 'utf8')).toBe('Frozen unrelated report\n')
}, 20000)

it('retains exact empty, binary and oversized Git blobs across transfer batches', () => {
  const { root, commit, invoke } = fixture()
  const contents = [
    ['core/a-empty', Buffer.alloc(0)],
    ['core/b-binary', Buffer.from([0, 10, 255, 13, 128])],
    ['core/c-tab\tline\n.bin', Buffer.from([0, 10, 255, 13, 128])],
    ['core/d-large', Buffer.alloc(33 * 1024 * 1024, 0xFF)],
    ['core/e-tail', Buffer.from('retained after the oversized blob\n')],
  ]
  for (const [path, bytes] of contents)
    commit(path, bytes)
  invoke(['sync', 'sample'])
  const captured = invoke(['capture', 'sample'])
  expect(captured.manifest.files.map(file => file.path)).toEqual(contents.map(([path]) => path))
  for (const [path, bytes] of contents)
    expect(readFileSync(join(root, 'research/evidence', captured.id, 'files', path)).equals(bytes), path).toBe(true)
  expect(invoke(['check', captured.id]).integrity).toBe('valid')
  expect(invoke(['capture', 'sample'])).toMatchObject({ id: captured.id, created: false })
}, 20000)

it('reports a blob lost between inventory and reading as unavailable without publishing evidence', () => {
  const { root, commit, git, invoke } = fixture()
  commit('core/task.md', 'selected material')
  const blob = git('rev-parse', 'HEAD:core/task.md')
  invoke(['sync', 'sample'])
  const missingObject = join(root, '.cache/research/sources/sample/objects', blob.slice(0, 2), blob.slice(2))
  expect(existsSync(missingObject)).toBe(true)
  const shim = join(root, 'git-shim')
  mkdirSync(shim)
  writeFileSync(join(shim, 'git'), '#!/bin/sh\nfor argument do\n  if [ "$argument" = --batch ]; then rm -- "$RESEARCH_MISSING_OBJECT"; fi\ndone\nexec "$RESEARCH_TEST_GIT" "$@"\n', { mode: 0o755 })
  const result = invoke(['capture', 'sample'], 1, {
    PATH: `${shim}:${process.env.PATH}`,
    RESEARCH_TEST_GIT: execFileSync('which', ['git'], { encoding: 'utf8' }).trim(),
    RESEARCH_MISSING_OBJECT: missingObject,
  })
  expect(result.error.kind).toBe('unavailable')
  expect(existsSync(join(root, 'research/evidence'))).toBe(false)
}, 20000)

it('binds cached candidates to synchronized refs and does not label explicit commits with configured refs', () => {
  const { root, commit, git, invoke } = fixture()
  const main = commit('core/task.md', 'main material')
  git('checkout', '-b', 'next')
  const next = commit('core/task.md', 'next material')
  invoke(['sync', 'sample'])
  const registryPath = join(root, 'research/sources.yaml')
  const registry = parse(readFileSync(registryPath, 'utf8'))
  registry.sources.sample.ref = 'next'
  writeFileSync(registryPath, stringify(registry))
  expect(invoke(['capture', 'sample'], 1).error.kind).toBe('unavailable')
  const explicit = invoke(['capture', 'sample', '--revision', main])
  expect(explicit.manifest.origin).toMatchObject({ revision: main, selection: 'explicit-revision' })
  expect(explicit.manifest.origin).not.toHaveProperty('ref')
  invoke(['sync', 'sample'])
  expect(invoke(['capture', 'sample']).manifest.origin).toMatchObject({ revision: next, ref: 'next' })
  registry.sources.sample.ref = 'main'
  writeFileSync(registryPath, stringify(registry))
  expect(invoke(['capture', 'sample']).manifest.origin).toMatchObject({ revision: main, ref: 'main' })
}, 20000)

it('keeps overlapping CLI syncs bound to their own refs after another fetch completes', async () => {
  const { root, commit, git, invoke } = fixture()
  const main = commit('core/task.md', 'main material')
  git('checkout', '-b', 'next')
  const next = commit('core/task.md', 'next material')
  invoke(['sync', 'sample'])
  const shim = join(root, 'git-shim')
  mkdirSync(shim)
  const marker = join(root, 'fetch-done')
  const release = join(root, 'fetch-release')
  // Forward all real Git output/status; pause A only after its successful fetch.
  writeFileSync(join(shim, 'git'), `#!/bin/sh
"$RESEARCH_TEST_GIT" "$@"
status=$?
if [ "$status" -eq 0 ]; then
  for argument do
    if [ "$argument" = fetch ]; then
      : > "$RESEARCH_FETCH_DONE"
      while [ ! -f "$RESEARCH_FETCH_RELEASE" ]; do sleep 0.02; done
      break
    fi
  done
fi
exit "$status"
`, { mode: 0o755 })
  const pending = promisify(execFile)(process.execPath, [cli, 'sync', 'sample', '--json'], {
    cwd: root,
    timeout: 15000,
    env: {
      ...process.env,
      PATH: `${shim}:${process.env.PATH}`,
      RESEARCH_TEST_GIT: execFileSync('which', ['git'], { encoding: 'utf8' }).trim(),
      RESEARCH_FETCH_DONE: marker,
      RESEARCH_FETCH_RELEASE: release,
    },
  }).then(result => result, error => ({ error }))
  let result
  const registryPath = join(root, 'research/sources.yaml')
  const registry = parse(readFileSync(registryPath, 'utf8'))
  try {
    const deadline = Date.now() + 10000
    while (!existsSync(marker) && Date.now() < deadline)
      await delay(20)
    expect(existsSync(marker), 'A must finish its real fetch before B starts').toBe(true)
    registry.sources.sample.ref = 'next'
    writeFileSync(registryPath, stringify(registry))
    expect(invoke(['sync', 'sample']).revision).toBe(next)
  }
  finally {
    writeFileSync(release, '')
    result = await pending
  }
  expect(result.error).toBeUndefined()
  expect(JSON.parse(result.stdout).revision).toBe(main)
  for (const [ref, revision, content] of [['main', main, 'main material'], ['next', next, 'next material']]) {
    registry.sources.sample.ref = ref
    writeFileSync(registryPath, stringify(registry))
    const captured = invoke(['capture', 'sample'])
    expect(captured.manifest.origin).toMatchObject({ ref, revision })
    expect(readFileSync(join(root, 'research/evidence', captured.id, 'files/core/task.md'), 'utf8')).toBe(content)
    expect(invoke(['check', captured.id]).integrity).toBe('valid')
  }
}, 25000)

it('syncs new commits and forced ref rewinds in a normal cache and peels annotated tags', () => {
  const { root, commit, git, invoke } = fixture()
  const first = commit('core/task.md', 'initial material')
  expect(invoke(['sync', 'sample']).revision).toBe(first)
  const next = commit('core/task.md', 'new material')
  git('tag', '-a', 'v1', '-m', 'annotated fixture tag')
  expect(invoke(['sync', 'sample']).revision).toBe(next)
  expect(invoke(['capture', 'sample']).manifest.origin.revision).toBe(next)
  git('reset', '--hard', first)
  expect(invoke(['sync', 'sample']).revision).toBe(first)
  expect(invoke(['capture', 'sample']).manifest.origin.revision).toBe(first)
  const registryPath = join(root, 'research/sources.yaml')
  const registry = parse(readFileSync(registryPath, 'utf8'))
  registry.sources.sample.ref = 'v1'
  writeFileSync(registryPath, stringify(registry))
  expect(invoke(['sync', 'sample']).revision).toBe(next)
  const captured = invoke(['capture', 'sample'])
  expect(captured.manifest.origin).toMatchObject({ ref: 'v1', revision: next })
  expect(readFileSync(join(root, 'research/evidence', captured.id, 'files/core/task.md'), 'utf8')).toBe('new material')
}, 20000)

it('compares traceable successors and refuses unsealed edits or unlinked corrections', () => {
  const { root, invoke, edit, importText, sealedPath } = fixture()
  const first = importText('baseline.txt', 'baseline observation')
  const second = importText('experiment.txt', 'experiment observation')
  invoke(['new', 'approach', '--question', 'Which approach?', '--evidence', first])
  edit('approach', 'First conclusion')
  const baseline = invoke(['seal', 'approach']).ref
  edit('approach', 'Unsealed observation')
  expect(invoke(['revise', 'approach', '--from', baseline], 1).error.message).toMatch(/unsealed edits/)
  expect(invoke(['seal', 'approach'], 1).error.message).toMatch(/supersede/)
  expect(invoke(['show', 'approach']).body).toContain('Unsealed observation')
  edit('approach', 'First conclusion')
  invoke(['revise', 'approach', '--from', baseline])
  edit('approach', 'Follow-up conclusion', metadata => ({ ...metadata, question: 'Which approach after experiment?', evidence: [second] }))
  const followup = invoke(['seal', 'approach']).ref
  const compared = invoke(['compare', baseline, followup])
  expect(compared).toMatchObject({ recordIntegrity: 'valid', evidenceIntegrity: 'not-checked', history: { integrity: 'not-checked' } })
  expect(compared).not.toHaveProperty('integrity')
  expect(compared).toMatchObject({ before: baseline, after: followup, questionChanged: true, bodyChanged: true, addedEvidence: [second], removedEvidence: [first], semanticApproval: false })
  expect(compared.beforeText).toContain('First conclusion')
  expect(compared.afterText).toContain('Follow-up conclusion')
  expect(invoke(['check', followup]).checkedRevisions).toEqual([followup, baseline])
  // Branching from an older sealed version is explicit and preserves every version.
  invoke(['revise', 'approach', '--from', baseline])
  edit('approach', 'Alternative conclusion')
  const branch = invoke(['seal', 'approach']).ref
  expect(invoke(['show', branch]).metadata.supersedes).toEqual([baseline])
  edit('approach', 'Third conclusion', metadata => ({ ...metadata, supersedes: [] }))
  expect(invoke(['seal', 'approach'], 1).error.message).toMatch(/supersede/)
  edit('approach', 'Third conclusion', metadata => ({ ...metadata, supersedes: [baseline] }))
  writeFileSync(sealedPath(baseline), 'Altered prior conclusion')
  expect(invoke(['check', followup], 1).integrity).toBe('corrupt')
  expect(invoke(['compare', baseline, followup], 1).error.kind).toBe('corrupt')
  expect(invoke(['revise', 'approach', '--from', baseline], 1).error.kind).toBe('corrupt')
  const revisionsBefore = readdirSync(dirname(sealedPath(baseline)))
  expect(invoke(['seal', 'approach'], 1).error.kind).toBe('corrupt')
  expect(readdirSync(dirname(sealedPath(baseline)))).toEqual(revisionsBefore)
  rmSync(sealedPath(baseline))
  expect(invoke(['check', followup], 1).integrity).toBe('unavailable')
  expect(existsSync(join(root, 'research/legacy/upstreams/upstreams.lock'))).toBe(true)
}, 20000)

it('rejects missing/corrupt payloads and occupied identities without publishing revisions', () => {
  const { root, invoke, edit, importText } = fixture()
  const id = importText('data.bin', Buffer.from([0, 255, 128, 1]))
  invoke(['new', 'integrity', '--question', 'Is evidence intact?', '--evidence', id])
  edit('integrity', 'Material observed')
  const payload = join(root, 'research/evidence', id, 'files/data.bin')
  const original = readFileSync(payload)
  writeFileSync(payload, 'tampered')
  expect(invoke(['check', id], 1).integrity).toBe('corrupt')
  expect(invoke(['seal', 'integrity'], 1).error.kind).toBe('corrupt')
  expect(existsSync(join(root, 'research/studies/integrity/revisions'))).toBe(false)
  expect(invoke(['import', '--file', 'data.bin', '--origin', 'fixture execution', '--limitations', 'local simulation'], 1).error.kind).toBe('corrupt')
  expect(readFileSync(payload, 'utf8')).toBe('tampered')
  writeFileSync(payload, original)
  const ref = invoke(['seal', 'integrity']).ref
  rmSync(payload)
  expect(invoke(['check', ref], 1).integrity).toBe('unavailable')
  expect(invoke(['show', ref]).integrity).toBe('not-checked')
  expect(invoke(['list']).integrity).toBe('not-checked')
  writeFileSync(payload, original)
  const manifestPath = join(root, 'research/evidence', id, 'manifest.json')
  const manifest = readFileSync(manifestPath)
  writeFileSync(manifestPath, manifest.toString().replace('fixture execution', 'altered provenance'))
  expect(invoke(['check', id], 1).integrity).toBe('corrupt')
  writeFileSync(manifestPath, manifest)
  writeFileSync(join(root, 'research/evidence', id, 'files/unrecorded.txt'), 'extra material')
  expect(invoke(['check', id], 1).integrity).toBe('corrupt')
}, 20000)

it('imports directory bytes with provenance and refuses symlinks and unsafe names', () => {
  const { root, invoke } = fixture()
  mkdirSync(join(root, 'bundle/nested'), { recursive: true })
  writeFileSync(join(root, 'bundle/nested/results.json'), '{"result":"local"}')
  writeFileSync(join(root, 'bundle/notes.md'), 'limitations')
  const imported = invoke(['import', '--file', 'bundle', '--origin', 'local experiment run 7', '--license', 'private', '--limitations', 'not a model acceptance'])
  expect(imported.manifest).toMatchObject({ origin: { kind: 'import', origin: 'local experiment run 7' }, license: 'private', limitations: 'not a model acceptance' })
  expect(imported.manifest.files.map(file => file.path)).toEqual(['nested/results.json', 'notes.md'])
  expect(invoke(['show', imported.id]).integrity).toBe('not-checked')
  symlinkSync(join(root, 'bundle'), join(root, 'link'))
  expect(invoke(['import', '--file', 'link/notes.md', '--origin', 'bad'], 1).error.kind).toBe('invalid')
  symlinkSync(join(root, 'research/legacy/upstreams/upstreams.lock'), join(root, 'bundle/alias'))
  expect(invoke(['import', '--file', 'bundle', '--origin', 'bad'], 1).error.kind).toBe('invalid')
  expect(invoke(['new', '../escape', '--question', 'bad', '--evidence', imported.id], 1).error.kind).toBe('invalid')
  const evidence = join(root, 'research/evidence', imported.id, 'files/notes.md')
  rmSync(evidence)
  symlinkSync(join(root, 'research/legacy/upstreams/upstreams.lock'), evidence)
  expect(invoke(['check', imported.id], 1).integrity).toBe('corrupt')
  expect(readFileSync(join(root, 'research/legacy/upstreams/upstreams.lock'), 'utf8')).toBe('Frozen invalid legacy lock\n')
}, 20000)

it('refuses symlinked storage and source symlinks without partial evidence publication', () => {
  const { root, commit, git, invoke } = fixture()
  commit('core/task.md', 'ordinary')
  symlinkSync('task.md', join(root, 'origin/core/link.md'))
  git('add', '--', 'core/link.md')
  git('commit', '-m', 'source symlink')
  invoke(['sync', 'sample'])
  expect(invoke(['capture', 'sample'], 1).error.kind).toBe('invalid')
  expect(existsSync(join(root, 'research/evidence'))).toBe(false)
  mkdirSync(join(root, 'outside'))
  symlinkSync(join(root, 'outside'), join(root, 'research/evidence'))
  expect(invoke(['capture', 'sample', '--path', 'core/task.md'], 1).error.kind).toBe('corrupt')
  expect(readdirSync(join(root, 'outside'))).toEqual([])
}, 20000)

it('never lazy-fetches promised objects for capture or reads', () => {
  const { root, repository, git, commit, invoke, importText, edit } = fixture()
  const revision = commit('core/task.md', 'promised contents\n')
  const blob = git('rev-parse', `${revision}:core/task.md`)
  git('config', 'uploadpack.allowFilter', 'true')
  const cache = join(root, '.cache/research/sources/sample')
  mkdirSync(dirname(cache), { recursive: true })
  execFileSync('git', ['clone', '--bare', '--filter=blob:none', pathToFileURL(repository).href, cache], { stdio: 'pipe' })
  const cachedGit = (...args) => execFileSync('git', args, { cwd: cache, encoding: 'utf8', env: { ...process.env, GIT_NO_LAZY_FETCH: '1' }, stdio: 'pipe' }).trim()
  cachedGit('remote', 'set-url', 'origin', repository)
  const missing = () => spawnSync('git', ['cat-file', '-e', blob], { cwd: cache, env: { ...process.env, GIT_NO_LAZY_FETCH: '1' } }).status !== 0
  expect(missing()).toBe(true)
  const id = importText('offline.txt', 'retained observation')
  invoke(['new', 'offline', '--question', 'Offline?', '--evidence', id])
  edit('offline', 'Observed retained evidence')
  const ref = invoke(['seal', 'offline']).ref
  const objects = join(cache, 'objects')
  const snapshot = () => readdirSync(objects, { recursive: true }).sort().filter(path => statSync(join(objects, path)).isFile()).map(path => [path, readFileSync(join(objects, path)).toString('hex')])
  const before = snapshot()
  const trace = join(root, 'git-trace.jsonl')
  const env = { GIT_TRACE2_EVENT: trace, GIT_NO_LAZY_FETCH: '0' }
  const missingCapture = invoke(['capture', 'sample', '--revision', revision], 1, env).error
  expect(missingCapture.kind, missingCapture.message).toBe('unavailable')
  for (const args of [['list'], ['show', ref], ['check', ref], ['check', id]])
    invoke(args, 0, env)
  expect(snapshot()).toEqual(before)
  expect(missing()).toBe(true)
  const events = readFileSync(trace, 'utf8').trim().split('\n').map(line => JSON.parse(line))
  expect(events.filter(event => event.event === 'child_start' && event.argv?.some(arg => /^(?:fetch|upload-pack)$|git-upload-pack/.test(arg)))).toEqual([])
  // Simulate a Git implementation that ignores the no-lazy-fetch environment knob.
  // Transport prohibition still prevents object acquisition and cache mutation.
  const shim = join(root, 'git-shim')
  mkdirSync(shim)
  writeFileSync(join(shim, 'git'), '#!/bin/sh\nunset GIT_NO_LAZY_FETCH\nexec "$RESEARCH_TEST_GIT" "$@"\n', { mode: 0o755 })
  const fallbackTrace = join(root, 'fallback-trace.jsonl')
  const unsupported = invoke(['capture', 'sample', '--revision', revision], 1, {
    PATH: `${shim}:${process.env.PATH}`,
    RESEARCH_TEST_GIT: execFileSync('which', ['git'], { encoding: 'utf8' }).trim(),
    GIT_TRACE2_EVENT: fallbackTrace,
  })
  expect(unsupported.error.kind, unsupported.error.message).toBe('unavailable')
  expect(unsupported.error.message).toMatch(/transport .* not allowed/)
  expect(snapshot()).toEqual(before)
  expect(missing()).toBe(true)
  const fallbackEvents = readFileSync(fallbackTrace, 'utf8').trim().split('\n').map(line => JSON.parse(line))
  expect(fallbackEvents.filter(event => event.event === 'child_start' && event.argv?.some(arg => /git-upload-pack|^upload-pack$/.test(arg)))).toEqual([])
}, 20000)

it('accepts a workspace root alias while rejecting symlinks in the selected import path', () => {
  const { root } = fixture()
  const aliasParent = mkdtempSync(join(tmpdir(), 'rsp-research-alias-'))
  temporary.push(aliasParent)
  const alias = join(aliasParent, 'workspace')
  symlinkSync(root, alias)
  mkdirSync(join(root, 'material'))
  writeFileSync(join(root, 'material/excerpt.md'), 'retained bytes')
  // The public command receives an aliased workspace root, as on macOS /var.
  const program = 'const {runResearch}=await import(process.argv[1]); console.log(JSON.stringify(await runResearch(JSON.parse(process.argv[3]),process.argv[2])))'
  const invokeAlias = args => spawnSync(process.execPath, ['--input-type=module', '-e', program, pathToFileURL(cli).href, alias, JSON.stringify(args)], { encoding: 'utf8' })
  const success = invokeAlias(['import', '--file', 'material', '--origin', 'aliased workspace'])
  expect(success.status, success.stderr).toBe(0)
  expect(JSON.parse(success.stdout).manifest.files[0].path).toBe('excerpt.md')
  const absolute = invokeAlias(['import', '--file', join(alias, 'material/excerpt.md'), '--origin', 'aliased absolute path'])
  expect(absolute.status, absolute.stderr).toBe(0)
  const canonicalAbsolute = invokeAlias(['import', '--file', join(root, 'material/excerpt.md'), '--origin', 'canonical absolute path'])
  expect(canonicalAbsolute.status, canonicalAbsolute.stderr).toBe(0)
  symlinkSync(join(root, 'material'), join(root, 'selected-link'))
  for (const file of ['selected-link/excerpt.md', join(alias, 'selected-link/excerpt.md'), join(root, 'selected-link/excerpt.md')]) {
    const rejected = invokeAlias(['import', '--file', file, '--origin', 'symlink'])
    expect(rejected.status, rejected.stdout || rejected.stderr).toBe(1)
    expect(rejected.stderr).toMatch(/does not follow symlinks/)
  }
})

it('imports normal external temporary inputs through parent aliases but rejects selected and subtree links', () => {
  const { invoke } = fixture()
  // A sibling mkdtemp(tmpdir()) input is outside the canonical workspace. On
  // macOS its spelling contains the /var alias that originally caused rejection.
  const external = mkdtempSync(join(tmpdir(), 'rsp-research-external-'))
  temporary.push(external)
  writeFileSync(join(external, 'normal.txt'), 'external bytes')
  const imported = invoke(['import', '--file', join(external, 'normal.txt'), '--origin', 'external local input'])
  expect(imported.manifest.files.map(file => file.path)).toEqual(['normal.txt'])
  expect(invoke(['check', imported.id]).integrity).toBe('valid')
  const aliasParent = mkdtempSync(join(tmpdir(), 'rsp-research-parent-'))
  temporary.push(aliasParent)
  symlinkSync(external, join(aliasParent, 'location'))
  expect(invoke(['import', '--file', join(aliasParent, 'location/normal.txt'), '--origin', 'parent alias']).integrity).toBe('valid')
  symlinkSync(join(external, 'normal.txt'), join(external, 'selected.txt'))
  expect(invoke(['import', '--file', join(external, 'selected.txt'), '--origin', 'selected link'], 1).error.kind).toBe('invalid')
  symlinkSync(external, join(external, 'selected-directory'))
  expect(invoke(['import', '--file', join(external, 'selected-directory'), '--origin', 'selected directory link'], 1).error.kind).toBe('invalid')
  expect(invoke(['import', '--file', external, '--origin', 'linked subtree'], 1).error.kind).toBe('invalid')
})

it('starts from a question and permits incomplete drafts to be viewed until ready to seal', () => {
  const { invoke, edit, importText } = fixture()
  expect(invoke(['new', 'question-first', '--question', 'What should be investigated?'])).toMatchObject({ sealed: false, integrity: 'not-checked' })
  expect(invoke(['show', 'question-first'])).toMatchObject({ metadata: { evidence: [], supersedes: [] }, body: '\n', integrity: 'not-checked' })
  expect(invoke(['list']).studies).toEqual([expect.objectContaining({ study: 'question-first', question: 'What should be investigated?', draft: true })])
  expect(invoke(['seal', 'question-first'], 1).error.kind).toBe('invalid')
  expect(invoke(['check', 'question-first'], 1)).toMatchObject({ integrity: 'invalid', history: { integrity: 'not-checked' } })
  edit('question-first', 'Conclusion without material')
  expect(invoke(['seal', 'question-first'], 1).error.message).toMatch(/nonempty unique array/)
  const id = importText('material.txt', 'retained material')
  edit('question-first', '', metadata => ({ ...metadata, evidence: [id] }))
  expect(invoke(['show', 'question-first']).body.trim()).toBe('')
  expect(invoke(['seal', 'question-first'], 1).error.message).toMatch(/nonempty research body/)
  edit('question-first', 'Evidence-supported conclusion')
  expect(invoke(['seal', 'question-first'])).toMatchObject({ integrity: 'valid', history: { integrity: 'not-checked' } })
})

it('keeps replaced historical evidence independent from current integrity and audits the full graph only on request', () => {
  const { root, invoke, edit, importText, sealedPath, draft } = fixture()
  const old = importText('old.txt', 'old material')
  const oldOther = importText('old-other.txt', 'other old material')
  const replacement = importText('replacement.txt', 'replacement material')
  invoke(['new', 'replacement', '--question', 'Which evidence?', '--evidence', old, '--evidence', oldOther])
  edit('replacement', 'Baseline conclusion')
  const baseline = invoke(['seal', 'replacement']).ref
  const oldPayload = join(root, 'research/evidence', old, 'files/old.txt')
  const otherPayload = join(root, 'research/evidence', oldOther, 'files/old-other.txt')
  rmSync(oldPayload)
  writeFileSync(otherPayload, 'corruption')
  // revise checks sealed record bytes, permitting unavailable evidence replacement.
  invoke(['revise', 'replacement', '--from', baseline])
  edit('replacement', 'Replaced conclusion', metadata => ({ ...metadata, evidence: [replacement] }))
  const followup = invoke(['seal', 'replacement']).ref
  const current = invoke(['check', followup])
  expect(current).toMatchObject({ integrity: 'valid', checkedEvidence: [replacement], history: { integrity: 'not-checked', diagnostics: [] } })
  expect(invoke(['seal', 'replacement']).created).toBe(false)
  invoke(['revise', 'replacement', '--from', followup])
  edit('replacement', 'Further conclusion')
  const latest = invoke(['seal', 'replacement']).ref
  expect(invoke(['compare', followup, latest])).toMatchObject({ recordIntegrity: 'valid', evidenceIntegrity: 'not-checked', history: { integrity: 'not-checked' } })
  // Even the report whose own evidence is unavailable/corrupt remains comparable.
  expect(invoke(['compare', baseline, latest])).toMatchObject({ recordIntegrity: 'valid', evidenceIntegrity: 'not-checked', removedEvidence: [old, oldOther] })
  const draftBefore = readFileSync(draft('replacement'))
  const revisionNames = readdirSync(dirname(sealedPath(latest)))
  const audited = invoke(['check', latest, '--history'], 1)
  expect(audited.integrity).toBe('valid')
  expect(audited.history).toMatchObject({ integrity: 'corrupt', diagnostics: expect.arrayContaining([
    expect.objectContaining({ target: old, kind: 'unavailable' }),
    expect.objectContaining({ target: oldOther, kind: 'corrupt' }),
  ]) })
  expect(audited.history.checkedRevisions).toEqual([latest, followup, baseline])
  expect(audited.history.checkedEvidence).toEqual([replacement, old, oldOther])
  expect(readFileSync(draft('replacement'))).toEqual(draftBefore)
  expect(readdirSync(dirname(sealedPath(latest)))).toEqual(revisionNames)
  writeFileSync(otherPayload, 'other old material')
  expect(invoke(['check', latest, '--history'], 1)).toMatchObject({ integrity: 'valid', history: { integrity: 'unavailable' } })
  writeFileSync(oldPayload, 'old material')
  expect(invoke(['check', 'replacement', '--history'])).toMatchObject({ integrity: 'valid', history: { integrity: 'valid', diagnostics: [] } })
  // Older record corruption is observable in history without becoming a hidden
  // transitive dependency of the latest version. Immediate corruption still fails.
  writeFileSync(sealedPath(baseline), 'changed historical record')
  expect(invoke(['check', latest]).integrity).toBe('valid')
  expect(invoke(['check', latest, '--history'], 1).history.diagnostics).toContainEqual(expect.objectContaining({ target: baseline, kind: 'corrupt' }))
  expect(invoke(['check', followup], 1).integrity).toBe('corrupt')
  expect(invoke(['compare', followup, latest]).recordIntegrity).toBe('valid')
  rmSync(sealedPath(baseline))
  expect(invoke(['compare', followup, latest]).recordIntegrity).toBe('valid')
  expect(invoke(['check', followup], 1).integrity).toBe('unavailable')
  const payload = join(root, 'research/evidence', replacement, 'files/replacement.txt')
  rmSync(payload)
  expect(invoke(['check', latest], 1)).toMatchObject({ integrity: 'unavailable', history: { integrity: 'not-checked' } })
  expect(invoke(['compare', followup, latest]).evidenceIntegrity).toBe('not-checked')
  expect(invoke(['seal', 'replacement'], 1).error.kind).toBe('unavailable')
  // Even missing current evidence does not prevent revising intact sealed bytes.
  invoke(['revise', 'replacement', '--from', latest])
  expect(invoke(['show', 'replacement']).metadata.supersedes).toEqual([latest])
}, 20000)

it('rejects malformed immediate predecessor records even when their content hash matches', () => {
  const { invoke, edit, importText, sealedPath, draft } = fixture()
  const id = importText('record.txt', 'record material')
  invoke(['new', 'record-schema', '--question', 'Which conclusion?', '--evidence', id])
  edit('record-schema', 'Initial conclusion')
  const valid = invoke(['seal', 'record-schema']).ref
  const malformed = '---\nquestion: Broken record\nevidence: []\nsupersedes: []\n---\nRecorded body\n'
  const malformedRef = `record-schema@${createHash('sha256').update(malformed).digest('hex')}`
  writeFileSync(sealedPath(malformedRef), malformed)
  const before = readFileSync(draft('record-schema'))
  expect(invoke(['revise', 'record-schema', '--from', malformedRef], 1).error).toMatchObject({ kind: 'corrupt', message: expect.stringContaining('Invalid sealed revision') })
  expect(readFileSync(draft('record-schema'))).toEqual(before)
  invoke(['revise', 'record-schema', '--from', valid])
  edit('record-schema', 'Follow-up conclusion', metadata => ({ ...metadata, supersedes: [malformedRef] }))
  expect(invoke(['check', 'record-schema'], 1).integrity).toBe('corrupt')
  expect(invoke(['seal', 'record-schema'], 1).error.kind).toBe('corrupt')
  expect(invoke(['compare', valid, malformedRef], 1).error.kind).toBe('corrupt')
})

it('distinguishes command errors, missing bytes and operational Git errors', () => {
  const { root, invoke } = fixture()
  expect(invoke(['--help']).help).toMatch(/seal.*freeze/)
  expect(invoke(['accept', 'sample'], 1).error.kind).toBe('invalid')
  expect(invoke(['new', 'empty'], 1).error.kind).toBe('invalid')
  expect(invoke(['check', 'missing'], 1).integrity).toBe('unavailable')
  expect(invoke(['check', 'missing', '--history', '--history'], 1).error.kind).toBe('invalid')
  expect(invoke(['check', '0'.repeat(64), '--history'], 1).error.message).toMatch(/not an evidence hash/)
  mkdirSync(join(root, '.cache/research/sources/sample'), { recursive: true })
  expect(invoke(['capture', 'sample'], 1).error.kind).toBe('operational-error')
  rmSync(join(root, 'research/sources.yaml'))
  // A missing active registry never falls back to the retired root file.
  expect(invoke(['capture', 'sample'], 1).error.kind).toBe('unavailable')
})
