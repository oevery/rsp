#!/usr/bin/env node

import { readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import process from 'node:process'

if (process.argv.includes('--version')) {
  console.log('codex-cli test-1.0.0')
  process.exit(0)
}

const prompt = readFileSync(0, 'utf8')
const receiptShapeMatch = prompt.match(/Use this exact top-level JSON shape: (\{[^\n]+\})\./u)

const outputFlag = process.argv.indexOf('--output-last-message')
const outputPath = outputFlag >= 0 ? process.argv[outputFlag + 1] : undefined
if (!outputPath)
  throw new Error('missing --output-last-message')

const configExpectation = process.env.FAKE_CODEX_CONFIG_MODE
const ignoresUserConfig = process.argv.includes('--ignore-user-config')
if (configExpectation === 'user' && ignoresUserConfig)
  throw new Error('unexpected --ignore-user-config')
if (configExpectation === 'isolated' && !ignoresUserConfig)
  throw new Error('missing --ignore-user-config')
if (configExpectation?.startsWith('provider:')) {
  const provider = configExpectation.slice('provider:'.length)
  if (!process.argv.includes(`model_provider="${provider}"`))
    throw new Error(`missing provider override: ${provider}`)
}

if (process.env.FAKE_CODEX_DELAY_MS)
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Number(process.env.FAKE_CODEX_DELAY_MS))

if (process.env.FAKE_CODEX_MUTATE === '1')
  writeFileSync('unauthorized.txt', 'mutation\n')

if (receiptShapeMatch || process.env.FAKE_CODEX_RECEIPT_MODE) {
  if (!receiptShapeMatch)
    throw new Error('missing evaluation receipt shape')
  const receipt = JSON.parse(receiptShapeMatch[1])
  const receiptMode = process.env.FAKE_CODEX_RECEIPT_MODE ?? 'valid'
  const receiptPath = '.rsp-evaluation-receipt.json'
  receipt.observations = {
    trigger: { status: 'passed', evidence: { selected_skill: 'rsp-manage' } },
    first_fix_result: 'passed',
    correction_count: 1,
    worker_dispatch_count: 2,
  }
  if (receiptMode === 'valid') {
    writeFileSync(receiptPath, `${JSON.stringify(receipt)}\n`)
  }
  else if (receiptMode === 'malformed') {
    writeFileSync(receiptPath, '{invalid json\n')
  }
  else if (receiptMode === 'symlink') {
    writeFileSync('.fake-receipt-target.json', `${JSON.stringify(receipt)}\n`)
    symlinkSync('.fake-receipt-target.json', receiptPath)
  }
  else if (receiptMode !== 'missing') {
    throw new Error(`unknown FAKE_CODEX_RECEIPT_MODE: ${receiptMode}`)
  }
}

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
