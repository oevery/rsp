import { readFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'

import { ARCHIVES_DIR } from '../core/config.js'
import { parseFrontmatter } from '../core/content.js'
import { inspectManagedFile } from '../core/managed-path.js'

/** Remove only the legacy generated Archive Index whose metadata proves RSP ownership. */
export async function removeLegacyArchiveIndex(): Promise<boolean> {
  const path = join(ARCHIVES_DIR, 'INDEX.md')
  const inspection = inspectManagedFile(path, 'legacy archive index', { allowMissing: true })
  if (!inspection.exists || inspection.issue)
    return false

  let frontmatter
  try {
    frontmatter = parseFrontmatter(await readFile(path, 'utf-8'))
  }
  catch {
    return false
  }
  if (frontmatter?.kind !== 'generated-index' || frontmatter.index_type !== 'archives')
    return false

  await unlink(path)
  return true
}
