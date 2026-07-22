---
kind: "fix"
---

# Change: fix-native-composition-retained-gate

## Proposal
- Summary: Bind retained native composition evidence to current product artifacts and auditable durable output
- Why:
  - Final adversarial review found that a successful retained native-design run could remain green after current Skill drift, and that its durable current-fact artifact was not retained for independent audit.
- Scope:
  - Bind retained native composition evidence to the current behavior-bearing package artifacts.
  - Retain and hash the sanitized durable artifact, then re-evaluate deterministic retained gates instead of trusting a prior result flag.
  - Report a truthful blocker when the historical seven-Skill package differs from its frozen identity.
- Non-goals:
  - Re-running model phases when existing successful evidence contains enough material for deterministic hardening.
  - Expanding the product surface or qualifying another host, hardware, managed orchestration, or Git delivery.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: retained native composition evidence fails closed after relevant current product drift or retained artifact tampering.
  - The evaluator compares current behavior-bearing artifacts with the retained installed identities, preserves an auditable sanitized durable artifact and hash, and recomputes deterministic gates from retained evidence.
  - Historical daily-depth evidence reports a non-empty frozen-package mismatch blocker when internally consistent evidence does not match its declared frozen package.

### Acceptance
#### Scenario: current Skill changes after a successful run
- GIVEN a retained successful native-design run
- WHEN a relevant published Skill or retained durable artifact changes
- THEN the default evaluator fails closed with the exact drift or integrity blocker
- AND release preparation does not rely only on the prior `metadata.result` or `score.passed` value

## Design
- Approach:
  - Extend the evaluator's retained-evidence contract with current artifact identities, an auditable durable artifact, and deterministic integrity rescoring.
  - Add mutation/tampering fixtures and the missing historical package-boundary blocker test.
- Affected areas:
  - `scripts/native-design-composition-eval.mjs` and its retained evidence/tests
  - `scripts/daily-workflow-depth-eval.mjs` and evaluator tests
- Constraints:
  - Preserve the successful real host observations and failed attempts; do not fabricate or relabel model output.
  - Bind behavior-bearing artifacts rather than the entire tarball so release-only documentation drift does not invalidate behavioral evidence.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Bind retained evidence to current artifacts and retain auditable durable output
- [x] Add the historical frozen-package mismatch blocker
- [x] Verify the hardened result and update release readiness

## Verify
- Automated:
  - [x] `mise exec -- pnpm run release:check`
    - Observed 2026-07-22: build, typecheck, lint, all 332 tests, and exact clean-install package validation passed; package SHA-256 remained `6b07aaedfa04539013b564eb6640968b3e9b6783dd8259feddcb099155bae4b7`.
- Manual:
  - [x] Inspect successful/failed retained evidence separation, drift/tamper failures, and release dependency status.
    - The default evaluator recomputed every gate as true; focused tests reject Skill/reference tree drift, CLI/rules drift, durable artifact tampering, score tampering, and frozen-package mismatch.
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or stable instructions that belong in the nearest project-owned `AGENTS.md`
  - [x] The evaluator contract and retained-evidence README are the correct durable owners; no product Spec or project instruction update was required.

## Blockers
- none
