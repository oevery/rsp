#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const RESULTS = new Set(['findings', 'clean', 'scoped uncertainty'])

function holdoutRoot(root) {
  return join(root, 'evaluation', 'structural-audit', 'holdout')
}

function readCase(root, id) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))
    throw new Error(`Invalid structural-audit case id: ${id}`)
  const path = join(holdoutRoot(root), id, 'case.yaml')
  if (!existsSync(path))
    throw new Error(`Unknown structural-audit case: ${id}`)
  const manifest = parseYaml(readFileSync(path, 'utf8'))
  const expected = manifest?.expected
  if (manifest?.id !== id || typeof manifest.request !== 'string' || !Array.isArray(manifest.tags))
    throw new Error(`Invalid structural-audit manifest: ${id}`)
  if (!expected || !RESULTS.has(expected.result)
    || !Number.isInteger(expected.min_findings) || !Number.isInteger(expected.max_findings)
    || expected.min_findings < 0 || expected.max_findings > 5 || expected.min_findings > expected.max_findings
    || !Array.isArray(expected.required_terms) || expected.required_terms.some(term => typeof term !== 'string')
    || !Array.isArray(expected.forbidden_terms) || expected.forbidden_terms.some(term => typeof term !== 'string')) {
    throw new Error(`Invalid structural-audit oracle: ${id}`)
  }
  return manifest
}

export function loadStructuralAuditCases(root) {
  return readdirSync(holdoutRoot(root), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => readCase(root, entry.name))
    .sort((left, right) => left.id.localeCompare(right.id))
}

function resultValue(final) {
  const lines = final.split(/\r?\n/)
  const heading = lines.findIndex(line => line.trim().toLowerCase() === '## result')
  const result = heading >= 0 ? lines.slice(heading + 1).find(line => line.trim().length > 0)?.trim().toLowerCase() : null
  return result && RESULTS.has(result) ? result : null
}

function findingBlocks(final) {
  const starts = [...final.matchAll(/^### \[P[1-3]\].*$/gm)]
  const sectionEnd = final.search(/^## (?:Coverage|Result)\s*$/m)
  return starts.map((match, index) => {
    const end = starts[index + 1]?.index ?? (sectionEnd >= 0 ? sectionEnd : final.length)
    return final.slice(match.index, end)
  })
}

export function scoreStructuralAuditOutput(manifest, final) {
  const normalized = final.toLowerCase()
  const blocks = findingBlocks(final)
  const missingFields = blocks.flatMap((block, index) => [
    'Lens:',
    'Evidence:',
    'Trigger:',
    'Impact:',
    'Confidence:',
    'Next owner:',
  ].filter(field => !block.includes(field)).map(field => `finding ${index + 1}: ${field}`))
  const missingTerms = manifest.expected.required_terms.filter(term => !normalized.includes(String(term).toLowerCase()))
  const forbiddenPresent = manifest.expected.forbidden_terms.filter(term => normalized.includes(String(term).toLowerCase()))
  const result = resultValue(final)
  const blockers = []
  if (result !== manifest.expected.result)
    blockers.push(`result: expected ${manifest.expected.result}, observed ${result ?? 'missing'}`)
  if (blocks.length < manifest.expected.min_findings || blocks.length > manifest.expected.max_findings)
    blockers.push(`findings: expected ${manifest.expected.min_findings}-${manifest.expected.max_findings}, observed ${blocks.length}`)
  blockers.push(...missingFields.map(field => `missing field: ${field}`))
  blockers.push(...missingTerms.map(term => `missing term: ${term}`))
  blockers.push(...forbiddenPresent.map(term => `forbidden term: ${term}`))
  return {
    passed: blockers.length === 0,
    blockers,
    observed: { result, findings: blocks.length },
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  const root = process.cwd()
  const [command, id, finalPath] = process.argv.slice(2)
  if (command === '--list') {
    console.log(JSON.stringify(loadStructuralAuditCases(root), null, 2))
  }
  else if (command === '--score' && id && finalPath) {
    const score = scoreStructuralAuditOutput(readCase(root, id), readFileSync(finalPath, 'utf8'))
    console.log(JSON.stringify(score, null, 2))
    if (!score.passed)
      process.exitCode = 1
  }
  else {
    console.error('Usage: node scripts/structural-audit-eval.mjs --list | --score <case-id> <final.md>')
    process.exitCode = 1
  }
}
