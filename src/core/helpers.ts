import type { CheckboxCount, DeltaSections, FeatureInfo, Frontmatter, ScenarioBlock } from '../types.js'
import { existsSync } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'

import { join, relative } from 'node:path'
import { RSP_DIR } from './config.js'

const RSP_AGENTS_BEGIN = '<!-- rsp:begin -->'
const RSP_AGENTS_END = '<!-- rsp:end -->'

/**
 * Parse a simple YAML-like key-value + list structure from lines.
 * Used by both frontmatter and config.yaml parsers.
 * Supports: `key: value`, `key:` + indent `- item`, and `#` comments.
 */
export function parseYamlLines(lines: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  let currentKey: string | null = null
  let currentList: string[] | null = null

  function flushList() {
    if (currentList !== null && currentKey !== null) {
      result[currentKey] = currentList
      currentList = null
      currentKey = null
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) {
      // comment lines inside a list are part of the list context — don't flush
      continue
    }

    // eslint-disable-next-line regexp/no-super-linear-backtracking
    const li = line.match(/^[ \t]+-[ \t]+([^\n]+)$/)
    if (li && currentList !== null) {
      currentList.push(li[1].trim())
      continue
    }

    flushList()

    // eslint-disable-next-line regexp/no-super-linear-backtracking
    const kv = line.match(/^([\w-]+):[ \t]*([^\n]*)$/)
    if (kv) {
      currentKey = kv[1]
      const val = kv[2].trim()
      if (!val || val === '[]') {
        currentList = []
      }
      else {
        result[currentKey] = val
        currentKey = null
      }
    }
  }

  flushList()
  return result
}

/**
 * Parse YAML frontmatter (between `---` delimiters) from feature file content.
 * Returns null if no frontmatter block is found.
 */
export function parseFrontmatter(content: string): Frontmatter | null {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)\r?\n/)
  if (!m)
    return null
  return parseYamlLines(m[1].split('\n')) as Frontmatter
}

/** Count semantic checkboxes ([ ], [/], [x]) in content. */
export function countCheckboxes(content: string): CheckboxCount {
  const todo = (content.match(/\[ \]/g) || []).length
  const progress = (content.match(/\[\/\]/g) || []).length
  const done = (content.match(/\[x\]/g) || []).length
  const dropped = (content.match(/\[-\]/g) || []).length
  return { todo, progress, done, total: todo + progress + done + dropped }
}

/** Recursively walk a directory, returning paths to all .md files. */
export async function walkMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  try {
    const items = await readdir(dir, { withFileTypes: true })
    for (const item of items) {
      if (item.name.startsWith('.'))
        continue
      const filePath = join(dir, item.name)
      if (item.isDirectory())
        files.push(...await walkMarkdownFiles(filePath))
      else if (item.name.endsWith('.md'))
        files.push(filePath)
    }
  }
  catch {
    // ignore missing dirs
  }
  return files
}

/** Recursively walk a directory, returning all entry paths (no file type filter). */
export async function walkFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  try {
    const items = await readdir(dir, { withFileTypes: true })
    for (const item of items) {
      if (item.name.startsWith('.'))
        continue
      const filePath = join(dir, item.name)
      if (item.isDirectory())
        files.push(...await walkFiles(filePath))
      else
        files.push(filePath)
    }
  }
  catch {
    // ignore missing dirs
  }
  return files
}

/** Convert a feature file path to its logical feature name (relative to features dir, no .md). */
export function featureNameFromPath(featuresDir: string, filePath: string): string {
  const rel = relative(featuresDir, filePath)
  return rel.replace(/\.md$/, '')
}

/**
 * Generate a feature file content from the built-in template.
 */
export function generateFeatureContent(name: string, summary = ''): string {
  return `---
status: draft
priority: medium
tags:
---

# Feature: ${name}

## Spec
- Summary: ${summary || '<one-line summary>'}
- Requirements:
  - <verifiable requirement>
- Constraints:
  -

## Plan
- [ ] Phase 1:
  - [ ] <task>

## Tests
- [ ] <test file or scenario>

## Notes (optional)
- <design decisions discovered during implementation>

## Blockers
-
`
}

/** Render the managed RSP block for AGENTS.md. */
export function renderRspAgentsBlock(): string {
  return `${RSP_AGENTS_BEGIN}
## RSP Entry

Read in order:
1. .rsp/rules/*.md
2. .rsp/specs/INDEX.md
3. .rsp/specs/design.md
4. .rsp/active.d/ and matching .rsp/features/*.md

Guidelines:
- .rsp/rules/rsp-rules.md is required
- .rsp/rules/project-rules.md is optional
- Keep project design in .rsp/specs/
- Add extra spec files only when they have durable value
${RSP_AGENTS_END}`
}

/** Update AGENTS.md with the managed RSP block while preserving user content. */
export function upsertRspAgentsBlock(content: string): { content: string, changed: boolean } {
  const block = renderRspAgentsBlock()
  const managedRe = /<!-- rsp:begin -->[\s\S]*?<!-- rsp:end -->/
  if (managedRe.test(content)) {
    const next = content.replace(managedRe, block)
    return { content: next, changed: next !== content }
  }

  const trimmed = content.trimStart()
  const next = trimmed ? `${block}\n\n${trimmed}` : `${block}\n`
  return { content: next, changed: true }
}

