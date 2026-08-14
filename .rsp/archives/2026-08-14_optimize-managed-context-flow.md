---
kind: "refactor"
---

# Change: optimize-managed-context-flow

## Proposal
- Outcome: Make focused managed work recoverable from a small Markdown capsule while reducing repeated context loading, worker handoff prose, and duplicate verification.
- Why:
  - Empty focus markers preserve selection but cannot carry the minimal accepted continuation needed after interruption or handoff.
  - Manage currently requires broad envelopes and full owner/status/evidence rereads after every ordinary receipt, which repeats context and slows independent lanes.
- Scope:
  - Allow bounded Markdown content in focus markers while retaining the marker path as the sole focus-selection truth.
  - Define a sparse Manager-owned Focus Capsule for accepted current work, next action, lane summaries, evidence validity, and blockers.
  - Reduce managed worker handoffs to exact authority references and Read/Write/Verify boundaries, use one-shot receipts, and make rereads and verification proportional to observed invalidation signals.
  - Align generated fallback rules, stable Specs, documentation, and semantic contract tests with the new behavior.
- Non-goals:
  - No SQLite, JSONL ledger, persistent dependency graph, event log, worker registry, automatic checkpoint commit, or cross-machine runtime coordination.
  - No worker writes to focus capsules and no capsule use as lifecycle, acceptance, Git, or external-action authority.
  - No weakening of fresh closeout verification, fixed-scope review, or fail-closed behavior when boundaries or evidence cannot be determined.

## Spec
### MODIFIED
- Requirement: Focus selection remains path-owned while a marker may contain one bounded Markdown recovery projection.
  - Empty markers remain valid and backward compatible. Non-empty markers no longer warn merely for containing text.
  - Capsule content is optional, sparse, human-readable Markdown with a strict byte bound. An RSP version comment is recommended for recognizable generated capsules but is neither required nor parsed; the marker path, never its prose, identifies the focused WorkRef.
  - `rsp focus <work-ref> --capsule-file <path|->` is the narrow command-owned write surface. It updates the capsule under the existing RSP lock, while ordinary `rsp focus <work-ref>` preserves an existing capsule instead of clearing it.
  - Only the Manager updates the capsule after accepting a meaningful continuation boundary. Worker messages and host transcripts remain the live transport and diagnostic history.
- Requirement: Managed execution uses progressive disclosure and invalidation-triggered refresh.
  - A worker receives one minimal slice containing the WorkRef, objective, exact authority references, Read/Write/Verify sets, bounded known facts, allowed/prohibited actions, and stop conditions.
  - Ordinary receipts return result, changed paths, exact verification, omissions, and boundary status without reproducing execution chronology.
  - The Manager inspects actual changed paths and local diff after a receipt, but rereads complete owner, status, authority, blockers, and decisive evidence only on a declared invalidation signal, cross-session recovery, or closeout.
  - Verification is lane-local first, one affected or integration gate at convergence, and fresh Change-required evidence at closeout; uncertainty widens verification instead of reusing an unproven receipt.

### Acceptance
#### Scenario: A focused marker contains a recovery capsule
- GIVEN an executable focused Change and a regular marker containing bounded Markdown
- WHEN status, show, check, archive, or unfocus resolves current work
- THEN the marker path selects the same WorkRef, the content produces no non-empty-marker warning, and lifecycle behavior remains compatible with an empty marker

#### Scenario: A Manager updates the accepted recovery projection
- GIVEN a focused Change and bounded capsule Markdown supplied by a regular file or standard input
- WHEN `rsp focus <work-ref> --capsule-file <path|->` succeeds
- THEN RSP updates the marker content while holding its local lock, rejects oversized or unsafe input without replacing the prior capsule, and a later plain `rsp focus <work-ref>` preserves that content

#### Scenario: A managed worker returns an ordinary same-scope receipt
- GIVEN a validated owner and a worker slice with exact read, write, and verify boundaries
- WHEN the worker returns changed paths, verification, omissions, and no boundary change
- THEN the Manager checks the actual changed paths and local diff, accepts or rejects the receipt, updates the capsule only when the accepted continuation changes, and does not require a complete owner reread before an unaffected next lane

