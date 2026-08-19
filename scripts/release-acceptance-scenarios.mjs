import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

const ALLOWED_KINDS = new Set(['existing-rsp', 'fresh-adoption', 'published-upgrade'])
export const REQUIRED_PROJECT_COVERAGE = [
  'complex-existing-rsp',
  'dirty-git-worktree',
  'fresh-adoption',
  'monorepo-nesting',
  'published-upgrade',
  'unicode-content',
]

function fail(message) {
  throw new Error(`Release acceptance scenario invalid: ${message}`)
}

function portablePath(root, path) {
  return relative(root, path).split(sep).join('/')
}

function assertRealFixtureTree(directory, label) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    const stats = lstatSync(path)
    if (stats.isSymbolicLink())
      fail(`${label} contains a symbolic link: ${entry.name}`)
    if (stats.isDirectory())
      assertRealFixtureTree(path, label)
  }
}

export function fixtureTreeSha256(directory) {
  const hash = createHash('sha256')
  const visit = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const path = join(current, entry.name)
      const stats = lstatSync(path)
      if (stats.isSymbolicLink())
        fail(`${portablePath(directory, path)} contains a symbolic link`)
      if (stats.isDirectory()) {
        visit(path)
        continue
      }
      if (!stats.isFile())
        fail(`${portablePath(directory, path)} is not a regular file`)
      hash.update(portablePath(directory, path))
      hash.update('\0')
      hash.update(readFileSync(path))
      hash.update('\0')
    }
  }
  visit(directory)
  return hash.digest('hex')
}

function findManifests(root) {
  const manifests = []
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const path = join(directory, entry.name)
      const stats = lstatSync(path)
      if (stats.isSymbolicLink())
        continue
      if (stats.isDirectory())
        visit(path)
      else if (stats.isFile() && entry.name.endsWith('.json'))
        manifests.push(path)
    }
  }
  visit(root)
  return manifests
}

function stringArray(value, label, { optional = false } = {}) {
  if (value === undefined && optional)
    return []
  if (!Array.isArray(value) || value.length === 0 || !value.every(item => typeof item === 'string' && item.trim() !== ''))
    fail(`${label} must be a non-empty string array`)
  if (new Set(value).size !== value.length)
    fail(`${label} must not contain duplicates`)
  return [...value]
}

function fixturePath(fixtureRoot, value, label, { directory = false, missing = false } = {}) {
  if (typeof value !== 'string' || value.trim() === '')
    fail(`${label} must be a non-empty fixture-relative path`)
  const path = resolve(fixtureRoot, value)
  if (path === fixtureRoot || !path.startsWith(fixtureRoot + sep))
    fail(`${label} must stay inside its fixture: ${value}`)
  if (missing) {
    if (existsSync(path))
      fail(`${label} must select a path absent from the source fixture: ${value}`)
    return value
  }
  const stats = lstatSync(path)
  if (stats.isSymbolicLink() || (directory ? !stats.isDirectory() : !stats.isFile()))
    fail(`${label} must select one real ${directory ? 'directory' : 'file'}: ${value}`)
  return value
}

