import type { BrokerProjectConnection } from '../src/broker/client.js'
import type { ManageRuntimeProjectProjection } from '../src/runtime/manage.js'
import type { RuntimeProjectProjectionSnapshot } from '../src/runtime/model.js'
import type { ProjectStatusView } from '../src/status/model.js'
import type { WebSnapshot } from '../src/web/model.js'
import type { WebProjectionService } from '../src/web/service.js'
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { brokerProjectRequest, registerBrokerProject } from '../src/broker/client.js'
import { resolveBrokerPaths } from '../src/broker/host.js'
import {
  completeBrokerProjectPathInspection,
  discoverBrokerProject,
  prepareBrokerProjectPathInspection,
} from '../src/broker/project.js'
import { BrokerError, evaluateBrokerCompatibility } from '../src/broker/protocol.js'
import { startBrokerServer } from '../src/broker/server.js'
import { BrokerProjectSessions } from '../src/broker/sessions.js'
import { runWebCommand } from '../src/commands/web.js'
import { inspectArchiveHistory } from '../src/history/query.js'
import { createStoreManageRuntimeCapability } from '../src/runtime/manage.js'
import { inspectSpecs, readSpecsDetail, searchSpecs } from '../src/specs/query.js'
import { WEB_BOOTSTRAP_TTL_MS, WEB_SESSION_TTL_MS } from '../src/web/model.js'
import {
  managedRunLookupId,
  projectWebHistory,
  projectWebHistoryDetail,
  projectWebManaged,
  projectWebManagedRunDetail,
  projectWebOverview,
  projectWebSpecs,
  projectWebSpecsDetail,
  projectWebSpecsSearch,
} from '../src/web/projection.js'
import { createWebProjector } from '../src/web/runner.js'
import { createWebProjectionService } from '../src/web/service.js'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const webAssetsRoot = join(repositoryRoot, 'web', 'static')
const builtCli = join(repositoryRoot, 'dist', 'cli.mjs')
const builtWebProjector = join(repositoryRoot, 'dist', 'web-projector.mjs')

