import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

export function observeProjectChecks(root, workspace, spec) {
  if (!spec.project_check)
    return {}
  const result = spawnSync(process.execPath, [join(root, 'dist', 'cli.mjs'), 'ready', spec.project_check, '--json'], {
    cwd: workspace,
    timeout: 10000,
    maxBuffer: Infinity,
    encoding: 'utf8',
    env: { PATH: process.env.PATH, HOME: workspace },
  })
  try {
    return { rspReady: { exitCode: result.status, result: JSON.parse(result.stdout) } }
  }
  catch {
    return { rspReady: { exitCode: result.status, result: null } }
  }
}
