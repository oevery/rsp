#!/usr/bin/env node
import { pathToFileURL } from 'node:url'
import { capturePath, readIndex } from './research/catalog.mjs'
import { compareEvidence } from './research/comparison.mjs'
import { evidenceMetadata, importEvidence, retain } from './research/evidence.mjs'
import { compareRefreshes, listRefreshes, readRefresh, refreshSources } from './research/refresh.mjs'
import { captureSource, syncSource } from './research/sources.mjs'
import { errorDetails, exists, fail, safePath } from './research/storage.mjs'
import { cleanCaptures, recoverCapture } from './research/transfer.mjs'

const HELP = 'Research acquisition and recovery. Reports are ordinary timestamped Markdown files.\n\n'
  + 'sync <source>\ncapture <source> [--revision <full-commit>] [--path <glob> ...]\n'
  + 'refresh --all | --source <name> ... [--from refresh@timestamp]\n'
  + 'refresh --resume refresh@timestamp [--update-config]\n'
  + 'import --file <path> --origin <provenance> [--name <slug>] [--license <text>] [--limitations <text>]\n'
  + 'list\nshow <capture|refresh@timestamp>\ndiff <capture> <capture>\n'
  + 'compare-refreshes <refresh> <refresh>\nrecover <capture>\n'
  + 'clean <capture> [<capture> ...] [--apply]\n\n'
  + 'All commands support --json. Git differences use local objects; sync/recover explicitly acquire them.\n'
  + 'list/show report directory availability, not content verification. clean previews explicit selections.\n'
  + 'Copy/archive material with ordinary tools. Write reports directly under research/reports/<UTC-time>.md.\n'

const CONFIG = {
  'sync': [1, []],
  'capture': [1, ['revision', 'path']],
  'refresh': [0, ['all', 'source', 'from', 'resume', 'update-config']],
  'import': [0, ['file', 'origin', 'name', 'license', 'limitations']],
  'list': [0, []],
  'show': [1, []],
  'diff': [2, []],
  'compare-refreshes': [2, []],
  'recover': [1, []],
  'clean': [null, ['apply']],
}
function parseArguments(args) {
  const command = args[0]
  const config = CONFIG[command]
  if (!config)
    fail('invalid', 'Unknown command; use --help')
  const options = { path: [], source: [] }
  const positionals = []
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--json')
      continue
    if (!args[i].startsWith('--')) {
      positionals.push(args[i])
      continue
    }
    const key = args[i].slice(2)
    if (!config[1].includes(key))
      fail('invalid', `Unsupported option --${key}`)
    if (['all', 'apply', 'update-config'].includes(key)) {
      if (options[key])
        fail('invalid', `Repeated option --${key}`)
      options[key] = true
      continue
    }
    const value = args[++i]
    if (!value || value.startsWith('--'))
      fail('invalid', `Missing value for --${key}`)
    if (Array.isArray(options[key]))
      options[key].push(value)
    else if (options[key] !== undefined)
      fail('invalid', `Repeated option --${key}`)
    else options[key] = value
  }
  if (config[0] !== null && positionals.length !== config[0])
    fail('invalid', 'Wrong arguments; use --help')
  return { command, options, positionals }
}
export async function runResearch(args, root = process.cwd(), progress) {
  const { command, options: o, positionals } = parseArguments(args)
  const [a, b] = positionals
  switch (command) {
    case 'sync': return syncSource(root, a)
    case 'capture': return retain(root, await captureSource(root, a, { revision: o.revision, paths: o.path }))
    case 'refresh': return refreshSources(root, { ...o, updateConfig: o['update-config'], progress })
    case 'import': return importEvidence(root, o)
    case 'list': {
      const index = await readIndex(root)
      const captures = []
      for (const [id, record] of Object.entries(index.captures)) {
        const path = capturePath(id, record)
        captures.push({ id, path, local: await exists(await safePath(root, path)) ? 'present' : 'missing' })
      }
      return { captures, refreshes: await listRefreshes(root) }
    }
    case 'show': return a.startsWith('refresh@') ? readRefresh(root, a) : evidenceMetadata(root, a)
    case 'diff': return compareEvidence(root, a, b)
    case 'compare-refreshes': return compareRefreshes(root, a, b)
    case 'recover': return recoverCapture(root, a)
    case 'clean': return cleanCaptures(root, positionals, o.apply)
  }
}
function display(result) {
  if (result.record) {
    console.log(result.ref)
    for (const item of result.record.sources)
      console.log(`  ${item.source}: ${item.status}${item.revision ? ` ${item.revision.slice(0, 12)}` : ''}${item.error ? ` — ${item.error.message}` : ''}`)
    for (const item of result.comparison ?? [])
      console.log(`  ${item.source}: ${item.status === 'compared' ? `${item.changes.length} changed paths (${item.outsideSelectionChanges.length} outside selection)` : item.status}`)
    if (result.acquisition === 'partial')
      console.log(`Resume: node scripts/research.mjs refresh --resume ${result.ref}`)
  }
  else if (result.captures) {
    for (const item of result.captures)
      console.log(`${item.id}  ${item.local}`)
    for (const ref of result.refreshes)
      console.log(ref)
  }
  else {
    console.log(JSON.stringify(result, null, 2))
  }
}
async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help')) {
    console.log(HELP)
    return
  }
  const json = args.includes('--json')
  try {
    const progress = json ? undefined : item => console.error(item.source ? `${item.source}: ${item.status}` : `${item.ref} (${item.total} sources)`)
    const result = await runResearch(args, process.cwd(), progress)
    if (json)
      console.log(JSON.stringify(result))
    else display(result)
    if (result.acquisition === 'partial')
      process.exitCode = 1
  }
  catch (error) {
    const result = { error: errorDetails(error) }
    if (json)
      console.log(JSON.stringify(result))
    else console.error(`${result.error.kind}: ${result.error.message}`)
    process.exitCode = 1
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await main()