describe.sequential('web observatory', () => {
  it('requires the Web-capable Broker protocol minor before reuse', () => {
    expect(evaluateBrokerCompatibility({
      protocol: { major: 1, minor: 0 },
      runtimeSchema: { major: 1, minor: 1 },
    })).toMatchObject({
      compatible: false,
      reason: 'protocol-minor',
    })
  })

  it('projects bounded overview, Specs, history, source identities, and redacted text', () => {
    const overview = projectWebOverview({
      ok: true,
      manage: { activation: 'auto', closeout: 'local' },
      workspace: { activation: 'auto' },
      language: { artifacts: 'en', commit: 'en' },
      query: { focused: false, blocked: false, stale: null },
      focused: ['group/change'],
      records: [{
        output: {
          name: 'group/change',
          summary: 'Current goal at /private/project and /private/project-copy for https://tracker.example/private/issue/1 and https://tracker.example/private/issue/10 with sk-proj-ABCDEFGHIJKLMNOPQRSTUV credential',
          kind: 'feature',
          progress: { done: 2, total: 4 },
          ageDays: 0,
          isFocused: true,
          isBlocked: true,
          path: '.rsp/changes/group/change.md',
          issues: [{
            url: 'https://tracker.example/private/issue/1',
            relation: 'relates',
          }],
        },
        progressKnown: true,
        title: 'Change title',
        blockerEntries: ['Bearer abcdefghijklmnop must not escape'],
        readiness: {
          incompleteTasks: 2,
          incompleteVerify: 1,
          incompleteRequiredVerify: 1,
          incompleteOptionalVerify: 0,
          requiredVerify: { todo: 1, progress: 0, done: 0, dropped: 0, total: 1 },
          optionalVerify: { todo: 0, progress: 0, done: 0, dropped: 0, total: 0 },
          legacyVerify: false,
          completionGate: 'blocked',
          coverageWarnings: 0,
          activeBlockers: true,
          missingScenarios: false,
          deterministic: 'warnings',
          semantic: 'needs-review',
          archiveReady: 'no',
        },
      }],
      groups: [],
      plan: {
        nodes: [{ name: 'group/change', selection: 'selected', state: 'blocked' }],
        ready: [],
        edges: [],
        blocked: [{ change: 'group/change', requires: [], external: true }],
        waves: [],
      },
      summary: { total: 1, focused: 1, blocked: 1 },
      nextActions: ['Review current authority'],
      archiveTrend: [],
      diagnostics: [{
        severity: 'error',
        code: 'fixture',
        message: 'token=secret-value',
        path: '/tmp/project/.rsp/changes/group/change.md',
      }],
      runtime: [],
      hasExecutableChanges: true,
    } satisfies ProjectStatusView, {
      checkoutRoots: ['/private/project'],
      sensitiveUrls: ['https://tracker.example/private/issue/1'],
    })
    const specs = projectWebSpecs({
      source: { root: '/private/project', gitHead: 'abc', gitBranch: 'main', dirty: true },
      roots: { specs: '.rsp/specs', decisions: '.rsp/specs/decisions' },
      tree: { name: 'specs', path: '.rsp/specs', directories: [], documents: [] },
      decisionRecords: { name: 'decisions', path: '.rsp/specs/decisions', directories: [], documents: [] },
      documents: [{
        path: '.rsp/specs/design.md',
        kind: 'spec',
        title: 'Design',
        summary: 'npm_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        bytes: 120,
        headings: [],
      }],
      generatedIndexes: [],
      diagnostics: [],
      diagnosticSummary: { total: 0, returned: 0, hasMore: false },
      runtime: [],
      limits: { candidates: 1000, fileBytes: 1000, results: 100, searchExcerptCodePoints: 240, detailContentCodePoints: 12000 },
    })
    const history = projectWebHistory({
      rootExists: true,
      records: [{
        date: '2026-08-08',
        workRef: 'done',
        group: null,
        kind: 'feature',
        summary: 'Archived Bearer abcdefghijklmnop',
        summaryTruncated: false,
        path: '.rsp/archives/2026-08-08_done.md',
        sourcePath: '/private/project/.rsp/archives/2026-08-08_done.md',
        archivesDir: '/private/project/.rsp/archives',
        sourceSnapshot: {
          device: 1n,
          inode: 2n,
          size: 100n,
          mtimeNs: 200n,
          ctimeNs: 300n,
        },
        maxFileBytes: 512 * 1024,
      }],
      groupBriefs: [],
      diagnostics: [],
      diagnosticSummary: { total: 0, returned: 0, hasMore: false },
      runtime: [],
    })

    expect(overview.current.goal).toContain('[REDACTED]')
    expect(overview.current.goal).toContain('[CHECKOUT]')
    expect(overview.current.goal).toContain('/private/project-copy')
    expect(overview.current.goal).toContain('https://tracker.example/private/issue/10')
    expect(overview.current.goal).not.toMatch(/https:\/\/tracker\.example\/private\/issue\/1(?!0)/u)
    expect(overview.current.blockers.some(blocker => blocker.includes('[REDACTED]'))).toBe(true)
    expect(overview.diagnostics[0]).toMatchObject({
      message: '[REDACTED]',
      path: '.rsp/changes/group/change.md',
    })
    expect(specs.documents[0]?.summary).toBe('[REDACTED]')
    expect(history.records[0]?.summary).toBe('Archived [REDACTED]')
    expect(JSON.stringify({ overview, specs, history })).not.toMatch(/\/private\/project(?!-copy)/u)
  })

  it('redacts exact checkout paths, issue relationships, and complete PEM blocks across production projections', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-web-redaction-'))
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    initializeGitRepository(fixture, 'web-redaction')
    runCli(['init'], fixture)
    const checkoutPrefixCollision = `${fixture}-copy`
    const issueUrl = 'https://tracker.example/private/issue/1'
    const issuePrefixCollision = 'https://tracker.example/private/issue/10'
    const legitimateIssueSuffix = 'https://tracker.example/private/issue/1_suffix'
    const legitimateDelimiterSuffix = 'https://tracker.example/private/issue/1**'
    const safeDocsUrl = 'https://docs.example.com/rsp/runtime'
    const privateKeyBody = 'PRIVATEKEYBODYABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    await writeFile(join(fixture, '.rsp', 'specs', 'redaction.md'), `---
summary: "Checkout ${fixture}/private, sibling ${checkoutPrefixCollision}/private, issue ${issueUrl}, neighboring issue ${issuePrefixCollision}; docs ${safeDocsUrl}"
---

# Redaction

Checkout source: ${fixture}/.rsp/specs/redaction.md
Prefix-collision checkout: ${checkoutPrefixCollision}/.rsp/specs/redaction.md
Private issue: ${issueUrl}
Strong private issue: **${issueUrl}**
Emphasized private issue: _${issueUrl}_
Struck private issue: ~~${issueUrl}~~
Nested strong-emphasis private issue: **_${issueUrl}_**
Nested strike-strong private issue: ~~**${issueUrl}**~~
Neighboring public issue: ${issuePrefixCollision}
Legitimate suffixed issue: **${legitimateIssueSuffix}**
Legitimate delimiter suffix: **${legitimateDelimiterSuffix}**
Public documentation: ${safeDocsUrl}

-----BEGIN PRIVATE KEY-----
${privateKeyBody}
-----END PRIVATE KEY-----
`)
    await writeFile(join(fixture, '.rsp', 'archives', '2026-08-08_sensitive.md'), `---
kind: feature
issues:
  - url: ${issueUrl}
    relation: relates
---

# Change: sensitive

## Proposal
- Outcome: Archive from ${fixture}/work, retain ${checkoutPrefixCollision}/work, redact ${issueUrl}, and retain ${issuePrefixCollision}

## Spec
### Acceptance
#### Scenario: retained evidence
- GIVEN a safe archive
- WHEN projected
- THEN private context is removed

## Design
- Public documentation: ${safeDocsUrl}

## Tasks
- [x] -----BEGIN PRIVATE KEY-----
- [x] ${privateKeyBody}
- [x] -----END PRIVATE KEY-----
- [x] Preserve ${checkoutPrefixCollision}/evidence and ${issuePrefixCollision}
- [x] Preserve ${safeDocsUrl}

## Verify
- [x] Checked ${issueUrl}

## Blockers
- none
`)
    const specsInspection = await inspectSpecs({ cwd: fixture })
    const historyInspection = await inspectArchiveHistory({
      archivesDir: join(fixture, '.rsp', 'archives'),
    })
    const context = {
      checkoutRoots: [fixture],
      sensitiveUrls: [issueUrl],
    }

    const specs = projectWebSpecs(specsInspection, context)
    const specsDetail = await projectWebSpecsDetail(
      specsInspection,
      '.rsp/specs/redaction.md',
      'b'.repeat(64),
      context,
    )
    const specsSearch = await projectWebSpecsSearch(
      specsInspection,
      issueUrl,
      10,
      'b'.repeat(64),
      context,
    )
    const history = projectWebHistory(historyInspection, context)
    const historyDetail = await projectWebHistoryDetail(historyInspection, 'sensitive', context)
    const serialized = JSON.stringify({ specs, specsDetail, specsSearch, history, historyDetail })
    const withoutLegitimateSuffix = serialized
      .replaceAll(legitimateIssueSuffix, '')
      .replaceAll(legitimateDelimiterSuffix, '')

    expect(serialized).not.toContain(`${fixture}/`)
    expect(withoutLegitimateSuffix).not.toMatch(/https:\/\/tracker\.example\/private\/issue\/1(?!0)/u)
    expect(serialized).not.toContain(privateKeyBody)
    expect(serialized).not.toContain('BEGIN PRIVATE KEY')
    expect(serialized).not.toContain('END PRIVATE KEY')
    expect(serialized).toContain('[CHECKOUT]')
    expect(serialized).toContain('[REDACTED]')
    expect(serialized).toContain(`${checkoutPrefixCollision}/`)
    expect(serialized).toContain(issuePrefixCollision)
    expect(serialized).toContain(`**${legitimateIssueSuffix}**`)
    expect(serialized).toContain(`**${legitimateDelimiterSuffix}**`)
    expect(serialized).toContain(safeDocsUrl)
    expect(specsDetail.document.content).toContain('Strong private issue: **[REDACTED]**')
    expect(specsDetail.document.content).toContain('Emphasized private issue: _[REDACTED]_')
    expect(specsDetail.document.content).toContain('Struck private issue: ~~[REDACTED]~~')
    expect(specsDetail.document.content).toContain('Nested strong-emphasis private issue: **_[REDACTED]_**')
    expect(specsDetail.document.content).toContain('Nested strike-strong private issue: ~~**[REDACTED]**~~')
  })

  it('redacts complete Specs PEM ranges before Web detail truncation and search excerpts', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-web-specs-pem-'))
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    initializeGitRepository(fixture, 'web-specs-pem')
    runCli(['init'], fixture)
    const bodyNeedle = 'PEM-BODY-SEARCH-NEEDLE-0123456789'
    const path = '.rsp/specs/pem-boundary.md'
    await writeFile(join(fixture, path), `# PEM boundary

Safe preface.

-----BEGIN PRIVATE KEY-----
${bodyNeedle}
${'A'.repeat(12_500)}
-----END PRIVATE KEY-----

Safe suffix.
`)
    const inspection = await inspectSpecs({ cwd: fixture })

    const webDetail = await projectWebSpecsDetail(
      inspection,
      path,
      'c'.repeat(64),
    )
    const webBodySearch = await projectWebSpecsSearch(
      inspection,
      bodyNeedle,
      10,
      'c'.repeat(64),
    )
    const webEndSearch = await projectWebSpecsSearch(
      inspection,
      'END PRIVATE KEY',
      10,
      'c'.repeat(64),
    )

    expect(webDetail.document.contentTruncated).toBe(true)
    expect(webDetail.document.content).toContain('[REDACTED]')
    expect(webDetail.document.content).not.toContain(bodyNeedle)
    expect(webDetail.document.content).not.toContain('BEGIN PRIVATE KEY')
    expect(webDetail.document.content).not.toContain('END PRIVATE KEY')
    expect(webBodySearch.matches).toEqual([
      expect.objectContaining({ excerpt: '[REDACTED]' }),
    ])
    expect(webEndSearch.matches).toEqual([
      expect.objectContaining({ excerpt: '[REDACTED]' }),
    ])

    const cliDetail = await readSpecsDetail(inspection, path)
    const cliBodySearch = await searchSpecs(inspection, bodyNeedle)
    expect(cliDetail.contentTruncated).toBe(true)
    expect(cliDetail.content).toContain(bodyNeedle)
    expect(cliBodySearch.matches[0]?.excerpt).toContain(bodyNeedle)
  })

  it('keeps the previous complete browser snapshot visibly stale after failed or incompatible refresh', async () => {
    const browser = await loadBrowserModule()
    const snapshot = fixtureSnapshot('a'.repeat(64), 'first')
    let state = browser.applySnapshotSuccess(browser.createInitialState(), { ok: true, snapshot })
    expect(state.snapshot).toBe(snapshot)
    expect(state.stale).toBe(false)

    state = browser.applySnapshotFailure(state, { code: 'refresh_failed', message: 'bounded failure' })
    expect(state.snapshot).toBe(snapshot)
    expect(state.stale).toBe(true)
    expect(browser.renderAppHtml(state)).toContain('Stale snapshot')

    state = browser.applySnapshotSuccess(state, {
      ok: true,
      snapshot: { ...snapshot, projection: { major: 2, minor: 0 } },
    })
    expect(state.snapshot).toBe(snapshot)
    expect(state.error.code).toBe('web_projection_incompatible')
    expect(browser.escapeHtml('<script>"x"</script>')).toBe('&lt;script&gt;&quot;x&quot;&lt;/script&gt;')
  })

  it('atomically clears detail and search projections after a successful source refresh', async () => {
    const browser = await loadBrowserModule()
    const original = fixtureSnapshot('a'.repeat(64), 'original')
    original.specs.documents = [{
      path: '.rsp/specs/old.md',
      kind: 'spec',
      title: 'Old document',
      summary: null,
      bytes: 20,
    }]
    let state = browser.applySnapshotSuccess(browser.createInitialState(), { ok: true, snapshot: original })
    state = {
      ...state,
      view: 'specs',
      detail: {
        mode: 'detail',
        document: {
          path: '.rsp/specs/old.md',
          kind: 'spec',
          title: 'Old detail',
          summary: null,
          bytes: 20,
          content: 'deleted source content',
          contentTruncated: false,
        },
      },
      search: {
        mode: 'search',
        matches: [{
          path: '.rsp/specs/old.md',
          kind: 'spec',
          title: 'Old search result',
          heading: null,
          line: 1,
          excerpt: 'invalid search result',
        }],
        summary: { matched: 1, returned: 1 },
      },
    }

    const refreshed = fixtureSnapshot('a'.repeat(64), 'refreshed')
    refreshed.specs.documents = [{
      path: '.rsp/specs/new.md',
      kind: 'spec',
      title: 'New document',
      summary: null,
      bytes: 20,
    }]
    state = browser.applySnapshotSuccess(state, { ok: true, snapshot: refreshed })

    expect(state).toMatchObject({
      snapshot: refreshed,
      stale: false,
      detail: null,
      search: null,
    })
    const html = browser.renderAppHtml(state)
    expect(html).toContain('New document')
    expect(html).not.toContain('Old detail')
    expect(html).not.toContain('deleted source content')
    expect(html).not.toContain('invalid search result')
  })

  it('rejects deferred detail and search commits from an invalidated snapshot generation', async () => {
    const browser = await loadBrowserModule()
    const coordinator = browser.createProjectionRequestCoordinator()
    const original = fixtureSnapshot('a'.repeat(64), 'deferred-old')
    original.specs.documents = [{
      path: '.rsp/specs/old.md',
      kind: 'spec',
      title: 'Old document',
      summary: null,
      bytes: 20,
    }]
    let state = browser.applySnapshotSuccess(browser.createInitialState(), { ok: true, snapshot: original })
    state = { ...state, view: 'specs' }
    const oldSearch = deferred<any>()
    const duringRefreshDetail = deferred<any>()
    const searchRequest = coordinator.begin('search', state.snapshot)
    const searchCommit = oldSearch.promise.then((projection) => {
      state = browser.applyProjectionSuccess(state, 'search', projection, searchRequest, coordinator)
    })

    coordinator.invalidate()
    expect(searchRequest.signal.aborted).toBe(true)
    const detailRequest = coordinator.begin('detail', state.snapshot)
    const detailCommit = duringRefreshDetail.promise.then((projection) => {
      state = browser.applyProjectionSuccess(state, 'detail', projection, detailRequest, coordinator)
    })

    const refreshed = fixtureSnapshot('a'.repeat(64), 'deferred-new')
    refreshed.specs.documents = [{
      path: '.rsp/specs/new.md',
      kind: 'spec',
      title: 'New document',
      summary: null,
      bytes: 20,
    }]
    coordinator.invalidate()
    expect(detailRequest.signal.aborted).toBe(true)
    state = browser.applySnapshotSuccess(state, { ok: true, snapshot: refreshed })

    oldSearch.resolve({
      mode: 'search',
      matches: [{
        path: '.rsp/specs/old.md',
        kind: 'spec',
        title: 'Old search result',
        heading: null,
        line: 1,
        excerpt: 'deferred invalid search result',
      }],
      summary: { matched: 1, returned: 1 },
    })
    duringRefreshDetail.resolve({
      mode: 'detail',
      document: {
        path: '.rsp/specs/old.md',
        kind: 'spec',
        title: 'Deferred old detail',
        summary: null,
        bytes: 20,
        content: 'deferred deleted source content',
        contentTruncated: false,
      },
    })
    await Promise.all([searchCommit, detailCommit])

    expect(state.snapshot).toBe(refreshed)
    expect(state.detail).toBeNull()
    expect(state.search).toBeNull()
    const html = browser.renderAppHtml(state)
    expect(html).toContain('New document')
    expect(html).not.toContain('Deferred old detail')
    expect(html).not.toContain('deferred deleted source content')
    expect(html).not.toContain('deferred invalid search result')
  })

  it('renders bounded managed runs and unavailable fallback without inventing acceptance', async () => {
    const browser = await loadBrowserModule()
    const projection = fixtureManagedProjection()
    const freshness = new Map([['run-web-managed', {
      state: 'stale' as const,
      sourceSequence: 4,
      generatedAt: '2026-08-08T08:00:04.000Z',
      reasons: ['Run WorkRef is not present in the current open project projection'],
    }]])
    const managed = projectWebManaged(projection, freshness)
    const detail = projectWebManagedRunDetail(
      projection.runs[0]!,
      projection.attention,
      freshness.get('run-web-managed')!,
      { checkoutRoots: ['/private/project'] },
    )
    const snapshot = fixtureSnapshot('a'.repeat(64), 'managed')
    snapshot.managed = managed
    let state = browser.applySnapshotSuccess(browser.createInitialState(), { ok: true, snapshot })
    state = { ...state, view: 'runs', detail }

    const runHtml = browser.renderAppHtml(state)
    expect(runHtml).toContain('Runs')
    expect(runHtml).toContain('worker-web-1')
    expect(runHtml).toContain('missing')
    expect(runHtml).toContain('Objective: required verification')
    expect(runHtml).toContain('out-of-order · duplicates 1 · conflicts 0')
    expect(runHtml).toContain('out-of-order')
    expect(runHtml).toContain('parent missing')
    expect(runHtml.match(/parent missing · out-of-order/gu)).toHaveLength(2)
    expect(runHtml).toContain('conflicts 1')
    expect(runHtml).toContain('source sequence 4')
    expect(runHtml).toContain('[CHECKOUT]')
    expect(runHtml).toContain('web/static/app.js')
    expect(runHtml).toContain('[REDACTED]')
    expect(runHtml).not.toContain('/private/project')
    expect(runHtml).not.toContain('C:\\private')
    expect(JSON.stringify(detail)).not.toContain('sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    expect(runHtml).not.toContain('accepted')
    expect(managed.runs[0]).toMatchObject({
      runId: 'run-web-managed',
      attention: 1,
      terminalDeliveryObserved: false,
    })

    state = {
      ...state,
      view: 'attention',
      detail: null,
    }
    expect(browser.renderAppHtml(state)).toContain('Dispatch dispatch-web-1 has no committed receipt')

    snapshot.managed = fixtureSnapshot('a'.repeat(64), 'unavailable').managed
    state = browser.applySnapshotSuccess(state, { ok: true, snapshot })
    state = { ...state, view: 'runs' }
    const unavailableHtml = browser.renderAppHtml(state)
    expect(unavailableHtml).toContain('Managed runtime unavailable')
    expect(unavailableHtml).toContain('Overview, Specs, and History remain available')
  })

  it('deduplicates managed events and requests atomic recovery for sequence gaps', async () => {
    const browser = await loadBrowserModule()
    const snapshot = fixtureSnapshot('a'.repeat(64), 'events')
    let state = browser.applySnapshotSuccess(browser.createInitialState(), { ok: true, snapshot })
    const managed = projectWebManaged(
      fixtureManagedProjection(),
      new Map([['run-web-managed', {
        state: 'current',
        sourceSequence: 4,
        generatedAt: '2026-08-08T08:00:04.000Z',
        reasons: [],
      }]]),
    )
    let applied = browser.applyManagedEvent(state, {
      id: 1,
      type: 'managed-projection',
      projection: managed,
    })
    state = applied.state
    expect(applied.refresh).toBe(false)
    expect(state.snapshot.managed.runs).toHaveLength(1)

    applied = browser.applyManagedEvent(state, {
      id: 1,
      type: 'managed-projection',
      projection: fixtureSnapshot('a'.repeat(64), 'duplicate').managed,
    })
    expect(applied.state).toBe(state)
    expect(applied.refresh).toBe(false)

    applied = browser.applyManagedEvent(state, {
      id: 3,
      type: 'managed-projection',
      projection: managed,
    })
    expect(applied.refresh).toBe(true)
    expect(applied.state.managedConnection).toBe('recovering')

    applied = browser.applyManagedEvent({
      ...state,
      managedEventId: 99,
    }, {
      id: 2,
      type: 'managed-gap',
    })
    expect(applied.refresh).toBe(true)
    expect(applied.state.managedEventId).toBe(2)

    applied = browser.applyManagedEvent(browser.createInitialState(), {
      id: 1,
      type: 'managed-projection',
      projection: managed,
    })
    expect(applied.refresh).toBe(true)
    expect(applied.state.managedConnection).toBe('recovering')

    const events: any[] = []
    const parser = browser.createSseParser((event: any) => events.push(event))
    parser.push('id: 4\nevent: managed-pro')
    parser.push('jection\ndata: {"type":"managed-projection",')
    parser.push('"projectId":"x"}\n\n: keepalive\n\n')
    parser.finish()
    expect(events).toEqual([{
      id: 4,
      type: 'managed-projection',
      projectId: 'x',
    }])
  })

  it('keeps managed replay stable across unchanged polling, duplicates, and reconnect gaps', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-web-managed-replay-'))
    const projectRoot = join(fixture, 'project')
    initializeGitRepository(projectRoot, 'managed-replay')
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    let now = Date.parse('2026-08-08T08:00:00.000Z')
    const sessions = new BrokerProjectSessions(paths, 60_000, () => now)
    onTestFinished(async () => {
      sessions.close()
      await rm(fixture, { recursive: true, force: true })
    })
    const registration = await sessions.register(projectRoot)
    const bootstrap = sessions.createWebBootstrap(
      registration.project.projectId,
      registration.accessToken,
    )
    const authorization = sessions.consumeWebBootstrap(
      registration.project.projectId,
      bootstrap.bootstrapToken,
    )
    const received: any[] = []
    const subscription = await sessions.subscribeManagedWeb(
      registration.project.projectId,
      authorization.webToken,
      null,
      event => received.push(event),
    )
    onTestFinished(subscription.unsubscribe)
    expect(received.map(event => event.id)).toEqual([1])

    now += 1_000
    await sessions.managedRuntimeForWeb(registration.project.projectId, authorization.webToken)
    expect(received.map(event => event.id)).toEqual([1])

    const store = await sessions.runtimeFor(
      registration.project.projectId,
      registration.accessToken,
    )
    const capability = createStoreManageRuntimeCapability(store, () => new Date(now))
    await capability.observeRun({
      runId: 'run-replay',
      runKey: 'managed-replay',
      workRef: 'managed-replay',
      managerId: 'manager-replay',
      eventId: 'event-replay-start',
      idempotencyKey: 'idem-replay-start',
      phase: 'implementation',
      authorityRefs: ['.rsp/changes/managed-replay.md'],
      evidenceRefs: [],
    })
    await sessions.publishManagedRuntime(
      registration.project.projectId,
      registration.accessToken,
    )
    await sessions.publishManagedRuntime(
      registration.project.projectId,
      registration.accessToken,
    )
    expect(received.map(event => event.id)).toEqual([1, 2])

    const dispatchInput = {
      runId: 'run-replay',
      dispatchId: 'dispatch-replay',
      idempotencyKey: 'idem-dispatch-replay',
      lane: 'verify',
      workerId: 'worker-replay',
      objectiveRef: 'verify replay',
      evidenceRefs: [],
      stopBoundary: 'same-scope',
    }
    await capability.observeDispatch(dispatchInput)
    await sessions.publishManagedRuntime(
      registration.project.projectId,
      registration.accessToken,
    )
    await capability.observeDispatch(dispatchInput)
    await sessions.publishManagedRuntime(
      registration.project.projectId,
      registration.accessToken,
    )
    await expect(capability.observeDispatch({
      ...dispatchInput,
      objectiveRef: 'conflicting replay',
    })).rejects.toMatchObject({
      code: 'runtime_idempotency_conflict',
    })
    await sessions.publishManagedRuntime(
      registration.project.projectId,
      registration.accessToken,
    )
    expect(received.map(event => event.id)).toEqual([1, 2, 3, 4, 5])
    expect(received.at(-1)?.projection?.runs[0]?.dispatches[0]).toMatchObject({
      deliveryCount: 3,
      duplicateCount: 1,
      conflictCount: 1,
    })

    const replayed: any[] = []
    const replay = await sessions.subscribeManagedWeb(
      registration.project.projectId,
      authorization.webToken,
      4,
      event => replayed.push(event),
    )
    replay.unsubscribe()
    expect(replayed.map(event => event.id)).toEqual([5])

    const gap: any[] = []
    const gapSubscription = await sessions.subscribeManagedWeb(
      registration.project.projectId,
      authorization.webToken,
      99,
      event => gap.push(event),
    )
    gapSubscription.unsubscribe()
    expect(gap).toEqual([
      expect.objectContaining({
        id: 5,
        type: 'managed-gap',
        expectedAfter: 5,
        replayFrom: 1,
      }),
    ])
  })

  it('serializes concurrent managed projection refreshes before publishing newer event IDs', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-web-managed-refresh-'))
    const projectRoot = join(fixture, 'project')
    initializeGitRepository(projectRoot, 'managed-refresh')
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    let projectCalls = 0
    let releaseOld!: () => void
    const oldGate = new Promise<void>((resolve) => {
      releaseOld = resolve
    })
    const sessions = new BrokerProjectSessions(paths, 60_000, Date.now, {
      open: async options => (await import('../src/runtime/store.js')).openRuntimeEventStore(options),
      inspect: async () => runtimeProjectSnapshot('absent') as any,
      dispose: async () => [],
      project: async () => {
        projectCalls += 1
        if (projectCalls === 2)
          await oldGate
        return projectCalls < 3
          ? runtimeProjectSnapshot('absent')
          : runtimeProjectSnapshot('incompatible')
      },
    })
    onTestFinished(async () => {
      sessions.close()
      await rm(fixture, { recursive: true, force: true })
    })
    const registration = await sessions.register(projectRoot)
    const bootstrap = sessions.createWebBootstrap(
      registration.project.projectId,
      registration.accessToken,
    )
    const authorization = sessions.consumeWebBootstrap(
      registration.project.projectId,
      bootstrap.bootstrapToken,
    )
    const events: any[] = []
    const subscription = await sessions.subscribeManagedWeb(
      registration.project.projectId,
      authorization.webToken,
      null,
      event => events.push(event),
    )
    onTestFinished(subscription.unsubscribe)

    const older = sessions.managedRuntimeForWeb(
      registration.project.projectId,
      authorization.webToken,
    )
    await vi.waitFor(() => expect(projectCalls).toBe(2))
    const newer = sessions.managedRuntimeForWeb(
      registration.project.projectId,
      authorization.webToken,
    )
    await Promise.resolve()
    expect(projectCalls).toBe(2)
    releaseOld()
    await Promise.all([older, newer])

    expect(projectCalls).toBe(3)
    expect(events.map(event => event.projection?.state)).toEqual([
      'absent',
      'incompatible',
    ])
    expect(events.map(event => event.id)).toEqual([1, 2])
  })

  it('revalidates a Web bearer after a slow managed refresh before replay or subscription', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-web-managed-subscribe-auth-'))
    const projectRoot = join(fixture, 'project')
    initializeGitRepository(projectRoot, 'managed-subscribe-auth')
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    let now = Date.parse('2026-08-08T08:00:00.000Z')
    let projectCalls = 0
    let releaseRefresh!: () => void
    const refreshGate = new Promise<void>((resolve) => {
      releaseRefresh = resolve
    })
    const sessions = new BrokerProjectSessions(paths, 60_000, () => now, {
      open: async options => (await import('../src/runtime/store.js')).openRuntimeEventStore(options),
      inspect: async () => runtimeProjectSnapshot('absent') as any,
      dispose: async () => [],
      project: async () => {
        projectCalls += 1
        await refreshGate
        return runtimeProjectSnapshot('absent')
      },
    })
    onTestFinished(async () => {
      sessions.close()
      await rm(fixture, { recursive: true, force: true })
    })
    const registration = await sessions.register(projectRoot)
    const bootstrap = sessions.createWebBootstrap(
      registration.project.projectId,
      registration.accessToken,
    )
    const authorization = sessions.consumeWebBootstrap(
      registration.project.projectId,
      bootstrap.bootstrapToken,
    )
    const events: any[] = []
    const subscribing = sessions.subscribeManagedWeb(
      registration.project.projectId,
      authorization.webToken,
      null,
      event => events.push(event),
    )
    await vi.waitFor(() => expect(projectCalls).toBe(1))

    now += WEB_SESSION_TTL_MS
    releaseRefresh()

    await expect(subscribing).rejects.toMatchObject({
      code: 'web_session_unauthorized',
    })
    expect(events).toEqual([])
  })

  it('associates attention with a run only when source-reference type and identity both match', () => {
    const first = fixtureManagedProjection()
    const secondRun = structuredClone(first.runs[0]!)
    secondRun.run = {
      ...secondRun.run!,
      runId: 'run-web-second',
      runKey: 'rsp-4-runtime-second',
    }
    secondRun.freshness = {
      ...secondRun.freshness,
      sourceSequence: 1,
    }
    secondRun.dispatches = []
    secondRun.receipts = []
    secondRun.events = [{
      ...secondRun.events[0]!,
      eventId: 'dispatch-web-1',
      source: {
        type: 'event',
        id: 'dispatch-web-1',
        sequence: 1,
      },
    }]
    secondRun.timeline = []
    first.runs.push(secondRun)
    first.attention = [{
      kind: 'runtime-attention',
      summary: 'Typed event attention',
      dispatchId: null,
      receiptId: null,
      sourceRefs: [{
        type: 'event',
        id: 'dispatch-web-1',
        sequence: 1,
      }],
    }]

    const managed = projectWebManaged(first, new Map([
      ['run-web-managed', {
        state: 'current',
        sourceSequence: 4,
        generatedAt: first.generatedAt,
        reasons: [],
      }],
      ['run-web-second', {
        state: 'current',
        sourceSequence: 1,
        generatedAt: first.generatedAt,
        reasons: [],
      }],
    ]))

    expect(managed.runs.map(run => [run.runId, run.attention])).toEqual([
      ['run-web-managed', 0],
      ['run-web-second', 1],
    ])
    expect(managed.attention[0]).toMatchObject({
      runId: 'run-web-second',
    })
  })

  it('uses a stable opaque run lookup and marks symlink-escaped repository evidence stale', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-web-managed-lookup-'))
    const projectRoot = join(fixture, 'project')
    const outside = join(fixture, 'outside')
    initializeGitRepository(projectRoot, 'managed-lookup')
    runCli(['init'], projectRoot)
    await mkdir(outside)
    await writeFile(join(outside, 'authority.md'), '# Outside\n')
    await symlink(outside, join(projectRoot, 'linked'), 'dir')
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    const project = await discoverBrokerProject(projectRoot)
    const managed = fixtureManagedProjection()
    const rawRunId = `sk-proj-${'A'.repeat(300)}`
    managed.runs[0]!.run = {
      ...managed.runs[0]!.run!,
      runId: rawRunId,
    }
    managed.runs[0]!.freshness = {
      ...managed.runs[0]!.freshness,
      projectId: project.projectId,
    }
    managed.runs[0]!.authorityRefs = ['linked/authority.md']
    const overview = fixtureSnapshot(project.projectId, 'lookup').overview
    overview.records = [{
      workRef: managed.runs[0]!.run!.workRef,
      goal: 'Managed lookup',
      kind: 'feature',
      state: 'ready',
      progress: { done: 0, total: 1 },
    }]
    const service = createWebProjectionService({
      overview: async () => ({
        projection: overview,
        openWorkRefs: [managed.runs[0]!.run!.workRef],
        sensitiveUrls: [],
      }),
    })
    const lookupId = managedRunLookupId(project.projectId, rawRunId)
    const projected = await service.managed(project, managed)
    const detail = await service.runDetail(project, managed, lookupId)

    expect(projected.runs[0]).toMatchObject({
      lookupId,
      freshness: {
        state: 'stale',
        reasons: expect.arrayContaining([
          expect.stringContaining('repository reference(s) are unavailable in the current checkout'),
        ]),
      },
    })
    expect(projected.runs[0]!.runId).not.toBe(rawRunId)
    expect(detail.run.run?.runId).not.toBe(rawRunId)
    expect(detail.freshness.state).toBe('stale')
    expect(JSON.stringify({ projected, detail })).not.toContain(rawRunId)
  })

  it('uses the complete open WorkRef set for managed freshness beyond the bounded Overview list', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-web-managed-open-refs-'))
    const projectRoot = join(fixture, 'project')
    initializeGitRepository(projectRoot, 'managed-open-refs')
    runCli(['init'], projectRoot)
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    const project = await discoverBrokerProject(projectRoot)
    const managed = fixtureManagedProjection()
    managed.runs[0]!.run = {
      ...managed.runs[0]!.run!,
      workRef: 'zz-managed-open-ref',
    }
    managed.runs[0]!.freshness = {
      ...managed.runs[0]!.freshness,
      projectId: project.projectId,
      workRef: 'zz-managed-open-ref',
    }
    managed.runs[0]!.authorityRefs = []
    managed.runs[0]!.receipts = []
    const overview = fixtureSnapshot(project.projectId, 'bounded-open-refs').overview
    overview.records = Array.from({ length: 50 }, (_, index) => ({
      workRef: `change-${String(index).padStart(2, '0')}`,
      goal: null,
      kind: 'feature',
      state: 'open' as const,
      progress: { done: 0, total: 1 },
    }))
    const service = createWebProjectionService({
      overview: async () => ({
        projection: overview,
        openWorkRefs: [
          ...overview.records.map(record => record.workRef),
          'zz-managed-open-ref',
        ],
        sensitiveUrls: [],
      }),
    })

    const projected = await service.managed(project, managed)

    expect(projected.runs[0]!.freshness).toMatchObject({
      state: 'current',
      reasons: [],
    })
  })

  it('fails closed when a repository evidence ancestor is swapped after identity capture', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-web-managed-ancestor-swap-'))
    const projectRoot = join(fixture, 'project')
    const outside = join(fixture, 'outside')
    initializeGitRepository(projectRoot, 'managed-ancestor-swap')
    await mkdir(join(projectRoot, 'evidence'))
    await writeFile(join(projectRoot, 'evidence', 'current.md'), '# Current\n')
    await mkdir(outside)
    await writeFile(join(outside, 'current.md'), '# Outside\n')
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    const project = await discoverBrokerProject(projectRoot)
    const inspection = await prepareBrokerProjectPathInspection(project, 'evidence/current.md')

    await rename(join(projectRoot, 'evidence'), join(projectRoot, 'evidence-original'))
    await symlink(outside, join(projectRoot, 'evidence'), 'dir')

    await expect(completeBrokerProjectPathInspection(inspection)).rejects.toMatchObject({
      code: 'broker_project_path_escape',
    })
  })

  it('derives the actual overview in an isolated project process without changing the Broker cwd', async ({ onTestFinished }) => {
    expect(existsSync(builtWebProjector)).toBe(true)
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-web-projector-'))
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    initializeGitRepository(fixture, 'web-projector')
    runCli(['init'], fixture)
    runCli(['create', 'example', 'Example observable goal'], fixture)
    runCli(['group', 'create', 'runtime-group', 'Observe one managed Group'], fixture)
    const cwd = process.cwd()

    const overview = await createWebProjector(builtWebProjector).overview(fixture)

    expect(process.cwd()).toBe(cwd)
    expect(overview.projection.current).toMatchObject({
      workRef: 'example',
      goal: 'Example observable goal',
      state: 'focused',
    })
    expect(overview.openWorkRefs).toContain('example')
    expect(overview.openWorkRefs).toContain('runtime-group')
  })

  it('fails closed for projector timeout, max-buffer, invalid JSON, and incompatible output without leaving children', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-web-projector-failures-'))
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    const timeoutPidPath = join(fixture, 'timeout.pid')
    const overflowPidPath = join(fixture, 'overflow.pid')
    const timeoutEntry = join(fixture, 'timeout.mjs')
    const overflowEntry = join(fixture, 'overflow.mjs')
    const invalidEntry = join(fixture, 'invalid.mjs')
    const incompatibleEntry = join(fixture, 'incompatible.mjs')
    await writeFile(timeoutEntry, `import { writeFileSync } from 'node:fs'
writeFileSync(${JSON.stringify(timeoutPidPath)}, String(process.pid))
setInterval(() => {}, 1000)
`)
    await writeFile(overflowEntry, `import { writeFileSync } from 'node:fs'
writeFileSync(${JSON.stringify(overflowPidPath)}, String(process.pid))
process.stdout.write('x'.repeat(4096))
setInterval(() => {}, 1000)
`)
    await writeFile(invalidEntry, `process.stdout.write('not-json')
`)
    await writeFile(incompatibleEntry, `process.stdout.write(JSON.stringify({ ok: true, overview: {}, sensitiveUrls: [] }))
`)

    await expect(createWebProjector(timeoutEntry, {
      timeoutMs: 250,
      maxBufferBytes: 1024,
    }).overview(fixture)).rejects.toEqual(expect.objectContaining({
      code: 'web_overview_unavailable',
    }))
    expectProcessAbsent(Number(await readFile(timeoutPidPath, 'utf8')))

    await expect(createWebProjector(overflowEntry, {
      timeoutMs: 2_000,
      maxBufferBytes: 256,
    }).overview(fixture)).rejects.toEqual(expect.objectContaining({
      code: 'web_overview_unavailable',
    }))
    expectProcessAbsent(Number(await readFile(overflowPidPath, 'utf8')))

    await expect(createWebProjector(invalidEntry).overview(fixture)).rejects.toEqual(expect.objectContaining({
      code: 'web_projection_invalid',
    }))
    await expect(createWebProjector(incompatibleEntry).overview(fixture)).rejects.toEqual(expect.objectContaining({
      code: 'web_projection_invalid',
    }))
  })

  it('serves exact read-only project routes with one-time bootstrap, strict headers, atomic stale refresh, and checkout isolation', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-web-http-'))
    const firstRoot = join(fixture, 'first')
    const secondRoot = join(fixture, 'second')
    initializeGitRepository(firstRoot, 'first')
    initializeGitRepository(secondRoot, 'second')
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    let failRefresh = false
    let overflowRefresh = false
    const service = fixtureWebService(
      () => failRefresh,
      () => overflowRefresh,
    )
    const handle = await startBrokerServer({
      paths,
      packageVersion: '0.0.0-web-fixture',
      webAssetsRoot,
      webService: service,
    })
    onTestFinished(async () => {
      await handle.close()
      await rm(fixture, { recursive: true, force: true })
    })
    const first = await registerBrokerProject(handle.record, firstRoot)
    const second = await registerBrokerProject(handle.record, secondRoot)

    const page = await fetch(`${handle.record.endpoint}/web/${first.project.projectId}/`)
    expect(page.status).toBe(200)
    expect(page.headers.get('cache-control')).toBe('no-store')
    expect(page.headers.get('content-security-policy')).toContain(`default-src 'none'`)
    expect(page.headers.get('content-security-policy')).toContain(`frame-ancestors 'none'`)
    expect(page.headers.get('x-frame-options')).toBe('DENY')
    expect(page.headers.get('referrer-policy')).toBe('no-referrer')
    expect(page.headers.get('permissions-policy')).toContain('camera=()')
    const pageContent = await page.text()
    expect(pageContent).not.toContain(first.project.root)
    expect(pageContent).not.toContain(first.accessToken)

    const bootstrapValue = await brokerProjectRequest(
      first,
      `/v1/projects/${first.project.projectId}/web/bootstrap`,
      { method: 'POST' },
    ) as Record<string, any>
    expect(bootstrapValue.bootstrapToken).not.toBe(first.accessToken)
    const authorization = await consumeBootstrap(handle.record.endpoint, first.project.projectId, bootstrapValue.bootstrapToken)
    expect(authorization.response.status).toBe(200)
    const webToken = authorization.value.webToken as string
    expect(webToken).not.toBe(first.accessToken)

    const replay = await consumeBootstrap(handle.record.endpoint, first.project.projectId, bootstrapValue.bootstrapToken)
    expect(replay.response.status).toBe(401)
    expect(replay.value.error.code).toBe('web_bootstrap_invalid')

    const initial = await webFetch(handle.record.endpoint, first.project.projectId, 'snapshot', webToken)
    expect(initial.response.status).toBe(200)
    expect(initial.value.snapshot.source.projectId).toBe(first.project.projectId)
    expect(JSON.stringify(initial.value)).not.toContain(first.project.root)
    expect(JSON.stringify(initial.value)).not.toContain(first.accessToken)

    const streamResponse = await fetch(
      `${handle.record.endpoint}/v1/web/projects/${first.project.projectId}/events`,
      {
        headers: {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${webToken}`,
          Origin: handle.record.endpoint,
        },
      },
    )
    expect(streamResponse.status).toBe(200)
    expect(streamResponse.headers.get('content-type')).toContain('text/event-stream')
    const streamReader = streamResponse.body!.getReader()
    const firstStreamChunk = await readStreamChunk(streamReader)
    expect(firstStreamChunk).toContain('id: 1')
    expect(firstStreamChunk).toContain('event: managed-projection')
    expect(firstStreamChunk).not.toContain(first.project.root)
    expect(firstStreamChunk).not.toContain(first.accessToken)
    await streamReader.cancel()

    const gapResponse = await fetch(
      `${handle.record.endpoint}/v1/web/projects/${first.project.projectId}/events`,
      {
        headers: {
          'Accept': 'text/event-stream',
          'Authorization': `Bearer ${webToken}`,
          'Last-Event-ID': '999',
          'Origin': handle.record.endpoint,
        },
      },
    )
    expect(gapResponse.status).toBe(200)
    const gapReader = gapResponse.body!.getReader()
    const gapChunk = await readStreamChunk(gapReader)
    expect(gapChunk).toContain('event: managed-gap')
    expect(gapChunk).toContain('"expectedAfter":1')
    await gapReader.cancel()

    const invalidCursor = await fetch(
      `${handle.record.endpoint}/v1/web/projects/${first.project.projectId}/events`,
      {
        headers: {
          'Authorization': `Bearer ${webToken}`,
          'Last-Event-ID': 'not-a-sequence',
          'Origin': handle.record.endpoint,
        },
      },
    )
    expect(invalidCursor.status).toBe(400)
    const unauthorizedStream = await fetch(
      `${handle.record.endpoint}/v1/web/projects/${first.project.projectId}/events`,
      {
        headers: {
          Authorization: 'Bearer wrong-token',
          Origin: handle.record.endpoint,
        },
      },
    )
    expect(unauthorizedStream.status).toBe(401)

    const specsDetail = await authenticatedWebRequest(
      handle.record.endpoint,
      `/v1/web/projects/${first.project.projectId}/specs/detail?path=${encodeURIComponent('.rsp/specs/design.md')}`,
      webToken,
    )
    expect(specsDetail.response.status).toBe(200)
    expect(specsDetail.value.projection.document.path).toBe('.rsp/specs/design.md')
    const specsSearch = await authenticatedWebRequest(
      handle.record.endpoint,
      `/v1/web/projects/${first.project.projectId}/specs/search?q=runtime&limit=5`,
      webToken,
    )
    expect(specsSearch.response.status).toBe(200)
    expect(specsSearch.value.projection.query).toEqual({ literal: 'runtime', limit: 5 })
    const historyDetail = await authenticatedWebRequest(
      handle.record.endpoint,
      `/v1/web/projects/${first.project.projectId}/history/detail?workRef=done`,
      webToken,
    )
    expect(historyDetail.response.status).toBe(200)
    expect(historyDetail.value.projection.record.workRef).toBe('done')
    const pathTraversal = await authenticatedWebRequest(
      handle.record.endpoint,
      `/v1/web/projects/${first.project.projectId}/specs/detail?path=${encodeURIComponent('../secret.md')}`,
      webToken,
    )
    expect(pathTraversal.response.status).toBe(400)

    failRefresh = true
    const failed = await webFetch(handle.record.endpoint, first.project.projectId, 'refresh', webToken, 'POST')
    expect(failed.response.status).toBe(503)
    expect(failed.value).toMatchObject({
      ok: false,
      stale: {
        snapshotId: initial.value.snapshot.snapshotId,
        generatedAt: initial.value.snapshot.generatedAt,
      },
    })
    const cached = await webFetch(handle.record.endpoint, first.project.projectId, 'snapshot', webToken)
    expect(cached.value.snapshot.snapshotId).toBe(initial.value.snapshot.snapshotId)

    failRefresh = false
    overflowRefresh = true
    const oversized = await webFetch(handle.record.endpoint, first.project.projectId, 'refresh', webToken, 'POST')
    expect(oversized.response.status).toBe(503)
    expect(oversized.value).toMatchObject({
      ok: false,
      error: { code: 'broker_response_too_large' },
      stale: {
        snapshotId: initial.value.snapshot.snapshotId,
        generatedAt: initial.value.snapshot.generatedAt,
      },
    })
    const cachedAfterOversized = await webFetch(handle.record.endpoint, first.project.projectId, 'snapshot', webToken)
    expect(cachedAfterOversized.value.snapshot.snapshotId).toBe(initial.value.snapshot.snapshotId)

    const wrongToken = await webFetch(handle.record.endpoint, first.project.projectId, 'snapshot', 'wrong-token')
    expect(wrongToken.response.status).toBe(401)
    const crossProject = await webFetch(handle.record.endpoint, second.project.projectId, 'snapshot', webToken)
    expect(crossProject.response.status).toBe(401)

    const wrongOrigin = await fetch(`${handle.record.endpoint}/v1/web/projects/${first.project.projectId}/session`, {
      headers: {
        Authorization: `Bearer ${webToken}`,
        Origin: 'http://127.0.0.1:1',
      },
    })
    expect(wrongOrigin.status).toBe(403)

    const wrongMethod = await fetch(`${handle.record.endpoint}/v1/web/projects/${first.project.projectId}/snapshot`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${webToken}`,
        Origin: handle.record.endpoint,
      },
    })
    expect(wrongMethod.status).toBe(405)
    const invalidQuery = await fetch(`${handle.record.endpoint}/v1/web/projects/${first.project.projectId}/specs/search?q=x&extra=y`, {
      headers: {
        Authorization: `Bearer ${webToken}`,
        Origin: handle.record.endpoint,
      },
    })
    expect(invalidQuery.status).toBe(400)
    const writeAttempt = await fetch(`${handle.record.endpoint}/v1/web/projects/${first.project.projectId}/archive`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${webToken}`,
        Origin: handle.record.endpoint,
      },
    })
    expect(writeAttempt.status).toBe(404)
  }, 20_000)

  it('expires injected-clock Web credentials and consumes a concurrent bootstrap exactly once', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-web-session-clock-'))
    const projectRoot = join(fixture, 'project')
    initializeGitRepository(projectRoot, 'web-session-clock')
    const paths = resolveBrokerPaths({ root: join(fixture, 'cache') })
    let now = Date.parse('2026-08-08T00:00:00.000Z')
    const sessions = new BrokerProjectSessions(paths, 60_000, () => now)
    onTestFinished(async () => {
      sessions.close()
      await rm(fixture, { recursive: true, force: true })
    })
    const registration = await sessions.register(projectRoot)

    const expiredBootstrap = sessions.createWebBootstrap(
      registration.project.projectId,
      registration.accessToken,
    )
    now += WEB_BOOTSTRAP_TTL_MS
    expect(() => sessions.consumeWebBootstrap(
      registration.project.projectId,
      expiredBootstrap.bootstrapToken,
    )).toThrowError(expect.objectContaining({ code: 'web_bootstrap_invalid' }))

    const bootstrap = sessions.createWebBootstrap(
      registration.project.projectId,
      registration.accessToken,
    )
    const attempts = await Promise.allSettled([
      Promise.resolve().then(() => sessions.consumeWebBootstrap(
        registration.project.projectId,
        bootstrap.bootstrapToken,
      )),
      Promise.resolve().then(() => sessions.consumeWebBootstrap(
        registration.project.projectId,
        bootstrap.bootstrapToken,
      )),
    ])
    expect(attempts.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    expect(attempts.filter(result => result.status === 'rejected')).toHaveLength(1)
    const authorization = attempts.find(result => result.status === 'fulfilled')
    expect(authorization?.status).toBe('fulfilled')
    if (!authorization || authorization.status !== 'fulfilled')
      throw new Error('expected one successful Web bootstrap consumption')

    let unauthorizedClosures = 0
    const subscription = await sessions.subscribeManagedWeb(
      registration.project.projectId,
      authorization.value.webToken,
      null,
      () => {},
      () => {
        unauthorizedClosures += 1
      },
    )
    now += WEB_SESSION_TTL_MS
    expect(() => sessions.authorizeWeb(
      registration.project.projectId,
      authorization.value.webToken,
    )).toThrowError(expect.objectContaining({ code: 'web_session_unauthorized' }))
    expect(unauthorizedClosures).toBe(1)
    subscription.unsubscribe()
    now += 60_000
    expect(sessions.sweep()).toContain(registration.project.projectId)
  })

  it('keeps normal rsp web output credential-free and exposes fallback bootstrap only to an explicit TTY path', async () => {
    const connection = fixtureConnection()
    const bootstrapToken = 'B'.repeat(43)
    const logs: string[] = []
    const errors: string[] = []
    vi.spyOn(console, 'log').mockImplementation(value => logs.push(String(value)))
    vi.spyOn(console, 'error').mockImplementation(value => errors.push(String(value)))
    let openedUrl = ''
    const dependencies = {
      connect: async () => connection,
      createBootstrap: async () => ({
        bootstrapToken,
        expiresAt: '2026-08-08T12:00:00.000Z',
      }),
      openBrowser: async (url: string) => {
        openedUrl = url
      },
      stdoutIsTty: true,
      stderrIsTty: true,
    }

    const opened = await runWebCommand({}, dependencies)

    expect(opened.ok).toBe(true)
    expect(openedUrl).toContain(`#bootstrap=${bootstrapToken}`)
    expect(logs.join('\n')).not.toContain(bootstrapToken)
    expect(logs.join('\n')).not.toContain(connection.accessToken)

    logs.length = 0
    let bootstrapCalls = 0
    const nonInteractive = await runWebCommand({}, {
      ...dependencies,
      stdoutIsTty: false,
      stderrIsTty: false,
      createBootstrap: async () => {
        bootstrapCalls += 1
        return { bootstrapToken, expiresAt: '2026-08-08T12:00:00.000Z' }
      },
    })
    expect(nonInteractive.ok).toBe(false)
    expect(bootstrapCalls).toBe(0)
    expect(errors.join('\n')).not.toContain(bootstrapToken)

    logs.length = 0
    const printed = await runWebCommand({ printUrl: true }, dependencies)
    expect(printed.ok).toBe(true)
    expect(logs.join('\n')).toContain(bootstrapToken)

    logs.length = 0
    errors.length = 0
    const ttyFallback = await runWebCommand({}, {
      ...dependencies,
      openBrowser: async () => {
        throw new BrokerError('web_browser_open_failed', 'Unable to open the default browser')
      },
    })
    expect(ttyFallback.ok).toBe(true)
    expect(errors.join('\n')).toContain(bootstrapToken)

    logs.length = 0
    errors.length = 0
    const nonTtyOpenFailure = await runWebCommand({}, {
      ...dependencies,
      stderrIsTty: false,
      openBrowser: async () => {
        throw new BrokerError('web_browser_open_failed', 'Unable to open the default browser')
      },
    })
    expect(nonTtyOpenFailure.ok).toBe(false)
    expect(logs.join('\n')).not.toContain(bootstrapToken)
    expect(errors.join('\n')).not.toContain(bootstrapToken)
  })

  it('maps rsp web connection and registration failures to bounded path-free human and JSON output', async () => {
    const connection = fixtureConnection()
    const stdout: string[] = []
    const stderr: string[] = []
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: string | Uint8Array) => {
      stdout.push(String(chunk))
      return true
    }) as typeof process.stdout.write)
    const stderrSpy = vi.spyOn(console, 'error').mockImplementation(value => stderr.push(String(value)))
    const baseDependencies = {
      connect: async () => connection,
      createBootstrap: async () => ({
        bootstrapToken: 'B'.repeat(43),
        expiresAt: '2026-08-08T12:00:00.000Z',
      }),
      openBrowser: async () => {},
      stdoutIsTty: true,
      stderrIsTty: true,
    }
    const failures = [
      {
        code: 'broker_project_not_found',
        raw: 'Unable to resolve /Users/private/sk-proj-ABCDEFGHIJKLMNOPQRSTUV/repo',
        secret: '/Users/private/sk-proj-ABCDEFGHIJKLMNOPQRSTUV/repo',
      },
      {
        code: 'broker_project_not_checkout',
        raw: 'fatal: not a git repository: /Users/private/repo/.git',
        secret: 'fatal: not a git repository',
      },
      {
        code: 'broker_project_collision',
        raw: 'collision at /Users/private/repo-copy with token=super-secret-value',
        secret: '/Users/private/repo-copy',
      },
    ] as const

    try {
      for (const failure of failures) {
        stdout.length = 0
        stderr.length = 0
        const result = await runWebCommand({ json: true }, {
          ...baseDependencies,
          connect: async () => {
            throw new BrokerError(failure.code, failure.raw)
          },
        })

        expect(result.ok).toBe(false)
        expect(stderr).toEqual([])
        const output = stdout.join('')
        expect(JSON.parse(output)).toMatchObject({
          command: 'web',
          ok: false,
          error: { code: failure.code },
        })
        expect(output).not.toContain(failure.raw)
        expect(output).not.toContain(failure.secret)
        expect(output).not.toContain('super-secret-value')
        expect(output).not.toContain('sk-proj-ABCDEFGHIJKLMNOPQRSTUV')
      }

      stdout.length = 0
      stderr.length = 0
      const human = await runWebCommand({}, {
        ...baseDependencies,
        connect: async () => {
          throw new BrokerError(
            'broker_project_not_checkout',
            'fatal: /Users/private/repo is not a checkout',
          )
        },
      })
      expect(human.ok).toBe(false)
      expect(stdout).toEqual([])
      expect(stderr.join('\n')).toContain('rsp web must run inside one Git checkout.')
      expect(stderr.join('\n')).not.toContain('/Users/private/repo')
      expect(stderr.join('\n')).not.toContain('fatal:')

      stdout.length = 0
      stderr.length = 0
      await runWebCommand({ json: true }, {
        ...baseDependencies,
        connect: async () => {
          throw new BrokerError('broker_injected_/Users/private/repo', 'token=super-secret-value')
        },
      })
      expect(JSON.parse(stdout.join(''))).toEqual({
        command: 'web',
        ok: false,
        error: {
          code: 'web_command_failed',
          message: 'Unable to start the local Web Observatory.',
        },
      })
      expect(stderr).toEqual([])
    }
    finally {
      stdoutSpy.mockRestore()
      stderrSpy.mockRestore()
    }
  })
})

