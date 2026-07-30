#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import process from 'node:process'

const VERSION_SOURCE = '\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?'
const VERSION_PATTERN = new RegExp(`^${VERSION_SOURCE}$`, 'u')
const IMMUTABLE_COMPARISON_PATTERN = /\bv?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\.\.\.HEAD\b/gu
const FUTURE_PUBLICATION_PATTERNS = [
  { pattern: /\bafter this (?:beta|prerelease|release) is published\b/giu, reason: 'package-facing text must not present the current release as future' },
  { pattern: /\b(?:remain|remains) unavailable until\b[^\n]+is published\b/giu, reason: 'package-facing text must not claim that the current version is unavailable' },
  { pattern: /\binstructions for the future published artifact\b/giu, reason: 'release text must not describe the current artifact as future' },
  { pattern: /\bnot verified by local preparation\b/giu, reason: 'release text must not retain local-preparation status' },
  { pattern: /\bhas only local\b[^\n]+validation until\b/giu, reason: 'release text must not retain local-preparation status' },
  { pattern: /发布后应使用精确身份/gu, reason: 'package-facing text must not present the current release as future' },
  { pattern: /实际发布前[^\n]*不可用/gu, reason: 'package-facing text must not claim that the current version is unavailable' },
]

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

function readRequired(root, path, violations) {
  const absolutePath = join(root, path)
  if (!existsSync(absolutePath)) {
    violations.push({ path, line: 1, reason: 'required release surface is missing' })
    return null
  }
  return readFileSync(absolutePath, 'utf8')
}

function lineNumber(text, index) {
  return text.slice(0, index).split('\n').length
}

function addMatches(violations, path, text, pattern, reason, lineOffset = 0) {
  pattern.lastIndex = 0
  for (const match of text.matchAll(pattern)) {
    const violation = { path, line: lineNumber(text, match.index) + lineOffset, reason }
    if (!violations.some(candidate => candidate.path === violation.path && candidate.line === violation.line && candidate.reason === violation.reason))
      violations.push(violation)
  }
}

function addViolation(violations, violation) {
  if (!violations.some(candidate => candidate.path === violation.path && candidate.line === violation.line && candidate.reason === violation.reason))
    violations.push(violation)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
}

function targetChangelogSection(text, version, violations) {
  const headingPattern = new RegExp(`^##\\s+(?:\\[)?${escapeRegExp(version)}(?:\\])?(?:\\s|$).*`, 'mu')
  const heading = headingPattern.exec(text)
  if (!heading) {
    violations.push({ path: 'CHANGELOG.md', line: 1, reason: `missing release section for package version ${version}` })
    return null
  }

  if (/\bunreleased\b/iu.test(heading[0])) {
    violations.push({
      path: 'CHANGELOG.md',
      line: lineNumber(text, heading.index),
      reason: `release heading for ${version} must not be marked Unreleased`,
    })
  }
  if (!/\(\d{4}-\d{2}-\d{2}\)\s*$/u.test(heading[0])) {
    violations.push({
      path: 'CHANGELOG.md',
      line: lineNumber(text, heading.index),
      reason: `release heading for ${version} must include a finalized YYYY-MM-DD date`,
    })
  }

  const bodyStart = heading.index + heading[0].length
  const nextHeading = /^##\s+/gmu
  nextHeading.lastIndex = bodyStart
  const next = nextHeading.exec(text)
  return {
    lineOffset: lineNumber(text, heading.index) - 1,
    text: text.slice(heading.index, next?.index ?? text.length),
  }
}

function inspectSurface(violations, path, text, lineOffset = 0) {
  addMatches(violations, path, text, IMMUTABLE_COMPARISON_PATTERN, 'release comparison must end at an immutable version tag, not HEAD', lineOffset)
  for (const { pattern, reason } of FUTURE_PUBLICATION_PATTERNS)
    addMatches(violations, path, text, pattern, reason, lineOffset)
}

