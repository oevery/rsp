import { randomUUID } from 'node:crypto'
import { lstatSync } from 'node:fs'
import { chmod, copyFile, mkdir, readdir, readFile, rename, rm } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { PKG_ROOT } from '../core/config.js'
import { inspectManagedDirectory, inspectManagedFileTree, ManagedPathError, resolveManagedDirectoryChain } from '../core/managed-path.js'

export interface InstallPackagedSkillsArgs {
  dryRun?: boolean
  force?: boolean
  names?: string[]
}

export const DEFAULT_PACKAGED_SKILL_NAMES = [
  'rsp',
  'rsp-address-review',
  'rsp-design',
  'rsp-diagnose',
  'rsp-implement',
  'rsp-manage',
  'rsp-release-docs',
  'rsp-review',
  'rsp-shape',
  'rsp-tdd',
] as const

export interface SkillInstallResult {
  installed: string[]
  unchanged: string[]
  replaced: string[]
}

export type PackagedSkillKind = 'default' | 'optional'
export type PackagedSkillStatus = 'missing' | 'unchanged' | 'divergent'

export interface PackagedSkillInventoryItem {
  name: string
  kind: PackagedSkillKind
  status: PackagedSkillStatus
}

export interface PackagedSkillInventory {
  package: { name: string, version: string }
  target: string
  skills: PackagedSkillInventoryItem[]
}

export interface InspectPackagedSkillsOptions {
  packageRoot?: string
  projectRoot?: string
}

interface InstallPackagedSkillsOptions {
  packageRoot?: string
  projectRoot?: string
  onMutationStep?: (step: SkillInstallMutationStep) => Promise<void> | void
  renamePath?: (source: string, destination: string) => Promise<void>
}

type SkillInstallMutationStep
  = | { phase: 'before-target-root-mutation', targetRoot: string }
    | { phase: 'before-activate', name: string, target: string }
    | { phase: 'before-rollback-restore', name: string, target: string, previous: string }

interface DirectoryIdentity {
  path: string
  dev: number
  ino: number
}

interface SkillTree {
  name: string
  root: string
  files: string[]
}

function unsupportedEntry(path: string, label: string): ManagedPathError {
  return new ManagedPathError(path, `unsupported entry in the ${label} tree: ${path}`)
}

function inspectDirectoryIdentity(path: string, label: string): DirectoryIdentity {
  const inspection = inspectManagedDirectory(path, label)
  if (inspection.issue)
    throw inspection.issue
  const stats = lstatSync(path)
  return { path, dev: stats.dev, ino: stats.ino }
}

function assertDirectoryIdentities(identities: DirectoryIdentity[], label: string): void {
  for (const identity of identities) {
    const current = inspectDirectoryIdentity(identity.path, label)
    if (current.dev !== identity.dev || current.ino !== identity.ino)
      throw new ManagedPathError(identity.path, `${label} changed after validation: ${identity.path}`)
  }
}

async function prepareTargetRoot(projectRoot: string, targetRoot: string): Promise<DirectoryIdentity[]> {
  const projectIdentity = inspectDirectoryIdentity(projectRoot, 'project Skills root')
  const agentsRoot = join(projectRoot, '.agents')
  const identities = [projectIdentity]

  assertDirectoryIdentities(identities, 'project Skills root')
  await mkdir(agentsRoot).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'EEXIST')
      throw error
  })
  assertDirectoryIdentities(identities, 'project Skills root')
  identities.push(inspectDirectoryIdentity(agentsRoot, 'project Skills root'))

  assertDirectoryIdentities(identities, 'project Skills root')
  await mkdir(targetRoot).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'EEXIST')
      throw error
  })
  assertDirectoryIdentities(identities, 'project Skills root')
  identities.push(inspectDirectoryIdentity(targetRoot, 'project Skills root'))
  return identities
}

