#!/usr/bin/env node

import { pathToFileURL } from 'node:url'
import { compareEvidence } from './research/comparison.mjs'
import { researchCoverage } from './research/coverage.mjs'
import { checkEvidence, evidenceMetadata, importEvidence, retain, subsetEvidence } from './research/evidence.mjs'
import { checkRefresh, compareRefreshes, readRefresh, refreshSources } from './research/refresh.mjs'
import { captureSource, syncSource } from './research/sources.mjs'
import { errorDetails, fail, ID } from './research/storage.mjs'
import { checkStudy, compareStudies, listResearch, newStudy, reviseStudy, sealStudy, showStudy } from './research/studies.mjs'

const HELP = `Repository research: upstream discovery and focused studies with retained evidence.

Usage: node scripts/research.mjs <command> [arguments] [--json]

  sync <source>                       Explicitly clone/fetch research/sources.yaml repo/ref
  refresh --all | --source <name> ... [--from refresh@SHA-256]
                                      Acquire and retain a batch; partial results exit 1
  capture <source> [--revision <id>]    Retain local scoped Git bytes; never fetch
          [--path <pattern> ...]        Override registry scope (*, ** and ? supported)
  subset <SHA-256> --path <pattern> ...
                                      Copy matching retained files with original Git identity
  import --file <file-or-directory> --origin <declared-origin>
          [--license <text>] [--limitations <text>]
                                      Retain local bytes; does not assert web freshness
  new <study> --brief <text> [--evidence <SHA-256> ...]
          [--refresh <refresh@SHA-256> ...] [--baseline <SHA-256> ...]
                                      Create an editable draft; write its body before seal
  seal <study>                        Check direct evidence/predecessors and freeze bytes
  revise <study> --from <study@SHA-256> Create a successor draft; refuse unsealed edits
  list                                Study metadata and evidence summaries; not-checked
  show <study|study@SHA-256|SHA-256|refresh@SHA-256>
                                      View draft, sealed text, evidence or refresh
  check <study|study@SHA-256|SHA-256|refresh@SHA-256> [--history]
                                      Verify current bytes, direct evidence/predecessors
                                      --history audits the full study graph; no evidence-only hash
  compare <study@SHA-256> <study@SHA-256>
                                      Verify report identities and compare text/references
                                      Evidence and history remain not-checked
  diff <SHA-256> <SHA-256>             Verify and compare scoped Git evidence inventories
  compare-refreshes <refresh@SHA-256> <refresh@SHA-256>
                                      Offline repository discovery and scoped evidence comparison
  coverage <study@SHA-256> <refresh@SHA-256>
                                      Derive changes since declared research coverage

Storage: research/evidence/<SHA-256>/{manifest.json,files/};
         research/studies/<study>/{draft.md,revisions/<SHA-256>.md}
         research/refreshes/<SHA-256>.json
Run from the project root. Names use lowercase kebab-case. Repeat --evidence/--path.
seal/check verify retained artifacts, not semantic approval or effectiveness.
Default history integrity is not-checked; only check --history audits prior evidence.
Historical reports and research/legacy/upstreams/ are not read or written. No upload occurs.
JSON errors: {error:{kind,message}}. Kinds: invalid, unavailable, corrupt, operational-error.
Exit 0: success; exit 1: error or failed check. --help shows this contract.
`

const CONFIG = {
  'sync': { positionals: 1, flags: [] },
  'refresh': { positionals: 0, flags: ['all', 'source', 'from'] },
  'capture': { positionals: 1, flags: ['revision', 'path'] },
  'subset': { positionals: 1, flags: ['path'] },
  'import': { positionals: 0, flags: ['file', 'origin', 'license', 'limitations'] },
  'new': { positionals: 1, flags: ['brief', 'evidence', 'refresh', 'baseline'] },
  'seal': { positionals: 1, flags: [] },
  'revise': { positionals: 1, flags: ['from'] },
  'list': { positionals: 0, flags: [] },
  'show': { positionals: 1, flags: [] },
  'check': { positionals: 1, flags: ['history'] },
  'compare': { positionals: 2, flags: [] },
  'diff': { positionals: 2, flags: [] },
  'compare-refreshes': { positionals: 2, flags: [] },
  'coverage': { positionals: 2, flags: [] },
}

function parseArguments(args) {
  const command = args[0]
  const config = CONFIG[command]
  if (!config)
    fail('invalid', `Unknown command: ${command ?? '(missing)'}; use --help`)
  const options = { evidence: [], path: [], source: [], refresh: [], baseline: [] }
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
    if (['history', 'all'].includes(key)) {
      if (options[key] !== undefined)
        fail('invalid', `Option ${argument} cannot be repeated`)
      options[key] = true
      continue
    }
    const value = args[++i]
    if (!value || value.startsWith('--'))
      fail('invalid', `${argument} requires a value`)
    if (['path', 'evidence', 'source', 'refresh', 'baseline'].includes(key))
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
    case 'refresh': return refreshSources(root, options)
    case 'capture': return retain(root, await captureSource(root, first, { revision: options.revision, paths: options.path }))
    case 'subset': return subsetEvidence(root, first, options.path)
    case 'import': return importEvidence(root, options)
    case 'new': return newStudy(root, first, options.brief, options.evidence, { refreshes: options.refresh, baseline: options.baseline })
    case 'seal': return sealStudy(root, first)
    case 'revise': return reviseStudy(root, first, options.from)
    case 'list': return listResearch(root)
    case 'show': return first.startsWith('refresh@') ? readRefresh(root, first) : ID.test(first) ? evidenceMetadata(root, first) : showStudy(root, first)
    case 'check':
      if ((ID.test(first) || first.startsWith('refresh@')) && options.history)
        fail('invalid', '--history requires a study or exact study revision, not an evidence hash')
      return first.startsWith('refresh@') ? checkRefresh(root, first) : ID.test(first) ? checkEvidence(root, first) : checkStudy(root, first, { history: options.history })
    case 'compare': return compareStudies(root, first, second)
    case 'diff': return compareEvidence(root, first, second)
    case 'compare-refreshes': return compareRefreshes(root, first, second)
    case 'coverage': return researchCoverage(root, first, second)
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
    if (args[0] === 'refresh' && result.acquisition !== 'complete')
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
