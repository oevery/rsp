---
kind: "refactor"
---

# Change: implementation-test-restraint-skills

## Proposal
- Outcome: Prevent speculative implementation boundaries and low-value permanent tests across ordinary implementation, TDD, and fixed-scope review without weakening required regression evidence.
- Why:
  - Real boats-cloud work showed tests mirroring wrappers, source strings, and technical hops, while other nearby tests protected genuinely independent failure reasons.
  - `rsp-implement` currently evaluates test retention after mutation, `rsp-tdd` can reach GREEN before rejecting a test-driven contract expansion, and `rsp-review` does not explicitly classify test-only consumers or permanent-test ownership.
  - Research model `research/models/agent-implementation-restraint-and-test-value.md` selects reachable-boundary evidence, test ownership, and contrastive restraint while rejecting universal TDD and coverage matrices.
- Scope:
  - Revise the authored `rsp-implement`, `rsp-tdd`, and `rsp-review` contracts at their existing ownership seams.
  - Extend only existing contract and behavior fixtures needed to lock the distinguishing decisions.
- Non-goals:
  - Add a new Skill, workflow stage, review pipeline, coverage quota, mandatory TDD policy, or test-count target.
  - Delete project tests automatically, weaken explicit Change/project test requirements, accept upstream revisions, or modify RSP rules, CLI behavior, or other Skills.

## Spec
### MODIFIED
- Requirement: Ordinary implementation admits new defensive/public seams only when a current producer, production consumer, actual trust or lifecycle transition, and material consequence are evidenced or explicit authority requires the seam.
  - A permanent test must own an observable consequence and distinct plausible regression that existing evidence misses at proportionate maintenance cost. Test or documentation consumers alone do not make generic behavior production-load-bearing.
- Requirement: TDD remains conditional and cannot create product authority.
  - Before RED, the behavior and test seam must be owned by the selected Change or project authority. GREEN must stop rather than add an unauthorized fallback, public API, compatibility path, or unreachable-state behavior merely to satisfy the test.
- Requirement: Code review judges test value as well as missing regression evidence.
  - Before returning `clean` for a changed seam or permanent test, Review classifies production and non-production consumers, verifies the test's observable consequence and distinct failure reason, and avoids collapsing tests that protect independent consequences.

### Acceptance
#### Scenario: Reject a speculative event capability and hop-by-hop tests
- GIVEN one real typed event/listener lifecycle with no runtime policy consumer
- WHEN implementation or TDD considers a generic capability and tests for each forwarding hop
- THEN the real behavior remains, while the capability and duplicate technical-hop tests are rejected unless explicit authority supplies a material production owner

#### Scenario: Preserve tests with independent failure reasons
- GIVEN two nearby tests where one protects user-visible stability and the other suppresses a native side effect
- WHEN implementation, TDD retention, or Review evaluates test count and overlap
- THEN both tests remain because each owns a distinct observable consequence

#### Scenario: Move a source-string assertion to its real owner
- GIVEN a source-reading architecture test whose invariant can be owned by lint, type, build, or behavior evidence
- WHEN the final implementation and review evidence are selected
- THEN the brittle source-string test is rejected or removed and the smallest decisive real owner is used

## Design
- Approach:
  - Add one concise pre-mutation admission block to `rsp-implement`.
  - Add behavior-ownership admission before RED and a product-contract stop before GREEN in `rsp-tdd`; retain its existing disposable-probe decision.
  - Extend `rsp-review/references/code-review.md` inside the existing production-reachability, regression-evidence, and simplicity sequence rather than creating another pipeline.
  - Independently reimplement recommendations DeepSeek R1-R4 and ECC R1-R4 through the local cross-source model; copy no upstream prose or runtime workflow.
- Boundaries:
  - Explicit user, Change, Spec, and project requirements remain authoritative. Safety, correctness, security, and real trust boundaries are never removed for simplicity.
  - Test value is semantic: neither fewer tests nor higher coverage is a goal.
- Affected areas:
  - `skills/rsp-implement/SKILL.md`, `skills/rsp-tdd/SKILL.md`.
  - `skills/rsp-review/references/code-review.md`.
  - Existing Skill contract tests and bounded current-versus-candidate evaluation evidence.
- Constraints:
  - Preserve triggers, authority, outputs, return ownership, report-only Review behavior, and conditional TDD routing.
  - Keep the contracts host-neutral and concise; no shared runtime state or new durable receipt.

## Tasks
- [x] Add reachable-boundary and permanent-test admission to `rsp-implement`.
- [x] Prevent unauthorized test-driven product-contract expansion in `rsp-tdd`.
- [x] Add bounded test-value and test-only-consumer judgment to Code Review.
- [x] Update the smallest existing contract/behavior fixtures and run candidate diagnostics.
- [x] Run focused and package-level verification and reconcile final evidence.
- [x] Resolve review Finding P2 by replacing self-asserting YAML expectations with actual current-versus-candidate Skill runs.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/rsp-implement-skill-contract.test.ts test/rsp-tdd-skill-contract.test.ts test/rsp-tdd-behavior.test.ts test/skill-contract.test.ts` — 4 files and 19 tests passed; proves the three authored text contracts preserve their existing routing, authority, and retention boundaries. It is not treated as behavioral evidence for the new decisions.
  - [x] `node scripts/skill-candidate-evaluation.mjs research/evaluations/rsp-skill-restraint/2026-08-17/manifest.json` — returned `candidate-eligible` with no regressions, candidate failures, or missing dimensions across three unseen current-versus-candidate cases. Trigger, Compliance, Boundary, and task result passed for Implement restraint, TDD authority refusal, and Review preservation of independent tests. Retained manifest SHA-256 is `0e3ed90836b15699be6f84e7da7f73ce505a865af9594fb97ddd42daa7dd7474`; report SHA-256 is `e02c5148d7eabf1cde57d6b1c33113d011fd2f7b69547a268991e02b3fa2ccdf`.
  - [x] `node .agents/skills/author-rsp-skills/scripts/scan-skill-context.mjs --json` — diagnostics completed; `rsp-review` references and `rsp-tdd` are reachable. The reported unreachable `rsp-implement/NOTICE.md` is existing package metadata, not a new contract resource.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run lint && mise exec -- pnpm run test` — build and lint passed; 73 files and 822 tests passed.
  - [x] `git diff --check` and `node dist/cli.mjs check implementation-test-restraint-skills --json` — changed artifacts passed whitespace validation and the selected Change reported 0 errors and 0 warnings.
### Optional
- Manual or environment:
  - [x] `node scripts/managed-controller-beta.mjs run --model combo/gpt-5.6-terra --effort high --timeout-ms 600000 --output-root .cache/rsp-manage-beta-2026-08-17-implementation-test-restraint` — required in practice because `rsp-implement` changed the locked Managed Controller product composition. Baseline and product both reached `contract-passed`; all 33 deterministic contracts passed, no unauthorized paths were observed, and bounded evidence is retained under `research/evaluations/rsp-manage/2026-08-17-implementation-test-restraint/`. Missing trigger, first-fix, and worker-lifecycle observations remain explicit omissions; the run supports no performance or promotion claim.
- Coverage:
  - Skill text contract, three unseen current-versus-candidate behavior cases, package validation, and repository regression only; no claim about every host/provider or real-project acceptance.

## Blockers
- none
