#!/usr/bin/env node

import { writeFileSync } from 'node:fs'
import process from 'node:process'

if (process.argv.includes('--version')) {
  console.log('codex-cli test-1.0.0')
  process.exit(0)
}

const outputFlag = process.argv.indexOf('--output-last-message')
const outputPath = outputFlag >= 0 ? process.argv[outputFlag + 1] : undefined
if (!outputPath)
  throw new Error('missing --output-last-message')

if (process.env.FAKE_CODEX_MUTATE === '1')
  writeFileSync('unauthorized.txt', 'mutation\n')

writeFileSync(outputPath, '## Review Scope\n\n- Code: clean\n- Document: skipped\n')
console.log(JSON.stringify({ type: 'thread.started', thread_id: 'test-thread' }))
console.log(JSON.stringify({ type: 'item.completed', item: { type: 'command_execution' } }))
console.log(JSON.stringify({
  type: 'turn.completed',
  usage: {
    cached_input_tokens: 60,
    input_tokens: 100,
    output_tokens: 20,
    reasoning_output_tokens: 5,
  },
}))
