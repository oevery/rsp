import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { inspectRspConfig, pc, RSP_DIR } from '../core/config.js'
import { cleanupEmptyParentDirs, detectProjectName, generateDesignContent, generateSpecContent, guardRspInitialized, isValidSpecName } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'
import { inspectManagedFileTree, resolveManagedDirectoryChain } from '../core/managed-path.js'
import { toErrorMessage } from '../core/output.js'
import { buildSpecsIndex } from './specs-index.js'

export async function addSpec(name: string, projectName = 'project') {
  if (!name || !isValidSpecName(name)) {
    console.error(`  ${pc.red('Error:')} spec name must be kebab-case with optional subdirectory`)
    process.exit(1)
  }
  if (name.startsWith('decisions/')) {
    console.error(`  ${pc.red('Error:')} .rsp/specs/decisions/ is reserved for Decision Records`)
    process.exit(1)
  }
  if (['index', '00-index'].includes(name.split('/').at(-1) || '')) {
    console.error(`  ${pc.red('Error:')} spec name "index" is reserved for generated local navigation`)
    process.exit(1)
  }
  guardRspInitialized()

  try {
    const configInspection = await inspectRspConfig()
    if (configInspection.issues.length > 0) {
      console.error(`  ${pc.red('Error:')} ${configInspection.issues.join('; ')}`)
      process.exit(1)
    }
  }
  catch (error) {
    console.error(`  ${pc.red('Error:')} .rsp/config.yaml could not be parsed: ${toErrorMessage(error)}`)
    process.exit(1)
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
    let created = false
    try {
      await writeFile(path, content, { flag: 'wx' })
      created = true
      await buildSpecsIndex({ acquireLock: false, affectedDirectory: parent })
    }
    catch (error) {
      if (created) {
        try {
          await unlink(path)
          await cleanupEmptyParentDirs(path, specsDir)
        }
        catch {
          // Preserve the original failure; doctor will report any residual path.
        }
      }
      if ((error as NodeJS.ErrnoException).code === 'EEXIST')
        throw new Error(`spec file already exists: .rsp/specs/${name}.md`)
      throw error
    }
    console.log(`  ${pc.green('Created:')} .rsp/specs/${name}.md\n`)
  })
}