async function inspectPackagedSkills(packageRoot: string): Promise<SkillTree[]> {
  const skillsRoot = join(packageRoot, 'skills')
  const rootInspection = inspectManagedDirectory(skillsRoot, 'packaged Skills root')
  if (rootInspection.issue)
    throw rootInspection.issue

  const entries = await readdir(skillsRoot, { withFileTypes: true })
  const skills: SkillTree[] = []
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('.'))
      continue
    const root = join(skillsRoot, entry.name)
    if (!entry.isDirectory())
      throw unsupportedEntry(root, 'packaged Skills')
    const inspection = await inspectManagedFileTree(root, `packaged Skill ${entry.name}`)
    if (inspection.issues.length > 0)
      throw inspection.issues[0]
    skills.push({
      name: entry.name,
      root,
      files: inspection.files.map(path => relative(root, path)),
    })
  }
  return skills
}

function inspectTarget(path: string, name: string): 'missing' | 'directory' {
  try {
    const stats = lstatSync(path)
    if (stats.isDirectory())
      return 'directory'
    throw unsupportedEntry(path, `installed Skill ${name}`)
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return 'missing'
    throw error
  }
}

function inspectInventoryTarget(path: string): 'missing' | 'directory' | 'divergent' {
  try {
    return lstatSync(path).isDirectory() ? 'directory' : 'divergent'
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return 'missing'
    throw error
  }
}

async function treesEqual(source: SkillTree, targetRoot: string): Promise<boolean> {
  const target = await inspectManagedFileTree(targetRoot, `installed Skill ${source.name}`)
  if (target.issues.length > 0)
    throw target.issues[0]
  const targetFiles = target.files.map(path => relative(targetRoot, path))
  if (source.files.length !== targetFiles.length || source.files.some((path, index) => path !== targetFiles[index]))
    return false

  for (const path of source.files) {
    const sourcePath = join(source.root, path)
    const targetPath = join(targetRoot, path)
    const [sourceStats, targetStats] = [lstatSync(sourcePath), lstatSync(targetPath)]
    if (!sourceStats.isFile() || !targetStats.isFile())
      throw unsupportedEntry(!sourceStats.isFile() ? sourcePath : targetPath, `Skill ${source.name}`)
    if ((sourceStats.mode & 0o777) !== (targetStats.mode & 0o777))
      return false
    const [sourceContent, targetContent] = await Promise.all([readFile(sourcePath), readFile(targetPath)])
    if (!sourceContent.equals(targetContent))
      return false
  }
  return true
}

export async function inspectPackagedSkillInventory(
  options: InspectPackagedSkillsOptions = {},
): Promise<PackagedSkillInventory> {
  const packageRoot = options.packageRoot ?? PKG_ROOT
  const projectRoot = options.projectRoot ?? process.cwd()
  const packagedSkills = await inspectPackagedSkills(packageRoot)
  const packagedNames = new Set(packagedSkills.map(skill => skill.name))
  const missingDefaults = DEFAULT_PACKAGED_SKILL_NAMES.filter(name => !packagedNames.has(name))
  if (missingDefaults.length > 0)
    throw new Error(`packaged Skills missing default Skills: ${missingDefaults.join(', ')}`)
  const manifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8')) as { name?: unknown, version?: unknown }
  if (typeof manifest.name !== 'string' || typeof manifest.version !== 'string')
    throw new Error('package.json must contain string name and version fields')
  const targetRoot = resolveManagedDirectoryChain(projectRoot, ['.agents', 'skills'], 'project Skills root')
  const defaults = new Set<string>(DEFAULT_PACKAGED_SKILL_NAMES)
  const skills: PackagedSkillInventoryItem[] = []
  for (const skill of packagedSkills) {
    const target = join(targetRoot, skill.name)
    const targetStatus = inspectInventoryTarget(target)
    skills.push({
      name: skill.name,
      kind: defaults.has(skill.name) ? 'default' : 'optional',
      status: targetStatus === 'missing'
        ? 'missing'
        : targetStatus === 'divergent'
          ? 'divergent'
          : await treesEqual(skill, target) ? 'unchanged' : 'divergent',
    })
  }
  return {
    package: { name: manifest.name, version: manifest.version },
    target: relative(projectRoot, targetRoot) || '.',
    skills,
  }
}

