import { lstatSync, realpathSync } from 'node:fs'
import { chmod, copyFile, mkdir, mkdtemp, readdir, readFile, rename, rm } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { PKG_ROOT } from '../core/config.js'
import { inspectManagedDirectory, inspectManagedFileTree, ManagedPathError, resolveManagedDirectoryChain } from '../core/managed-path.js'

export const DEFAULT_PACKAGED_SKILL_NAMES = [
  'rsp',
  'rsp-shape',
  'rsp-implement',
  'rsp-doc',
  'rsp-verify',
  'rsp-review',
  'rsp-commit',
] as const

const RETIRED_PACKAGED_SKILL_NAMES = [
  'rsp-address-review',
  'rsp-codebase-audit',
  'rsp-structural-audit',
  'rsp-design',
  'rsp-diagnose',
  'rsp-manage',
  'rsp-release-docs',
  'rsp-resolve-findings',
  'rsp-tdd',
] as const

export interface SkillUpdateResult {
  installed: string[]
  removed: string[]
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
  retired: string[]
}

export interface InspectPackagedSkillsOptions {
  packageRoot?: string
  projectRoot?: string
}

interface PackagedSkillsUpdateOptions {
  packageRoot?: string
  projectRoot?: string
  dryRun?: boolean
  renamePath?: (source: string, destination: string) => Promise<void>
}

interface SkillTree {
  name: string
  root: string
  files: string[]
}

function unsupportedEntry(path: string, label: string): ManagedPathError {
  return new ManagedPathError(path, `unsupported entry in the ${label} tree: ${path}`)
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
    const inspection = await inspectManagedFileTree(root, `packaged Skill ${entry.name}`, { includeHidden: true })
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

function isCanonicalSourceProjection(sourceRoot: string, targetRoot: string): boolean {
  try {
    if (!lstatSync(targetRoot).isSymbolicLink())
      return false
    return realpathSync(targetRoot) === realpathSync(sourceRoot)
  }
  catch {
    return false
  }
}

async function treesEqual(source: SkillTree, targetRoot: string): Promise<boolean> {
  const target = await inspectManagedFileTree(targetRoot, `installed Skill ${source.name}`, { includeHidden: true })
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
          ? isCanonicalSourceProjection(skill.root, target) ? 'unchanged' : 'divergent'
          : await treesEqual(skill, target) ? 'unchanged' : 'divergent',
    })
  }
  const retired = RETIRED_PACKAGED_SKILL_NAMES.filter(name => inspectInventoryTarget(join(targetRoot, name)) !== 'missing')
  return {
    retired,
    package: { name: manifest.name, version: manifest.version },
    target: relative(projectRoot, targetRoot) || '.',
    skills,
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

/** Replace exact package-owned trees; failures keep completed changes for a retry. */
export async function updatePackagedSkills(options: PackagedSkillsUpdateOptions = {}): Promise<SkillUpdateResult> {
  const packageRoot = options.packageRoot ?? PKG_ROOT
  const projectRoot = options.projectRoot ?? process.cwd()
  const renamePath = options.renamePath ?? rename
  const packaged = await inspectPackagedSkills(packageRoot)
  const skills = DEFAULT_PACKAGED_SKILL_NAMES.map((name) => {
    const skill = packaged.find(candidate => candidate.name === name)
    if (!skill)
      throw new Error(`Packaged Skill missing: ${name}`)
    return skill
  }).sort((a, b) => a.name.localeCompare(b.name))
  const targetRoot = resolveManagedDirectoryChain(projectRoot, ['.agents', 'skills'], 'project Skills root')
  const result: SkillUpdateResult = { installed: [], removed: [], unchanged: [], replaced: [] }
  for (const skill of skills) {
    const target = join(targetRoot, skill.name)
    if (isCanonicalSourceProjection(skill.root, target))
      result.unchanged.push(skill.name)
    else if (inspectTarget(target, skill.name) === 'missing')
      result.installed.push(skill.name)
    else if (await treesEqual(skill, target))
      result.unchanged.push(skill.name)
    else
      result.replaced.push(skill.name)
  }
  for (const name of RETIRED_PACKAGED_SKILL_NAMES) {
    if (inspectTarget(join(targetRoot, name), name) !== 'missing')
      result.removed.push(name)
  }
  if (options.dryRun || result.installed.length + result.replaced.length + result.removed.length === 0)
    return result

  await mkdir(targetRoot, { recursive: true })
  resolveManagedDirectoryChain(projectRoot, ['.agents', 'skills'], 'project Skills root')
  const staging = await mkdtemp(join(targetRoot, '.rsp-skills-'))
  const completed: string[] = []
  let failure: Error | undefined
  try {
    for (const skill of skills) {
      if (!result.unchanged.includes(skill.name))
        await copySkillTree(skill, join(staging, skill.name))
    }
    for (const name of result.removed) {
      resolveManagedDirectoryChain(projectRoot, ['.agents', 'skills'], 'project Skills root')
      inspectTarget(join(targetRoot, name), name)
      await rm(join(targetRoot, name), { recursive: true, force: true })
      completed.push(`removed ${name}`)
    }
    for (const skill of skills) {
      if (result.unchanged.includes(skill.name))
        continue
      resolveManagedDirectoryChain(projectRoot, ['.agents', 'skills'], 'project Skills root')
      const target = join(targetRoot, skill.name)
      inspectTarget(target, skill.name)
      await rm(target, { recursive: true, force: true })
      await renamePath(join(staging, skill.name), target)
      completed.push(`installed ${skill.name}`)
    }
  }
  catch (error) {
    failure = new Error(`Skill update stopped; completed: ${completed.join(', ') || 'none'}. ${error instanceof Error ? error.message : String(error)}`, { cause: error })
  }
  try {
    await rm(staging, { recursive: true })
  }
  catch (error) {
    failure = new Error(`Temporary Skill content cleanup failed: ${staging}`, { cause: failure ?? error })
  }
  if (failure)
    throw failure
  return result
}
