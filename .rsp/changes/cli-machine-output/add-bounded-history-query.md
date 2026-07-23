---
kind: "feature"
---

# Change: cli-machine-output/add-bounded-history-query

## Proposal
- Summary: Add a bounded CLI query for archived Change summaries and opt-in detail.
- Why:
  - `rsp status` currently exposes only monthly archive counts, while agents and scripts must inspect generated index Markdown or search archive files to find relevant completed work.
  - Returning the complete archive in `status --json` would mix current navigation with history retrieval and create unbounded output.
- Scope:
  - Add a dedicated history command that returns a bounded, deterministic list of archived Change metadata.
  - Support filters that narrow history before serialization.
  - Support one exact archived WorkRef detail lookup with explicitly bounded content.
- Non-goals:
  - Replacing Git history, providing full-text search, indexing arbitrary project documents, or creating a history database.
  - Returning every archived Change body by default or changing archive file ownership.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: archived Change history is queryable through a bounded machine-readable CLI surface.
  - The default query returns a deterministic limited list containing at least archive date, WorkRef, kind, summary, and project-relative archive path.
  - Consumers can narrow the list by stable filters such as date range, kind, or Group before records are serialized.
  - An exact WorkRef query returns one archived record or a structured not-found/ambiguous error.
  - Detailed content is opt-in and bounded; the default list never embeds all archive Markdown bodies.
  - Archive files and their generated index remain authoritative, and incomplete or inconsistent inspection fails visibly.

### Acceptance
#### Scenario: agent finds recent relevant history
- GIVEN a project has archived Changes across multiple dates, kinds, and Groups
- WHEN an agent requests a limited filtered JSON history list
- THEN the CLI returns only matching deterministic summaries up to the requested bound
- AND reports enough selection metadata to request one exact archived record next

#### Scenario: agent requests one archived Change
- GIVEN an exact archived WorkRef exists
- WHEN its history detail is requested as JSON
- THEN the CLI returns that record's archive identity, metadata, evidence-oriented detail, and source path
- AND does not include unrelated archive bodies

#### Scenario: archive inspection is incomplete
- GIVEN an archive entry cannot be read or its identity is inconsistent
- WHEN history is queried
- THEN the command returns a structured failure instead of silently presenting partial history as complete

## Design
- Affected boundaries:
  - `src/cli.ts` owns the public command and argument surface.
  - Archive/work-tree inspection owns safe file discovery and identity validation.
  - A dedicated history command owns filtering, bounding, output shape, and human rendering.
  - `src/types.ts`, integration tests, `README.md`, and stable Specs own the published contract.
- Constraints:
  - Reuse authoritative archive files and generated metadata rather than adding a cache or database.
  - Apply bounds before reading or serializing optional detailed content wherever possible.
  - Preserve flat or one-Group-level WorkRef semantics and deterministic ordering.
- Design decision to settle with the maintainer:
  - Choose the exact command syntax, default limit, supported first-release filters, and whether continuation uses an offset, cursor, or only explicit bounds.
  - Choose which structured sections belong in single-record detail and whether raw Markdown requires a separate `--include-content` option.

## Tasks
- [ ] Settle and record the list, filter, continuation, and single-record detail contract.
- [ ] Implement archive discovery, deterministic bounded filtering, and structured error handling.
- [ ] Implement human and JSON history list/detail output without changing archive ownership.
- [ ] Document examples and add focused integration fixtures for flat, grouped, filtered, detailed, empty, and invalid archive cases.

## Verify
- Automated:
  - [ ] `mise exec -- pnpm exec vitest run test/integration.test.ts`
  - [ ] `mise exec -- pnpm run build`
  - [ ] `mise exec -- pnpm run lint`
  - [ ] `mise exec -- pnpm run test`
- Manual:
  - [ ] Query this repository's archive with the settled default and filters, then retrieve one exact flat and one grouped Change without emitting unrelated archive bodies.
- Durable updates:
  - [ ] Update `.rsp/specs/design.md` and `README.md` with the settled archive-query boundary and command contract if implementation confirms them.

## Blockers
- Maintainer decision: select the first-release command, bounds, filters, continuation, and detail-content contract before implementation.
