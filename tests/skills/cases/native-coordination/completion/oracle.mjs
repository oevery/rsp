import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export async function check({ case: spec }) {
  return { status: spec.native?.minCompletedWorkers === 3 ? 'passed' : 'failed' }
}
export async function verify({ observation }) {
  const ready = observation.checks?.rspReady?.result
  const required = ['src/pricing.mjs', 'src/checkout.mjs', 'tools/check.mjs']
  if (required.some(path => typeof observation.artifacts?.[path] !== 'string'))
    return { status: 'inconclusive', evidence: { missingArtifacts: true } }
  // Execute retained task artifacts without credentials or host filesystem access.
  // Node permission scopes must use the physical path on symlinked temp roots.
  const dir = realpathSync(mkdtempSync(join(tmpdir(), 'rsp-checkout-oracle-')))
  try {
    mkdirSync(join(dir, 'src'))
    mkdirSync(join(dir, 'tools'))
    for (const path of required) writeFileSync(join(dir, path), observation.artifacts[path])
    const result = spawnSync(process.execPath, ['--permission', `--allow-fs-read=${dir}`, join(dir, 'tools/check.mjs')], { cwd: dir, env: {}, encoding: 'utf8', timeout: 5000, maxBuffer: 65536 })
    return { status: result.status === 0 && ready?.ok && ready.readiness.archiveReady === 'yes' ? 'passed' : 'failed', evidence: { contractCheckExit: result.status, checkerStderr: result.stderr?.slice(0, 4096) ?? '', executionError: result.error?.code ?? null, ready } }
  }
  finally { rmSync(dir, { recursive: true, force: true }) }
}
