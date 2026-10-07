import { Buffer } from 'node:buffer'
import { execFile, execFileSync, spawnSync } from 'node:child_process'
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
  mkdirSync(join(root, 'research'), { recursive: true })
  writeFileSync(join(root, 'research/sources.yaml'), stringify(registry))
  const invoke = (args, expected = 0, env = {}) => {
    const result = spawnSync(process.execPath, [cli, ...args, '--json'], { cwd: root, encoding: 'utf8', timeout: 20000, env: { ...process.env, ...env } })
    expect(result.status, result.stderr || result.stdout).toBe(expected)
    return JSON.parse(result.stdout)
  }
  const importText = (name, text) => {
    writeFileSync(join(root, name), text)
    return invoke(['import', '--file', name, '--origin', 'fixture execution', '--limitations', 'local simulation']).id
  }
  return { root, repository, git, commit, invoke, importText }
}

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
  for (const [path, bytes] of contents)
    expect(readFileSync(join(root, captured.path, path)).equals(bytes), path).toBe(true)
  expect(invoke(['show', captured.id]).local).toBe('present')
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
  expect(existsSync(join(root, 'research/captures'))).toBe(false)
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
  expect(explicit.id).toBe(`sample@${main}`)
  expect(explicit.capture).not.toHaveProperty('ref')
  invoke(['sync', 'sample'])
  expect(invoke(['capture', 'sample']).id).toBe(`sample@${next}`)
  registry.sources.sample.ref = 'main'
  writeFileSync(registryPath, stringify(registry))
  expect(invoke(['capture', 'sample']).id).toBe(`sample@${main}`)
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
    expect(captured.id).toBe(`sample@${revision}`)
    expect(readFileSync(join(root, captured.path, 'core/task.md'), 'utf8')).toBe(content)
    expect(invoke(['show', captured.id]).local).toBe('present')
  }
}, 25000)

it('syncs new commits and forced ref rewinds in a normal cache and peels annotated tags', () => {
  const { root, commit, git, invoke } = fixture()
  const first = commit('core/task.md', 'initial material')
  expect(invoke(['sync', 'sample']).revision).toBe(first)
  const next = commit('core/task.md', 'new material')
  git('tag', '-a', 'v1', '-m', 'annotated fixture tag')
  expect(invoke(['sync', 'sample']).revision).toBe(next)
  expect(invoke(['capture', 'sample']).id).toBe(`sample@${next}`)
  git('reset', '--hard', first)
  expect(invoke(['sync', 'sample']).revision).toBe(first)
  expect(invoke(['capture', 'sample']).id).toBe(`sample@${first}`)
  const registryPath = join(root, 'research/sources.yaml')
  const registry = parse(readFileSync(registryPath, 'utf8'))
  registry.sources.sample.ref = 'v1'
  writeFileSync(registryPath, stringify(registry))
  expect(invoke(['sync', 'sample']).revision).toBe(next)
  const captured = invoke(['capture', 'sample'])
  expect(captured.id).toBe(`sample@${next}`)
  expect(readFileSync(join(root, captured.path, 'core/task.md'), 'utf8')).toBe('new material')
}, 20000)

it('refuses symlinked storage and source symlinks without partial evidence publication', () => {
  const { root, commit, git, invoke } = fixture()
  commit('core/task.md', 'ordinary')
  symlinkSync('task.md', join(root, 'origin/core/link.md'))
  git('add', '--', 'core/link.md')
  git('commit', '-m', 'source symlink')
  invoke(['sync', 'sample'])
  expect(invoke(['capture', 'sample'], 1).error.kind).toBe('invalid')
  expect(existsSync(join(root, 'research/captures'))).toBe(false)
  mkdirSync(join(root, 'outside'))
  symlinkSync(join(root, 'outside'), join(root, 'research/captures'))
  expect(invoke(['capture', 'sample', '--path', 'core/task.md'], 1).error.kind).toBe('corrupt')
  expect(readdirSync(join(root, 'outside'))).toEqual([])
}, 20000)

