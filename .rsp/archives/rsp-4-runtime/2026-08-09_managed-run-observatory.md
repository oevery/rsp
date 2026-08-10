---
kind: "feature"
---

# Change: rsp-4-runtime/managed-run-observatory

## Proposal
- Outcome: Add managed run topology, receipts, attention, evidence, and timelines to the Web Observatory
- Why:
  - Real concurrent managed execution needs a richer read-only surface than terminal output or inferred chat history.
  - The base Web shell, transport security, and repository views can be accepted independently before runtime-specific presentation is added.
- Scope:
  - Add Runs and Attention views to the existing Web Observatory.
  - Present Manager and worker topology, dispatch identity, receipts, decisive evidence references, stop boundaries, freshness, and ordered timelines from accepted runtime projections.
  - Extend SSE snapshots and events with bounded run updates, reconnect, replay, sequence-gap recovery, and unavailable-runtime states.
- Non-goals:
  - Start or retry workers, select lanes, change routing, accept receipts, mutate Changes, archive, commit, push, publish, deploy, approve, or resume managed work.
  - Infer dispatch, completion, authority, acceptance, or errors from prose or missing runtime events.
  - Expose raw prompts, hidden reasoning, credentials, unrestricted logs, or arbitrary process output.
  - Make the Web UI or runtime database required for ordinary Manage execution or recovery.

## Spec
### ADDED
- Requirement: Managed run views are read-only projections of exact accepted runtime observations and fresh repository references.
  - Run detail presents Manager and worker topology, lane, objective, status, receipt, evidence reference, changed paths, stop boundary, freshness, and ordered timeline.
  - Attention items are derived by Manage-owned projection rules and cannot advance, accept, retry, or close a run.
  - Missing, duplicate, delayed, rejected, or out-of-order observations remain visible without fabricating dispatch, completion, or acceptance.
  - Runtime absence, incompatibility, disposal, or stale repository evidence produces an explicit unavailable or stale state while base project views remain usable.
  - SSE events use stable run and sequence identities; reconnect uses bounded replay or a fresh snapshot without duplicating accepted effects.

### Acceptance
#### Scenario: concurrent managed run
- GIVEN Manager and multiple workers producing valid runtime observations
- WHEN the run page is open
- THEN actor topology, receipts, attention, evidence, and monotonic timeline update without duplicate or fabricated completion

#### Scenario: missing or duplicate receipt
- GIVEN one required worker has no receipt and another receipt is delivered twice
- WHEN the run and attention views render
- THEN the missing work remains incomplete, the duplicate is identifiable, and neither condition manufactures acceptance

#### Scenario: stale repository evidence
- GIVEN retained runtime observations whose WorkRef, authority, or changed paths no longer match the current checkout
- WHEN the run page refreshes
- THEN the stale relationship is visible and current repository evidence remains authoritative

#### Scenario: runtime unavailable
- GIVEN the base Web Observatory is healthy and runtime storage is absent or incompatible
- WHEN a user opens Runs or Attention
- THEN those views show an exact unavailable state while Overview, Specs, and History continue to work

## Design
- Approach:
  - Extend the accepted base Web shell and shared API with presentation-neutral run, actor, receipt, attention, evidence, and timeline projections.
  - Consume only the Manage-owned projection seam; browser code does not derive workflow state from raw storage rows.
  - Use initial bounded snapshots plus SSE projection events and explicit freshness or sequence-gap recovery.
- Boundaries:
  - Manage owns dispatch, attention, acceptance, and closeout semantics.
  - The event store owns persistence mechanics; the Broker and base Web Change own secure transport and checkout routing.
  - The browser renders projections only and exposes no mutation endpoint.
- Affected areas:
  - Runs and Attention browser routes and components, shared projection types, Broker APIs, SSE events, and documentation.
  - Runtime unavailable/stale presentation, evidence links, component tests, integration tests, and real-run browser acceptance.
- Constraints:
  - Every detail is bounded and source-attributed; raw JSON remains diagnostic-only.
  - One malformed or incompatible project runtime cannot affect base views or another checkout.
  - Browser state is disposable and never becomes a continuation, acceptance, or retry input.

## Tasks
- [x] Define bounded run, actor, receipt, attention, evidence, freshness, error, and SSE projection contracts.
- [x] Implement Runs and Attention views over the accepted Manage runtime projection seam.
- [x] Add replay, sequence-gap, stale-evidence, unavailable-runtime, duplicate, and missing-receipt presentation behavior.
- [x] Add component, API, SSE, isolation, package, and local real-run browser acceptance coverage and documentation.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/manage-runtime-integration.test.ts test/runtime-event-store.test.ts test/web-observatory.test.ts test/clean-install-check.test.ts` — 4 files / 48 tests passed after final review convergence; covers bounded run topology, typed delivery metadata, missing and duplicate receipts, delayed and missing parents, attention, evidence, freshness, unavailable runtime, replay, gap recovery, and exact-package behavior without semantic invention.
  - [x] Focused HTTP, SSE, service, and browser-module coverage passed for serialized projection refresh, stable bearer-authenticated streaming, future/old cursors, atomic recovery, opaque run detail, subscription-time expiry, duplicate/conflict scope collisions, and deterministic out-of-order rendering.
  - [x] Focused security and isolation coverage passed for mutation-route absence, one-time bootstrap and scoped Web bearer lifecycle, redaction, exact checkout routing, complete open Change and Group WorkRefs, static symlink escape, and controlled ancestor-swap fail-closed behavior.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `mise exec -- pnpm run docs:check`, `mise exec -- pnpm run docs:build`, `mise exec -- pnpm run test`, and `git diff --check` passed; the full suite passed 68 files / 799 tests before the final two focused review corrections, and those corrections passed the fresh 4-file / 48-test suite.
- Fresh browser acceptance on 2026-08-09 used the exact rebuilt Broker and authenticated Web bundle: Runs detail remained rendered in 20/20 samples across two seconds while SSE stayed live; topology, receipt, missing receipt, attention, changed path, freshness, and ordered timeline were visible; console logs were empty and the current 1280px viewport had no horizontal overflow. Earlier fresh acceptance of the same CSS bundle passed at 390px with `scrollWidth` equal to `innerWidth`.
- Fixed-scope re-review result: Code `clean`, no P0-P2 findings after convergence; document review remained clean.
- Durable review:
  - [x] Current projection, freshness, runtime-unavailable, authority, and disposal facts are owned by `.rsp/specs/runtime.md` and the scoped CLI/Web facts in `.rsp/specs/cli-contracts.md`.
  - [x] The lasting framework-free Web security and host-neutral managed-observability rationale is recorded in `.rsp/specs/decisions/fragment-bootstrap-and-framework-free-web-observatory.md` and `.rsp/specs/decisions/host-neutral-managed-observability-with-authority-reread.md`; no additional Decision Record is needed.
### Optional
- Manual or environment:
  - [ ] Observe one real parallel managed run, interrupt the browser and Broker, then inspect reconnect, attention, evidence, and stale-state behavior — omitted; the accepted browser fixture used exact committed runtime observations and Broker restart/reconnect, but did not claim a real parallel host-worker execution.
- Coverage:
  - Group release-candidate validation later covers supported Node versions, Broker reuse, runtime migrations, idle resource release, and final documentation.

## Blockers
- none