async function loadBrowserModule(): Promise<{
  createInitialState: () => any
  applySnapshotSuccess: (state: any, envelope: any) => any
  applySnapshotFailure: (state: any, error: any) => any
  applyManagedEvent: (state: any, event: any) => { state: any, refresh: boolean }
  createSseParser: (onEvent: (event: any) => void) => {
    push: (chunk: string) => void
    finish: () => void
  }
  createProjectionRequestCoordinator: () => any
  applyProjectionSuccess: (state: any, kind: 'detail' | 'search', projection: any, request: any, coordinator: any) => any
  renderAppHtml: (state: any) => string
  escapeHtml: (value: string) => string
}> {
  return import(pathToFileURL(join(webAssetsRoot, 'app.js')).href)
}

function fixtureWebService(
  shouldFail: () => boolean,
  shouldOverflow: () => boolean = () => false,
): WebProjectionService {
  return {
    async snapshot(project) {
      if (shouldFail())
        throw new BrokerError('web_fixture_refresh_failed', 'Bounded fixture refresh failed')
      const snapshot = fixtureSnapshot(project.projectId, project.projectId.slice(0, 8))
      if (shouldOverflow()) {
        snapshot.specs.documents = [{
          path: '.rsp/specs/oversized.md',
          kind: 'spec',
          title: 'x'.repeat(70 * 1024),
          summary: null,
          bytes: 70 * 1024,
        }]
      }
      return snapshot
    },
    async specsDetail(project, path) {
      return {
        mode: 'detail',
        source: fixtureSnapshot(project.projectId, 'detail').source,
        document: {
          path,
          kind: 'spec',
          title: 'Fixture detail',
          summary: null,
          bytes: 10,
          content: '# Fixture',
          contentTruncated: false,
        },
      }
    },
    async specsSearch(project, literal, limit) {
      return {
        mode: 'search',
        source: fixtureSnapshot(project.projectId, 'search').source,
        query: { literal, limit },
        matches: [],
        summary: { candidates: 0, searched: 0, matched: 0, returned: 0, hasMore: false },
      }
    },
    async historyDetail(_project, workRef) {
      return {
        mode: 'detail',
        record: {
          date: '2026-08-08',
          workRef,
          group: null,
          kind: 'feature',
          summary: 'Fixture',
          summaryTruncated: false,
          scenarioCount: 1,
          checkboxes: {
            tasks: { todo: 0, progress: 0, done: 1, dropped: 0, total: 1 },
            verify: { todo: 0, progress: 0, done: 1, dropped: 0, total: 1 },
          },
          evidence: {
            tasks: { items: ['done'], truncated: false },
            verify: { items: ['passed'], truncated: false },
            blockers: { items: [], truncated: false },
          },
        },
      }
    },
    async runDetail() {
      throw new BrokerError('web_managed_run_not_found', 'Fixture has no managed run')
    },
    async managed(_project, managed) {
      return {
        state: managed.state,
        available: managed.available,
        authoritative: false,
        diagnostic: managed.diagnostic,
        generatedAt: managed.generatedAt,
        runs: [],
        runsSummary: { total: 0, returned: 0, hasMore: false },
        attention: [],
        attentionSummary: { total: 0, returned: 0, hasMore: false },
      }
    },
  }
}