export function printPackagedSkillInventory(inventory: PackagedSkillInventory): void {
  console.log(`  ${inventory.package.name}@${inventory.package.version}`)
  console.log(`  target: ${inventory.target}`)
  for (const group of [
    { heading: 'Default lifecycle Skills', kind: 'default' },
    { heading: 'Optional project Skills', kind: 'optional' },
  ] as const) {
    console.log('')
    console.log(`  ${group.heading}`)
    const skills = inventory.skills.filter(skill => skill.kind === group.kind)
    if (skills.length === 0)
      console.log('    none')
    for (const skill of skills)
      console.log(`    ${skill.name}  ${skill.status}`)
  }
}

async function copySkillTree(source: SkillTree, targetRoot: string): Promise<void> {
  await mkdir(targetRoot, { recursive: true })
  for (const path of source.files) {
    const sourcePath = join(source.root, path)
    const targetPath = join(targetRoot, path)
    const stats = lstatSync(sourcePath)
    if (!stats.isFile())
      throw unsupportedEntry(sourcePath, `packaged Skill ${source.name}`)
    await mkdir(dirname(targetPath), { recursive: true })
    await copyFile(sourcePath, targetPath)
    await chmod(targetPath, stats.mode & 0o777)
  }
}

export async function installPackagedSkills(
  args: InstallPackagedSkillsArgs = {},
  options: InstallPackagedSkillsOptions = {},
): Promise<SkillInstallResult> {
  const packageRoot = options.packageRoot ?? PKG_ROOT
  const projectRoot = options.projectRoot ?? process.cwd()
  const renamePath = options.renamePath ?? rename
  const packagedSkills = await inspectPackagedSkills(packageRoot)
  const requestedNames = args.names?.length
    ? [...new Set(args.names)]
    : [...DEFAULT_PACKAGED_SKILL_NAMES]
  const packagedSkillsByName = new Map(packagedSkills.map(skill => [skill.name, skill]))
  for (const name of requestedNames) {
    if (!packagedSkillsByName.has(name))
      throw new Error(`unknown packaged Skill: ${name}`)
  }
  const skills = requestedNames
    .map(name => packagedSkillsByName.get(name)!)
    .sort((a, b) => a.name.localeCompare(b.name))
  const targetRoot = resolveManagedDirectoryChain(projectRoot, ['.agents', 'skills'], 'project Skills root')

  const result: SkillInstallResult = { installed: [], unchanged: [], replaced: [] }
  const conflicts: string[] = []
  const targetTreeIdentities = new Map<string, DirectoryIdentity>()
  for (const skill of skills) {
    const target = join(targetRoot, skill.name)
    if (inspectTarget(target, skill.name) === 'missing') {
      result.installed.push(skill.name)
      continue
    }
    const targetIdentity = inspectDirectoryIdentity(target, `installed Skill ${skill.name}`)
    if (await treesEqual(skill, target)) {
      result.unchanged.push(skill.name)
      continue
    }
    assertDirectoryIdentities([targetIdentity], `installed Skill ${skill.name}`)
    if (args.force) {
      result.replaced.push(skill.name)
      targetTreeIdentities.set(skill.name, targetIdentity)
    }
    else {
      conflicts.push(skill.name)
    }
  }

  if (conflicts.length > 0)
    throw new Error(`conflicting packaged Skills: ${conflicts.join(', ')}; rerun with --force to replace only these package-owned directories`)
  if (args.dryRun)
    return result

  await options.onMutationStep?.({ phase: 'before-target-root-mutation', targetRoot })
  const targetIdentities = await prepareTargetRoot(projectRoot, targetRoot)
  const stagingRoot = join(targetRoot, `.rsp-skills-install-${randomUUID()}`)
  const nextRoot = join(stagingRoot, 'next')
  const previousRoot = join(stagingRoot, 'previous')
  const failedRoot = join(stagingRoot, 'failed')
  const movedPrevious: string[] = []
  const activated: string[] = []
  let removeStaging = true
  try {
    assertDirectoryIdentities(targetIdentities, 'project Skills root')
    await mkdir(nextRoot, { recursive: true })
    await mkdir(previousRoot)
    await mkdir(failedRoot)
    for (const skill of skills) {
      if (result.unchanged.includes(skill.name))
        continue
      await copySkillTree(skill, join(nextRoot, skill.name))
    }

    for (const name of result.installed) {
      const target = join(targetRoot, name)
      if (inspectTarget(target, name) !== 'missing')
        throw new ManagedPathError(target, `installed Skill changed after preflight: ${target}`)
    }
    for (const name of result.replaced) {
      assertDirectoryIdentities([targetTreeIdentities.get(name)!], `installed Skill ${name}`)
    }

    for (const name of result.replaced) {
      assertDirectoryIdentities(targetIdentities, 'project Skills root')
      assertDirectoryIdentities([targetTreeIdentities.get(name)!], `installed Skill ${name}`)
      await renamePath(join(targetRoot, name), join(previousRoot, name))
      movedPrevious.push(name)
    }
    for (const name of [...result.installed, ...result.replaced].sort()) {
      const target = join(targetRoot, name)
      assertDirectoryIdentities(targetIdentities, 'project Skills root')
      await options.onMutationStep?.({ phase: 'before-activate', name, target })
      assertDirectoryIdentities(targetIdentities, 'project Skills root')
      if (inspectTarget(target, name) !== 'missing')
        throw new ManagedPathError(target, `installed Skill changed after preflight: ${target}`)
      await renamePath(join(nextRoot, name), target)
      activated.push(name)
    }
  }
  catch (error) {
    const rollbackErrors: string[] = []
    for (const name of activated.reverse()) {
      const target = join(targetRoot, name)
      try {
        assertDirectoryIdentities(targetIdentities, 'project Skills root')
        if (inspectTarget(target, name) === 'directory')
          await renamePath(target, join(failedRoot, name))
      }
      catch (rollbackError) {
        rollbackErrors.push(rollbackError instanceof Error ? rollbackError.message : String(rollbackError))
      }
    }
    for (const name of movedPrevious.reverse()) {
      const target = join(targetRoot, name)
      const previous = join(previousRoot, name)
      try {
        assertDirectoryIdentities(targetIdentities, 'project Skills root')
        await options.onMutationStep?.({ phase: 'before-rollback-restore', name, target, previous })
        assertDirectoryIdentities(targetIdentities, 'project Skills root')
        if (inspectTarget(target, name) !== 'missing')
          throw new ManagedPathError(target, `cannot restore installed Skill because the target is occupied: ${target}`)
        await renamePath(previous, target)
      }
      catch (rollbackError) {
        rollbackErrors.push(rollbackError instanceof Error ? rollbackError.message : String(rollbackError))
      }
    }
    if (rollbackErrors.length > 0) {
      removeStaging = false
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`${message}; rollback incomplete; recover original Skills from ${previousRoot}; ${rollbackErrors.join('; ')}`)
    }
    throw error
  }
  finally {
    if (removeStaging)
      await rm(stagingRoot, { recursive: true, force: true })
  }

  return result
}

export function printSkillInstallResult(result: SkillInstallResult, dryRun = false): void {
  const prefix = dryRun ? 'would be ' : ''
  for (const status of ['installed', 'unchanged', 'replaced'] as const) {
    if (result[status].length > 0)
      console.log(`  ${prefix}${status}: ${result[status].join(', ')}`)
  }
}
