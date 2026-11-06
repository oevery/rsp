import { spawn } from 'node:child_process'
import { rename, rm, writeFile } from 'node:fs/promises'

const controller = new AbortController()
const stop = () => controller.abort()
process.once('SIGINT', stop)
process.once('SIGTERM', stop)
const manifest = 'dist/viewer-build.json'
const pending = `${manifest}.tmp`

async function runTool(args) {
  controller.signal.throwIfAborted()
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: 'inherit', signal: controller.signal })
    child.once('error', reject)
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Build tool exited with ${code}`)))
  })
}

try {
  await rm(manifest, { force: true })
  const { readBuildSnapshot } = await import('../src/viewer/build-assets.mjs')
  const { buildViewer } = await import('./build-viewer.mjs')
  await runTool(['node_modules/tsup/dist/cli-default.js'])
  const assets = await buildViewer(runTool)
  const { identity } = await readBuildSnapshot(process.cwd(), assets)
  controller.signal.throwIfAborted()
  await writeFile(pending, JSON.stringify({ identity, assets }))
  controller.signal.throwIfAborted()
  await rename(pending, manifest)
  console.log('RSP build complete')
}
catch (error) {
  await rm(manifest, { force: true })
  await rm(pending, { force: true })
  console.error(`RSP build failed: ${error.message}`)
  process.exitCode = 1
}
finally {
  process.removeListener('SIGINT', stop)
  process.removeListener('SIGTERM', stop)
}
