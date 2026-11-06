import { spawn } from 'node:child_process'
import { watch } from 'node:fs'
import { rm } from 'node:fs/promises'

let pending = true
let running = false
let stopping = false
let child
let timer
const watchers = []

async function rebuild() {
  if (running || stopping)
    return
  running = true
  try {
    while (pending) {
      if (stopping)
        break
      pending = false
      // Invalidate before loading the child, including an unparseable build entry.
      await rm('dist/viewer-build.json', { force: true })
      if (stopping)
        break
      // A fresh process also reloads edited build configuration and scripts.
      await new Promise((resolve) => {
        child = spawn(process.execPath, ['scripts/build.mjs'], { stdio: 'inherit' })
        child.once('error', (error) => {
          console.error(`RSP build failed: ${error.message}`)
          resolve()
        })
        child.once('exit', resolve)
      })
      child = undefined
    }
  }
  catch (error) {
    console.error(`RSP build failed: ${error.message}`)
    process.exitCode = 1
    stop()
  }
  finally {
    running = false
  }
}

function schedule() {
  pending = true
  clearTimeout(timer)
  timer = setTimeout(() => void rebuild(), 75)
}

function stop() {
  stopping = true
  clearTimeout(timer)
  watchers.forEach(watcher => watcher.close())
  child?.kill('SIGTERM')
}

try {
  for (const directory of ['src', 'scripts'])
    watchers.push(watch(directory, { recursive: true }, schedule))
  watchers.push(watch('.', (_event, name) => {
    if (name && ['package.json', 'pnpm-lock.yaml', 'tsconfig.json', 'tsup.config.ts'].includes(name))
      schedule()
  }))
  watchers.push(watch('docs/site/public', (_event, name) => {
    if (name === 'rsp-icon.svg')
      schedule()
  }))
  watchers.forEach(watcher => watcher.on('error', (error) => {
    console.error(error.message)
    process.exitCode = 1
    stop()
  }))
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)
  await rebuild()
}
catch (error) {
  console.error(error.message)
  process.exitCode = 1
  stop()
}
