#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import process from 'node:process'

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u

function parseRoot(argv) {
  let root = process.cwd()
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument !== '--root')
      throw new Error(`unknown argument: ${argument}`)
    const value = argv[index + 1]
    if (!value || value.startsWith('--'))
      throw new Error('--root requires a path')
    root = isAbsolute(value) ? value : resolve(process.cwd(), value)
    index += 1
  }
  return root
}

function readVersion(root) {
  let packageJson
  try {
    packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  }
  catch (error) {
    throw new Error(`cannot read package.json: ${error.message}`)
  }

  if (typeof packageJson.version !== 'string' || !VERSION_PATTERN.test(packageJson.version))
    throw new Error('package.json version must be an explicit semantic version')
  return packageJson.version
}

function runGit(root, args, label) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' })
  if (result.error)
    throw new Error(`${label}: ${result.error.message}`)
  return result
}

function requireGitSuccess(result, label) {
  if (result.status !== 0) {
    const detail = result.stderr.trim() || result.stdout.trim() || `git exited with status ${result.status}`
    throw new Error(`${label}: ${detail}`)
  }
  return result.stdout.trim()
}

function checkCandidate(root) {
  const version = readVersion(root)
  const tag = `v${version}`

  const status = runGit(root, ['status', '--porcelain=v1', '--untracked-files=all'], 'cannot inspect worktree')
  const changes = requireGitSuccess(status, 'cannot inspect worktree')
  if (changes)
    throw new Error('worktree is dirty; commit, stash, or remove tracked and untracked changes before checking a release candidate')

  const head = requireGitSuccess(
    runGit(root, ['rev-parse', '--verify', 'HEAD^{commit}'], 'cannot resolve HEAD'),
    'cannot resolve HEAD',
  )
  const tagRef = `refs/tags/${tag}`
  const tagLookup = runGit(root, ['show-ref', '--verify', '--quiet', tagRef], `cannot inspect ${tag}`)
  if (tagLookup.status === 1)
    return { state: 'new', tag, version }
  requireGitSuccess(tagLookup, `cannot inspect ${tag}`)

  const tagCommit = requireGitSuccess(
    runGit(root, ['rev-parse', '--verify', `${tagRef}^{commit}`], `cannot resolve ${tag}`),
    `cannot resolve ${tag}`,
  )
  if (tagCommit !== head)
    throw new Error(`${tag} is finalized at ${tagCommit}; current HEAD ${head} must use a new package version`)

  return { state: 'exact', tag, version }
}

function main() {
  try {
    const root = parseRoot(process.argv.slice(2))
    const result = checkCandidate(root)
    const detail = result.state === 'new'
      ? `${result.tag} does not exist; the version is available for a new candidate`
      : `${result.tag} resolves to HEAD; the tagged candidate identity is exact`
    console.log(`Release candidate check passed for ${result.version}: ${detail}.`)
  }
  catch (error) {
    console.error(`Release candidate check failed: ${error.message}`)
    process.exitCode = 1
  }
}

main()
