#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process'
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
  'rsp-manage',
  'rsp-release-docs',
  'rsp-review',
  'rsp-shape',
  'rsp-tdd',
]
const EXPECTED_DESIGN_REFERENCES = [
  'domain-modeling.md',
  'module-seams.md',
  'reversible-exploration.md',
]
const EXPECTED_CORE_REFERENCES = [
  'conflict-handling.md',
  'durable-review.md',
  'groups-dependencies.md',
  'setup-repair.md',
]
const EXPECTED_RELEASE_REFERENCES = [
  'convention-discovery.md',
  'evidence-and-surfaces.md',
  'output-contracts.md',
  'publication-lifecycle.md',
]
const FORBIDDEN_PACKAGE_ROOTS = ['.agents', '.cache', '.codex', '.rsp', 'research', 'scripts']
const PORTABLE_FRONTMATTER_KEYS = new Set(['description', 'license', 'metadata', 'name'])

function argument(name) {
  const index = process.argv.indexOf(name)
  return index < 0 ? undefined : process.argv[index + 1]
}

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

function runResult(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  })
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
  const npmCli = argument('--npm-cli')
  const runNpm = (args, options = {}) => npmCli
    ? run(process.execPath, [resolve(npmCli), ...args], options)
    : run('npm', args, options)
  const temporaryParent = resolve(process.env.RSP_PACKAGE_CHECK_TMP_ROOT || tmpdir())
  mkdirSync(temporaryParent, { recursive: true })
  const workspace = mkdtempSync(join(temporaryParent, 'rsp-clean-install-'))
  let report

  try {
    const packRoot = join(workspace, 'pack')
    const projectRoot = join(workspace, 'project')
    const execRoot = join(workspace, 'exec-project')
    mkdirSync(packRoot)
    mkdirSync(projectRoot)
    mkdirSync(execRoot)
    writeFileSync(join(projectRoot, 'package.json'), '{"name":"rsp-clean-install-smoke","private":true}\n')
    writeFileSync(join(execRoot, 'package.json'), '{"name":"rsp-npm-exec-smoke","private":true}\n')

    const packOutput = runNpm([
      'pack',
      '--ignore-scripts',
      '--foreground-scripts=false',
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

    runNpm([
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--no-save',
      '--package-lock=false',
      tarball,
    ], { cwd: projectRoot })
    const installedRoot = join(projectRoot, 'node_modules', '@oevery', 'rsp')
    const installedBin = join(installedRoot, 'bin', 'rsp.mjs')
    const help = run(process.execPath, [installedBin, '--help'], { cwd: projectRoot })
    if (!help.includes('rsp'))
      fail('Installed rsp executable did not return its help output')
    const version = run(process.execPath, [installedBin, '--version'], { cwd: projectRoot })
    if (version !== packResult.version)
      fail(`Installed rsp version mismatch: expected ${packResult.version}, received ${version}`)
    const npmExecVersion = runNpm(['exec', '--yes', '--package', tarball, '--', 'rsp', '--version'], { cwd: execRoot })
    if (npmExecVersion !== packResult.version)
      fail(`Local tarball npm exec version mismatch: expected ${packResult.version}, received ${npmExecVersion}`)
    const init = runResult(process.execPath, [installedBin, 'init'], { cwd: projectRoot })
    if (init.status !== 0)
      fail(`Installed rsp init failed: ${init.stderr.trim()}`)
    const skillInstall = runResult(process.execPath, [installedBin, 'skills', 'install'], { cwd: projectRoot })
    if (skillInstall.status !== 0)
      fail(`Installed rsp skills install failed: ${skillInstall.stderr.trim()}`)
    const skillInstallRepeat = runResult(process.execPath, [installedBin, 'skills', 'install'], { cwd: projectRoot })
    if (skillInstallRepeat.status !== 0 || !skillInstallRepeat.stdout.includes('unchanged:'))
      fail('Installed rsp skills install was not idempotent')
    const status = runResult(process.execPath, [installedBin, 'status', '--json'], { cwd: projectRoot })
    if (status.status !== 0 || JSON.parse(status.stdout).command !== 'status')
      fail('Installed rsp executable did not return normal status JSON')
    const nonTtyUi = runResult(process.execPath, [installedBin, 'ui'], { cwd: projectRoot, env: { ...process.env, CI: 'false', TERM: 'xterm-256color' } })
    const invalidLocale = runResult(process.execPath, [installedBin, 'ui', '--lang', 'fr'], { cwd: projectRoot, env: { ...process.env, CI: 'false', TERM: 'xterm-256color' } })
    const expectedNonTtyError = '  Error: rsp ui requires an interactive terminal; use rsp status or rsp status --json instead\n'
    const expectedLocaleError = '  Error: --lang must be auto, en, or zh-CN\n'
    if (nonTtyUi.status !== 1 || nonTtyUi.stdout !== '' || nonTtyUi.stderr !== expectedNonTtyError)
      fail('Installed rsp ui non-TTY error boundary was not concise')
    if (invalidLocale.status !== 1 || invalidLocale.stdout !== '' || invalidLocale.stderr !== expectedLocaleError)
      fail('Installed rsp ui locale error boundary was not concise')

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
    const projectSkills = readdirSync(join(projectRoot, '.agents', 'skills'), { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()
    if (JSON.stringify(projectSkills) !== JSON.stringify(EXPECTED_SKILLS))
      fail(`Installed project Skill inventory mismatch: ${projectSkills.join(', ')}`)

    const designReferences = readdirSync(join(skillRoot, 'rsp-design', 'references')).sort()
    if (JSON.stringify(designReferences) !== JSON.stringify(EXPECTED_DESIGN_REFERENCES))
      fail(`rsp-design reference inventory mismatch: ${designReferences.join(', ')}`)

    const coreReferences = readdirSync(join(skillRoot, 'rsp', 'references')).sort()
    if (JSON.stringify(coreReferences) !== JSON.stringify(EXPECTED_CORE_REFERENCES))
      fail(`rsp core reference inventory mismatch: ${coreReferences.join(', ')}`)

    const releaseReferences = readdirSync(join(skillRoot, 'rsp-release-docs', 'references')).sort()
    if (JSON.stringify(releaseReferences) !== JSON.stringify(EXPECTED_RELEASE_REFERENCES))
      fail(`rsp-release-docs reference inventory mismatch: ${releaseReferences.join(', ')}`)

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
      runtime: { node: process.version, npm: runNpm(['--version']) },
      entrySmoke: {
        help: true,
        version,
        npmExecVersion,
        init: true,
        skillsInstall: true,
        skillsInstallIdempotent: true,
        statusJson: true,
        nonTtyUi: { exitCode: nonTtyUi.status, stderr: nonTtyUi.stderr.trim() },
        invalidLocale: { exitCode: invalidLocale.status, stderr: invalidLocale.stderr.trim() },
      },
      prepareReleaseNotesReferences: releaseReferences,
      rspCoreReferences: coreReferences,
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
