import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export async function check() {
  return { status: 'passed' }
}
export async function readiness({ workspace }) {
  const pkg = JSON.parse(readFileSync(join(workspace, 'package.json'), 'utf8'))
  const version = execFileSync(process.execPath, ['dist/cli.mjs', '--version'], { cwd: workspace, encoding: 'utf8', timeout: 10000 }).trim()
  const help = execFileSync(process.execPath, ['dist/cli.mjs', '--help'], { cwd: workspace, encoding: 'utf8', timeout: 10000 })
  return { status: version.includes(pkg.version) && help.length > 0 ? 'passed' : 'failed', scope: 'fixed-source-build-and-cli', version }
}
export async function verify({ observation }) {
  try {
    const actual = JSON.parse(observation.artifacts['contract.json'])
    const pkg = JSON.parse(observation.artifacts['package.json'])
    return { status: actual.name === pkg.name && actual.version === pkg.version && actual.versionMatchesPackage === true ? 'passed' : 'failed' }
  }
  catch { return { status: 'failed' } }
}
