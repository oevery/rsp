import { createContext, SourceTextModule } from 'node:vm'

// Executed only in a bounded child process, without inherited credentials.
// No imports, host objects, generated functions or filesystem APIs are exposed
// to the module. This is a task probe, not a general untrusted-code sandbox.
async function main() {
  let input = ''
  for await (const chunk of process.stdin)
    input += chunk
  try {
    const { source, exportName } = JSON.parse(input)
    const context = createContext(Object.create(null), { codeGeneration: { strings: false, wasm: false } })
    const module = new SourceTextModule(source, { context })
    await module.link(() => {
      throw new Error('imports-not-supported')
    })
    await module.evaluate({ timeout: 100 })
    const value = module.namespace[exportName]
    process.stdout.write(JSON.stringify({ status: 'evaluated', value: typeof value === 'boolean' ? value : null }))
  }
  catch {
    process.stdout.write(JSON.stringify({ status: 'inconclusive', reason: 'module-evaluation-unavailable' }))
  }
}
void main()