function inspectReleaseNotesIdentity(violations, path, text, version) {
  const firstHeading = /^# ([^\r\n]+)$/mu.exec(text)
  if (!firstHeading || !new RegExp(`(?:^|\\s)${escapeRegExp(version)}(?:\\s|$)`, 'u').test(firstHeading[1])) {
    addViolation(violations, {
      path,
      line: firstHeading ? lineNumber(text, firstHeading.index) : 1,
      reason: `release-note H1 must identify package version ${version}`,
    })
  }

  const comparisonPattern = new RegExp(`\\bv?${VERSION_SOURCE}\\.\\.\\.v?(${VERSION_SOURCE})\\b`, 'gu')
  const comparisons = [...text.matchAll(comparisonPattern)]
  if (comparisons.length === 0) {
    addViolation(violations, { path, line: 1, reason: `release notes must include an immutable comparison ending at v${version}` })
    return
  }
  for (const comparison of comparisons) {
    if (comparison[1] !== version) {
      addViolation(violations, {
        path,
        line: lineNumber(text, comparison.index),
        reason: `release comparison must end at current package version v${version}`,
      })
    }
  }
}

function inspectReadmeExamples(violations, path, text, packageName, version) {
  if (typeof packageName !== 'string' || packageName.length === 0)
    return
  const prerelease = version.includes('-')
  const identity = prerelease ? version : 'latest'
  const examplePattern = new RegExp(`\\bnpx\\s+-y\\s+${escapeRegExp(packageName)}@${escapeRegExp(identity)}\\b`, 'gu')
  if (!examplePattern.test(text)) {
    const reason = prerelease
      ? `README must include an exact npx example for current package version ${version}`
      : 'README must use @latest for the current stable package example'
    addViolation(violations, { path, line: 1, reason })
  }
}

function checkReleaseMetadata(root) {
  const violations = []
  const packageText = readRequired(root, 'package.json', violations)
  if (packageText === null)
    return { packageName: null, version: null, violations }

  let packageJson
  try {
    packageJson = JSON.parse(packageText)
  }
  catch {
    violations.push({ path: 'package.json', line: 1, reason: 'package metadata is not valid JSON' })
    return { packageName: null, version: null, violations }
  }

  const version = packageJson.version
  if (typeof version !== 'string' || !VERSION_PATTERN.test(version)) {
    violations.push({ path: 'package.json', line: 1, reason: 'package version must be an explicit semantic version' })
    return { packageName: packageJson.name ?? null, version: null, violations }
  }

  const changelog = readRequired(root, 'CHANGELOG.md', violations)
  if (changelog !== null) {
    const section = targetChangelogSection(changelog, version, violations)
    if (section !== null)
      inspectSurface(violations, 'CHANGELOG.md', section.text, section.lineOffset)
  }

  const releasePath = `docs/releases/${version}.md`
  const releaseNotes = readRequired(root, releasePath, violations)
  if (releaseNotes !== null) {
    inspectSurface(violations, releasePath, releaseNotes)
    inspectReleaseNotesIdentity(violations, releasePath, releaseNotes, version)
  }

  for (const path of ['README.md', 'README.zh-CN.md']) {
    const absolutePath = join(root, path)
    if (existsSync(absolutePath)) {
      const readme = readFileSync(absolutePath, 'utf8')
      inspectSurface(violations, path, readme)
      inspectReadmeExamples(violations, path, readme, packageJson.name, version)
    }
  }

  return { packageName: packageJson.name ?? null, version, violations }
}

function main() {
  let root
  try {
    root = parseRoot(process.argv.slice(2))
  }
  catch (error) {
    console.error(`Release metadata check failed: ${error.message}`)
    process.exitCode = 1
    return
  }

  const result = checkReleaseMetadata(root)
  if (result.violations.length > 0) {
    const label = result.version ?? 'unknown version'
    console.error(`Release metadata check failed for ${label}:`)
    for (const violation of result.violations) {
      const displayPath = relative(root, join(root, violation.path)) || violation.path
      console.error(`- ${displayPath}:${violation.line}: ${violation.reason}`)
    }
    process.exitCode = 1
    return
  }

  const identity = result.packageName ? `${result.packageName}@${result.version}` : result.version
  console.log(`Release metadata check passed for ${identity}.`)
}

main()
