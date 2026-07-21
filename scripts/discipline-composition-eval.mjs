import { lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { basename, join, relative, resolve, sep } from 'node:path'
import { parse as parseYaml } from 'yaml'

const CASE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function assertStringArray(value, label) {
  if (!Array.isArray(value) || value.length === 0 || value.some(item => typeof item !== 'string' || item.length === 0))
    throw new Error(`${label} must be a non-empty string array`)
}

function assertSafeFile(root, path, label) {
  const canonicalRoot = realpathSync(root)
  const stats = lstatSync(path)
  if (stats.isSymbolicLink() || !stats.isFile())
    throw new Error(`${label} must be a regular non-symlink file`)
  const canonicalPath = realpathSync(path)
  if (canonicalPath !== canonicalRoot && !canonicalPath.startsWith(`${canonicalRoot}${sep}`))
    throw new Error(`${label} escapes its allowed root`)
}

export function loadDisciplineCompositionCases(root) {
  const fixturesRoot = join(root, 'test', 'discipline-composition', 'fixtures')
  return readdirSync(fixturesRoot)
    .filter(name => name.endsWith('.yaml'))
    .sort()
    .map((name) => {
      const path = join(fixturesRoot, name)
      assertSafeFile(fixturesRoot, path, `fixture ${name}`)
      const item = parseYaml(readFileSync(path, 'utf8'))
      if (!item || typeof item !== 'object')
        throw new Error(`fixture ${name} must contain an object`)
      if (!CASE_ID.test(item.id) || item.id !== basename(name, '.yaml'))
        throw new Error(`fixture ${name} has an invalid or mismatched id`)
      for (const field of ['evidence', 'sources', 'required_contract', 'prohibited_actions'])
        assertStringArray(item[field], `${item.id}.${field}`)
      if (typeof item.expected?.next_action !== 'string' || !item.expected.next_action)
        throw new Error(`${item.id}.expected.next_action must be a non-empty string`)
      if (typeof item.expected?.returned_owner !== 'string' || !item.expected.returned_owner)
        throw new Error(`${item.id}.expected.returned_owner must be a non-empty string`)
      return item
    })
}

export function evaluateDisciplineComposition(root) {
  const skillsRoot = join(root, 'skills')
  return loadDisciplineCompositionCases(root).map((item) => {
    const contract = item.sources.map((source) => {
      const path = resolve(root, source)
      if (!path.startsWith(`${skillsRoot}${sep}`))
        throw new Error(`${item.id}.sources must stay inside skills/`)
      assertSafeFile(skillsRoot, path, `${item.id} source ${relative(root, path)}`)
      return readFileSync(path, 'utf8')
    }).join('\n')
    const missing = item.required_contract.filter(fragment => !contract.includes(fragment))
    return { id: item.id, missing, passed: missing.length === 0 }
  })
}
