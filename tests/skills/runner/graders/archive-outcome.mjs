import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export function isArchivePath(path, workRef) {
  return typeof workRef === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(workRef)
    && new RegExp(`^[.]rsp/archives/[0-9]{4}-[0-9]{2}-[0-9]{2}_${workRef}(?:-(?:[2-9]|[1-9][0-9]+))?[.]md$`, 'u').test(path)
}

export async function check({ case: spec }) {
  return { status: typeof spec.expected?.archived === 'boolean' && spec.hard.archive === 'price-update' ? 'passed' : 'failed' }
}

export async function readiness({ workspace, case: spec }) {
  const check = spawnSync(process.execPath, ['tools/check.mjs'], { cwd: workspace, encoding: 'utf8', timeout: 10000, maxBuffer: Infinity })
  const cli = spawnSync(process.execPath, ['.tooling/rsp/bin/rsp.mjs', 'check', 'price-update'], { cwd: workspace, encoding: 'utf8', timeout: 10000, maxBuffer: Infinity })
  const capsule = spawnSync(process.execPath, ['.tooling/rsp/bin/rsp.mjs', 'focus', 'price-update', '--capsule-file', '-'], { cwd: workspace, encoding: 'utf8', input: readFileSync(join(workspace, '.rsp/focus.d/price-update'), 'utf8'), timeout: 10000, maxBuffer: Infinity })
  return { status: check.status === (spec.expected.archived ? 0 : 1) && cli.status === 0 && capsule.status === 0 ? 'passed' : 'failed', scope: 'required-check-cli-and-focus' }
}

export async function verify({ case: spec, observation }) {
  const archives = observation.changedPaths.filter(path => path.startsWith('.rsp/archives/') && Object.hasOwn(observation.files, path))
  const open = Object.hasOwn(observation.files, '.rsp/changes/price-update.md')
  const focus = Object.hasOwn(observation.files, '.rsp/focus.d/price-update')
  const lifecycle = spec.expected.archived ? archives.length === 1 && !open && !focus : archives.length === 0 && open && focus
  return { status: lifecycle ? 'passed' : 'failed', evidence: { archives, open, focus, finalTextQuality: 'independent-judge-required' } }
}
