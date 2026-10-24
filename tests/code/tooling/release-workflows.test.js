import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { parse } from 'yaml'

const read = name => parse(readFileSync(new URL(`../../../.github/workflows/${name}.yml`, import.meta.url), 'utf8'))
const config = JSON.parse(readFileSync(new URL('../../../.github/xova.json', import.meta.url), 'utf8'))
const ci = read('ci')
const publish = read('publish')
const recover = read('docs-recover')
const expression = value => `$` + `{{ ${value} }}`

it('pins one toolkit revision while keeping RSP checks and packed installation local', () => {
  const calls = [ci.jobs.code, ci.jobs.docs, publish.jobs.check, publish.jobs.release, recover.jobs.recover]
  const revisions = [...calls, publish.jobs.ci.steps.at(-1)].map((call) => {
    expect(call.uses).toMatch(/^xova-dev\/actions\/(?:\.github\/workflows\/[a-z-]+\.yml|actions\/checked-ci)@[0-9a-f]{40}$/)
    return call.uses.split('@')[1]
  })
  expect(new Set(revisions).size).toBe(1)
  expect(config.code['check-command']).toBe('uv sync --project tests/skills --frozen && RSP_INSTALL_ALLOW_NETWORK=1 pnpm release:check')
  expect(config.npm['verify-command'].trim()).not.toBe('')
  expect(config.npm['package-verify-command']).toBe('RSP_INSTALL_ALLOW_NETWORK=1 pnpm test:pack')
  expect(config.npm['package-manager']).toBe('npm')
  expect(config.setup['install-command']).toBe('pnpm install --frozen-lockfile')
})

it('checks the complete final source before publishing regardless of ordinary docs-only skips', () => {
  for (const job of [ci.jobs.code, publish.jobs.check]) {
    expect(job.uses.split('@')[0]).toBe('xova-dev/actions/.github/workflows/check.yml')
    expect(job.with['source-sha']).toBe(expression('github.sha'))
    expect(job['continue-on-error']).toBeUndefined()
  }
  expect(ci.jobs.code.with['detect-changes']).toBe(true)
  expect(publish.jobs.check.with['detect-changes'] ?? false).toBe(false)
  expect(publish.jobs.release['continue-on-error']).toBeUndefined()
  expect(publish.jobs.release.with['expected-sha']).toBe(expression('needs.check.outputs.source-sha || needs.ci.outputs.source-sha'))
  expect(publish.jobs.release.with['release-tag']).toBe(expression('github.event.release.tag_name || inputs.release-tag'))
  expect(publish.on.release.types).toEqual(['published'])
  expect(publish.on.push).toBeUndefined()
})

it('wires optional CI reuse to complete RSP fallback and exact-source publication', () => {
  expect(Object.keys(publish.jobs)).toEqual(['ci', 'ci-status', 'check', 'release'])
  expect(publish.jobs.ci.permissions).toEqual({ contents: 'read', actions: 'read' })
  expect(publish.jobs.ci['continue-on-error']).toBe(true)
  const lookup = publish.jobs.ci.steps.at(-1)
  expect(lookup.id).toBe('ci')
  expect(lookup.uses.split('@')[0]).toBe('xova-dev/actions/actions/checked-ci')
  expect(lookup.with).toEqual({ 'expected-sha': expression('github.sha') })
  expect(publish.jobs.ci.outputs).toEqual({
    'source-sha': expression('steps.ci.outcome == \'success\' && steps.ci.outputs.source-sha || \'\''),
    'input-error': expression('steps.ci.outputs.input-error'),
  })
  const report = publish.jobs['ci-status']
  expect(report.needs).toBe('ci')
  expect(report.permissions).toEqual({})
  expect(report.if).toBe(expression('!cancelled() && (needs.ci.outputs.input-error == \'true\' || needs.ci.result != \'success\' || needs.ci.outputs.source-sha != github.sha)'))
  expect(report['continue-on-error']).toBe(expression('needs.ci.outputs.input-error != \'true\''))
  expect(report.steps[0].env.INPUT_ERROR).toBe(expression('needs.ci.outputs.input-error'))
  expect(publish.jobs.check.needs).toBe('ci')
  expect(publish.jobs.check.if).toBe(expression('!cancelled() && needs.ci.result != \'skipped\' && needs.ci.outputs.input-error != \'true\' && (needs.ci.result != \'success\' || needs.ci.outputs.source-sha != github.sha)'))
  expect(publish.jobs.release.needs).toEqual(['ci', 'check'])
  expect(publish.jobs.release.if).toBe(expression('!cancelled() && needs.ci.result != \'skipped\' && needs.ci.outputs.input-error != \'true\' && ((needs.check.result == \'success\' && needs.check.outputs.source-sha == github.sha) || (needs.ci.result == \'success\' && needs.check.result == \'skipped\' && needs.ci.outputs.source-sha == github.sha))'))
})

it('keeps checks read-only and shares Cloudflare policy with isolated documentation recovery', () => {
  for (const workflow of [ci, publish, recover])
    expect(workflow.permissions).toEqual({ contents: 'read' })
  for (const job of [ci.jobs.code, ci.jobs.docs, publish.jobs.check]) {
    expect(job.secrets).toBeUndefined()
    expect(job.permissions).toBeUndefined()
  }
  expect(ci.on.pull_request).toBeNull()
  expect(ci.on.push).toEqual({ branches: ['main'] })
  for (const job of [ci.jobs.code, ci.jobs.docs]) {
    expect(job.needs).toBeUndefined()
    expect(job.if).toBeUndefined()
    expect(job.environment).toBeUndefined()
  }
  expect(ci.jobs.docs.with).toEqual({ 'kind': 'docs', 'source-sha': expression('github.sha') })
  expect(publish.jobs.release.permissions).toEqual({ 'contents': 'read', 'id-token': 'write' })
  expect(publish.jobs.release.with['deploy-docs']).toBe(expression('github.event_name == \'release\' && !github.event.release.prerelease'))
  expect(config.docs).toMatchObject({ 'provider': 'cloudflare', 'environment-name': 'docs-production', 'concurrency-group': 'docs-production', 'deployment-policy': 'latest-stable' })
  expect(Object.keys(recover.on)).toEqual(['workflow_dispatch'])
  expect(Object.keys(recover.jobs)).toEqual(['recover'])
  expect(recover.jobs.recover.uses.split('@')[0]).toBe('xova-dev/actions/.github/workflows/docs-recover.yml')
  expect(recover.jobs.recover.with).toEqual({ 'release-tag': expression('inputs.release-tag'), 'published-sha': expression('inputs.published-sha') })
  expect(recover.jobs.recover.secrets).toEqual(publish.jobs.release.secrets)
  expect(Object.keys(recover.jobs.recover.secrets).sort()).toEqual(['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN'])
})
