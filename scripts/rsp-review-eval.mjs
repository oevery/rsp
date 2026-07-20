#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const CASE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const PIPELINE_STATES = new Set(['blocked', 'clean', 'issues_found', 'skipped'])

function assertContained(parent, child, label) {
  const resolvedParent = resolve(parent)
  const resolvedChild = resolve(child)
  if (resolvedChild !== resolvedParent && !resolvedChild.startsWith(`${resolvedParent}${sep}`))
    throw new Error(`Unsafe ${label}: ${relative(resolvedParent, resolvedChild)}`)
}

function fixtureRoot(root) {
  return join(root, 'test', 'skill-behavior', 'fixtures')
}

function readCase(root, id) {
  if (!CASE_ID.test(id))
    throw new Error(`Invalid evaluation case id: ${id}`)

  const fixtures = fixtureRoot(root)
  const directory = join(fixtures, id)
  assertContained(fixtures, directory, 'fixture path')
  const casePath = join(directory, 'case.yaml')
  if (!existsSync(casePath))
    throw new Error(`Unknown evaluation case: ${id}`)

  const value = parseYaml(readFileSync(casePath, 'utf8'))
  if (!value || value.id !== id || !Array.isArray(value.tags) || typeof value.request !== 'string')
    throw new Error(`Invalid evaluation case manifest: ${id}`)
  if (!value.expected || !PIPELINE_STATES.has(value.expected.code) || !PIPELINE_STATES.has(value.expected.document))
    throw new Error(`Invalid pipeline expectations: ${id}`)
  if (!Array.isArray(value.expected.observations) || !Array.isArray(value.expected.prohibited_actions))
    throw new Error(`Invalid evaluation expectations: ${id}`)

  return { directory, value }
}

export function loadEvaluationCases(root) {
  return readdirSync(fixtureRoot(root), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => readCase(root, entry.name).value)
    .sort((left, right) => left.id.localeCompare(right.id))
}

function git(workspace, args) {
  return execFileSync('git', args, { cwd: workspace, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

export function prepareEvaluation({ caseId, outputRoot, root, variant }) {
  if (variant !== 'baseline' && variant !== 'candidate')
    throw new Error(`Unknown evaluation variant: ${variant}`)

  const { directory, value } = readCase(root, caseId)
  const evaluations = resolve(outputRoot ?? join(root, '.cache', 'rsp-review-eval'))
  mkdirSync(evaluations, { recursive: true })
  const workspace = mkdtempSync(join(evaluations, `${caseId}-${variant}-`))
  assertContained(evaluations, workspace, 'evaluation workspace')

  const base = join(directory, 'base')
  if (existsSync(base))
    cpSync(base, workspace, { recursive: true })

  git(workspace, ['init', '--quiet'])
  git(workspace, ['config', 'user.name', 'RSP Evaluation'])
  git(workspace, ['config', 'user.email', 'rsp-eval@example.invalid'])
  git(workspace, ['add', '--all'])
  git(workspace, ['commit', '--quiet', '--allow-empty', '-m', 'fixture base'])

  const changed = join(directory, 'changed')
  if (existsSync(changed))
    cpSync(changed, workspace, { recursive: true })

  if (variant === 'candidate') {
    const sourceSkill = join(root, 'research', 'candidates', 'skills', 'rsp-review')
    const installedSkill = join(workspace, '.agents', 'skills', 'rsp-review')
    mkdirSync(join(workspace, '.agents', 'skills'), { recursive: true })
    cpSync(sourceSkill, installedSkill, { recursive: true })
  }

  const prompt = [
    variant === 'candidate'
      ? 'Load the rsp-review skill installed in this isolated workspace and follow it exactly.'
      : 'Review this isolated workspace using your normal review behavior; no review skill is installed.',
    'Use HEAD as the immutable comparison point and inspect the current working-tree diff.',
    'Return a report only. Do not edit files, stage, commit, push, publish, delete, or create review artifacts.',
    value.request,
  ].join('\n\n')
  const promptPath = join(evaluations, `${basename(workspace)}.prompt.md`)
  writeFileSync(promptPath, `${prompt}\n`)

  return { case: value, promptPath, variant, workspace }
}

function usage() {
  console.error('Usage: node scripts/rsp-review-eval.mjs prepare <case> <baseline|candidate> [--json]')
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const [command, caseId, variant, flag] = process.argv.slice(2)
  if (command !== 'prepare' || !caseId || !variant) {
    usage()
    process.exitCode = 1
  }
  else {
    try {
      const root = process.cwd()
      const prepared = prepareEvaluation({ caseId, root, variant })
      if (flag === '--json')
        console.log(JSON.stringify(prepared, null, 2))
      else
        console.log(`Prepared ${prepared.case.id} (${prepared.variant})\nWorkspace: ${prepared.workspace}\nPrompt: ${prepared.promptPath}`)
    }
    catch (error) {
      console.error(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    }
  }
}