function fixtureSnapshot(projectId: string, label: string): WebSnapshot {
  return {
    projection: { major: 1, minor: 1 },
    snapshotId: `${label.padEnd(64, '0').slice(0, 64)}`,
    generatedAt: '2026-08-08T00:00:00.000Z',
    source: {
      projectId,
      gitHead: 'abc123',
      gitBranch: 'main',
      dirty: true,
      identities: {
        overview: 'o'.repeat(64),
        specs: 's'.repeat(64),
        history: 'h'.repeat(64),
        managed: 'm'.repeat(64),
      },
    },
    overview: {
      current: {
        workRef: label,
        goal: `Goal ${label}`,
        state: 'ready',
        blockers: [],
        nextAction: 'Review',
      },
      summary: { open: 1, focused: 0, blocked: 0 },
      records: [],
      recordsSummary: { total: 0, returned: 0, hasMore: false },
      diagnostics: [],
      diagnosticSummary: { total: 0, returned: 0, hasMore: false },
    },
    specs: {
      documents: [],
      summary: { total: 0, returned: 0, hasMore: false },
    },
    history: {
      records: [],
      summary: { total: 0, returned: 0, hasMore: false },
    },
    managed: {
      state: 'absent',
      available: false,
      authoritative: false,
      diagnostic: {
        code: 'runtime_database_absent',
        message: 'Managed runtime storage is absent for this checkout',
        action: null,
      },
      generatedAt: '2026-08-08T00:00:00.000Z',
      runs: [],
      runsSummary: { total: 0, returned: 0, hasMore: false },
      attention: [],
      attentionSummary: { total: 0, returned: 0, hasMore: false },
    },
  }
}

