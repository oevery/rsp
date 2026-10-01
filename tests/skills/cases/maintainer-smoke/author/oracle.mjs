import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export { check, verify } from '../../document-quality/write/oracle.mjs'

export async function readiness({ workspace, root }) {
  const provenance = JSON.parse(readFileSync(join(workspace, 'tool-source.json'), 'utf8'))
  const snapshot = join(workspace, '.tooling/rsp/scripts/skill-package-check.mjs')
  const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex')
  const sourceMatches = sha(snapshot) === provenance.sha256
    && sha(join(root, provenance.source)) === provenance.sha256
  const run = (script, args) => {
    const result = spawnSync(join(workspace, '.tooling/node'), [script, ...args], { cwd: workspace, encoding: 'utf8', timeout: 10000 })
    return { exitCode: result.status, output: JSON.parse(result.stdout) }
  }
  // Match the documented workspace-relative invocation, including on hosts
  // where the temporary root has a filesystem alias such as /var.
  const packageCheck = run('.tooling/rsp/scripts/skill-package-check.mjs', ['skills'])
  const cli = '.tooling/rsp/dist/cli.mjs'
  const check = run(cli, ['check', '--focused', '--json'])
  const ready = run(cli, ['ready', 'clarify-evidence-note', '--json'])
  const planReady = ready.exitCode === 0 && ready.output.ok
    && ready.output.readiness.activeBlockers === false
    && ready.output.readiness.missingScenarios === false
  return {
    status: sourceMatches && packageCheck.exitCode === 0 && packageCheck.output.status === 'passed'
      && check.exitCode === 0 && check.output.ok && planReady
      ? 'passed'
      : 'failed',
    sourceMatches,
    checkerSha256: provenance.sha256,
    packageCheck: packageCheck.output.status,
    rspCheck: check.output.ok,
    implementationPlanReady: planReady,
    archiveReady: ready.output.readiness.archiveReady,
    behavioralAcceptance: 'not-run',
  }
}
