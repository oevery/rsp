#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'

function requiredArgument(name) {
  const index = process.argv.indexOf(name)
  if (index < 0 || !process.argv[index + 1])
    throw new Error(`${name} is required`)
  return resolve(process.argv[index + 1])
}

function numberArgument(name, fallback) {
  const index = process.argv.indexOf(name)
  const value = index < 0 ? fallback : Number(process.argv[index + 1])
  if (!Number.isInteger(value) || value < 1)
    throw new Error(`${name} must be a positive integer`)
  return value
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function measure(cli, cwd, warmups, samples) {
  const timings = []
  for (let index = 0; index < warmups + samples; index += 1) {
    const started = process.hrtime.bigint()
    const result = spawnSync(process.execPath, [cli, 'status', '--json'], {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    })
    const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000
    if (result.status !== 0)
      throw new Error(`${cli} exited ${result.status}: ${result.stderr}`)
    JSON.parse(result.stdout)
    if (index >= warmups)
      timings.push(Number(elapsedMs.toFixed(3)))
  }
  return { samplesMs: timings, medianMs: Number(median(timings).toFixed(3)) }
}

function main() {
  const baselineCli = requiredArgument('--baseline-cli')
  const candidateCli = requiredArgument('--candidate-cli')
  const warmups = numberArgument('--warmups', 5)
  const samples = numberArgument('--samples', 25)
  const fixture = mkdtempSync(join(tmpdir(), 'rsp-startup-benchmark-'))
  try {
    for (const directory of ['changes', 'focus.d', 'archives', 'specs'])
      mkdirSync(join(fixture, '.rsp', directory), { recursive: true })
    const baseline = measure(baselineCli, fixture, warmups, samples)
    const candidate = measure(candidateCli, fixture, warmups, samples)
    const allowedRegressionMs = Math.max(25, baseline.medianMs * 0.2)
    const regressionMs = candidate.medianMs - baseline.medianMs
    const report = {
      schema: 1,
      command: 'node <cli> status --json',
      warmups,
      samples,
      baseline: { cli: baselineCli, ...baseline },
      candidate: { cli: candidateCli, ...candidate },
      regressionMs: Number(regressionMs.toFixed(3)),
      allowedRegressionMs: Number(allowedRegressionMs.toFixed(3)),
      passed: regressionMs <= allowedRegressionMs,
      runtime: { node: process.version, platform: process.platform, arch: process.arch },
    }
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
    if (!report.passed)
      process.exitCode = 1
  }
  finally {
    rmSync(fixture, { force: true, recursive: true })
  }
}

try {
  main()
}
catch (error) {
  process.stderr.write(`Startup benchmark failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
}
