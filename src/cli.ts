import type { CloseFeatureArgs, NewFeatureArgs } from './types.js'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineCommand, runMain } from 'citty'
import { buildArchiveIndex } from './commands/archive-index.js'
import { runCheck } from './commands/check.js'
import { closeFeature } from './commands/close-feature.js'
import { showDependencies } from './commands/deps.js'
import { initProject } from './commands/init.js'
import { newFeature } from './commands/new-feature.js'
import { showStatus } from './commands/status.js'
import { getVersion } from './core/config.js'

/** CLI command: scaffold .rsp/ directory and AGENTS.md */
const initCommand = defineCommand({
  meta: {
    name: 'init',
    description: 'Scaffold .rsp/ + AGENTS.md in current project',
  },
  async run() {
    await initProject()
  },
})

/** CLI command: create a new feature file */
const newFeatureCommand = defineCommand({
  meta: {
    name: 'new',
    description: 'Create .rsp/features/<name>.md [summary]',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Feature name',
      required: true,
    },
  },
  async run({ args }: { args: NewFeatureArgs }) {
    const summary = Array.isArray(args._) && args._.length > 1 ? args._.slice(1).join(' ') : ''
    await newFeature(args.name, summary)
  },
})

/** CLI command: archive a completed feature */
const closeFeatureCommand = defineCommand({
  meta: {
    name: 'close',
    description: 'Archive to .rsp/archive/',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Feature name',
      required: true,
    },
  },
  async run({ args }: { args: CloseFeatureArgs }) {
    await closeFeature(args.name)
  },
})

/** CLI command: show project status dashboard */
const statusCommand = defineCommand({
  meta: {
    name: 'status',
    description: 'Show project status summary',
  },
  async run() {
    await showStatus()
  },
})

/** CLI command: validate all feature files */
const checkCommand = defineCommand({
  meta: {
    name: 'check',
    description: 'Validate features (frontmatter, sections, deps, deltas, scenarios)',
  },
  async run() {
    const errors = await runCheck()
    if (errors > 0)
      process.exit(1)
  },
})

/** CLI command: show feature dependency graph */
const depsCommand = defineCommand({
  meta: {
    name: 'deps',
    description: 'Show dependency summary (--mermaid for graph)',
  },
  args: {
    mermaid: {
      type: 'boolean',
      description: 'Output as Mermaid.js graph',
      default: false,
    },
  },
  async run({ args }) {
    await showDependencies(Boolean(args.mermaid))
  },
})

/** CLI command: regenerate archive INDEX.md */
const archiveIndexCommand = defineCommand({
  meta: {
    name: 'archive-index',
    description: 'Regenerate archive INDEX.md',
  },
  async run() {
    await buildArchiveIndex()
  },
})

/**
 * Build and run the RSP CLI.
 * Called automatically when this module is the entry point (dist/cli.mjs),
 * or can be imported and invoked manually for testing.
 */
export async function runCli(rawArgs = process.argv.slice(2)) {
  const version = await getVersion()

  const main = defineCommand({
    meta: {
      name: 'rsp',
      version,
      description: 'RSP (Rules, Spec, Plan) workflow for AI-assisted development',
    },
    subCommands: {
      'init': initCommand,
      'new': newFeatureCommand,
      'close': closeFeatureCommand,
      'status': statusCommand,
      'check': checkCommand,
      'deps': depsCommand,
      'archive-index': archiveIndexCommand,
    },
  })

  await runMain(main, { rawArgs })
}

/** Auto-execute when run as the entry point (dist/cli.mjs), not when imported */
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])
if (isMain) {
  runCli().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`  Error: ${message}`)
    process.exit(1)
  })
}
