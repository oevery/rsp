import type { CloseFeatureArgs, NewFeatureArgs } from './types.js'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineCommand, runMain } from 'citty'
import { addRules } from './commands/add-rules.js'
import { addSpec } from './commands/add-spec.js'
import { buildArchiveIndex } from './commands/archive-index.js'
import { runCheck } from './commands/check.js'
import { closeFeature } from './commands/close-feature.js'
import { showDependencies } from './commands/deps.js'
import { runDoctor } from './commands/doctor.js'
import { initProject } from './commands/init.js'
import { newFeature } from './commands/new-feature.js'
import { buildSpecsIndex } from './commands/specs-index.js'
import { showStatus } from './commands/status.js'
import { getVersion } from './core/config.js'

/** CLI command: scaffold .rsp/ directory and AGENTS.md */
const initCommand = defineCommand({
  meta: {
    name: 'init',
    description: 'Scaffold .rsp/ + AGENTS.md in current project',
  },
  args: {
    'agents-mode': {
      type: 'string',
      description: 'How to update AGENTS.md: managed, skip, or print',
      default: 'managed',
    },
    'with-project-rules': {
      type: 'boolean',
      description: 'Create .rsp/rules/project-rules.md',
      default: false,
    },
  },
  async run({ args }: { args: Record<string, unknown> }) {
    await initProject({
      agentsMode: args['agents-mode'] === 'skip' || args['agents-mode'] === 'print'
        ? args['agents-mode'] as 'skip' | 'print'
        : 'managed',
      withProjectRules: Boolean(args['with-project-rules']),
    })
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

/** CLI command: add a rules file */
const addRulesCommand = defineCommand({
  meta: {
    name: 'rules',
    description: 'Create .rsp/rules/<name>.md',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Rules file name',
      required: true,
    },
  },
  async run({ args }: { args: { name: string } }) {
    await addRules(args.name)
  },
})

/** CLI command: add a spec file */
const addSpecCommand = defineCommand({
  meta: {
    name: 'spec',
    description: 'Create .rsp/specs/<name>.md and rebuild specs index',
  },
  args: {
    name: {
      type: 'positional',
      description: 'Spec file name',
      required: true,
    },
  },
  async run({ args }: { args: { name: string } }) {
    await addSpec(args.name)
  },
})

/** CLI command group: add supporting project files */
const addCommand = defineCommand({
  meta: {
    name: 'add',
    description: 'Add optional rules or spec files',
  },
  subCommands: {
    rules: addRulesCommand,
    spec: addSpecCommand,
  },
})

/** CLI command: archive a completed feature */
const closeFeatureCommand = defineCommand({
  meta: {
    name: 'close',
    description: 'Archive to .rsp/archives/',
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
  args: {
    active: {
      type: 'boolean',
      description: 'Show only active features',
      default: false,
    },
    blocked: {
      type: 'boolean',
      description: 'Show only blocked features',
      default: false,
    },
    stale: {
      type: 'string',
      description: 'Show only features with age >= days',
    },
  },
  async run({ args }) {
    const stale = args.stale === undefined ? undefined : Number(args.stale)
    if (args.stale !== undefined && (Number.isFinite(stale) === false || Number.isInteger(stale) === false || stale < 0)) {
      console.error(`  Error: --stale must be a non-negative integer number of days`)
      process.exit(1)
    }

    await showStatus({
      active: Boolean(args.active),
      blocked: Boolean(args.blocked),
      stale,
    })
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
    focus: {
      type: 'string',
      description: 'Show only a feature and its direct dependency neighborhood',
    },
    reverse: {
      type: 'string',
      description: 'Show only features that depend on the given feature',
    },
  },
  async run({ args }) {
    await showDependencies({
      mermaid: Boolean(args.mermaid),
      focus: typeof args.focus === 'string' ? args.focus : undefined,
      reverse: typeof args.reverse === 'string' ? args.reverse : undefined,
    })
  },
})

/** CLI command: regenerate archive INDEX.md */
const archiveIndexCommand = defineCommand({
  meta: {
    name: 'archive-index',
    description: 'Regenerate archives INDEX.md',
  },
  async run() {
    await buildArchiveIndex()
  },
})

/** CLI command: regenerate specs INDEX.md */
const specsIndexCommand = defineCommand({
  meta: {
    name: 'specs-index',
    description: 'Regenerate specs INDEX.md',
  },
  async run() {
    await buildSpecsIndex()
  },
})

/** CLI command: inspect RSP setup health */
const doctorCommand = defineCommand({
  meta: {
    name: 'doctor',
    description: 'Check RSP setup health and common integration issues',
  },
  async run() {
    const issues = await runDoctor()
    if (issues > 0)
      process.exit(1)
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
      description: 'RSP (Rules, Specs, Plans) workflow for AI-assisted development',
    },
    subCommands: {
      'init': initCommand,
      'add': addCommand,
      'new': newFeatureCommand,
      'close': closeFeatureCommand,
      'status': statusCommand,
      'check': checkCommand,
      'deps': depsCommand,
      'archive-index': archiveIndexCommand,
      'specs-index': specsIndexCommand,
      'doctor': doctorCommand,
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