it('never lazy-fetches promised objects for capture or reads', () => {
  const { root, repository, git, commit, invoke, importText } = fixture()
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
  const objects = join(cache, 'objects')
  const snapshot = () => readdirSync(objects, { recursive: true }).sort().filter(path => statSync(join(objects, path)).isFile()).map(path => [path, readFileSync(join(objects, path)).toString('hex')])
  const before = snapshot()
  const trace = join(root, 'git-trace.jsonl')
  const env = { GIT_TRACE2_EVENT: trace, GIT_NO_LAZY_FETCH: '0' }
  const missingCapture = invoke(['capture', 'sample', '--revision', revision], 1, env).error
  expect(missingCapture.kind, missingCapture.message).toBe('unavailable')
  for (const args of [['list'], ['show', id]])
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
  expect(readFileSync(join(root, JSON.parse(success.stdout).path, 'excerpt.md'), 'utf8')).toBe('retained bytes')
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
  const { root, invoke } = fixture()
  // A sibling mkdtemp(tmpdir()) input is outside the canonical workspace. On
  // macOS its spelling contains the /var alias that originally caused rejection.
  const external = mkdtempSync(join(tmpdir(), 'rsp-research-external-'))
  temporary.push(external)
  writeFileSync(join(external, 'normal.txt'), 'external bytes')
  const imported = invoke(['import', '--file', join(external, 'normal.txt'), '--origin', 'external local input'])
  expect(readFileSync(join(root, imported.path, 'normal.txt'), 'utf8')).toBe('external bytes')
  expect(invoke(['show', imported.id]).local).toBe('present')
  const aliasParent = mkdtempSync(join(tmpdir(), 'rsp-research-parent-'))
  temporary.push(aliasParent)
  symlinkSync(external, join(aliasParent, 'location'))
  expect(invoke(['import', '--file', join(aliasParent, 'location/normal.txt'), '--origin', 'parent alias']).local).toBe('present')
  symlinkSync(join(external, 'normal.txt'), join(external, 'selected.txt'))
  expect(invoke(['import', '--file', join(external, 'selected.txt'), '--origin', 'selected link'], 1).error.kind).toBe('invalid')
  symlinkSync(external, join(external, 'selected-directory'))
  expect(invoke(['import', '--file', join(external, 'selected-directory'), '--origin', 'selected directory link'], 1).error.kind).toBe('invalid')
  expect(invoke(['import', '--file', external, '--origin', 'linked subtree'], 1).error.kind).toBe('invalid')
})

it('resumes only failures and records explicit configuration changes without refreshing successes', () => {
  const { root, commit, invoke } = fixture()
  const a = commit('core/a.md', 'a')
  const path = join(root, 'research/sources.yaml')
  const registry = parse(readFileSync(path, 'utf8'))
  registry.sources.broken = { ...registry.sources.sample, repository: join(root, 'missing') }
  writeFileSync(path, stringify(registry))
  const partial = invoke(['refresh', '--all'], 1)
  expect(partial.record.sources.map(s => s.status)).toEqual(['failed', 'captured'])
  commit('core/a.md', 'newer')
  registry.sources.broken.repository = registry.sources.sample.repository
  writeFileSync(path, stringify(registry))
  // Frozen task config is reused unless update is explicit.
  expect(invoke(['refresh', '--resume', partial.ref], 1).record.sources[0].status).toBe('failed')
  const recovered = invoke(['refresh', '--resume', partial.ref, '--update-config'])
  expect(recovered.ref).toBe(partial.ref)
  expect(recovered.acquisition).toBe('complete')
  expect(recovered.record.sources[1].revision).toBe(a)
  expect(recovered.record.sources[1].attempts).toHaveLength(1)
  expect(recovered.record.sources[0].attempts.map(a => a.status)).toEqual(['failed', 'failed', 'captured'])
  const index = readFileSync(join(root, 'research/index.json'))
  invoke(['refresh', '--resume', partial.ref])
  expect(readFileSync(join(root, 'research/index.json'))).toEqual(index)
})

