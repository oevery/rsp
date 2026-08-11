import { randomUUID } from 'node:crypto'
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'tsup'
import { describe, expect, it } from 'vitest'

import { captureStatusCliMatrix, hashJson, hashText } from './status-cli-matrix.js'

interface OracleEntry {
  argv: string[]
  status: number
  stdoutSha256: string
  stderrSha256: string
  jsonSha256?: string
}

const root = fileURLToPath(new URL('../..', import.meta.url))
const oraclePath = join(root, 'test', 'status', 'fixtures', 'status-cli-oracles.json')
let oracles = JSON.parse(readFileSync(oraclePath, 'utf8')) as Record<string, OracleEntry>

describe('rsp status frozen CLI equivalence matrix', () => {
  it('matches complete HEAD stdout, stderr, exit, and JSON oracles', async ({ onTestFinished }) => {
    const packageRoot = join(root, '.cache', `rsp-status-oracle-package-${randomUUID()}`)
    onTestFinished(() => rmSync(packageRoot, { force: true, recursive: true }))
    const outDir = join(packageRoot, 'dist')
    mkdirSync(outDir, { recursive: true })
    copyFileSync(join(root, 'package.json'), join(packageRoot, 'package.json'))
    await build({
      banner: { js: '#!/usr/bin/env node' },
      clean: false,
      dts: false,
      entry: { cli: join(root, 'src', 'cli.ts') },
      format: ['esm'],
      outDir,
      outExtension: () => ({ js: '.mjs' }),
      platform: 'node',
      silent: true,
      sourcemap: false,
      target: 'es2022',
    })
    const cliPath = join(outDir, 'cli.mjs')
    const captures = await captureStatusCliMatrix(cliPath)
    if (process.env.UPDATE_STATUS_ORACLES === '1') {
      oracles = Object.fromEntries(captures.map(capture => [capture.name, {
        argv: capture.argv,
        status: capture.status,
        stdoutSha256: hashText(capture.stdout),
        stderrSha256: hashText(capture.stderr),
        ...(capture.json === undefined ? {} : { jsonSha256: hashJson(capture.json) }),
      }])) as Record<string, OracleEntry>
      writeFileSync(oraclePath, `${JSON.stringify(oracles, null, 2)}\n`)
    }
    expect(captures.map(capture => capture.name)).toEqual(Object.keys(oracles))

    for (const capture of captures) {
      const oracle = oracles[capture.name]
      expect(capture.argv, `${capture.name} argv`).toEqual(oracle.argv)
      expect(capture.status, `${capture.name} exit\nstdout:\n${capture.stdout}\nstderr:\n${capture.stderr}`).toBe(oracle.status)
      expect(hashText(capture.stdout), `${capture.name} stdout:\n${capture.stdout}`).toBe(oracle.stdoutSha256)
      expect(hashText(capture.stderr), `${capture.name} stderr:\n${capture.stderr}`).toBe(oracle.stderrSha256)
      if (oracle.jsonSha256)
        expect(hashJson(capture.json), `${capture.name} JSON:\n${JSON.stringify(capture.json, null, 2)}`).toBe(oracle.jsonSha256)
      else
        expect(capture.json, `${capture.name} unexpected JSON`).toBeUndefined()
    }
  }, 15_000)
})
