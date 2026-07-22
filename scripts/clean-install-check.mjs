#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const EXPECTED_SKILLS = [
  'rsp',
  'rsp-address-review',
  'rsp-design',
  'rsp-diagnose',
  'rsp-implement',
  'rsp-review',
  'rsp-shape',
  'rsp-tdd',
]
const EXPECTED_DESIGN_REFERENCES = [
  'domain-modeling.md',
  'module-seams.md',
  'reversible-exploration.md',
]
const FORBIDDEN_PACKAGE_ROOTS = ['.agents', '.cache', '.rsp', 'research', 'scripts']
const PORTABLE_FRONTMATTER_KEYS = new Set(['description', 'license', 'metadata', 'name'])

function fail(message) {
  throw new Error(message)
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim()
}

function walkNoSymlinks(root) {
  const files = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name)
    const stats = lstatSync(path)
    if (stats.isSymbolicLink())
      fail(`Installed package contains symlink: ${relative(root, path)}`)
    if (stats.isDirectory())
      files.push(...walkNoSymlinks(path))
    else
      files.push(path)
  }
  return files
}

function validateSkill(skillRoot, name) {
  const skillPath = join(skillRoot, name)
  const stats = lstatSync(skillPath)
  if (!stats.isDirectory() || stats.isSymbolicLink())
    fail(`Skill must be a real directory: ${name}`)

  const skillFile = join(skillPath, 'SKILL.md')
  const skillStats = lstatSync(skillFile)
  if (!skillStats.isFile() || skillStats.isSymbolicLink())
    fail(`Skill entrypoint must be a regular file: ${name}/SKILL.md`)

  const content = readFileSync(skillFile, 'utf8')
  const match = content.match(/^---\n([\s\S]*?)\n---\n[\s\S]+$/u)
  if (!match)
    fail(`Skill entrypoint has invalid frontmatter: ${name}/SKILL.md`)
  const frontmatter = parseYaml(match[1])
  if (!frontmatter || typeof frontmatter !== 'object')
    fail(`Skill frontmatter must be a mapping: ${name}/SKILL.md`)
  if (frontmatter.name !== name)
    fail(`Skill name mismatch: expected ${name}, received ${String(frontmatter.name)}`)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(frontmatter.name) || frontmatter.name.length > 64)
    fail(`Skill name is not portable: ${name}/SKILL.md`)
  if (typeof frontmatter.description !== 'string' || frontmatter.description.trim() === '')
    fail(`Skill description is missing: ${name}/SKILL.md`)
  if (frontmatter.description.length > 1024)
    fail(`Skill description is too long: ${name}/SKILL.md`)
  if (!Object.keys(frontmatter).every(key => PORTABLE_FRONTMATTER_KEYS.has(key)))
    fail(`Skill frontmatter contains unsupported keys: ${name}/SKILL.md`)
  if (frontmatter.license !== undefined && typeof frontmatter.license !== 'string')
    fail(`Skill license must be a string: ${name}/SKILL.md`)
  if (frontmatter.metadata !== undefined
    && (typeof frontmatter.metadata !== 'object'
      || frontmatter.metadata === null
      || !Object.values(frontmatter.metadata).every(value => typeof value === 'string'))) {
    fail(`Skill metadata must contain only string values: ${name}/SKILL.md`)
  }
}

function assertPackageInventory(files) {
  for (const path of files) {
    const root = path.split('/', 1)[0]
    if (FORBIDDEN_PACKAGE_ROOTS.includes(root))
      fail(`Forbidden package root included: ${path}`)
  }
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const temporaryParent = resolve(process.env.RSP_PACKAGE_CHECK_TMP_ROOT || tmpdir())
  mkdirSync(temporaryParent, { recursive: true })
  const workspace = mkdtempSync(join(temporaryParent, 'rsp-clean-install-'))
  let report

  try {
    const packRoot = join(workspace, 'pack')
    const projectRoot = join(workspace, 'project')
    mkdirSync(packRoot)
    mkdirSync(projectRoot)
    writeFileSync(join(projectRoot, 'package.json'), '{"name":"rsp-clean-install-smoke","private":true}\n')

    const packOutput = run('npm', [
      'pack',
      '--ignore-scripts',
      '--json',
      '--pack-destination',
      packRoot,
    ], { cwd: root })
    const packResults = JSON.parse(packOutput)
    if (!Array.isArray(packResults) || packResults.length !== 1)
      fail('npm pack did not produce exactly one tarball')
    const packResult = packResults[0]
    const tarball = join(packRoot, basename(packResult.filename))
    const packageFiles = packResult.files.map(file => file.path).sort()
    assertPackageInventory(packageFiles)

    run('npm', [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--no-save',
      '--package-lock=false',
      tarball,
    ], { cwd: projectRoot })
    const help = run('npx', ['--no-install', 'rsp', '--help'], { cwd: projectRoot })
    if (!help.includes('rsp'))
      fail('Installed rsp executable did not return its help output')

    const installedRoot = join(projectRoot, 'node_modules', '@oevery', 'rsp')
    const installedManifest = JSON.parse(readFileSync(join(installedRoot, 'package.json'), 'utf8'))
    if (installedManifest.name !== packResult.name || installedManifest.version !== packResult.version)
      fail(`Installed package identity mismatch: ${installedManifest.name}@${installedManifest.version}`)
    const skillRoot = join(installedRoot, 'skills')
    const installedSkills = readdirSync(skillRoot, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()
    if (JSON.stringify(installedSkills) !== JSON.stringify(EXPECTED_SKILLS))
      fail(`Installed Skill inventory mismatch: ${installedSkills.join(', ')}`)
    for (const skill of installedSkills)
      validateSkill(skillRoot, skill)

    const designReferences = readdirSync(join(skillRoot, 'rsp-design', 'references')).sort()
    if (JSON.stringify(designReferences) !== JSON.stringify(EXPECTED_DESIGN_REFERENCES))
      fail(`rsp-design reference inventory mismatch: ${designReferences.join(', ')}`)

    const installedFiles = walkNoSymlinks(installedRoot)
      .map(path => relative(installedRoot, path).split(sep).join('/'))
      .sort()
    report = {
      inventory: {
        files: packageFiles,
        installedFiles,
        skills: installedSkills,
      },
      package: `${packResult.name}@${packResult.version}`,
      rspDesignReferences: designReferences,
      tarballSha256: createHash('sha256').update(readFileSync(tarball)).digest('hex'),
    }
  }
  finally {
    rmSync(workspace, { force: true, recursive: true })
  }

  if (process.argv.includes('--json'))
    process.stdout.write(`${JSON.stringify(report)}\n`)
  else
    process.stdout.write(`Clean install valid: ${report.package}\nSHA-256: ${report.tarballSha256}\nSkills: ${report.inventory.skills.join(', ')}\nFiles: ${report.inventory.files.join(', ')}\n`)
}

try {
  main()
}
catch (error) {
  process.stderr.write(`Clean install invalid: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
}
