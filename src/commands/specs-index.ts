import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, isAbsolute, join, relative, sep } from 'node:path'

import { inspectRspConfig, pc, RSP_DIR } from '../core/config.js'
import { DEFAULT_DECISION_RECORDS_PATH, resolveDecisionRecordsPath } from '../core/decisions.js'
import { normalizeLogicalPath, parseFrontmatter, walkMarkdownFiles } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'

/** Regenerate the .rsp/specs/INDEX.md file as an index of additional project specs. */
export async function buildSpecsIndex({ acquireLock = true, quiet = false } = {}): Promise<boolean | undefined> {
  if (acquireLock)
    return withRspLock('specs-index', async () => buildSpecsIndex({ acquireLock: false, quiet }))

  const specsDir = join(RSP_DIR, 'specs')
  const configInspection = await inspectRspConfig()
  if (configInspection.decisionRecordsIssue)
    throw new Error(configInspection.decisionRecordsIssue)
  const decisionRecordsPath = resolveDecisionRecordsPath(configInspection.config)

  if (!existsSync(specsDir)) {
    if (!quiet)
      console.log(`  ${pc.dim('No specs directory.')}\n`)
    return false
  }

  const specFiles = (await walkMarkdownFiles(specsDir))
    .filter((fp) => {
      const name = basename(fp)
      return name !== 'INDEX.md'
        && name !== 'design.md'
        && !isInside(DEFAULT_DECISION_RECORDS_PATH, fp)
        && !isInside(decisionRecordsPath, fp)
    })
    .sort()

  const lines: string[] = []
  lines.push('---')
  lines.push('title: Specs Index')
  lines.push('summary: Additional project-level specs beyond design.md.')
  lines.push('kind: generated-index')
  lines.push('index_type: specs')
  lines.push('source_dir: .rsp/specs')
  lines.push(`entry_count: ${specFiles.length}`)
  lines.push('---')
  lines.push('')
  lines.push('# Specs Index')
  lines.push('')
  lines.push('_Additional project-level specs beyond `design.md`._')
  lines.push('')

  if (specFiles.length === 0) {
    lines.push('_No additional project-level specs yet._')
  }
  else {
    lines.push('| File | Title | Summary |')
    lines.push('|------|-------|---------|')

    for (const fp of specFiles) {
      const rel = normalizeLogicalPath(relative(specsDir, fp))
      const content = await readFile(fp, 'utf-8')
      const fm = parseFrontmatter(content)
      const fmTitle = fm && typeof fm.title === 'string' ? fm.title : ''
      const title = fmTitle || extractTitle(content) || rel.replace(/\.md$/, '')
      const summary = extractSummary(content, fm?.summary)
      lines.push(`| ${escapeCell(rel)} | ${escapeCell(title)} | ${escapeCell(summary || '—')} |`)
    }
  }
  const indexPath = join(specsDir, 'INDEX.md')
  const nextContent = lines.join('\n')
  const existingContent = existsSync(indexPath) ? await readFile(indexPath, 'utf-8') : null
  const changed = existingContent !== nextContent
  if (changed)
    await writeFile(indexPath, nextContent)
  if (!quiet)
    console.log(`  ${pc.green('INDEX.md updated:')} ${specFiles.length} spec file(s).\n`)
  return changed
}

function isInside(directory: string, filePath: string): boolean {
  const rel = relative(directory, filePath)
  return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`))
}

function extractTitle(content: string): string {
  for (const rawLine of content.split('\n')) {
    if (!rawLine.startsWith('# '))
      continue
    return rawLine.slice(2).trim()
  }
  return ''
}

function extractSummary(content: string, frontmatterSummary?: unknown): string {
  if (typeof frontmatterSummary === 'string' && frontmatterSummary.trim() !== '')
    return frontmatterSummary.trim()

  const lines = content.split('\n')
  let inFrontmatter = false

  for (const rawLine of lines) {
    const line = rawLine.trim()

    if (line === '---' || line === '...') {
      inFrontmatter = !inFrontmatter
      continue
    }
    if (inFrontmatter || line === '')
      continue
    if (line.startsWith('#'))
      continue
    if (line.startsWith('##'))
      continue

    return line.replace(/^[-*]\s*/, '').trim()
  }

  return ''
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|')
}
