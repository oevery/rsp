import { readFile, realpath } from 'node:fs/promises'
import { join } from 'node:path'
import { getVersion, PKG_ROOT, RSP_DIR } from './config.js'
import { inspectManagedDirectory, inspectManagedFile } from './managed-path.js'

export const PROJECT_VERSION_PATH = '.rsp/version'
export const PROJECT_SOURCE_PATH = '.rsp/source'
export const SOURCE_INVOCATION = 'mise exec -- node dist/cli.mjs'
export type ProjectRuntime = { mode: 'package', version: string | null } | { mode: 'source' }
export interface SelectedRuntime { mode: 'package' | 'source', version: string }

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

export async function readProjectRuntime(projectRoot = '.'): Promise<ProjectRuntime> {
  const version = await readProjectVersion(projectRoot)
  const source = inspectManagedFile(join(projectRoot, PROJECT_SOURCE_PATH), 'project source selection', { allowMissing: true })
  if (source.issue)
    throw source.issue
  if (!source.exists)
    return { mode: 'package', version }
  if (version !== null)
    throw new Error(`${PROJECT_SOURCE_PATH} and ${PROJECT_VERSION_PATH} are mutually exclusive; explicitly select one runtime.`)
  if ((await readFile(join(projectRoot, PROJECT_SOURCE_PATH), 'utf8')).trim() !== '.')
    throw new Error(`${PROJECT_SOURCE_PATH} must contain . to select this RSP source checkout.`)
  if (await realpath(projectRoot) !== await realpath(PKG_ROOT))
    throw new Error(`Source mode requires this checkout's local CLI. Build here, then use ${SOURCE_INVOCATION} <command>; a registry package or another checkout cannot substitute.`)
  const sourceDirectory = inspectManagedDirectory(join(projectRoot, 'src'), 'RSP source directory')
  const sourceEntry = inspectManagedFile(join(projectRoot, 'src/cli.ts'), 'RSP source entry')
  if (sourceDirectory.issue || sourceEntry.issue)
    throw sourceDirectory.issue ?? sourceEntry.issue
  return { mode: 'source' }
}

export async function selectProjectRuntime(operation: 'ordinary' | 'update' = 'ordinary'): Promise<SelectedRuntime> {
  const version = await getVersion()
  exactInvocation(version)
  const selected = await readProjectRuntime()
  if (selected.mode === 'source')
    return { mode: 'source', version }
  if (selected.version && selected.version !== version && operation !== 'update') {
    throw new Error(`Project pins RSP ${selected.version}; running CLI is ${version}. Use ${exactInvocation(selected.version)} <command>. To migrate deliberately, inspect the target version and run ${exactInvocation(version)} update.`)
  }
  if (selected.version && operation === 'update' && compareVersions(version, selected.version) < 0)
    throw new Error(`Downgrading RSP from ${selected.version} to ${version} is unsupported. Use ${exactInvocation(selected.version)} <command>.`)
  return { mode: 'package', version }
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
  await selectProjectRuntime()
}