function fixtureManagedProjection(): ManageRuntimeProjectProjection {
  const dispatchSource = {
    type: 'dispatch' as const,
    id: 'dispatch-web-1',
    sequence: 2,
  }
  return {
    state: 'ready',
    available: true,
    authoritative: false,
    diagnostic: null,
    generatedAt: '2026-08-08T08:00:04.000Z',
    runs: [{
      available: true,
      authoritative: false,
      diagnostic: null,
      freshness: {
        projectId: 'a'.repeat(64),
        workRef: 'rsp-4-runtime/managed-run-observatory',
        sourceSequence: 4,
        generatedAt: '2026-08-08T08:00:04.000Z',
      },
      run: {
        runId: 'run-web-managed',
        runKey: 'rsp-4-runtime',
        workRef: 'rsp-4-runtime/managed-run-observatory',
        nextSequence: 5,
        createdAt: '2026-08-08T08:00:00.000Z',
        lastObservedAt: '2026-08-08T08:00:04.000Z',
      },
      status: 'observed',
      managerId: 'manager-web',
      phase: 'verification',
      authorityRefs: ['.rsp/changes/rsp-4-runtime/managed-run-observatory.md'],
      evidenceRefs: ['/private/project/secret-evidence', 'focused-tests'],
      terminalBoundary: null,
      terminalDeliveryObserved: false,
      actors: [{
        actorType: 'manager',
        actorId: 'manager-web',
        dispatchId: null,
        lane: null,
      }, {
        actorType: 'worker',
        actorId: 'worker-web-1',
        dispatchId: 'dispatch-web-1',
        lane: 'verify',
      }],
      dispatches: [{
        dispatchId: 'dispatch-web-1',
        sequence: 2,
        lane: 'verify',
        workerId: 'worker-web-1',
        parentState: 'missing',
        outOfOrder: true,
        objectiveRef: 'required verification',
        evidenceRefs: ['focused-tests'],
        stopBoundary: 'same-scope',
        receiptState: 'missing',
        terminalState: 'missing',
        receiptId: null,
        receiptResult: null,
        deliveryCount: 2,
        duplicateCount: 1,
        conflictCount: 0,
        source: dispatchSource,
      }],
      receipts: [{
        receiptId: 'receipt-web-1',
        eventId: 'sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        sequence: 3,
        dispatchId: 'dispatch-web-complete',
        actorId: 'worker-web-complete',
        result: 'verified',
        laneObjectiveRef: 'browser verification',
        evidenceRefs: ['focused-tests'],
        changedPaths: [
          'web/static/app.js',
          '/private/project/secret-path',
          'C:\\private\\secret-path',
        ],
        verificationRefs: ['vitest-web-observatory'],
        stopBoundary: 'same-scope',
        deliveryCount: 2,
        duplicateCount: 1,
        conflictCount: 1,
        source: {
          type: 'receipt',
          id: 'receipt-web-1',
          sequence: 3,
        },
      }],
      events: [{
        eventId: 'event-web-started',
        sequence: 1,
        kind: 'manage-run-started',
        actorType: 'manager',
        actorId: 'manager-web',
        dispatchId: null,
        phase: 'implementation',
        summary: 'Managed run observed',
        evidenceRefs: [],
        sourceRefs: [],
        stopBoundary: null,
        parentState: 'missing',
        outOfOrder: true,
        deliveryCount: 1,
        duplicateCount: 0,
        conflictCount: 0,
        source: {
          type: 'event',
          id: 'event-web-started',
          sequence: 1,
        },
      }],
      timeline: [{
        type: 'event',
        id: 'event-web-started',
        sequence: 1,
        actorType: 'manager',
        actorId: 'manager-web',
        dispatchId: null,
        kind: 'manage-run-started',
        summary: 'Managed run observed',
        parentState: 'missing',
        outOfOrder: true,
        duplicateCount: 0,
        conflictCount: 0,
        source: {
          type: 'event',
          id: 'event-web-started',
          sequence: 1,
        },
      }, {
        type: 'dispatch',
        id: 'dispatch-web-1',
        sequence: 2,
        actorType: 'worker',
        actorId: 'worker-web-1',
        dispatchId: 'dispatch-web-1',
        kind: 'dispatch',
        summary: 'required verification',
        parentState: 'missing',
        outOfOrder: true,
        duplicateCount: 1,
        conflictCount: 0,
        source: dispatchSource,
      }],
      truncated: false,
    }],
    runsTruncated: false,
    attention: [{
      kind: 'missing-receipt',
      summary: 'Dispatch dispatch-web-1 has no committed receipt',
      dispatchId: 'dispatch-web-1',
      receiptId: null,
      sourceRefs: [dispatchSource, {
        type: 'event',
        id: 'sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        sequence: 99,
      }],
    }],
    attentionTruncated: false,
  }
}

