---
kind: "refactor"
summary: "Separated viewer feature ownership and coordinated complete builds with validated, lazily loaded Mermaid resources."
---

# Change: viewer-structure

## Proposal
Separate viewer navigation, remote data, graph adaptation and document reading
so changes remain local to their owning feature. Consolidate refresh scheduling,
reader lifecycle and native graph adaptation. Coordinate CLI/viewer development
builds and serve split Mermaid assets through a validated build manifest.
Scope includes `src/viewer/`, build scripts/configuration, affected tests and
architecture/distribution knowledge. Preserve current interactions, URLs,
authentication, document authorization, startup snapshots and dependencies.
Visual redesign and new libraries are out of scope.

## Spec
<!-- Describe the contract delta and acceptance conditions, referencing affected existing Specs; do not copy the full baseline or implementation steps. -->
### MODIFIED
- Requirement: Viewer implementation boundaries
  - Preserve `.rsp/specs/cli.md` Architecture reading contracts while moving
    state and lifecycle ownership into route, data, diagram and reader modules.
- Requirement: Complete, isolated viewer builds
  - Build and development commands produce matching CLI, browser assets and
    build identity. Failed builds cannot publish a valid partial runtime.
  - Only manifest-listed viewer resources are public. New chunks retain the
    same startup snapshot, local-origin checks and build-integrity guarantees.
  - Mermaid loads its implementation and diagram chunks only when needed.

### Acceptance
#### Scenario: Existing graph and document exploration
- GIVEN an existing workspace and supported view or document URL
- WHEN navigating, selecting, reading, refreshing or changing screen size
- THEN selection, history, focus, viewport, reading position and stale-response
  isolation retain their current behavior.
#### Scenario: Build replacement and dynamic resources
- GIVEN a running viewer and a later successful or failed rebuild
- WHEN requesting an existing or newly needed diagram chunk
- THEN the running viewer serves its startup bytes, unrelated files remain
  inaccessible, and a new runtime starts only from a complete valid build.

## Design
<!-- Explain the current approach, boundaries, and necessary tradeoffs; replace obsolete plans while preserving decision reasons and useful outcome comparisons. -->
Route parsing and transitions own URL state. Feature-specific data hooks own
requests, polling and cancellation. The diagram controller owns native instances,
geometry, selection and viewport restoration; the reader owns document rendering,
assets, scrolling and resizing. App composes those features and coordinates
cross-feature navigation. Presentation components receive only their required
inputs. Retain distinct resource lifecycles rather than introduce a generic store.
Preserve arbitrary addressed selections and existing push/replace semantics.
A shared scheduler owns refresh triggers and cleanup while resource hooks retain
identity, revision and error policy. The reader owns pre-replacement position
capture; native DOM and binding interpretation stay in the diagram adapter.
Shared response contracts constrain service producers and web consumers.
One build coordinator publishes the manifest after CLI, web and CSS succeed.
Mermaid uses ESM dynamic chunks; the service snapshots an explicit validated
resource allowlist rather than reading arbitrary paths or live installation bytes.

## Tasks
<!-- Keep current checkable work and actual completion; revise or reopen invalidated tasks within authorized scope. Do not append routine attempts, fixes, retries, or check runs. -->
- [x] Extract route transitions, API contracts and feature data hooks.
- [x] Move graph adaptation and reading lifecycles into their feature owners.
- [x] Compose presentation components and synchronize architecture knowledge.
- [x] Consolidate scheduling, reader ownership, diagram adaptation and response contracts.
- [x] Coordinate complete builds/watch rebuilds and publish a validated asset manifest.
- [x] Split Mermaid and cover chunk loading, isolation, tampering and build failures.
- [x] Complete implementation checks and inspect final diff for behavior drift.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm run build` — complete production runtime and resources.
  - [x] `mise exec -- pnpm run typecheck` — feature interfaces and native graph types.
  - [x] `mise exec -- pnpm run lint` — repository static checks.
  - [x] `mise exec -- pnpm run test` — code, development rebuild and package regressions.
  - [x] `mise exec -- pnpm exec vitest run tests/code/architecture/build.test.ts tests/code/architecture/assets.test.ts` — build-entry/module load failures, recovery and resource safety.
  - [x] `mise exec -- pnpm run test:viewer:browser` — interaction preservation and lazy diagram resources.
  - [x] `mise exec -- pnpm run test:pack` — split resources in an installed package.
  - [x] `mise exec -- node dist/cli.mjs doctor` — architecture and binding validity.
  - [x] `mise exec -- node dist/cli.mjs check viewer-structure` — Change consistency.
- [x] Correction-only review — P2 manifest invalidation before module loading and child startup, including cancellation and recovery.

The full-suite result is reused for unchanged coverage; the focused command
replaces the affected build-test evidence. Browser and installed-package evidence
is reused with unchanged runtime sources and the same rebuilt resource identity
`5dbe720c43921e07182c1dc29ac58310eceecf798d2b7b5c2f75a1b40fd2da0f`.

## Blockers
None