it('persists progress through process death and refuses a concurrent resume', async () => {
  const { root, commit } = fixture()
  commit('core/a.md', 'a')
  const module = pathToFileURL(cli).href
  const program = 'const {runResearch}=await import(process.argv[1]); await runResearch(["refresh","--all"],process.argv[2],e=>{if(e.status==="captured")process.kill(process.pid,"SIGKILL")})'
  const stopped = spawnSync(process.execPath, ['--input-type=module', '-e', program, module, root], { encoding: 'utf8' })
  expect(stopped.signal).toBe('SIGKILL')
  const file = readdirSync(join(root, 'research/refreshes'))[0]
  const record = JSON.parse(readFileSync(join(root, 'research/refreshes', file)))
  expect(record.sources[0].status).toBe('captured')
  const { runResearch } = await import(module)
  const resumed = await runResearch(['refresh', '--resume', record.id], root)
  expect(resumed.record.sources[0].attempts).toHaveLength(1)
  expect(resumed.acquisition).toBe('complete')
  const { withLock } = await import('../../../scripts/research/locking.mjs')
  await withLock(root, `refresh-${record.id.slice(8).toLowerCase()}`, async () => {
    await expect(runResearch(['refresh', '--resume', record.id], root)).rejects.toThrow('active')
  })
})

it('retains nonempty failure history when resuming an interrupted source attempt', () => {
  const { root, commit, invoke } = fixture()
  commit('core/a.md', 'a')
  const run = invoke(['refresh', '--all'])
  const record = run.record
  record.sources[0].status = 'running'
  record.sources[0].attempts[0].status = 'running'
  delete record.sources[0].evidence
  writeFileSync(join(root, run.path), JSON.stringify(record))
  const resumed = invoke(['refresh', '--resume', run.ref])
  expect(resumed.record.sources[0].attempts.map(item => item.status)).toEqual(['interrupted', 'captured'])
  expect(resumed.acquisition).toBe('complete')
})

it('retries transient Git boundaries and cleans a failed clone before retrying', () => {
  const { root, commit, invoke } = fixture()
  commit('core/a.md', 'a')
  const shim = join(root, 'git-shim')
  mkdirSync(shim)
  writeFileSync(join(shim, 'git'), '#!/bin/sh\noperation=""\nfor argument do\n  case "$argument" in clone|fetch) operation="$argument" ;; esac\n  last="$argument"\ndone\nif [ -n "$operation" ] && [ ! -f "$RESEARCH_RETRY_MARKER-$operation" ]; then\n  touch "$RESEARCH_RETRY_MARKER-$operation"\n  if [ "$operation" = clone ]; then mkdir -p "$last"; touch "$last/incomplete"; fi\n  echo "TLS connection reset" >&2\n  exit 128\nfi\nexec "$RESEARCH_TEST_GIT" "$@"\n', { mode: 0o755 })
  const marker = join(root, 'retry')
  const result = invoke(['refresh', '--all'], 0, {
    PATH: `${shim}:${process.env.PATH}`,
    RESEARCH_TEST_GIT: execFileSync('which', ['git'], { encoding: 'utf8' }).trim(),
    RESEARCH_RETRY_MARKER: marker,
  })
  expect(result.acquisition).toBe('complete')
  expect(existsSync(`${marker}-clone`)).toBe(true)
  expect(existsSync(`${marker}-fetch`)).toBe(true)
  expect(existsSync(join(root, '.cache/research/sources/sample/incomplete'))).toBe(false)
  expect(readdirSync(join(root, '.cache/research/sources')).filter(name => name.startsWith('.sync-'))).toEqual([])
})