/** Check whether AGENTS.md already contains a managed RSP block. */
export function hasRspAgentsBlock(content: string): boolean {
  return content.includes(RSP_AGENTS_BEGIN) && content.includes(RSP_AGENTS_END)
}

/** Generate the default project design spec template. */
export function generateDesignContent(projectName: string): string {
  return `# Project Design: ${projectName}

## Purpose
- <what this project is responsible for>
- <who or what it serves>

## Scope
- In scope:
  - <major capability or boundary>
- Out of scope:
  - <intentional non-goal>

## Structure
- <important directory or subsystem> — <responsibility>

## Constraints
- <cross-cutting technical or operational constraint, when it affects architecture>
`
}

/** Generate the optional project rules template. */
export function generateProjectRulesContent(projectName: string): string {
  return `---
name: project-rules
description: Project-specific rules for ${projectName}
---

# Project Rules

## Scope
- <stable local rules, workflow constraints, or validation expectations>

## Validation
- <preferred validation commands>

## Conventions
- <project-specific conventions>
`
}

/** Generate a generic rules file template. */
export function generateRulesContent(name: string): string {
  const title = toTitleCase(name)
  return `---
name: ${name}
description: Project-specific rules for ${title}
---

# ${title}

## Scope
- <what this rules file governs>

## Rules
- <stable local rule>

## Validation
- <relevant validation command or check>
`
}

/** Generate a generic project spec template. */
export function generateSpecContent(name: string): string {
  const title = toTitleCase(name)
  return `# ${title}

## Purpose
- <why this project-level spec exists>

## Details
- <important project-level detail>
`
}

function toTitleCase(value: string): string {
  return value
    .split(/[-/]/g)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/**
 * Detect if the Spec section contains lightweight delta markers (ADDED/MODIFIED/REMOVED).
 * Matches `### ADDED`, `### MODIFIED`, `### REMOVED` sub-headings under ## Spec.
 */
export function detectDeltaSections(content: string): DeltaSections {
  const match = content.match(/^## Spec\n([\s\S]*?)(?=\n## |\n---|\n\.\.\.)/m)
  if (!match) {
    const m2 = content.match(/^## Spec\n([\s\S]*)$/m)
    if (!m2)
      return { added: false, modified: false, removed: false }
    // no trailing section separator — Spec is the last block
    const body = m2[1]
    return {
      added: /^###\s*ADDED/im.test(body),
      modified: /^###\s*MODIFIED/im.test(body),
      removed: /^###\s*REMOVED/im.test(body),
    }
  }
  const body = match[1]
  return {
    added: /^###\s*ADDED/im.test(body),
    modified: /^###\s*MODIFIED/im.test(body),
    removed: /^###\s*REMOVED/im.test(body),
  }
}

/**
 * Parse structured Given/When/Then scenario blocks from feature content.
 * Matches `### Scenario: Name` followed by indented `- GIVEN/WHEN/THEN` lines.
 */
export function parseScenarios(content: string): ScenarioBlock[] {
  const scenarios: ScenarioBlock[] = []
  // eslint-disable-next-line regexp/no-super-linear-backtracking
  const regex = /^###\s*Scenario:\s*(.+)$/gim
  let match

  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(content)) !== null) {
    const heading = match[1].trim()
    const startPos = match.index + match[0].length
    const restContent = content.slice(startPos)
    const nextSection = restContent.match(/^###/m)
    const block = nextSection ? restContent.slice(0, nextSection.index) : restContent
    const steps = block
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.startsWith('-') && /GIVEN|WHEN|THEN|AND|BUT/i.test(s))
      .map(s => s.replace(/^-\s*/, ''))
    if (steps.length > 0)
      scenarios.push({ heading, steps })
  }

  return scenarios
}

/**
 * Get a feature file's age in days (based on birthtime if available, else mtime).
 * Returns null if the file does not exist or stat fails.
 */
export async function getFeatureAge(filePath: string): Promise<number | null> {
  try {
    const s = await stat(filePath)
    const created = s.birthtime || s.mtime
    const diffMs = Date.now() - created.getTime()
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
  }
  catch {
    return null
  }
}

/**
 * Collect FeatureInfo for all feature files under .rsp/features/.
 */
export async function collectFeatureInfos(): Promise<FeatureInfo[]> {
  const featuresDir = join(RSP_DIR, 'features')
  const files = existsSync(featuresDir) ? await walkMarkdownFiles(featuresDir) : []
  const infos: FeatureInfo[] = []

  for (const fp of files) {
    const name = featureNameFromPath(featuresDir, fp)
    const ageDays = await getFeatureAge(fp)
    infos.push({ path: fp, name, ageDays })
  }

  return infos
}

/** Detect cycles in a directed dependency graph. Returns each cycle as an array of node names. */
export function detectCycles(graph: Map<string, string[]>): string[][] {
  const cycles: string[][] = []
  const visited = new Set<string>()
  const inStack = new Set<string>()

  function dfs(node: string, path: string[]) {
    if (inStack.has(node)) {
      const cycleStart = path.indexOf(node)
      if (cycleStart !== -1)
        cycles.push(path.slice(cycleStart).concat(node))
      return
    }
    if (visited.has(node))
      return

    visited.add(node)
    inStack.add(node)
    path.push(node)

    const neighbors = graph.get(node) || []
    for (const next of neighbors) {
      if (graph.has(next))
        dfs(next, path)
    }

    path.pop()
    inStack.delete(node)
  }

  for (const node of graph.keys())
    dfs(node, [])

  return cycles
}
