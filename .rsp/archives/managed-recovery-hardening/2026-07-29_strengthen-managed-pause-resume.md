---
kind: feature
---

# Change: managed-recovery-hardening/strengthen-managed-pause-resume

## Proposal
- Outcome: Strengthen managed pause and resume semantics
- Why:
  - A progress question can currently be treated as a terminal turn even when managed continuation remains authorized.
  - Explicit pause has been implemented by removing focus, conflating execution suspension with durable owner selection and making multi-ready recovery ambiguous.
  - Stop responses do not consistently carry the complete response-only continuation contract needed for drift-safe recovery.
- Scope:
  - Define status updates, explicit pause, explicit owner release, environmental blocker stops, and resume as distinct managed behaviors.
  - Preserve the focused WorkRef by default across pause and blockers, and require resume to re-read authority, status, diff, blockers, and stale verification before dispatch.
  - Strengthen Core/Manage/discipline guidance and retained behavior evaluation without adding CLI lifecycle state.
- Non-goals:
  - A persisted paused status, controller ledger, host scheduler implementation, automatic commits, or cross-thread synchronization protocol.
  - Changing focus commands for explicit user-directed owner release.

## Spec
<!-- <…> -->
### ADDED
- Requirement: Managed interruption preserves one recoverable owner
  - A progress or status question reports current evidence and continuing intent without stopping otherwise authorized work.
  - Explicit pause stops active workers and further mutation only after interruption is confirmed, but keeps the selected focused WorkRef unless the user explicitly requests owner release or a conflicting owner must be resolved.
  - Environmental or verification blockers stop dispatch while preserving the focused owner and record only durable blocker/evidence facts in the Change.
  - Every incomplete stop returns the localized continuation fields `WorkRef`, `Authority`, `Current state`, `Changed artifacts`, `Fresh verification`, `Blockers`, and `Next action` in order.
  - Resume treats continuation prose only as a pointer: it reopens authoritative artifacts, inspects worktree drift, re-derives Manage qualification, and refreshes stale decisive evidence before mutation.

### Acceptance
#### Scenario: Status inquiry during managed execution
- GIVEN an authorized managed goal with remaining unblocked work
- WHEN the user asks for progress without requesting pause, stop, or changed scope
- THEN the controller reports current evidence and continues the same managed run

#### Scenario: Explicit pause and resume
- GIVEN a focused managed Change with accepted uncommitted work
- WHEN the user explicitly pauses and later resumes
- THEN workers stop before the pause acknowledgement, focus remains on the same owner, no new lifecycle state is persisted, and resume checks authority and drift before continuing

#### Scenario: Explicit owner release
- GIVEN paused work whose selection should no longer remain current
- WHEN the user explicitly requests release or unfocus
- THEN the existing focus operation may clear selection without treating ordinary pause as equivalent

## Design
- Approach:
  - Make the pause/status/release distinction explicit in Core and Manage, and reuse the existing response-only continuation schema rather than creating runtime state.
  - Add deterministic behavior fixtures for status, pause, release, environment and drift stops, plus structured holdout scoring for ordered continuation fields and explicit resume-preflight evidence.
- Boundaries:
  - Skills own orchestration semantics; `.rsp/focus.d/` remains selection truth and CLI focus/unfocus behavior remains unchanged.
- Affected areas:
  - `skills/rsp/SKILL.md`, `skills/rsp-manage/SKILL.md`, managed routing and applicable discipline return contracts
  - `rules/rsp-rules.md`, README guidance, `.rsp/specs/core-model.md`, `.rsp/specs/skill-system.md`
  - managed-controller and artifact-continuation fixtures/evaluators/tests
- Constraints:
  - Keep scheduling state transient, avoid host-specific directives, preserve explicit focus authority, and do not weaken existing stop conditions or closeout boundaries.

## Tasks
- [x] Update Core, Manage, managed routing, fallback rules, and documentation with distinct status/pause/release/blocker/resume semantics.
- [x] Strengthen continuation contracts so every incomplete managed stop is complete and resume always re-derives authority, owner, drift, and evidence.
- [x] Add deterministic contract cases for progress-with-continuation, explicit pause, environment and drift stops, explicit owner release, and drift-safe resume.
- [x] Sync the self-hosted fallback through the built CLI.
- [x] Rerun the exact-package resume-and-blocker holdout under the structured scorer with a new immutable identity; the earlier retained run remains unchanged.

## Verify
- Automated:
  - [x] Focused managed-controller and artifact-continuation contract tests — final focused run passed 50/50; the first correction pass observed RED for the general drift-stop return and structured scorer before implementation.
  - [x] Full build, lint, and test suite — build and lint passed; final full run passed 53 files and 624 tests; clean-install package check passed for `@oevery/rsp@3.1.0-beta.4` with SHA-256 `6d805d3d79439fa55dfe67134818adc24a822e505428473308c0f6b07b7e652e`.
  - [-] Full typecheck — the only failure is the pre-existing Vitest matcher typing at `test/issue-relationship.test.ts:56`, outside this Change; changed TypeScript surfaces build and lint cleanly.
- Manual or environment:
  - [x] Exact-package resume-and-blocker composition — structured run `pause-resume-product-SEMWDN` passed with stable source/installed composition, authorized paths only, `npm test` 1/1, unique ordered continuation fields, complete recovery tokens, and a receiver blocker; retained under `research/evaluations/rsp-manage/2026-07-29-product-pause-resume-structured/`. Historical run `pause-resume-product-i6Gkc1` remains immutable and correctly fails the stricter rescore. Neither run claims that a live multi-turn status inquiry or pause occurred.
- Coverage:
  - Deterministic contracts cover status/progress and explicit pause semantics. The retained exact-package fixture covers resume from a pause handoff plus blocker continuation only; host thread scheduling and a live multi-turn status/pause sequence remain outside this evidence.

## Blockers
- none
