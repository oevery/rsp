import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { hash } from './files.mjs'

export function readReleaseSuite(root) {
  const path = join(root, 'release', 'suites', 'required-cases.json')
  if (!existsSync(path))
    return null
  const source = readFileSync(path, 'utf8')
  const suite = JSON.parse(source)
  if (suite.schema !== 'rsp-release-suite-v1' || !Array.isArray(suite.publicCases) || !suite.publicCases.length || new Set(suite.publicCases).size !== suite.publicCases.length || !Array.isArray(suite.holdoutNegativeSkills))
    throw new Error('Invalid release scenario suite')
  return { ...suite, hash: hash(source) }
}
