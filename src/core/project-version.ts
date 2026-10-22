import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getVersion, RSP_DIR } from './config.js'
import { inspectManagedDirectory, inspectManagedFile } from './managed-path.js'

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

export async function selectProjectVersion(operation: 'ordinary' | 'update' = 'ordinary'): Promise<string> {
  const version = await getVersion()
  exactInvocation(version)
  const selected = await readProjectVersion()
  if (selected && selected !== version && operation !== 'update') {
    throw new Error(`Project pins RSP ${selected}; running CLI is ${version}. Use ${exactInvocation(selected)} <command>. To migrate deliberately, inspect the target version and run ${exactInvocation(version)} update.`)
  }
  if (selected && operation === 'update' && compareVersions(version, selected) < 0)
    throw new Error(`Downgrading RSP from ${selected} to ${version} is unsupported. Use ${exactInvocation(selected)} <command>.`)
  return version
}

/** SemVer precedence; build metadata does not change upgrade direction. */
export function compareVersions(left: string, right: string): number {
  const parts = (value: string) => {
    const [core, ...pre] = value.split('+', 1)[0]!.split('-')
    return { core: core!.split('.').map(BigInt), pre: pre.length ? pre.join('-').split('.') : [] }
  }
  const a = parts(left)
  const b = parts(right)
  for (let i = 0; i < 3; i++) {
    if (a.core[i] !== b.core[i])
      return a.core[i]! > b.core[i]! ? 1 : -1
  }
  if (!a.pre.length || !b.pre.length)
    return Number(!a.pre.length) - Number(!b.pre.length)
  for (let i = 0; i < Math.max(a.pre.length, b.pre.length); i++) {
    const x = a.pre[i]
    const y = b.pre[i]
    if (x === y)
      continue
    if (x === undefined || y === undefined)
      return x === undefined ? -1 : 1
    const nx = /^\d+$/.test(x)
    const ny = /^\d+$/.test(y)
    if (nx && ny)
      return BigInt(x) > BigInt(y) ? 1 : -1
    if (nx !== ny)
      return nx ? -1 : 1
    return x > y ? 1 : -1
  }
  return 0
}

export async function guardProjectVersion(rawArgs: string[]): Promise<void> {
  if (rawArgs.some(arg => ['--help', '-h'].includes(arg)) || (rawArgs.length === 1 && ['--version', '-v'].includes(rawArgs[0]!)))
    return
  // Diagnostics must explain drift; update selects its target inside the project lock.
  if (['doctor', 'config', 'update'].includes(rawArgs[0] ?? ''))
    return
  await selectProjectVersion()
}
