import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

const root = process.cwd()
const checker = join(root, 'scripts', 'release-candidate-check.mjs')
const fixtures: string[] = []

function packageScripts(): Record<string, string> {
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { scripts?: Record<string, string> }
  return manifest.scripts ?? {}
}

function git(directory: string, ...args: string[]) {
  return execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8' }).trim()
}

function createRepository(version = '1.2.3') {
  const directory = mkdtempSync(join(tmpdir(), 'rsp-release-candidate-check-'))
  fixtures.push(directory)
  git(directory, 'init', '--quiet')
  git(directory, 'config', 'user.name', 'RSP Test')
  git(directory, 'config', 'user.email', 'rsp-test@example.invalid')
  writeFileSync(join(directory, 'package.json'), `${JSON.stringify({ name: '@example/rsp', version }, null, 2)}\n`)
  git(directory, 'add', 'package.json')
  git(directory, 'commit', '--quiet', '-m', 'initial')
  return directory
}

function check(directory: string) {
  return spawnSync(process.execPath, [checker, '--root', directory], { encoding: 'utf8' })
}

afterEach(() => {
  for (const fixture of fixtures.splice(0))
    rmSync(fixture, { force: true, recursive: true })
})

describe('release candidate check', () => {
  it('keeps the candidate guard on the publication lifecycle path', () => {
    const scripts = packageScripts()
    const publishEntry = scripts.prepublishOnly ?? ''
    const candidateEntry = scripts['release:candidate-check'] ?? ''

    expect(publishEntry).toMatch(/(?:^|&&\s*)pnpm run release:candidate-check(?:\s*&&|$)/u)
    expect(candidateEntry).toMatch(/(?:^|&&\s*)node scripts\/release-candidate-check\.mjs(?:\s*&&|$)/u)
    expect(candidateEntry).toMatch(/(?:^|&&\s*)node scripts\/release-behavior-evidence-check\.mjs(?:\s*&&|$)/u)
    expect(candidateEntry).toMatch(/(?:^|&&\s*)pnpm run release:acceptance(?:\s*&&|$)/u)
    const identityIndex = candidateEntry.indexOf('release-candidate-check.mjs')
    const providerEvidenceIndex = candidateEntry.indexOf('release-behavior-evidence-check.mjs')
    const acceptanceIndex = candidateEntry.indexOf('pnpm run release:acceptance')
    expect(identityIndex).toBeLessThan(providerEvidenceIndex)
    expect(providerEvidenceIndex).toBeLessThan(acceptanceIndex)
    expect(candidateEntry).not.toContain('release:provider-compare')
    expect(candidateEntry).not.toContain('release:behavior-check')
    expect(candidateEntry).toContain('release-behavior-evidence-check.mjs')
  })

  it('accepts a clean checkout when the version tag is absent', () => {
    const directory = createRepository()
    const result = check(directory)

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('v1.2.3 does not exist')
  })

  it.each(['lightweight', 'annotated'])('accepts a %s version tag resolving to HEAD', (kind) => {
    const directory = createRepository()
    if (kind === 'annotated')
      git(directory, 'tag', '--no-sign', '-a', 'v1.2.3', '-m', 'candidate')
    else
      git(directory, 'tag', '--no-sign', 'v1.2.3')

    const result = check(directory)
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('v1.2.3 resolves to HEAD')
  })

  it('rejects a version tag resolving to another commit as finalized', () => {
    const directory = createRepository()
    git(directory, 'tag', '--no-sign', 'v1.2.3')
    writeFileSync(join(directory, 'next.txt'), 'next\n')
    git(directory, 'add', 'next.txt')
    git(directory, 'commit', '--quiet', '-m', 'next')

    const result = check(directory)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('v1.2.3 is finalized at')
    expect(result.stderr).toContain('must use a new package version')
  })

  it.each([
    ['tracked', (directory: string) => writeFileSync(join(directory, 'package.json'), '{"version":"1.2.3"}\n')],
    ['untracked', (directory: string) => writeFileSync(join(directory, 'untracked.txt'), 'dirty\n')],
  ])('rejects a dirty checkout containing %s changes', (_kind, dirty) => {
    const directory = createRepository()
    dirty(directory)

    const result = check(directory)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('worktree is dirty')
    expect(result.stderr).toContain('tracked and untracked changes')
  })

  it('fails closed when Git cannot inspect the requested root', () => {
    const directory = mkdtempSync(join(tmpdir(), 'rsp-release-candidate-check-non-git-'))
    fixtures.push(directory)
    writeFileSync(join(directory, 'package.json'), '{"name":"@example/rsp","version":"1.2.3"}\n')

    const result = check(directory)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('cannot inspect worktree')
  })
})
