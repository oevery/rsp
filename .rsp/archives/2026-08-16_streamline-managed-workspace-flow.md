---
kind: "refactor"
---

# Change: streamline-managed-workspace-flow

## Proposal
- Outcome: Make Core-selected managed Workspace execution explicit, recoverable from ordinary status, and proportionately routed, with one end-to-end lifecycle contract protecting the complete seam.
- Why:
  - Core, Manage, and Workspace currently describe isolation handoff requirements across separate Skills without one bounded field set.
  - `rsp status` exposes only Workspace policy, so an interrupted isolated commit, registered activity, or unlanded branch is invisible unless the operator already remembers the WorkRef.
  - Recent managed holdouts repeatedly exercise one sequential multi-surface case; they do not cover the complete prepare, execute, commit, land, cleanup, and recovery chain or distinguish coordination value from task size alone.
  - Several maintainer research models still describe already implemented Groups and Discipline Skills as proposed future behavior.
- Scope:
  - Add one deterministic end-to-end managed Workspace lifecycle fixture spanning Core selection, preparation, exact execution location, commit, status recovery, landing, and cleanup.
  - Define one response-only bounded Workspace selection handoff shared by Core, Manage, and Workspace.
  - Add bounded active Workspace observations to ordinary status JSON and verbose plain output without making them project-semantic state.
  - Calibrate automatic Manage qualification with positive managed cases and a hard direct near-miss; change routing prose only when the fixtures preserve proactive coordination for real multi-phase obligations.
  - Reconcile stale implementation markers and current/target wording in maintainer research models with current authoritative Specs.
- Non-goals:
  - No persisted controller, Assignment, Receipt, topology, or workspace-selection state.
  - No automatic Land, cleanup, push, publication, provider run, performance threshold, or broad routing benchmark matrix.
  - No change to Workspace branch/path identity, destructive disposal authority, or standalone CLI command authority.

## Spec
### MODIFIED
- Requirement: Workspace isolation handoff is explicit and response-only.
  - Core supplies the selected WorkRef, material selection reason, exact target branch, and authority reference; Manage validates and forwards that selection without reselecting isolation; Workspace appends only observed path, branch, target, activity, and cleanup facts.
- Requirement: Active isolated work is recoverable through ordinary status.
  - Status reports bounded mechanical observations for valid registered RSP Workspaces, including WorkRef, branch, target, dirty state, commits ahead, and active activity count.
  - Invalid or unreadable records fail visibly without becoming Change readiness, acceptance, or lifecycle state.
- Requirement: Automatic Manage routing requires an observable coordination obligation.
  - Independent slices, interruption recovery, distinct execution and acceptance owners, real-host boundaries, bounded review convergence, lifecycle coordination, or a clear ready successor remain managed signals.
  - Multiple changed surfaces alone do not force Manage when one owner, one writer, one execution phase, and one decisive integrated check remain sufficient.
- Requirement: Maintainer research distinguishes historical proposals from current product truth.
  - Implemented or superseded model sections point to current Specs and no longer present shipped Groups or Discipline Skills as future work.

### Acceptance
#### Scenario: Recover and land an isolated managed Change
- GIVEN Core selected Workspace isolation for one ready managed Change
- WHEN the Workspace is prepared, changed, committed, observed through status, landed with an exact commit list, and cleaned up
- THEN every step reports the same WorkRef, target, and owned branch, status exposes pending delivery before Land, and no active Workspace remains afterward

#### Scenario: Preserve proactive Manage coordination
- GIVEN one completion has a real multi-phase, independent verification, recovery, lifecycle, or successor obligation
- WHEN Core qualifies the route
- THEN Manage remains selected even when execution is sequential

#### Scenario: Keep one-owner integrated work direct
- GIVEN one ready owner has one writer, one execution phase, one integrated check, no recovery, no independent acceptance obligation, and no successor
- WHEN several files or presentation surfaces change inside that boundary
- THEN Core may keep the route direct instead of selecting Manage solely from file or surface count

## Design
- Approach:
  - Start with the lifecycle fixture and focused routing cases so product changes are constrained by executable evidence.
  - Add a small `WorkspaceSelection` response contract to the Skill Control Model and project only its fields into the three owning Skills.
  - Reuse validated workspace records and existing bounded facts for status rather than creating another registry or semantic owner.
  - Keep routing calibration in Core's managed-routing reference and deterministic fixtures; retain the existing safety and authority ceilings.
- Boundaries:
  - Core owns selection and routing; Manage owns selected-goal orchestration; Workspace owns mechanical isolation observations; Land owns exact local integration.
  - `.git/rsp/workspaces` remains the mechanical record owner. Status is a read-only projection and never infers implementation or delivery completion.
  - Current Specs own product truth; research models retain provenance and historical recommendations.
- Affected areas:
  - `src/workspace/`, status model/projections/presentation, CLI types, and focused integration tests.
  - `skills/rsp`, `skills/rsp-manage`, `skills/rsp-workspace`, control Specs, authored fallback, and contract fixtures.
  - `research/models/` implementation-state reconciliation and navigation.
- Constraints:
  - Preserve deterministic offline behavior, stable ordering, bounded output, unrelated dirty work, and exact authority separation.
  - Do not expose machine-specific paths in default status or persist transient control objects.
  - Build authored sources before synchronizing generated fallback content.

## Tasks
- [x] Add the end-to-end managed Workspace lifecycle and routing-calibration fixtures before changing product contracts.
- [x] Implement and validate the bounded Workspace selection handoff across Core, Manage, and Workspace.
- [x] Project active Workspace recovery observations through status JSON and verbose plain output.
- [x] Apply only the routing calibration supported by the new positive and near-miss fixtures.
- [x] Reconcile stale research model implementation markers and current-product wording.
- [x] Run focused, package, full regression, fixed-scope review, and readiness checks.

## Verify
### Required
- Automated:
  - [x] Focused Workspace lifecycle and status tests — proves: prepare, pending-delivery observation, exact Land, cleanup, invalid-record, and non-regular-record behavior are connected through production entry points.
  - [x] Focused Core/Manage/Workspace contract and routing fixtures — proves: the handoff fields agree, real coordination remains managed, and a hard direct near-miss is not selected from surface count alone.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run test` — proves: package and repository regression safety; the final full run passed 75 files and 821 tests.
  - [x] `node dist/cli.mjs update`, docs checks, fixed-scope Code/Document review, `node dist/cli.mjs check --focused --json`, and `git diff --check` — proves: authored/fallback consistency, truthful documentation, Change validity, and patch hygiene; fixed-scope Code and Document review are clean.
### Optional
- Manual or environment:
  - [x] Provider-backed routing comparison — one `combo/gpt-5.6-terra` high-effort run completed the fixed `auto-multisurface-routing` baseline/product holdout: 22 deterministic contracts passed, both variants passed without correction or unauthorized paths, and the product selected Manage from distinct execution and acceptance owners with sequential dispatch. Product composition `b645617c86ce744b578adbe8c98c239b60de3465c764a1dcc4577e4fc0062623`; holdout contract `0303b585bef27638f92f1c7b0f308fd0f63ff5b0ae92354f389d2c9fdb9c4540`.
- Coverage:
  - Evidence covers local deterministic managed Workspace orchestration plus one fixed provider/model/holdout routing comparison; it does not claim provider-general performance improvement, automatic delivery authority, or cross-host process behavior.

## Blockers
- none