#### Scenario: Evidence or authority may be stale
- GIVEN a worker crosses its envelope, touches a shared seam, reports a boundary change, the owner or capsule changes externally, the run resumes across sessions, or closeout begins
- WHEN the Manager derives the next action
- THEN it rereads the affected authority and evidence, widens verification when impact is uncertain, and stops rather than trusting the capsule or an earlier receipt

## Design
- Approach:
  - Treat each `focus.d/<work-ref>` file as an optional Focus Capsule: a short accepted-state projection, not a log or shared blackboard. Preserve empty-file compatibility.
  - Validate capsule size and regular-file safety without parsing prose into controller state. Use the existing RSP lock and managed-file boundary; keep path identity authoritative.
  - Expose capsule replacement only through the existing `focus` command with `--capsule-file <path|->`; use standard input for host-generated projections and preserve existing content when the option is absent.
  - Make capsule writes sparse and event-driven: accepted lane, changed next action, blocker transition, convergence, pause, or session end.
  - Replace broad repeated Manage reloads with a conservative invalidation matrix. Envelope-external paths, discovery or requests that change declared behavior, acceptance, or public-interface boundaries, shared seams, external owner/capsule edits, recovery, and closeout trigger wider rereads. A normal Fix implementing already-declared acceptance does not.
  - Keep lane dependency and evidence validity transient within a managed run. Prefer project-native related/changed test selection and one convergence gate; do not build a persistent cache or dependency engine.
- Boundaries:
  - Capsule prose is recovery guidance only; current Change, Specs, project instructions, worktree, and fresh evidence remain authoritative.
  - Manager is the sole capsule writer. Workers receive slices by message and return one structured receipt; workers do not coordinate through the capsule.
  - Git commits remain explicitly user-authorized recovery boundaries. Ordinary capsule updates never create commits.
- Affected areas:
  - Focus marker validation, constants, tests, and user documentation.
  - `rsp-manage`, Core fallback guidance, stable Core/Skill Specs, and managed semantic contract tests.
- Constraints:
  - Keep capsules bounded to 4096 UTF-8 bytes and retain existing symlink and path protections.
  - Do not require every optional capsule section or parse natural-language content into focus, acceptance, lifecycle, or authority decisions.
  - Keep complete owner and Required verification refresh mandatory for cross-session recovery and closeout.

## Tasks
- [x] Support bounded non-empty focus marker capsules with backward-compatible selection and validation tests.
- [x] Update Manage and Core guidance for minimal worker slices, one-shot receipts, invalidation-triggered rereads, sparse capsule updates, and tiered verification.
- [x] Align stable Specs, generated fallback rules, user documentation, and current semantic fixtures without introducing a second state store.
- [x] Establish a fresh managed-controller beta evaluation identity for the changed product composition, then rerun the full suite, fixed-scope review, and RSP readiness checks.

## Verify
### Required
- Automated:
  - [x] `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=commit.gpgSign GIT_CONFIG_VALUE_0=false mise exec -- pnpm exec vitest run test/artifact-continuation-contract.test.ts test/helpers.test.ts test/managed-controller-contract.test.ts test/integration.test.ts --reporter=dot --no-file-parallelism` — 314 tests passed; proves focus capsule compatibility and the managed progressive-disclosure contracts at their owning seams.
  - [x] `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=commit.gpgSign GIT_CONFIG_VALUE_0=false mise exec -- pnpm run test` — 70/70 test files and 833/833 tests passed after the isolated-context cleanup and malformed-capsule corrections.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run typecheck && mise exec -- pnpm run lint` — passed on the final implementation and declaration surface.
  - [x] Fixed-scope Code and Document review of `HEAD` versus the owned diff and retained beta report/summary — review-clean after correcting isolated authentication cleanup, existing-capsule UTF-8 validation, and public declaration drift.
  - [x] Durable writeback decision — updated the existing Core and Skill Specs plus scoped/public instructions for the stable Focus Capsule and managed-flow boundaries; no Decision Record is needed because the Change records no additional lasting rationale beyond those current product facts.
  - [x] `node dist/cli.mjs check --focused --json && git diff --check` — focused check passed with zero errors and zero warnings; diff check passed.
### Optional
- Manual or environment:
  - [ ] Exercise an interrupted managed run in a downstream repository and compare prompt/token usage with the pre-change workflow.
- Coverage:
  - Automated coverage proves deterministic marker and Skill contracts; real-host token and latency reduction remains optional observational evidence.

## Blockers
- none
