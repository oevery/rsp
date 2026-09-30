import { fileURLToPath } from 'node:url'
import { runProcess } from '../adapters/process.mjs'

export async function observeBooleanExport(source, exportName) {
  if (typeof source !== 'string')
    return { status: 'inconclusive', reason: 'module-source-missing' }
  const probe = fileURLToPath(new URL('./module-probe.mjs', import.meta.url))
  const permission = process.allowedNodeEnvironmentFlags.has('--permission') ? '--permission' : '--experimental-permission'
  const result = await runProcess(process.execPath, [permission, `--allow-fs-read=${probe}`, '--experimental-vm-modules', '--max-old-space-size=64', probe], {
    cwd: fileURLToPath(new URL('.', import.meta.url)),
    env: {},
    input: JSON.stringify({ source, exportName }),
    timeoutMs: 1000,
  })
  if (result.exitCode !== 0 || result.timedOut || result.outputLimited)
    return { status: 'inconclusive', reason: 'module-probe-incomplete' }
  try {
    return JSON.parse(result.stdout)
  }
  catch {
    return { status: 'inconclusive', reason: 'module-probe-evidence-invalid' }
  }
}
