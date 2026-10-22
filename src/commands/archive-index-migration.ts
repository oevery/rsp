import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { ARCHIVES_DIR } from '../core/config.js'
import { parseFrontmatter } from '../core/content.js'
import { requireManagedFile } from '../core/managed-path.js'

/** Recognize the legacy Archive Index by its generated ownership metadata. */
export async function isLegacyArchiveIndex(): Promise<boolean> {
  const path = join(ARCHIVES_DIR, 'INDEX.md')
  if (!requireManagedFile(path, 'legacy archive index', { allowMissing: true }))
    return false

  return isLegacyArchiveIndexContent(await readFile(path, 'utf-8'))
}

export function isLegacyArchiveIndexContent(content: string): boolean {
  try {
    const frontmatter = parseFrontmatter(content)
    return frontmatter?.kind === 'generated-index' && frontmatter.index_type === 'archives'
  }
  catch {
    return false
  }
}
