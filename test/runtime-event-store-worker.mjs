import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'

async function main() {
  const [command, configurationPath] = process.argv.slice(2)
  if (!command || !configurationPath)
    throw new Error('runtime worker requires a command and configuration path')

  const configuration = JSON.parse(await readFile(configurationPath, 'utf8'))
  if (configuration.readyPath)
    await writeFile(configuration.readyPath, `${process.pid}\n`)
  while (configuration.startPath && !existsSync(configuration.startPath))
    await new Promise(resolve => setTimeout(resolve, 5))

  const runtime = await import(configuration.runtimeEntry)
  const store = await runtime.openRuntimeEventStore({
    namespacePath: configuration.namespacePath,
    project: configuration.project,
  })

  try {
    let result
    if (command === 'append') {
      store.ensureRun(configuration.run)
      if (configuration.dispatch)
        store.registerDispatch(configuration.dispatch)
      result = store.appendEvent(configuration.event)
    }
    else if (command === 'checkpoint') {
      result = store.writeCheckpoint(configuration.checkpoint)
    }
    else if (command === 'receipt') {
      result = store.recordReceipt(configuration.receipt)
    }
    else if (command === 'crash-write') {
      store.ensureRun(configuration.run)
      result = store.appendEvent(configuration.event)
      process.stdout.write(`${JSON.stringify(result)}\n`)
      process.exit(0)
    }
    else {
      throw new Error(`unknown runtime worker command: ${command}`)
    }
    process.stdout.write(`${JSON.stringify(result)}\n`)
  }
  finally {
    store.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
