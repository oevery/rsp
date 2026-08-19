import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { discoverReleaseProjectScenarios, fixtureTreeSha256 } from '../../scripts/release-acceptance-scenarios.mjs'
import {
  buildReleaseAcceptancePlan,
  computeReleaseSourceIdentity,
  createAcceptanceRunDirectory,
  renderReleaseAcceptanceMarkdown,
} from '../../scripts/release-acceptance.mjs'

const root = process.cwd()

describe('release acceptance runner', () => {
  it('discovers a serial plan with stable coverage and dynamic project scenarios', () => {
    const plan = buildReleaseAcceptancePlan(root)

    expect(plan.execution).toBe('serial-fail-fast')
    expect(plan.steps.map(step => step.id)).toEqual([
      'skill-security',
      'metadata',
      'docs-check',
      'docs-build',
      'build',
      'typecheck',
      'lint',
      'tests',
      'package',
    ])
    expect(plan.counts.steps).toBe(plan.steps.length)
    expect(plan.counts.projectScenarios).toBe(plan.projects.scenarios.length)
    expect(plan.projects.requiredCoverage).toEqual([
      'complex-existing-rsp',
      'dirty-git-worktree',
      'fresh-adoption',
      'monorepo-nesting',
      'published-upgrade',
      'unicode-content',
    ])
    expect(plan.projects.scenarios.map(scenario => scenario.id)).toEqual(expect.arrayContaining([
      'home-manager-fresh-adoption',
      'rsp-v3-2-published-upgrade',
      'sanitized-dirty-git-adoption',
      'sanitized-existing-rsp',
      'sanitized-unicode-monorepo-adoption',
    ]))
    expect(plan.projects.coverage).toEqual(expect.arrayContaining([
      'complex-existing-rsp',
      'dirty-git-worktree',
      'fresh-adoption',
      'monorepo-nesting',
      'published-upgrade',
      'real-project',
      'unicode-content',
    ]))
    expect(plan.projects.scenarios).toEqual(expect.arrayContaining([
      expect.objectContaining({
        derivedFrom: expect.stringMatching(/^[a-z0-9-]+$/),
        fixturePath: expect.stringMatching(/^acceptance\/fixtures\//),
        manifestPath: expect.stringMatching(/^acceptance\/projects\//),
        fixtureSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
        sanitizationVersion: 'v1',
      }),
    ]))
    expect(plan.omissions).toEqual(expect.arrayContaining([
      expect.stringContaining('release:provider-compare'),
      expect.stringContaining('interactive PTY'),
    ]))
  })

  it('exposes only operator-facing release workflows and keeps internal checks in the runner', () => {
    const scripts = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts as Record<string, string>

    expect(scripts['release:acceptance']).toBe('node scripts/release-acceptance.mjs')
    expect(scripts['release:provider-compare']).toBe('node scripts/release-provider-comparison.mjs')
    expect(scripts['release:candidate-check']).toBe('node scripts/release-candidate-check.mjs && pnpm run release:acceptance')
    expect(scripts.prepublishOnly).toBe('pnpm run release:candidate-check')
    expect(Object.keys(scripts).filter(name => name.startsWith('release:')).sort()).toEqual([
      'release:acceptance',
      'release:candidate-check',
      'release:provider-compare',
    ])
    expect(scripts['test:release']).toBeUndefined()
    expect(scripts.test).toBe('pnpm run build && vitest run')
    expect(scripts['test:watch']).toBe('vitest --config vitest.watch.config.ts')
    expect(scripts['skills:security-check']).toBe('node scripts/skill-security-preflight.mjs --suppressions skill-security-suppressions.json')
    const vitestConfig = readFileSync(join(root, 'vitest.config.ts'), 'utf8')
    const watchConfig = readFileSync(join(root, 'vitest.watch.config.ts'), 'utf8')
    expect(vitestConfig).not.toContain('globalSetup')
    expect(vitestConfig).toContain(`'test/**/fixtures/**'`)
    expect(vitestConfig).toContain(`'test/**/holdout/**'`)
    expect(watchConfig).toContain(`globalSetup: ['./test/support/watch-build-setup.ts']`)
    const plan = buildReleaseAcceptancePlan(root)
    expect(plan.steps.find(step => step.id === 'metadata')?.commandText).toBe('node scripts/release-metadata-check.mjs')
    expect(plan.steps.find(step => step.id === 'tests')?.commandText).toBe('pnpm exec vitest run --no-file-parallelism')
    expect(plan.steps.find(step => step.id === 'package')?.commandText).toBe('node scripts/clean-install-check.mjs --json')
  })

  it('exposes the dynamically discovered plan through the CLI without executing checks', () => {
    const result = spawnSync(process.execPath, [join(root, 'scripts', 'release-acceptance.mjs'), '--plan', '--json'], {
      cwd: root,
      encoding: 'utf8',
    })

    expect(result.status, result.stderr).toBe(0)
    const plan = JSON.parse(result.stdout)
    expect(plan.execution).toBe('serial-fail-fast')
    expect(plan.counts).toEqual({ steps: 9, projectScenarios: expect.any(Number), projectCoverageTags: expect.any(Number) })
    expect(plan.counts.projectScenarios).toBe(plan.projects.scenarios.length)
    for (const coverage of plan.projects.requiredCoverage)
      expect(plan.projects.coverage).toContain(coverage)
  })

  it('creates immutable run directories and renders dynamic evidence without release authority', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'rsp-release-acceptance-report-'))
    try {
      createAcceptanceRunDirectory(temporaryRoot, 'run-1')
      expect(() => createAcceptanceRunDirectory(temporaryRoot, 'run-1')).toThrow()
      const plan = buildReleaseAcceptancePlan(root)
      const markdown = renderReleaseAcceptanceMarkdown({
        verdict: 'passed',
        id: 'run-1',
        package: { name: '@oevery/rsp', version: '3.2.0' },
        source: { commit: 'abc123', dirty: false, fingerprintSha256: 'f'.repeat(64) },
        startedAt: '2026-08-18T00:00:00.000Z',
        completedAt: '2026-08-18T00:01:00.000Z',
        plan,
        steps: [{
          id: 'tests',
          label: 'Complete serial test suite',
          status: 'passed',
          durationMs: 1,
          evidence: { testFilesPassed: 80, testFilesTotal: 80, testsPassed: 900, testsTotal: 900 },
        }],
        omissions: ['provider evidence not observed'],
      })

      expect(markdown).toContain(`Project scenarios: ${plan.counts.projectScenarios}`)
      expect(markdown).toContain('80/80 files; 900/900 tests')
      expect(markdown).toContain('Source fingerprint:')
      expect(markdown).toContain('grants no commit, push, tag, publication')
    }
    finally {
      rmSync(temporaryRoot, { force: true, recursive: true })
    }
  })

  it('fails closed when required dynamic project coverage is missing', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'rsp-release-project-coverage-'))
    try {
      const fixtureRoot = join(temporaryRoot, 'acceptance', 'fixtures', 'fresh')
      const registryRoot = join(temporaryRoot, 'acceptance', 'projects')
      mkdirSync(fixtureRoot, { recursive: true })
      mkdirSync(registryRoot, { recursive: true })
      writeFileSync(join(fixtureRoot, 'README.md'), 'fixture\n')
      writeFileSync(join(registryRoot, 'fresh.json'), JSON.stringify({
        id: 'fresh',
        kind: 'fresh-adoption',
        fixture: 'acceptance/fixtures/fresh',
        derivedFrom: 'sanitized-test-project',
        sanitizationVersion: 'v1',
        fixtureSha256: fixtureTreeSha256(fixtureRoot),
        coverage: ['fresh-adoption'],
        preserve: ['README.md'],
      }))

      expect(() => discoverReleaseProjectScenarios(temporaryRoot)).toThrow(/required project coverage is missing: .*published-upgrade/u)
    }
    finally {
      rmSync(temporaryRoot, { force: true, recursive: true })
    }
  })

  it('rejects preserved paths that escape a registered fixture', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'rsp-release-project-boundary-'))
    try {
      const fixtureRoot = join(temporaryRoot, 'acceptance', 'fixtures', 'fresh')
      const registryRoot = join(temporaryRoot, 'acceptance', 'projects')
      mkdirSync(fixtureRoot, { recursive: true })
      mkdirSync(registryRoot, { recursive: true })
      writeFileSync(join(temporaryRoot, 'acceptance', 'fixtures', 'outside.txt'), 'outside\n')
      writeFileSync(join(registryRoot, 'fresh.json'), JSON.stringify({
        id: 'fresh',
        kind: 'fresh-adoption',
        fixture: 'acceptance/fixtures/fresh',
        derivedFrom: 'sanitized-test-project',
        sanitizationVersion: 'v1',
        fixtureSha256: fixtureTreeSha256(fixtureRoot),
        coverage: ['fresh-adoption'],
        preserve: ['../outside.txt'],
      }))

      expect(() => discoverReleaseProjectScenarios(temporaryRoot)).toThrow('preserve must stay inside its fixture')
    }
    finally {
      rmSync(temporaryRoot, { force: true, recursive: true })
    }
  })

  it('rejects sanitized fixture drift without retaining fixture content', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'rsp-release-project-fingerprint-'))
    try {
      const fixtureRoot = join(temporaryRoot, 'acceptance', 'fixtures', 'fresh')
      const registryRoot = join(temporaryRoot, 'acceptance', 'projects')
      mkdirSync(fixtureRoot, { recursive: true })
      mkdirSync(registryRoot, { recursive: true })
      writeFileSync(join(fixtureRoot, 'README.md'), 'fixture\n')
      writeFileSync(join(registryRoot, 'fresh.json'), JSON.stringify({
        id: 'fresh',
        kind: 'fresh-adoption',
        fixture: 'acceptance/fixtures/fresh',
        derivedFrom: 'sanitized-test-project',
        sanitizationVersion: 'v1',
        fixtureSha256: fixtureTreeSha256(fixtureRoot),
        coverage: ['fresh-adoption'],
        preserve: ['README.md'],
      }))
      writeFileSync(join(fixtureRoot, 'README.md'), 'drifted private-shaped content\n')

      expect(() => discoverReleaseProjectScenarios(temporaryRoot)).toThrow('fixtureSha256 does not match')
    }
    finally {
      rmSync(temporaryRoot, { force: true, recursive: true })
    }
  })

  it('fingerprints a tracked diff larger than the default child-process buffer plus untracked changes', () => {
    const repository = mkdtempSync(join(tmpdir(), 'rsp-release-source-fingerprint-'))
    const git = (...args: string[]) => execFileSync('git', ['-C', repository, ...args], { encoding: 'utf8' })
    try {
      git('init', '--quiet')
      git('config', 'user.name', 'RSP Test')
      git('config', 'user.email', 'rsp-test@example.invalid')
      writeFileSync(join(repository, 'tracked.txt'), 'baseline\n')
      git('add', 'tracked.txt')
      git('commit', '--quiet', '-m', 'baseline')

      const clean = computeReleaseSourceIdentity(repository)
      const largeTrackedContent = 'x'.repeat(2 * 1024 * 1024)
      writeFileSync(join(repository, 'tracked.txt'), largeTrackedContent)
      const tracked = computeReleaseSourceIdentity(repository)
      writeFileSync(join(repository, 'untracked.txt'), 'untracked\n')
      const untracked = computeReleaseSourceIdentity(repository)

      expect(clean.dirty).toBe(false)
      expect(clean.fingerprintSha256).toMatch(/^[a-f0-9]{64}$/u)
      expect(tracked.dirty).toBe(true)
      expect(tracked.fingerprintSha256).toMatch(/^[a-f0-9]{64}$/u)
      expect(tracked.fingerprintSha256).not.toBe(clean.fingerprintSha256)
      expect(untracked.fingerprintSha256).not.toBe(tracked.fingerprintSha256)
    }
    finally {
      rmSync(repository, { force: true, recursive: true })
    }
  })
})