function runtimeProjectSnapshot(
  state: 'absent' | 'incompatible',
): RuntimeProjectProjectionSnapshot {
  return {
    state,
    schema: null,
    diagnostic: {
      code: state === 'absent'
        ? 'runtime_database_absent'
        : 'runtime_schema_incompatible',
      message: state === 'absent'
        ? 'Managed runtime storage is absent for this checkout'
        : 'Managed runtime storage is incompatible for this checkout',
      action: null,
    },
    runs: [],
    runsTruncated: false,
    projections: [],
  }
}

async function consumeBootstrap(endpoint: string, projectId: string, bootstrapToken: string) {
  const response = await fetch(`${endpoint}/v1/web/bootstrap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': endpoint,
    },
    body: JSON.stringify({ projectId, bootstrapToken }),
  })
  return {
    response,
    value: await response.json() as Record<string, any>,
  }
}

async function webFetch(
  endpoint: string,
  projectId: string,
  action: 'snapshot' | 'refresh',
  token: string,
  method: 'GET' | 'POST' = 'GET',
) {
  const response = await fetch(`${endpoint}/v1/web/projects/${projectId}/${action}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: endpoint,
    },
  })
  return {
    response,
    value: await response.json() as Record<string, any>,
  }
}

async function authenticatedWebRequest(endpoint: string, path: string, token: string) {
  const response = await fetch(`${endpoint}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Origin: endpoint,
    },
  })
  return {
    response,
    value: await response.json() as Record<string, any>,
  }
}

async function readStreamChunk(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<string> {
  const result = await Promise.race([
    reader.read(),
    new Promise<never>((_, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out waiting for SSE data')), 2_000)
      timeout.unref()
    }),
  ])
  if (result.done)
    throw new Error('SSE stream ended before one event was received')
  return new TextDecoder().decode(result.value)
}

function fixtureConnection(): BrokerProjectConnection {
  const projectId = 'a'.repeat(64)
  return {
    broker: {
      schema: 1,
      instanceId: 'fixture-instance',
      pid: process.pid,
      processIdentity: 'fixture-process',
      endpoint: 'http://127.0.0.1:43210',
      protocol: { major: 1, minor: 0 },
      runtimeSchema: { major: 1, minor: 1 },
      packageVersion: '0.0.0',
      controlToken: 'control-token-control-token-control',
      startedAt: '2026-08-08T00:00:00.000Z',
    },
    project: {
      projectId,
      root: '/fixture',
      filesystem: { device: '1', inode: '2' },
      loadedAt: '2026-08-08T00:00:00.000Z',
      lastAccessAt: '2026-08-08T00:00:00.000Z',
    },
    accessToken: 'project-access-token-project-access-token',
  }
}

function deferred<T>(): {
  promise: Promise<T>
  resolve: (value: T) => void
} {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise
  })
  return { promise, resolve }
}

function initializeGitRepository(root: string, label: string): void {
  execFileSync('git', ['init', '-q', root])
  execFileSync('git', ['-C', root, 'config', 'user.email', 'rsp-web@example.invalid'])
  execFileSync('git', ['-C', root, 'config', 'user.name', 'RSP Web Fixture'])
  execFileSync('git', ['-C', root, 'commit', '--allow-empty', '-qm', label])
}

function runCli(args: string[], cwd: string): void {
  const result = spawnSync(process.execPath, [builtCli, ...args], {
    cwd,
    encoding: 'utf8',
  })
  expect(result.status, result.stderr || result.stdout).toBe(0)
}

function expectProcessAbsent(pid: number): void {
  expect(Number.isSafeInteger(pid) && pid > 0).toBe(true)
  let running = true
  try {
    process.kill(pid, 0)
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH')
      running = false
    else
      throw error
  }
  expect(running).toBe(false)
}
