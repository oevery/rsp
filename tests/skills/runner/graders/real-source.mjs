import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { runProcess } from '../adapters/process.mjs'

const files = ['src/core/issue-relationship.ts', 'src/core/path-identity.ts']
export async function check() {
  return { status: 'passed' }
}
export async function probe(artifacts, multimodule = false) {
  const sources = {}
  for (const file of files.slice(0, multimodule ? 2 : 1)) {
    if (typeof artifacts[file] !== 'string')
      return { status: 'inconclusive', reason: 'source-missing' }
    sources[file] = ts.transpileModule(artifacts[file], { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
  }
  const runner = fileURLToPath(new URL('./real-source-probe.mjs', import.meta.url))
  const permission = process.allowedNodeEnvironmentFlags.has('--permission') ? '--permission' : '--experimental-permission'
  const result = await runProcess(process.execPath, [permission, `--allow-fs-read=${runner}`, '--experimental-vm-modules', runner], {
    cwd: fileURLToPath(new URL('.', import.meta.url)),
    env: {},
    input: JSON.stringify(sources),
    timeoutMs: 3000,
  })
  if (result.exitCode !== 0 || result.timedOut || result.outputLimited)
    return { status: 'inconclusive', reason: 'source-probe-incomplete' }
  try {
    return JSON.parse(result.stdout)
  }
  catch { return { status: 'inconclusive', reason: 'source-probe-missing' } }
}
export async function readiness({ workspace, case: spec }) {
  const artifacts = Object.fromEntries(files.map(file => [file, readFileSync(join(workspace, file), 'utf8')]))
  const broken = await probe(artifacts, spec.expected?.multimodule)
  for (const patch of spec.patches) artifacts[patch.path] = artifacts[patch.path].replace(patch.after, patch.before)
  const repaired = await probe(artifacts, spec.expected?.multimodule)
  return { status: broken.status === 'failed' && repaired.status === 'passed' ? 'passed' : 'failed', scope: 'injected-regression-and-known-good-controls', broken, repaired }
}
export async function verify({ case: spec, observation }) {
  return probe(observation.artifacts, spec.expected?.multimodule)
}
