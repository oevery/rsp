#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import process from 'node:process'
import { checkCampaignEvidence } from './evidence.mjs'

const steps = [
  ['build', ['run', 'build']],
  ['skill-package', ['run', 'skills:package-check']],
  ['skill-security', ['run', 'skills:security-check']],
  ['docs-check', ['run', 'docs:check']],
  ['docs-build', ['run', 'docs:build']],
  ['typecheck', ['run', 'typecheck']],
  ['lint', ['run', 'lint']],
  ['code-tests', ['run', 'test:code']],
  ['eval-schema', ['run', 'eval:check']],
  ['package', ['run', 'release:package-check']],
]

const results = []
for (const [id, args] of steps) {
  const started = Date.now()
  const result = spawnSync('pnpm', args, { encoding: 'utf8', stdio: 'pipe' })
  results.push({ id, status: result.status === 0 ? 'passed' : 'failed', exitCode: result.status, durationMs: Date.now() - started, stdout: result.stdout, stderr: result.stderr })
  if (result.status !== 0)
    break
}

const provider = checkCampaignEvidence(process.cwd(), process.env.RSP_CAMPAIGN_REPORT)
const localStatus = results.every(step => step.status === 'passed') ? 'passed' : 'failed'
const required = process.argv.includes('--require-provider')
const report = { mode: required ? 'release-candidate' : 'local-validation', status: localStatus === 'failed' ? 'failed' : required && provider.status !== 'passed' ? 'inconclusive' : 'passed', steps: results, provider, releaseReady: localStatus === 'passed' && provider.status === 'passed', publication: 'not-authorized' }
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
process.exitCode = report.status === 'passed' ? 0 : 1