it('keeps only recovery metadata, reuses Git captures and discovers changes without payloads', () => {
  const { root, repository, commit, invoke } = fixture()
  const first = commit('core/a.md', 'a')
  const a = invoke(['refresh', '--all'])
  const id = a.record.sources[0].evidence
  const indexPath = join(root, 'research/index.json')
  expect(JSON.parse(readFileSync(indexPath)).captures[id]).toEqual({ repository, paths: ['core/**'] })
  const original = readFileSync(indexPath)
  invoke(['capture', 'sample'])
  expect(readFileSync(indexPath)).toEqual(original)
  commit('docs/new.md', 'outside selection')
  const next = commit('core/a.md', 'changed')
  const b = invoke(['refresh', '--all'])
  expect(b.record.sources[0]).toMatchObject({ before: first, revision: next })
  expect(b.comparison[0].outsideSelectionChanges).toEqual([{ path: 'docs/new.md', kind: 'added' }])
  invoke(['capture', 'sample', '--path', 'docs/**'])
  expect(invoke(['show', b.record.sources[0].evidence]).capture.paths).toEqual(['core/**', 'docs/**'])
  rmSync(join(root, 'research/captures'), { recursive: true })
  expect(invoke(['diff', id, b.record.sources[0].evidence]).changes).toEqual([
    { path: 'core/a.md', kind: 'modified' },
    { path: 'docs/new.md', kind: 'added' },
  ])
  const compared = invoke(['compare-refreshes', a.ref, b.ref]).comparison[0]
  expect(compared.before).toBe(first)
  expect(compared.after).toBe(next)
  rmSync(join(root, '.cache/research/sources'), { recursive: true })
  expect(invoke(['compare-refreshes', a.ref, b.ref]).comparison[0].status).toBe('unavailable')
})

it('preserves the pre-fetch baseline after capture failure and retries at the same task', () => {
  const { repository, commit, git, invoke } = fixture()
  const first = commit('core/a.md', 'a')
  invoke(['refresh', '--all'])
  symlinkSync('a.md', join(repository, 'core/link.md'))
  git('add', '.')
  git('commit', '-m', 'unretainable selection')
  const failed = invoke(['refresh', '--all'], 1)
  expect(failed.record.sources[0].before).toBe(first)
  git('rm', 'core/link.md')
  git('commit', '-m', 'remove link')
  const current = commit('core/a.md', 'new content')
  const resumed = invoke(['refresh', '--resume', failed.ref])
  expect(resumed.record.sources[0]).toMatchObject({ before: first, revision: current })
  expect(resumed.record.sources[0].attempts.map(item => item.status)).toEqual(['failed', 'captured'])
  expect(resumed.record.sources[0].attempts.every(item => !item.config)).toBe(true)
  expect(resumed.comparison[0].changes).toEqual([{ path: 'core/a.md', kind: 'modified' }])
})

it('keeps the original comparison after path repair and resets it when switching refs', () => {
  const { root, repository, commit, git, invoke } = fixture()
  const first = commit('core/a.md', 'before')
  invoke(['refresh', '--all'])
  symlinkSync('a.md', join(repository, 'core/link.md'))
  git('add', 'core/link.md')
  const updated = commit('core/a.md', 'after')
  const failed = invoke(['refresh', '--all'], 1)
  expect(failed.record.sources[0].before).toBe(first)

  const registryPath = join(root, 'research/sources.yaml')
  const registry = parse(readFileSync(registryPath, 'utf8'))
  registry.sources.sample.paths = ['core/a.md']
  writeFileSync(registryPath, stringify(registry))
  const repaired = invoke(['refresh', '--resume', failed.ref, '--update-config'])
  expect(repaired.ref).toBe(failed.ref)
  expect(repaired.record.sources[0]).toMatchObject({ before: first, revision: updated })
  expect(repaired.comparison[0]).toMatchObject({
    before: first,
    after: updated,
    selectedChanges: [{ path: 'core/a.md', kind: 'modified' }],
    outsideSelectionChanges: [{ path: 'core/link.md', kind: 'added' }],
  })

  git('branch', 'next')
  registry.sources.sample.ref = 'next'
  writeFileSync(registryPath, stringify(registry))
  const switched = invoke(['refresh', '--resume', failed.ref, '--update-config'])
  expect(switched.record.sources[0]).toMatchObject({ before: null, revision: updated })
  expect(switched.comparison[0].status).toBe('no-baseline')
})