export function discoverReleaseProjectScenarios(repositoryRoot) {
  const fixturesRoot = join(repositoryRoot, 'acceptance', 'fixtures')
  const registryRoot = join(repositoryRoot, 'acceptance', 'projects')
  const scenarios = findManifests(registryRoot).map((manifestPath) => {
    let manifest
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    }
    catch (error) {
      fail(`${portablePath(repositoryRoot, manifestPath)} cannot be parsed: ${error.message}`)
    }
    if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest))
      fail(`${portablePath(repositoryRoot, manifestPath)} must contain an object`)
    const allowedKeys = new Set([
      'coverage',
      'derivedFrom',
      'fixture',
      'fixtureSha256',
      'gitWorktree',
      'id',
      'kind',
      'nestedProjectDirectory',
      'preserve',
      'sanitizationVersion',
      'sourceVersion',
      'specName',
    ])
    const unsupported = Object.keys(manifest).filter(key => !allowedKeys.has(key))
    if (unsupported.length > 0)
      fail(`${portablePath(repositoryRoot, manifestPath)} has unsupported keys: ${unsupported.join(', ')}`)
    if (typeof manifest.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(manifest.id))
      fail(`${portablePath(repositoryRoot, manifestPath)} has an invalid id`)
    if (!ALLOWED_KINDS.has(manifest.kind))
      fail(`${manifest.id} has unsupported kind ${String(manifest.kind)}`)
    if (typeof manifest.fixture !== 'string' || manifest.fixture.trim() === '')
      fail(`${manifest.id}.fixture must be a non-empty repository-relative path`)
    const fixtureRoot = resolve(repositoryRoot, manifest.fixture)
    if (!fixtureRoot.startsWith(fixturesRoot + sep))
      fail(`${manifest.id}.fixture must select one directory under acceptance/fixtures`)
    const fixtureStats = lstatSync(fixtureRoot)
    if (fixtureStats.isSymbolicLink() || !fixtureStats.isDirectory())
      fail(`${manifest.id}.fixture must select one real directory under acceptance/fixtures`)
    assertRealFixtureTree(fixtureRoot, manifest.id)
    if (typeof manifest.derivedFrom !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(manifest.derivedFrom))
      fail(`${manifest.id}.derivedFrom must be one anonymous kebab-case category`)
    if (typeof manifest.sanitizationVersion !== 'string' || !/^v[1-9]\d*$/u.test(manifest.sanitizationVersion))
      fail(`${manifest.id}.sanitizationVersion must use vN`)
    if (typeof manifest.fixtureSha256 !== 'string' || !/^[a-f0-9]{64}$/u.test(manifest.fixtureSha256))
      fail(`${manifest.id}.fixtureSha256 must be a lowercase SHA-256`)
    const actualFixtureSha256 = fixtureTreeSha256(fixtureRoot)
    if (manifest.fixtureSha256 !== actualFixtureSha256)
      fail(`${manifest.id}.fixtureSha256 does not match the registered fixture`)
    const coverage = stringArray(manifest.coverage, `${manifest.id}.coverage`).sort()
    if (!coverage.includes(manifest.kind))
      fail(`${manifest.id}.coverage must include its kind ${manifest.kind}`)
    const preserve = stringArray(manifest.preserve, `${manifest.id}.preserve`, { optional: true }).sort()
    if ((manifest.kind === 'fresh-adoption' || manifest.kind === 'existing-rsp') && preserve.length === 0)
      fail(`${manifest.id} must declare preserved project files`)
    for (const path of preserve) {
      fixturePath(fixtureRoot, path, `${manifest.id}.preserve`)
    }
    if (manifest.sourceVersion !== undefined
      && (typeof manifest.sourceVersion !== 'string' || manifest.sourceVersion.trim() === '')) {
      fail(`${manifest.id}.sourceVersion must be a non-empty string`)
    }
    if (manifest.kind === 'published-upgrade' && !manifest.sourceVersion)
      fail(`${manifest.id} must declare sourceVersion`)
    if (manifest.specName !== undefined
      && (typeof manifest.specName !== 'string' || manifest.specName.trim() === '')) {
      fail(`${manifest.id}.specName must be a non-empty string`)
    }
    const nestedProjectDirectory = manifest.nestedProjectDirectory === undefined
      ? null
      : fixturePath(fixtureRoot, manifest.nestedProjectDirectory, `${manifest.id}.nestedProjectDirectory`, { directory: true })
    let gitWorktree = null
    if (manifest.gitWorktree !== undefined) {
      if (!manifest.gitWorktree || typeof manifest.gitWorktree !== 'object' || Array.isArray(manifest.gitWorktree))
        fail(`${manifest.id}.gitWorktree must be an object`)
      const gitKeys = Object.keys(manifest.gitWorktree)
      const unsupportedGitKeys = gitKeys.filter(key => !['staged', 'unstaged', 'untracked'].includes(key))
      if (unsupportedGitKeys.length > 0 || gitKeys.length !== 3)
        fail(`${manifest.id}.gitWorktree must declare only staged, unstaged, and untracked`)
      gitWorktree = {
        staged: fixturePath(fixtureRoot, manifest.gitWorktree.staged, `${manifest.id}.gitWorktree.staged`),
        unstaged: fixturePath(fixtureRoot, manifest.gitWorktree.unstaged, `${manifest.id}.gitWorktree.unstaged`),
        untracked: fixturePath(fixtureRoot, manifest.gitWorktree.untracked, `${manifest.id}.gitWorktree.untracked`, { missing: true }),
      }
      if (new Set(Object.values(gitWorktree)).size !== 3)
        fail(`${manifest.id}.gitWorktree paths must be distinct`)
    }
    return {
      id: manifest.id,
      kind: manifest.kind,
      coverage,
      derivedFrom: manifest.derivedFrom,
      fixtureSha256: manifest.fixtureSha256,
      gitWorktree,
      nestedProjectDirectory,
      preserve,
      sanitizationVersion: manifest.sanitizationVersion,
      sourceVersion: manifest.sourceVersion ?? null,
      specName: manifest.specName ?? 'shell-layout',
      fixturePath: portablePath(repositoryRoot, fixtureRoot),
      fixtureRoot,
      manifestPath: portablePath(repositoryRoot, manifestPath),
    }
  }).sort((left, right) => left.id.localeCompare(right.id))

  const ids = scenarios.map(scenario => scenario.id)
  if (new Set(ids).size !== ids.length)
    fail('scenario ids must be unique')
  const coverage = [...new Set(scenarios.flatMap(scenario => scenario.coverage))].sort()
  const missingCoverage = REQUIRED_PROJECT_COVERAGE.filter(tag => !coverage.includes(tag))
  if (missingCoverage.length > 0)
    fail(`required project coverage is missing: ${missingCoverage.join(', ')}`)

  return { coverage, requiredCoverage: [...REQUIRED_PROJECT_COVERAGE], scenarios }
}
