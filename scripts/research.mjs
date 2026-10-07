#!/usr/bin/env node

import { pathToFileURL } from 'node:url'
import { checkEvidence, evidenceMetadata, importEvidence, retain } from './research/evidence.mjs'
import { captureSource, syncSource } from './research/sources.mjs'
import { errorDetails, fail, ID } from './research/storage.mjs'
import { checkStudy, compareStudies, listResearch, newStudy, reviseStudy, sealStudy, showStudy } from './research/studies.mjs'

const HELP = `Repository research: explicit acquisition, retained evidence, question-led studies.

Usage: node scripts/research.mjs <command> [arguments] [--json]

  sync <source>                       Explicitly clone/fetch research/sources.yaml repo/ref
  capture <source> [--revision <id>]    Retain local scoped Git bytes; never fetch
          [--path <pattern> ...]        Override registry scope (*, ** and ? supported)
  import --file <file-or-directory> --origin <declared-origin>
          [--license <text>] [--limitations <text>]
                                      Retain local bytes; does not assert web freshness
  new <study> --question <text> [--evidence <SHA-256> ...]
                                      Create an editable draft; write its body before seal
  seal <study>                        Check direct evidence/predecessors and freeze bytes
  revise <study> --from <study@SHA-256> Create a successor draft; refuse unsealed edits
  list                                Study metadata and evidence summaries; not-checked
  show <study|study@SHA-256|SHA-256>    View draft, sealed text or evidence manifest
  check <study|study@SHA-256|SHA-256> [--history]
                                      Verify current bytes, direct evidence/predecessors
                                      --history audits the full study graph; no evidence-only hash
  compare <study@SHA-256> <study@SHA-256>
                                      Verify report identities and compare text/references
                                      Evidence and history remain not-checked

Storage: research/evidence/<SHA-256>/{manifest.json,files/};
         research/studies/<study>/{draft.md,revisions/<SHA-256>.md}
Run from the project root. Names use lowercase kebab-case. Repeat --evidence/--path.
seal/check verify retained artifacts, not semantic approval or effectiveness.
Default history integrity is not-checked; only check --history audits prior evidence.
Historical reports and research/legacy/upstreams/ are not read or written. No upload occurs.
JSON errors: {error:{kind,message}}. Kinds: invalid, unavailable, corrupt, operational-error.
Exit 0: success; exit 1: error or failed check. --help shows this contract.
`

const CONFIG = {
  sync: { positionals: 1, flags: [] },
  capture: { positionals: 1, flags: ['revision', 'path'] },
  import: { positionals: 0, flags: ['file', 'origin', 'license', 'limitations'] },
  new: { positionals: 1, flags: ['question', 'evidence'] },
  seal: { positionals: 1, flags: [] },
  revise: { positionals: 1, flags: ['from'] },
  list: { positionals: 0, flags: [] },
  show: { positionals: 1, flags: [] },
  check: { positionals: 1, flags: ['history'] },
  compare: { positionals: 2, flags: [] },
}

function parseArguments(args) {
  const command = args[0]
  const config = CONFIG[command]
  if (!config)
    fail('invalid', `Unknown command: ${command ?? '(missing)'}; use --help`)
  const options = { evidence: [], path: [] }
  const positionals = []
  for (let i = 1; i < args.length; i++) {
    const argument = args[i]
    if (argument === '--json')
      continue
    if (!argument.startsWith('--')) {
      positionals.push(argument)
      continue
    }
    const key = argument.slice(2)
    if (!config.flags.includes(key))
      fail('invalid', `Unsupported option ${argument} for ${command}; use --help`)
    if (key === 'history') {
      if (options.history !== undefined)
        fail('invalid', `Option ${argument} cannot be repeated`)
      options.history = true
      continue
    }
    const value = args[++i]
    if (!value || value.startsWith('--'))
      fail('invalid', `${argument} requires a value`)
    if (['path', 'evidence'].includes(key))
      options[key].push(value)
    else if (options[key] !== undefined)
      fail('invalid', `Option ${argument} cannot be repeated`)
    else
      options[key] = value
  }
  if (positionals.length !== config.positionals)
    fail('invalid', `${command} expects ${config.positionals} positional argument(s); use --help`)
  return { command, options, positionals }
}

export async function runResearch(args, root = process.cwd()) {
  const { command, options, positionals: [first, second] } = parseArguments(args)
  switch (command) {
    case 'sync': return syncSource(root, first)
    case 'capture': return retain(root, await captureSource(root, first, { revision: options.revision, paths: options.path }))
    case 'import': return importEvidence(root, options)
    case 'new': return newStudy(root, first, options.question, options.evidence)
    case 'seal': return sealStudy(root, first)
    case 'revise': return reviseStudy(root, first, options.from)
    case 'list': return listResearch(root)
    case 'show': return ID.test(first) ? evidenceMetadata(root, first) : showStudy(root, first)
    case 'check':
      if (ID.test(first) && options.history)
        fail('invalid', '--history requires a study or exact study revision, not an evidence hash')
      return ID.test(first) ? checkEvidence(root, first) : checkStudy(root, first, { history: options.history })
    case 'compare': return compareStudies(root, first, second)
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--help') || args.includes('-h')) {
    console.log(args.includes('--json') ? JSON.stringify({ help: HELP }) : HELP)
    return
  }
  try {
    const result = await runResearch(args)
    console.log(JSON.stringify(result, null, args.includes('--json') ? undefined : 2))
    if (args[0] === 'check' && (result.integrity !== 'valid' || (result.history && !['valid', 'not-checked'].includes(result.history.integrity))))
      process.exitCode = 1
  }
  catch (error) {
    const detail = errorDetails(error)
    if (args.includes('--json'))
      console.log(JSON.stringify({ error: detail }))
    else
      console.error(`${detail.kind}: ${detail.message}`)
    process.exitCode = 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await main()
