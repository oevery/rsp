---
kind: "feature"
---

# Change: converge-managed-review

## Proposal
- Outcome: Converge in-scope managed review findings without redundant user continuations
- Why:
  - A long managed goal currently stops after every bounded address-review pass, even when a re-review finding remains inside the same selected Change, fixed mutation authority, and verification boundary.
  - Repeatedly asking the user to reply `continue` adds no decision value and makes otherwise recoverable long work appear externally blocked.
- Scope:
  - Let Core and `rsp-manage` automatically start another bounded `rsp-address-review` pass for accepted remaining or new findings that stay inside the original managed authority.
  - Separate review-convergence passes from worker corrective retries, cap automatic convergence, and define the material boundaries that still return to the user.
  - Keep every pass fixed-scope, freshly verified, and report-only re-reviewed without adding durable controller state or correction chronology.
- Non-goals:
  - Do not make standalone address-review requests self-loop, weaken reviewer independence, infer product decisions or external actions, persist retry state, or remove stop conditions for repeated non-convergence.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: managed review correction converges within the original authority envelope
  - After a fixed-scope re-review, Core may return an accepted remaining or new finding to another bounded address-review pass without another user authorization when the finding is owned by the same selected Change and stays within its original behavior, acceptance, affected paths, mutation authority, and verification budget.
  - Address Review still performs exactly one correction pass and one fresh re-review at a time; Manage owns any subsequent re-entry and keeps review-convergence accounting separate from worker dispatch and worker corrective-retry limits.
  - Automatic convergence permits at most three address-review passes for one selected Change and stops earlier when the same finding remains after two completed corrections.
  - A pass returns to the user for `needs-clarification`, a product or acceptance decision, public-interface or scope expansion, new mutation or external-action authority, an additional real-host/provider/network run outside the selected Change's existing verification authority, repeated non-convergence, or failed/unavailable decisive verification.
  - An in-scope correctable finding is `correction-needed`, not an external blocker. Correction counts and chronology remain transient; the Change retains only converged dispositions, decisive evidence, omissions, and real blockers.

### Acceptance
#### Scenario: managed re-review finds another in-scope defect
- GIVEN an explicit managed goal, one selected Change, and a fixed-scope re-review that reports an accepted remaining or new finding inside the original authority envelope
- WHEN the prior bounded address-review pass returns to Core
- THEN Manage starts the next bounded pass without asking the user to reply `continue`
- AND every pass receives fresh verification and an independent fixed-scope re-review
- AND execution stops only at a declared authority, verification, or convergence boundary

#### Scenario: correction requires a real owner decision
- GIVEN a managed correction pass whose re-review exposes a finding that changes behavior, acceptance, public interface, scope, mutation authority, external action, or verification budget
- WHEN Core evaluates the returned report
- THEN the managed run stops with the single required owner input and does not mutate for that finding

## Design
- Approach:
  - Extend Core routing and Manage continuation contracts with a transient review-convergence branch that correlates the fixed report, selected Change, authority, dispositions, fresh verification, pass count, and re-review result.
  - Keep `rsp-address-review` single-pass and report-only at its return boundary, but allow it to identify an in-scope managed continuation as `correction-needed` rather than requiring a separately authorized user pass.
  - Express the same host-neutral behavior in fallback rules, stable design surfaces, and deterministic Skill contract tests.
- Boundaries:
  - Core owns authority re-derivation; Manage owns bounded continuation and transient convergence accounting; Address Review owns one fixed correction/re-review pass; the Change remains the only durable work owner.
- Affected areas:
  - `skills/rsp/SKILL.md`, `skills/rsp-manage/SKILL.md`, and `skills/rsp-address-review/SKILL.md`
  - `rules/rsp-rules.md`, `.rsp/specs/design.md`, and `docs/design-philosophy.md`
  - Skill contract tests, managed-controller holdout/evidence, and native exact-package evidence
- Constraints:
  - Preserve reviewer read-only independence, one-pass Address Review semantics, host neutrality, no hidden state, and explicit-only Git push/publication/deployment/approval authority.

## Tasks
- [x] Add managed review-convergence routing and stop boundaries to Core, Manage, and Address Review.
- [x] Synchronize fallback and durable design documentation without persisting correction chronology.
- [x] Add focused contract coverage for automatic in-scope continuation, separate budgets, and real-boundary stops.
- [x] Qualify three-pass managed convergence and native composition against the same final authored package.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-contract.test.ts test/rsp-core-routing-contract.test.ts test/rsp-address-review-contract.test.ts test/native-design-composition.test.ts` — 61/61 passed; proves: managed convergence continues only inside authority, remains separately bounded, preserves Address Review's single-pass contract, replays current retained composition, and keeps native exact-package gates current.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run lint`, and `node dist/cli.mjs check --focused` — passed; proves: authored artifacts, synchronized fallback rules, and focused Change remain structurally valid.
  - [x] `mise exec -- pnpm exec vitest run` — 129 suites / 511 tests passed; proves: the full repository contract remains green after final review corrections.
- Manual or environment:
  - [x] Fresh `gpt-5.6-terra` managed run `review-convergence-product-mO195E` — three accepted in-scope correction passes continued with `user_continuations: 0`; every focused check and `npm test` passed 3/3; the fourth fixed-scope review was clean; lifecycle archived; commit, push, publication, controller state, and unauthorized paths remained absent.
  - [x] Fresh native composition run `device-discovery-boundary-managed-review-convergence-final` — all four phases, semantic gates, runtime isolation, exact-package SHA-256 `0aff24581c7480c8821397fe85099b1e7f4b5c2f1a59c3b01036a2f4523054f9`, current release artifact, retained integrity, and disposable-path sanitization passed.
- Coverage:
  - The managed evaluator failed closed on two non-composable fixture assertions and one stale fixture lifecycle baseline before the corrected immutable run passed; failed-attempt hashes remain in retained provenance rather than being presented as product failures. The fixed reports were independent frozen fixture inputs processed sequentially by one host run, not generated live by separate reviewer processes. Cross-provider repetition and a fourth-pass/repeated-finding real-host stop remain out of scope; deterministic contracts cover those stop boundaries.

## Blockers
- none

## Review Resolution
- Fresh fixed-scope Code and Document re-review: clean. The product `rsp-manage` compactness cap is 800 words while the unchanged research candidate remains at 600; managed authority, single-pass Address Review, transient convergence limits, retained-evidence claims, and fallback/design surfaces are coherent with the Change.
