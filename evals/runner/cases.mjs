import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { hash, treeFiles } from './files.mjs'

const CASE_FILE = 'case.yaml'

function casesRoot(root) {
  return join(root, 'evals', 'cases')
}

function walk(directory, root, found = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name)
    if (entry.isDirectory())
      walk(path, root, found)
    else if (entry.name === CASE_FILE)
      found.push({ directory, manifestPath: path, id: relative(root, directory).split('/').join('/') })
  }
  return found
}

function assertSafePath(root, candidate, label) {
  const resolvedRoot = resolve(root)
  const resolved = resolve(candidate)
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}/`))
    throw new Error(`${label} must stay inside ${resolvedRoot}`)
}

export function discoverCases(root = process.cwd()) {
  const rootPath = casesRoot(root)
  if (!existsSync(rootPath))
    return []
  const entries = walk(rootPath, rootPath).map((entry) => {
    const manifest = parseCase(entry.manifestPath, entry.directory)
    return { ...entry, id: manifest.id, manifest, visibility: 'public', inputHash: hash(treeFiles(entry.directory, { rejectLinks: true })) }
  })
  if (new Set(entries.map(entry => entry.id)).size !== entries.length)
    throw new Error('Duplicate evaluation case IDs')
  return entries
}

export function loadCase(root, id) {
  const match = discoverCases(root).find(entry => entry.id === id)
  if (!match)
    throw new Error(`Unknown evaluation case: ${id}`)
  return match
}

export function parseCase(manifestPath, directory) {
  if (lstatSync(manifestPath).isSymbolicLink())
    throw new Error(`Case manifest must not be a symlink: ${manifestPath}`)
  const value = parseYaml(readFileSync(manifestPath, 'utf8'))
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`Case manifest must be a mapping: ${manifestPath}`)
  if (typeof value.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/u.test(value.id))
    throw new Error(`Case id is required: ${manifestPath}`)
  if (!['trigger', 'behavior', 'workflow', 'regression'].includes(value.kind))
    throw new Error(`Case kind is invalid: ${value.id}`)
  if (typeof value.skill !== 'string' || !value.skill.trim())
    throw new Error(`Case skill is required: ${value.id}`)
  if (typeof value.prompt !== 'string' || !value.prompt.trim())
    throw new Error(`Case prompt is required: ${value.id}`)
  const fixture = value.fixture ?? null
  if (fixture !== null) {
    if (typeof fixture !== 'string' || fixture.startsWith('/'))
      throw new Error(`Case fixture must be a relative path: ${value.id}`)
    const fixturePath = resolve(directory, fixture)
    assertSafePath(directory, fixturePath, 'Case fixture')
    if (!existsSync(fixturePath) || !lstatSync(fixturePath).isDirectory())
      throw new Error(`Case fixture directory is missing: ${value.id}`)
  }
  const oracle = value.oracle ?? 'oracle.mjs'
  if (typeof oracle !== 'string' || oracle.startsWith('/'))
    throw new Error(`Case oracle must be a relative path: ${value.id}`)
  const oraclePath = resolve(directory, oracle)
  assertSafePath(directory, oraclePath, 'Case oracle')
  if (!['read-only', 'project-outcome'].includes(oracle) && (!existsSync(oraclePath) || !lstatSync(oraclePath).isFile()))
    throw new Error(`Case oracle is missing: ${value.id}`)
  const hard = value.hard
  if (value.activation !== undefined && !['required', 'forbidden', 'optional'].includes(value.activation))
    throw new Error('Invalid activation expectation')
  if (value.project_check !== undefined && !/^[a-z0-9][a-z0-9-]*$/u.test(value.project_check))
    throw new Error('Invalid project check WorkRef')
  if (value.tooling !== undefined && value.tooling !== 'rsp-cli')
    throw new Error('Unsupported fixture tooling')
  for (const [path, content] of Object.entries(value.working_tree ?? {})) {
    if (!path || path.startsWith('/') || path.split('/').some(segment => ['..', '.git', '.agents', '.codex', '.tooling'].includes(segment)) || typeof content !== 'string')
      throw new Error('Invalid working-tree fixture')
  }
  if (value.staged_paths !== undefined && (!Array.isArray(value.staged_paths) || value.staged_paths.some(path => !(path in (value.working_tree ?? {})))))
    throw new Error('Staged fixture paths must be declared working-tree changes')
  if (!hard || !Array.isArray(hard.allowed_paths) || hard.allowed_paths.some(path => typeof path !== 'string' || path.startsWith('/') || path.split('/').includes('..')) || !Array.isArray(hard.forbidden_actions) || hard.forbidden_actions.some(action => !['push', 'publish'].includes(action)))
    throw new Error('Case requires explicit hard boundaries')
  if (!Array.isArray(value.rubric) || !value.rubric.length || value.rubric.some(item => !item.name || !item.description) || new Set(value.rubric.map(item => item.name)).size !== value.rubric.length)
    throw new Error('Case requires a nonempty, unique semantic rubric')
  treeFiles(directory, { rejectLinks: true })
  return { ...value, fixture, oracle }
}
