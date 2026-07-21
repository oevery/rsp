#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const DECISIONS = new Set([
  'adapted',
  'independent-reimplementation',
  'model-only',
  'external',
  'defer',
  'reject',
])
const ADAPT_SOURCES = new Set(['compound-engineering', 'matt-skills', 'ponytail', 'superpowers'])
const MODEL_PATH = join('research', 'models', 'rsp-capability-coverage.md')
const LOCAL_REPORT_PATH = join('research', 'local-skills', '2026-07-19.md')

function fail(message) {
  throw new Error(message)
}

function reportRevision(root, source) {
  const directory = join(root, 'research', 'upstreams', source)
  const reports = readdirSync(directory).filter(path => path.endsWith('.md'))
  if (reports.length !== 1)
    fail(`Expected one report for ${source}, found ${reports.length}`)
  return reports[0].slice(0, -3)
}

function evidencePaths(root, source, revision) {
  const path = join(root, '.cache', 'upstream-distillation', source, revision, 'files.txt')
  if (!existsSync(path))
    fail(`Missing prepared evidence for ${source}@${revision}: ${path}`)
  return readFileSync(path, 'utf8')
    .split(/\r?\n/u)
    .filter(path => path.endsWith('SKILL.md'))
}

function localPaths(root) {
  const report = readFileSync(join(root, LOCAL_REPORT_PATH), 'utf8')
  return [...report.matchAll(/`(skills\/[^`]+\/SKILL\.md)`/gu)].map(match => match[1])
}

function parseRows(model) {
  return model.split(/\r?\n/u)
    .filter(line => /^\| C\d+ \|/u.test(line))
    .map((line) => {
      const cells = line.split('|').slice(1, -1).map(cell => cell.trim())
      if (cells.length !== 11)
        fail(`Coverage row must contain 11 cells: ${line}`)
      const [id, sourceCell, pathCell, capability, io, authority, gap, decisionCell, owner, depth, followUp] = cells
      const sourceMatch = sourceCell.match(/\[([a-z0-9-]+)@([^\]]+)\]\(([^)]+)\)/u)
      if (!sourceMatch)
        fail(`${id}: invalid source/revision/report cell`)
      const paths = [...pathCell.matchAll(/`([^`]*SKILL\.md)`/gu)].map(match => match[1])
      if (paths.length === 0)
        fail(`${id}: no exact Skill path`)
      const decisionMatch = decisionCell.match(/^`([^`]+)`$/u)
      if (!decisionMatch || !DECISIONS.has(decisionMatch[1]))
        fail(`${id}: invalid decision ${decisionCell}`)
      for (const [label, value] of Object.entries({ authority, capability, depth, followUp, gap, io, owner })) {
        if (!value)
          fail(`${id}: missing ${label}`)
      }
      return {
        decision: decisionMatch[1],
        id,
        paths,
        report: sourceMatch[3],
        revision: sourceMatch[2],
        source: sourceMatch[1],
      }
    })
}

function assertUniqueCoverage(rows) {
  const seenIds = new Set()
  const seenPaths = new Map()
  for (const row of rows) {
    if (seenIds.has(row.id))
      fail(`Duplicate coverage id: ${row.id}`)
    seenIds.add(row.id)
    for (const path of row.paths) {
      const key = `${row.source}:${path}`
      if (seenPaths.has(key))
        fail(`Duplicate coverage for ${key}: ${seenPaths.get(key)} and ${row.id}`)
      seenPaths.set(key, row.id)
    }
  }
  return seenPaths
}

function assertAdaptCoverage(root, rows, seenPaths) {
  for (const source of [...ADAPT_SOURCES].sort()) {
    const revision = reportRevision(root, source)
    const sourceRows = rows.filter(row => row.source === source)
    if (sourceRows.length === 0)
      fail(`No coverage rows for adapt source ${source}`)
    if (sourceRows.some(row => row.revision !== revision))
      fail(`${source}: model revision does not match complete report ${revision}`)
    for (const path of evidencePaths(root, source, revision)) {
      if (!seenPaths.has(`${source}:${path}`))
        fail(`Missing inventoried path: ${source}:${path}`)
    }
    for (const row of sourceRows) {
      for (const path of row.paths) {
        if (!evidencePaths(root, source, revision).includes(path))
          fail(`Coverage path is absent from prepared evidence: ${source}:${path}`)
      }
    }
  }
}

function assertLocalCoverage(root, rows, seenPaths) {
  const localRows = rows.filter(row => row.source === 'local-skills')
  if (localRows.length === 0)
    fail('No coverage rows for local-skills')
  for (const path of new Set(localPaths(root))) {
    if (!seenPaths.has(`local-skills:${path}`))
      fail(`Missing local Skill path: ${path}`)
  }
}

function assertReportLinks(root, rows) {
  for (const row of rows) {
    const absolute = resolve(root, 'research', 'models', row.report)
    if (!existsSync(absolute))
      fail(`${row.id}: missing linked report ${row.report}`)
  }
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const model = readFileSync(join(root, MODEL_PATH), 'utf8')
  const rows = parseRows(model)
  if (rows.length === 0)
    fail('No capability coverage rows found')
  const seenPaths = assertUniqueCoverage(rows)
  assertAdaptCoverage(root, rows, seenPaths)
  assertLocalCoverage(root, rows, seenPaths)
  assertReportLinks(root, rows)
  process.stdout.write(`Capability coverage valid: ${rows.length} classifications, ${seenPaths.size} exact Skill paths, ${DECISIONS.size} decisions.\n`)
}

try {
  main()
}
catch (error) {
  process.stderr.write(`Capability coverage invalid: ${error.message}\n`)
  process.exitCode = 1
}
