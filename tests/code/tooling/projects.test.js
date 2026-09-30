import { lstatSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { loadCase } from '../../skills/runner/core/cases.mjs'
import { prepareWorkspace, runCase } from '../../skills/runner/core/execute.mjs'
import { hash } from '../../skills/runner/core/files.mjs'

it('isolates real project dependencies and restores dirty recovery state in fresh workspaces', async () => {
  const root = process.cwd()
  const entry = loadCase(root, 'real-multimodule-recovery')
  const directory = mkdtempSync(join(tmpdir(), 'rsp-project-check-'))
  const original = readFileSync('node_modules/picocolors/package.json')
  let workspace
  try {
    workspace = prepareWorkspace(entry, root)
    const physical = realpathSync(workspace)
    const visit = (path) => {
      for (const name of readdirSync(path)) {
        const child = join(path, name)
        const stat = lstatSync(child)
        if (stat.isSymbolicLink())
          expect(realpathSync(child).startsWith(`${physical}/`)).toBe(true)
        else if (stat.isDirectory())
          visit(child)
      }
    }
    visit(join(workspace, 'node_modules'))
    writeFileSync(join(workspace, 'node_modules/picocolors/package.json'), 'isolated edit')
    expect(readFileSync('node_modules/picocolors/package.json')).toEqual(original)
    const adapter = repairAll => ({
      id: 'local-test',
      settings: { provider: 'local-test', model: 'none', effort: 'none' },
      async run({ workspace }) {
        for (const patch of entry.manifest.patches.slice(0, repairAll ? 2 : 1)) {
          const path = join(workspace, patch.path)
          writeFileSync(path, readFileSync(path, 'utf8').replace(patch.after, patch.before))
        }
        return { exitCode: 0, stdout: JSON.stringify({ type: 'turn.completed' }), stderr: '', finalOutput: 'Local oracle control; no model execution.' }
      },
    })
    const partial = await runCase(entry, root, { adapter: adapter(false), outputRoot: directory })
    expect(partial.verdict.status, JSON.stringify({ verdict: partial.verdict, task: partial.task, hard: partial.hard })).toBe('failed')
    const complete = await runCase(entry, root, { adapter: adapter(true), outputRoot: directory })
    expect(complete.verdict.status).toBe('passed')
    expect(complete.identity.dependencies.lockHash).toBe(hash(readFileSync('pnpm-lock.yaml')))
    expect(complete.observation.indexHash).toBe(complete.observation.baselineIndexHash)
    expect(complete.observation.changedPaths).toEqual(['src/core/issue-relationship.ts', 'src/core/path-identity.ts'])
    expect(complete.context.workspace).not.toBe(partial.context.workspace)
  }
  finally {
    if (workspace)
      rmSync(workspace, { recursive: true, force: true, maxRetries: 3 })
    rmSync(directory, { recursive: true, force: true })
  }
}, 60000)
