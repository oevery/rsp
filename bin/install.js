#!/usr/bin/env node

import { cp, mkdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkgRoot = join(__dirname, '..')
const home = homedir()
const kiloConfig = join(home, '.config', 'kilo')

const installs = [
  {
    name: 'skill: rsp',
    src: join(pkgRoot, 'skills', 'rsp'),
    dest: join(kiloConfig, '.kilo', 'skills', 'rsp'),
  },
  {
    name: 'rule: rsp-rules',
    src: join(pkgRoot, 'rules', 'rsp-rules.md'),
    dest: join(kiloConfig, '.ai', 'rules', 'rsp-rules.md'),
  },
  {
    name: 'command: init-rsp',
    src: join(pkgRoot, 'commands', 'init-rsp.md'),
    dest: join(kiloConfig, '.kilo', 'command', 'init-rsp.md'),
  },
  {
    name: 'command: new-feature',
    src: join(pkgRoot, 'commands', 'new-feature.md'),
    dest: join(kiloConfig, '.kilo', 'command', 'new-feature.md'),
  },
  {
    name: 'command: close-feature',
    src: join(pkgRoot, 'commands', 'close-feature.md'),
    dest: join(kiloConfig, '.kilo', 'command', 'close-feature.md'),
  },
]

async function main() {
  console.log('\n  RSP installer\n  =============\n')

  let installed = 0

  for (const { name, src, dest } of installs) {
    await mkdir(dirname(dest), { recursive: true })
    await cp(src, dest, { recursive: true })
    console.log(`  + ${name}`)
    installed++
  }

  console.log(`\n  ${installed} items installed.\n`)
  console.log('  Next steps:')
  console.log('    1. Add this to kilo.jsonc instructions:')
  console.log('       "~/.config/kilo/.ai/rules/rsp-rules.md"\n')
  console.log('    2. Restart Kilo or run /new-feature to verify.\n')
  console.log('    Docs: https://github.com/oevery/rsp\n')
  console.log('\n')
  console.log('  RSP is tool-agnostic. The .ai/ directory works with')
  console.log('  Cursor, Claude Code, Cline, Copilot, or any AI coding tool.\n')
}

main().catch((err) => {
  console.error('  Install failed:', err.message)
  process.exit(1)
})
