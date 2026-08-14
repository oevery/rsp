import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { generateDesignContent, generateSpecContent } from '../core/artifacts.js'
import { inspectRspConfig, RSP_DIR, RSP_RULES_PATH } from '../core/config.js'
import { detectProjectName, isValidSpecName } from '../core/filesystem.js'
import { withRspLock } from '../core/lock.js'
import { inspectManagedFile, inspectManagedFileTree, resolveManagedDirectoryChain } from '../core/managed-path.js'
import { toErrorMessage } from '../core/output.js'

export type AddSpecResult
  = | { ok: true, path: string }
    | { ok: false, message: string }

export async function addSpec(name: string, projectName = 'project'): Promise<AddSpecResult> {
  if (!name || !isValidSpecName(name)) {
    return { ok: false, message: 'spec name must be kebab-case with optional subdirectory' }
  }
  if (name.startsWith('decisions/')) {
    return { ok: false, message: '.rsp/specs/decisions/ is reserved for Decision Records' }
  }
  if (['index', '00-index'].includes(name.split('/').at(-1) || '')) {
    return { ok: false, message: 'spec name "index" is reserved for Specs migration compatibility' }
  }
  const rules = inspectManagedFile(RSP_RULES_PATH, 'fallback protocol', { allowMissing: true })
  const design = inspectManagedFile(join(RSP_DIR, 'specs', 'design.md'), 'design Spec', { allowMissing: true })
  if (rules.issue || design.issue || !rules.exists || !design.exists) {
    const initialized = existsSync(RSP_DIR)
    return { ok: false, message: `${initialized ? 'RSP project requires an update' : 'RSP is not initialized in this project'}\n  ${initialized ? 'Run: rsp update' : 'Run: rsp init'}` }
  }

  try {
    const configInspection = await inspectRspConfig()
    if (configInspection.issues.length > 0) {
      return { ok: false, message: configInspection.issues.join('; ') }
    }
  }
  catch (error) {
    return { ok: false, message: `.rsp/config.yaml could not be parsed: ${toErrorMessage(error)}` }
  }

  return withRspLock('add-spec', async () => {
    const specsDir = join(RSP_DIR, 'specs')
    const segments = name.split('/')
    const parent = resolveManagedDirectoryChain(specsDir, segments.slice(0, -1), 'spec path')
    const path = join(parent, `${segments.at(-1)}.md`)
    const inspection = await inspectManagedFileTree(specsDir, 'Specs')
    if (inspection.issues.length > 0)
      throw inspection.issues[0]

    await mkdir(parent, { recursive: true })
    const resolvedProjectName = projectName === 'project' ? await detectProjectName() : projectName
    const content = name === 'design' ? generateDesignContent(resolvedProjectName) : generateSpecContent(name)
    try {
      await writeFile(path, content, { flag: 'wx' })
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST')
        throw new Error(`spec file already exists: .rsp/specs/${name}.md`)
      throw error
    }
    return { ok: true, path: `.rsp/specs/${name}.md` }
  })
}
