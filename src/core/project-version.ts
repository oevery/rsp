import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getVersion, RSP_DIR } from './config.js'
import { inspectManagedDirectory, inspectManagedFile, writeManagedFile } from './managed-path.js'

export const PROJECT_VERSION_PATH = '.rsp/version'

export function isExactVersion(value: string): boolean {
  return /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[a-z-][\da-z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-z-][\da-z-]*))*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?$/i.test(value)
}

export function exactInvocation(version: string): string {
  if (!isExactVersion(version))
    throw new Error(`Invalid exact RSP version: ${version}`)
  return `npx -y @oevery/rsp@${version}`
}

export async function readProjectVersion(projectRoot = '.'): Promise<string | null> {
  const directory = inspectManagedDirectory(join(projectRoot, RSP_DIR), 'RSP root', { allowMissing: true })
  if (directory.issue)
    throw directory.issue
  if (!directory.exists)
    return null
  const path = join(projectRoot, PROJECT_VERSION_PATH)
  const inspection = inspectManagedFile(path, 'project CLI version', { allowMissing: true })
  if (inspection.issue)
    throw inspection.issue
  if (!inspection.exists)
    return null
  const version = (await readFile(path, 'utf8')).trim()
  if (!isExactVersion(version))
    throw new Error(`${PROJECT_VERSION_PATH} must contain one exact package version, not a tag or range`)
  return version
}

export async function selectProjectVersion(adopt = false): Promise<string> {
  const version = await getVersion()
  exactInvocation(version)
  const selected = await readProjectVersion()
  if (selected && selected !== version && !adopt) {
    throw new Error(`Project pins RSP ${selected}; running CLI is ${version}. Use ${exactInvocation(selected)} <command>. To migrate deliberately, inspect the target version and run ${exactInvocation(version)} update --adopt-version.`)
  }
  return version
}

export async function writeProjectVersion(version: string): Promise<void> {
  exactInvocation(version)
  await writeManagedFile(PROJECT_VERSION_PATH, `${version}\n`, 'project CLI version')
}

export async function guardProjectVersion(rawArgs: string[]): Promise<void> {
  if (rawArgs.some(arg => ['--help', '-h'].includes(arg)) || (rawArgs.length === 1 && ['--version', '-v'].includes(rawArgs[0]!)))
    return
  // Diagnostics must explain drift; update checks its own adoption flag inside the lock.
  if (['doctor', 'config', 'update'].includes(rawArgs[0] ?? ''))
    return
  await selectProjectVersion()
}
