import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join, relative } from 'node:path'

import { ARCHIVES_DIR, pc } from '../core/config.js'
import { extractSection, normalizeLogicalPath, parseFrontmatter, walkMarkdownFiles } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'

/** Regenerate the .rsp/archives/INDEX.md file by scanning archived change files. */
export async function buildArchiveIndex({ acquireLock = true, quiet = false } = {}) {
  if (acquireLock)
    return withRspLock('archive-index', async () => buildArchiveIndex({ acquireLock: false, quiet }))

  if (!existsSync(ARCHIVES_DIR)) {
    if (!quiet)
      console.log(`  ${pc.dim('No archives directory.')}\n`)
    return
  }

  const archiveFiles = (await walkMarkdownFiles(ARCHIVES_DIR))
    .filter(fp => basename(fp) !== 'INDEX.md')
    .sort()

  const lines: string[] = []
  lines.push('---')
  lines.push('title: Archive Index')
  lines.push('summary: Completed RSP changes.')
  lines.push('kind: generated-index')
  lines.push('index_type: archives')
  lines.push('source_dir: .rsp/archives')
  lines.push(`entry_count: ${archiveFiles.length}`)
  lines.push('---')
  lines.push('')
  lines.push('# Archive Index')
  lines.push('')
  if (archiveFiles.length === 0) {
    lines.push('_No archived changes yet._')
  }
  else {
    lines.push('| Date | Change | Kind | Summary |')
    lines.push('|------|--------|------|---------|')
  }

  for (const fp of archiveFiles) {
    const base = basename(fp)
    const archiveRel = normalizeLogicalPath(relative(ARCHIVES_DIR, fp))
    const archiveDirPart = dirname(archiveRel)

    const dateMatch = base.match(/^(\d{4}-\d{2}-\d{2})_(.+)\.md$/)
    const date = dateMatch ? dateMatch[1] : '—'
    const baseName = dateMatch ? dateMatch[2] : base.replace(/\.md$/, '')
    const changeName = archiveDirPart !== '.' ? `${archiveDirPart}/${baseName}` : baseName

    let summary = ''
    let kind = ''
    try {
      const content = await readFile(fp, 'utf-8')
      const fm = parseFrontmatter(content)
      if (typeof fm?.kind === 'string')
        kind = fm.kind
      if (typeof fm?.summary === 'string')
        summary = fm.summary.trim()
      const proposal = extractSection(content, 'Proposal')
      const summaryLine = proposal
        .split('\n')
        .map(line => line.trim())
        .find(line => line.startsWith('- Summary:'))
      if (!summary && summaryLine)
        summary = summaryLine.slice('- Summary:'.length).trim()
    }
    catch { /* ignore malformed archive entries */ }

    lines.push(`| ${date} | ${escapeCell(changeName)} | ${escapeCell(kind || '—')} | ${escapeCell(summary || '—')} |`)
  }

  const indexPath = join(ARCHIVES_DIR, 'INDEX.md')
  await writeFile(indexPath, lines.join('\n'))

  if (!quiet)
    console.log(`  ${pc.green('INDEX.md updated:')} ${archiveFiles.length} archived change(s).\n`)
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|')
}
