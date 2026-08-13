import type { ManageRuntimeProjectProjection } from '../src/runtime/manage.js'
import type { ProjectStatusView } from '../src/status/model.js'
import type { WebSnapshot } from '../src/web/model.js'
import { Buffer } from 'node:buffer'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  completeBrokerProjectPathInspection,
  discoverBrokerProject,
  prepareBrokerProjectPathInspection,
} from '../src/broker/project.js'
import { evaluateBrokerCompatibility } from '../src/broker/protocol.js'
import { inspectArchiveHistory } from '../src/history/query.js'
import { inspectSpecs, readSpecsDetail, searchSpecs } from '../src/specs/query.js'
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
const builtCli = join(repositoryRoot, 'dist', 'cli.mjs')

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
    const historyDetail = await projectWebHistoryDetail(historyInspection, history.records[0]!.lookupId, context)
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

  it('redacts complete Specs PEM ranges before complete Web detail projection and search excerpts', async ({ onTestFinished }) => {
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

    expect(webDetail.document.contentTruncated).toBe(false)
    expect(webDetail.document.content).toContain('[REDACTED]')
    expect(webDetail.document.content).toContain('Safe suffix.')
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

  it('projects a normal long Spec completely beyond the former source and Markdown ceilings', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-web-specs-complete-'))
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    initializeGitRepository(fixture, 'web-specs-complete')
    runCli(['init'], fixture)
    const path = '.rsp/specs/complete-long-document.md'
    const finalMarker = 'FINAL-COMPLETE-SPEC-PARAGRAPH'
    const paragraphs = Array.from(
      { length: 9000 },
      (_, index) => `Paragraph ${index}: complete content.`,
    )
    await writeFile(join(fixture, path), `# Complete long document\n\n${paragraphs.join('\n\n')}\n\n${finalMarker}\n`)
    const inspection = await inspectSpecs({ cwd: fixture })

    const detail = await projectWebSpecsDetail(inspection, path, 'e'.repeat(64))
    const markdown = JSON.stringify(detail.document.markdown)

    expect(detail.document.bytes).toBeGreaterThan(100 * 1024)
    expect(detail.document.contentTruncated).toBe(false)
    expect(detail.document.markdown.bounded).toBe(false)
    expect(detail.document.content).toContain(finalMarker)
    expect(markdown).toContain(finalMarker)
  })

  it('projects representative and hostile Markdown only after redaction and bounding', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-web-markdown-'))
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    initializeGitRepository(fixture, 'web-markdown')
    runCli(['init'], fixture)
    const path = '.rsp/specs/markdown.md'
    const privateUrl = 'https://tracker.example/private/markdown/1'
    await writeFile(join(fixture, path), `# Safe **Markdown**

Paragraph with *emphasis*, \`inline code\`, and a [safe link](https://docs.example.com/rsp "Docs").

> Quoted guidance

- [x] completed
- [ ] open
  - nested item

\`\`\`ts
const checkout = '${fixture}/secret'
\`\`\`

<script>globalThis.compromised = true</script>

[unsafe](javascript:alert(1))

![remote image](https://images.example/private.png)

Private relationship: ${privateUrl}

${'> '.repeat(12)}excessively nested
`)
    const inspection = await inspectSpecs({ cwd: fixture })
    const detail = await projectWebSpecsDetail(
      inspection,
      path,
      'd'.repeat(64),
      { checkoutRoots: [fixture], sensitiveUrls: [privateUrl] },
    )
    const markdown = JSON.stringify(detail.document.markdown)

    expect(detail.document.content).toContain('<script>globalThis.compromised = true</script>')
    expect(detail.document.content).toContain('![remote image](https://images.example/private.png)')
    expect(detail.document.content).toContain('[REDACTED]')
    expect(detail.document.content).not.toContain(`${fixture}/`)
    expect(markdown).toContain('"type":"heading"')
    expect(markdown).toContain('"type":"strong"')
    expect(markdown).toContain('"type":"emphasis"')
    expect(markdown).toContain('"type":"inline-code"')
    expect(markdown).toContain('"type":"blockquote"')
    expect(markdown).toContain('"type":"code"')
    expect(markdown).toContain('"checked":true')
    expect(markdown).toContain('"checked":false')
    expect(markdown).toContain('"href":"https://docs.example.com/rsp"')
    expect(markdown).toContain('[CHECKOUT]')
    expect(markdown).toContain('[REDACTED]')
    expect(markdown).not.toContain('<script>')
    expect(markdown).not.toContain('javascript:')
    expect(markdown).not.toContain('images.example')
    expect(detail.document.markdown.unsupported).toBe(true)
    expect(detail.document.markdown.bounded).toBe(true)
    expect(Buffer.byteLength(JSON.stringify(detail), 'utf8')).toBeLessThan(16 * 1024 * 1024)
    const packageManifest = JSON.parse(await readFile(join(repositoryRoot, 'package.json'), 'utf8'))
    expect(packageManifest.dependencies['mdast-util-from-markdown']).toBeUndefined()
    expect(packageManifest.devDependencies['mdast-util-from-markdown']).toMatch(/^\^2\./u)
  })

  it('keeps frontmatter in source while projecting metadata and benign RSP metavariables', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-web-frontmatter-'))
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    initializeGitRepository(fixture, 'web-frontmatter')
    runCli(['init'], fixture)
    const path = '.rsp/specs/decisions/rendered-metadata.md'
    await mkdir(dirname(join(fixture, path)), { recursive: true })
    await writeFile(join(fixture, path), `---
title: Rendered Metadata
summary: Metadata remains readable without becoming document content.
kind: decision
status: accepted
---

# Rendered Metadata

Use \`- requires \\\`<change-work-ref>\\\`: <reason>\` for an exact prerequisite.
`)
    const inspection = await inspectSpecs({ cwd: fixture })
    const detail = await projectWebSpecsDetail(inspection, path, 'e'.repeat(64))
    const markdown = JSON.stringify(detail.document.markdown)

    expect(detail.document.content).toContain('title: Rendered Metadata')
    expect(detail.document.metadata).toEqual({
      kind: 'decision',
      status: 'accepted',
    })
    expect(detail.document.markdown.blocks[0]).toEqual({
      type: 'heading',
      depth: 1,
      children: [{ type: 'text', value: 'Rendered Metadata' }],
    })
    expect(markdown).not.toContain('title: Rendered Metadata')
    expect(markdown).toContain('"value":"<change-work-ref>"')
    expect(markdown).toContain('"value":"<reason>"')
    expect(detail.document.markdown.unsupported).toBe(false)
  })

  it('uses distinct opaque history lookup IDs for repeated archives of the same WorkRef', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-web-history-lookup-'))
    onTestFinished(() => rm(fixture, { recursive: true, force: true }))
    const archivesDir = join(fixture, '.rsp', 'archives')
    await mkdir(archivesDir, { recursive: true })
    await writeFile(join(archivesDir, '2026-08-08_repeated.md'), `---
kind: feature
---

# Change: repeated

## Proposal
- Outcome: First archived outcome

## Spec
### Acceptance
#### Scenario: first archive
- GIVEN the first archive
- WHEN its detail is selected
- THEN the first outcome is shown

## Tasks
- [x] First archived task

## Verify
- [x] First archived verification

## Blockers
- none
`)
    await writeFile(join(archivesDir, '2026-08-09_repeated.md'), `---
kind: feature
---

# Change: repeated

## Proposal
- Outcome: Second archived outcome

## Spec
### Acceptance
#### Scenario: second archive
- GIVEN the second archive
- WHEN its detail is selected
- THEN the second outcome is shown

## Tasks
- [x] Second archived task

## Verify
- [x] Second archived verification

## Blockers
- none
`)

    const inspection = await inspectArchiveHistory({ archivesDir })
    const history = projectWebHistory(inspection)
    const repeated = history.records.filter(record => record.workRef === 'repeated')

    expect(repeated).toHaveLength(2)
    expect(repeated[0]!.lookupId).toMatch(/^[a-f0-9]{64}$/u)
    expect(repeated[1]!.lookupId).toMatch(/^[a-f0-9]{64}$/u)
    expect(repeated[0]!.lookupId).not.toBe(repeated[1]!.lookupId)

    const details = await Promise.all(repeated.map(record =>
      projectWebHistoryDetail(inspection, record.lookupId),
    ))
    expect(details.map(detail => detail.record.summary).sort()).toEqual([
      'First archived outcome',
      'Second archived outcome',
    ])
    expect(details.map(detail => detail.document.content)).toEqual(expect.arrayContaining([
      expect.stringContaining('First archived task'),
      expect.stringContaining('Second archived task'),
    ]))
    expect(details.every(detail => detail.document.contentTruncated === false)).toBe(true)
    expect(details.every(detail => detail.document.markdown.blocks.length > 0)).toBe(true)
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

  it('keeps detail failures scoped without marking the complete snapshot stale', async () => {
    const browser = await loadBrowserModule()
    const snapshot = fixtureSnapshot('a'.repeat(64), 'operation-failure')
    const state = browser.applySnapshotSuccess(browser.createInitialState(), { ok: true, snapshot })
    const failed = browser.applyOperationFailure(state, {
      code: 'web_query_invalid',
      message: 'Web query parameters do not match the route contract',
    })

    expect(failed.snapshot).toBe(snapshot)
    expect(failed.stale).toBe(false)
    expect(failed.error).toBeNull()
    expect(failed.notice).toMatchObject({
      tone: 'warning',
      code: 'web_query_invalid',
    })
    expect(browser.renderAppHtml(failed)).toContain('View update needs attention')
    expect(browser.renderAppHtml(failed)).not.toContain('Stale snapshot')
  })

  it('defaults to visible auto refresh without a retained transport route', async () => {
    const browser = await loadBrowserModule()
    const snapshot = fixtureSnapshot('a'.repeat(64), 'auto-refresh')
    let state = browser.applySnapshotSuccess(browser.createInitialState(), { ok: true, snapshot })

    expect(state.autoRefresh).toBe(true)
    expect(browser.shouldAutoRefresh(state, 'visible')).toBe(true)
    expect(browser.shouldAutoRefresh(state, 'hidden')).toBe(false)
    expect(browser.shouldAutoRefresh({ ...state, detail: { mode: 'detail' } }, 'visible')).toBe(false)
    expect(browser.shouldAutoRefresh({ ...state, search: { mode: 'search' } }, 'visible')).toBe(false)
    state = browser.applyAutoRefreshSelection(state, false)
    expect(browser.shouldAutoRefresh(state, 'visible')).toBe(false)
    expect(browser.AUTO_REFRESH_INTERVAL_MS).toBe(30_000)
  })

  it('marks repeated legacy History records ambiguous without disabling the live snapshot', async () => {
    const browser = await loadBrowserModule()
    const snapshot = fixtureSnapshot('a'.repeat(64), 'legacy-history')
    snapshot.history.records = [
      {
        date: '2026-08-10',
        workRef: 'repeated',
        group: null,
        kind: 'feature',
        summary: 'Newer archive',
        summaryTruncated: false,
      },
      {
        date: '2026-08-08',
        workRef: 'repeated',
        group: null,
        kind: 'feature',
        summary: 'Older archive',
        summaryTruncated: false,
      },
      {
        date: '2026-08-07',
        workRef: 'unique',
        group: null,
        kind: 'fix',
        summary: 'Unique archive',
        summaryTruncated: false,
      },
    ] as any
    snapshot.history.summary = { total: 3, returned: 3, hasMore: false }
    const state = {
      ...browser.applySnapshotSuccess(browser.createInitialState(['zh-CN']), { ok: true, snapshot }),
      view: 'history',
    }
    const html = browser.renderAppHtml(state)

    expect(html.match(/data-history-ambiguous="true"/gu)).toHaveLength(2)
    expect(html).toContain('data-history-work-ref="unique"')
    expect(state.stale).toBe(false)
  })

  it('does not route retained browser source to the removed Web command', async () => {
    const browser = await loadBrowserModule()
    const state = browser.applySnapshotFailure(browser.createInitialState(['zh-CN']), {
      code: 'web_bootstrap_missing',
      messageKey: 'bootstrapMissing',
    })
    const html = browser.renderAppHtml(state)

    expect(html).toContain('网页观测台不可用')
    expect(html).toContain('默认软件包不交付 Web Observatory')
    expect(html).not.toContain('rsp web')
    expect(html).not.toContain('data-action="copy-recovery-command"')
  })

  it('resolves browser languages, keeps catalog parity, and switches locale without side effects', async () => {
    const browser = await loadBrowserModule()
    const i18n = await loadBrowserI18nModule()
    expect(browser.createInitialState(['fr-FR', 'zh-Hans-SG']).locale).toBe('zh-CN')
    expect(browser.createInitialState(['zh-SG']).locale).toBe('zh-CN')
    expect(browser.createInitialState(['zh-CN-u-nu-hanidec']).locale).toBe('zh-CN')
    expect(browser.createInitialState(['en-US', 'zh-CN']).locale).toBe('en')
    expect(browser.createInitialState(['zh-TW', 'de-DE']).locale).toBe('en')
    expect(browser.createInitialState([]).locale).toBe('en')
    expect(Object.keys(i18n.catalogs.en).sort()).toEqual(Object.keys(i18n.catalogs['zh-CN']).sort())

    const snapshot = fixtureSnapshot('a'.repeat(64), 'locale-switch')
    const detail = { mode: 'detail', document: { path: '.rsp/specs/runtime.md' } }
    const search = { mode: 'search', query: { literal: 'runtime' }, matches: [] }
    const webToken = { value: 'in-memory-only' }
    const state = {
      ...browser.applySnapshotSuccess(browser.createInitialState(['en-US']), { ok: true, snapshot }),
      view: 'specs',
      detail,
      search,
      webToken,
    }
    const switched = browser.applyLocaleSelection(state, 'zh-CN')
    expect(switched).toMatchObject({ locale: 'zh-CN', view: 'specs' })
    expect(switched.snapshot).toBe(snapshot)
    expect(switched.detail).toBe(detail)
    expect(switched.search).toBe(search)
    expect(switched.webToken).toBe(webToken)
    expect(browser.applyLocaleSelection(switched, 'zh-CN')).toBe(switched)
    expect(browser.applyLocaleSelection(switched, 'fr-FR')).toBe(switched)
  })

  it('renders Chinese Web text while preserving projected and canonical values', async () => {
    const browser = await loadBrowserModule()
    const snapshot = fixtureSnapshot('a'.repeat(64), 'localized')
    snapshot.overview.current = {
      workRef: 'rsp-4-runtime/web-localization',
      goal: 'Repository-authored goal stays in English',
      state: 'ready',
      blockers: ['Owner-authored blocker stays exact'],
      nextAction: 'Run focused verification',
    }
    snapshot.overview.records = [{
      workRef: 'canonical/work-ref',
      kind: 'feature',
      goal: 'Projected summary stays exact',
      state: 'blocked',
      progress: { done: 1, total: 2 },
    }]
    snapshot.overview.recordsSummary = { total: 1, returned: 1, hasMore: false }
    let state = browser.applySnapshotSuccess(browser.createInitialState(['zh-CN']), { ok: true, snapshot })
    const overviewHtml = browser.renderAppHtml(state)
    expect(overviewHtml).toContain('当前工作')
    expect(overviewHtml).toContain('rsp-4-runtime/web-localization')
    expect(overviewHtml).toContain('Repository-authored goal stays in English')
    expect(overviewHtml).toContain('Owner-authored blocker stays exact')
    expect(overviewHtml).toContain('feature · 1/2 · blocked')
    expect(overviewHtml).toContain('class="language-switch" role="group"')
    expect(overviewHtml).toContain('data-locale="zh-CN" aria-pressed="true"')
    expect(overviewHtml).toContain('data-locale="en" aria-pressed="false"')
    expect(overviewHtml).toContain('data-action="auto-refresh" aria-pressed="true"')
    expect(overviewHtml).toContain('class="card span-4 metric-card"')

    state = { ...state, view: 'runs' }
    const unavailableHtml = browser.renderAppHtml(state)
    expect(unavailableHtml).toContain('托管运行时不可用')
    expect(unavailableHtml).toContain('Managed runtime storage is absent for this checkout')
    expect(unavailableHtml).toContain('概览、规范和历史仍然可用')

    const timestamp = '2026-08-08T08:00:04.000Z'
    expect(browser.formatTimestamp(timestamp, 'zh-CN')).toBe(new Date(timestamp).toLocaleString('zh-CN'))
  })

  it('renders bounded responsive presentation owners for every browser view', async () => {
    const browser = await loadBrowserModule()
    const snapshot = fixtureSnapshot('a'.repeat(64), 'presentation')
    const projection = fixtureManagedProjection()
    snapshot.managed = projectWebManaged(projection, new Map([['run-web-managed', {
      state: 'current',
      sourceSequence: 4,
      generatedAt: '2026-08-08T08:00:04.000Z',
      reasons: [],
    }]]))
    let state = browser.applySnapshotSuccess(browser.createInitialState(['en-US']), { ok: true, snapshot })

    state = { ...state, view: 'specs' }
    expect(browser.renderAppHtml(state)).toContain('<section class="grid master-detail has-search">')
    expect(browser.renderAppHtml(state)).toContain('class="card span-4 collection-card"')
    expect(browser.renderAppHtml(state)).toContain('class="card span-8 detail-card"')

    state = { ...state, view: 'history' }
    expect(browser.renderAppHtml(state)).toContain('class="card span-4 collection-card"')
    expect(browser.renderAppHtml(state)).toContain('class="card span-8 detail-card"')

    state = { ...state, view: 'runs' }
    expect(browser.renderAppHtml(state)).toContain('class="runs-workspace is-single-run"')
    expect(browser.renderAppHtml(state)).toContain('class="run-workbench"')

    state = { ...state, view: 'attention' }
    const attentionHtml = browser.renderAppHtml(state)
    expect(attentionHtml).toContain('data-view="attention" aria-current="page"')
    expect(attentionHtml).toContain('class="card span-12 attention-card"')
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
    expect(runHtml).toContain('Invocation tree')
    expect(runHtml).toContain('missing parent event')
    expect(runHtml).toContain('2 anomaly/anomalies')
    expect(runHtml).toContain('source sequence 4')
    const serializedDetail = JSON.stringify(detail)
    expect(serializedDetail).toContain('[CHECKOUT]')
    expect(serializedDetail).toContain('web/static/app.js')
    expect(serializedDetail).toContain('[REDACTED]')
    expect(runHtml).not.toContain('/private/project')
    expect(runHtml).not.toContain('C:\\private')
    expect(serializedDetail).not.toContain('sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    expect(detail.run.dispatches[0]).toMatchObject({
      parentRef: 'event-web-parent',
      createdAt: '2026-08-08T08:00:02.000Z',
    })
    expect(detail.run.receipts[0]).toMatchObject({
      parentRef: 'event-web-started',
      observedAt: '2026-08-08T08:00:03.000Z',
    })
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
})

