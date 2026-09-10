---
kind: "refactor"
---

# Change: verification-refactor

## Proposal
- Outcome: Separate deterministic verification from explicit provider behavior and workflow evaluations, with local scenario ownership and outcome-based judgments.
- Why: Global inventories, literal handoff checks, and synthetic campaign reports obscure real outcomes and make local checks unnecessarily coupled.
- Scope: verification/, its scripts and package entry points, deterministic tests, and active documentation. This is the authorized integration successor to the pre-existing test-suite-simplification edits; preserve its historical archive and abandoned-work deletions.
- Non-goals: Product CLI or Skill behavior changes, rewriting retained research/cache evidence, real provider calls, Git delivery, archive, or publication.

## Spec
### MODIFIED
- Requirement: Code tests and disposable package acceptance MUST run without a provider or historical report identity prerequisite.
- Requirement: Provider scenarios MUST be organized as behaviors and workflows and explicitly selected; baseline comparison is optional.
- Requirement: Default provider evaluation MUST judge observable outcomes and authority boundaries, not exact handoff wording or evaluator-specific agent receipts. Execution failure, insufficient evidence, and behavior failure MUST remain distinct.
- Requirement: Historical reports MUST remain unchanged and legacy comparison identity checks MUST remain confined to explicit evidence-reuse/comparison operations.

### Acceptance
#### Scenario: Independent local and provider verification
- GIVEN the current checkout and selected behavior or workflow
- WHEN local tests or an explicit provider plan are requested
- THEN local success depends only on executed deterministic checks, provider listing/planning makes no provider calls, and live evaluation reports only evidenced outcomes.

## Design
- Approach: Keep tests/, acceptance/, harness/, artifacts/; regroup evaluation datasets into behaviors/ and workflows/. Co-locate scenario definitions and remove redundant synthetic topology/campaign machinery. Reuse the existing provider process adapter with an outcome mode, preserving explicit historical comparison semantics.
- Boundaries: One shared execution adapter; provider harness contracts are deterministic tests. Required local evidence and optional real-provider acceptance are separate.
- Affected areas: verification, scripts, package.json, Vitest collection and active verification documentation.
- Constraints: No new provider infrastructure, automatic model judge, real calls, or rewrites of historical research and archives.

## Tasks
- [x] Migrate scenario ownership and active path references; remove superseded global definitions.
- [x] Simplify deterministic entry points and retain meaningful harness regression coverage.
- [x] Implement explicit behavior/workflow execution with outcome-based judgments and separate execution/acceptance states.
- [x] Update documentation, inspect the integrated diff, and run fresh deterministic verification.
- [x] Rename and separate daily, harness, release acceptance, and explicit provider commands; update their documentation and contract tests.

## Verify
### Required
- Automated:
  - [x] Build, typecheck, lint, docs check, full deterministic tests, and diff check — 89 files / 844 tests; release acceptance passed.
  - [x] Provider fake-process integration: alternative final wording, incorrect product, boundary violation, provider failure, and missing evidence classifications — 19 focused tests passed.
  - [x] Behavior/workflow discovery and planning through the actual command without provider calls.
  - [x] `pnpm test` — 62 files / 613 tests passed.
  - [x] `pnpm run test:acceptance` — 89 files / 844 tests, build, typecheck, lint, docs, package and installed-package workflows passed.
### Optional
- Manual or environment:
  - [ ] Real provider behavior and workflow runs — require separate model, budget, and execution authority.
- Coverage:
  - Local evidence does not establish current model behavior or release readiness.

## Blockers
- none