it('recovers the recorded commit and scope without the current source registry', () => {
  const { root, commit, invoke } = fixture()
  commit('docs/keep-out.md', 'unselected')
  const original = commit('core/a.md', 'original')
  const run = invoke(['refresh', '--all'])
  const id = run.record.sources[0].evidence
  const path = invoke(['show', id]).path
  rmSync(join(root, path), { recursive: true })
  rmSync(join(root, '.cache/research/sources'), { recursive: true })
  rmSync(join(root, 'research/sources.yaml'))
  commit('core/a.md', 'newer')
  const recovered = invoke(['recover', id])
  expect(recovered.id).toBe(`sample@${original}`)
  expect(readFileSync(join(root, path, 'core/a.md'), 'utf8')).toBe('original')
  expect(existsSync(join(root, path, 'docs/keep-out.md'))).toBe(false)
  writeFileSync(join(root, path, 'core/a.md'), 'local edits')
  expect(invoke(['recover', id], 1).error.kind).toBe('corrupt')
  expect(readFileSync(join(root, path, 'core/a.md'), 'utf8')).toBe('local edits')
})

it('previews explicit cleanup, leaves other material and reports alone, and retains the index', () => {
  const { root, invoke, importText } = fixture()
  const keep = importText('keep.txt', 'keep')
  const selected = importText('selected.txt', 'selected')
  const index = readFileSync(join(root, 'research/index.json'))
  mkdirSync(join(root, 'research/reports'))
  const report = join(root, 'research/reports/2026-10-07T14-00-00Z.md')
  writeFileSync(report, `# Ordinary report\n\nSource: ${keep}\n`)
  expect(invoke(['clean'], 1).error.kind).toBe('invalid')
  const preview = invoke(['clean', selected])
  expect(preview.applied).toBe(false)
  expect(preview.candidates).toMatchObject([{ id: selected, bytes: 8 }])
  expect(invoke(['show', selected]).local).toBe('present')
  invoke(['clean', selected, '--apply'])
  expect(invoke(['show', selected]).local).toBe('missing')
  expect(invoke(['show', keep]).local).toBe('present')
  expect(readFileSync(join(root, 'research/index.json'))).toEqual(index)
  expect(readFileSync(report, 'utf8')).toContain(keep)
  expect(invoke(['recover', selected], 1).error.kind).toBe('unavailable')
})

it('records independent imported observations without content-addressed deduplication', () => {
  const { root, invoke, importText } = fixture()
  const first = importText('source.txt', 'same bytes')
  const second = importText('source.txt', 'same bytes')
  expect(first).not.toBe(second)
  expect(invoke(['show', second]).capture).toEqual({ origin: 'fixture execution', limitations: 'local simulation' })
  expect(Object.keys(JSON.parse(readFileSync(join(root, 'research/index.json'))).captures)).toHaveLength(2)
  const path = invoke(['show', second]).path
  const index = JSON.parse(readFileSync(join(root, 'research/index.json')))
  index.captures[second].path = 'research/captures/unrelated'
  writeFileSync(join(root, 'research/index.json'), JSON.stringify(index))
  expect(invoke(['clean', second, '--apply'], 1).error.kind).toBe('invalid')
  expect(existsSync(join(root, path))).toBe(true)
})