async function loadBrowserModule(): Promise<{
  AUTO_REFRESH_INTERVAL_MS: number
  createInitialState: (languages?: string[]) => any
  applyLocaleSelection: (state: any, locale: string) => any
  applyAutoRefreshSelection: (state: any, enabled: boolean) => any
  applySnapshotSuccess: (state: any, envelope: any) => any
  applySnapshotFailure: (state: any, error: any) => any
  applyOperationFailure: (state: any, error: any) => any
  shouldAutoRefresh: (state: any, visibilityState?: string) => boolean
  applyManagedEvent: (state: any, event: any) => { state: any, refresh: boolean }
  createSseParser: (onEvent: (event: any) => void) => {
    push: (chunk: string) => void
    finish: () => void
  }
  createProjectionRequestCoordinator: () => any
  applyProjectionSuccess: (state: any, kind: 'detail' | 'search', projection: any, request: any, coordinator: any) => any
  renderAppHtml: (state: any) => string
  escapeHtml: (value: string) => string
  formatTimestamp: (value: string, locale?: string) => string
}> {
  return import('../web/src/testing.js')
}

async function loadBrowserI18nModule(): Promise<{
  catalogs: Record<'en' | 'zh-CN', Record<string, string>>
}> {
  return import('../web/src/i18n.js')
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
        workerDisplayName: null,
        workerRole: null,
        parentRef: 'event-web-parent',
        parentDispatchId: null,
        relationship: 'missing',
        createdAt: '2026-08-08T08:00:02.000Z',
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
        parentRef: 'event-web-started',
        observedAt: '2026-08-08T08:00:03.000Z',
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
        parentRef: 'event-web-parent',
        observedAt: '2026-08-08T08:00:01.000Z',
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
        parentRef: 'event-web-parent',
        observedAt: '2026-08-08T08:00:01.000Z',
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
        parentRef: 'event-web-parent',
        createdAt: '2026-08-08T08:00:02.000Z',
        receiptState: 'missing',
        terminalState: 'missing',
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
