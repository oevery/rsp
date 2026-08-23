---
kind: "fix"
---

# Change: release-behavior-provider-execution

## Proposal
- Outcome: Make provider-backed release behavior runs distinguish startup or harness failure from model behavior and give the commit-surface holdout the declared local Git authority.
- Why:
  - The first real campaign showed that an invalid provider ID exited before a model turn but was reported as a candidate hard-dimension failure.
  - The commit-surface baseline and candidate both implemented and verified the task cleanly but could not create the required local commit because the fixture lacked `.git` write authority and current RSP initialization.
- Scope:
  - Classify pre-turn nonzero executions with no final response or events as harness startup failures.
  - Align the commit-surface holdout with the existing commit evaluation boundary by enabling RSP initialization and `danger-full-access` sandboxing.
- Non-goals:
  - Weakening candidate behavior gates, changing the twelve-run plan, retrying failed model behavior automatically, or changing provider credentials and routing.

## Spec
### MODIFIED
- Requirement: Provider execution failures are classified from observed execution phase.
  - A nonzero run that produces no final response and no model event stream is `harness-failed`, not an eligible model-behavior sample.
- Requirement: A holdout that requires a local commit supplies the Git and RSP runtime authority needed to exercise that contract.
  - The commit-surface fixture initializes the current RSP fallback and permits isolated `.git` mutation while remote and history-rewrite actions remain denied.

### Acceptance
#### Scenario: Provider startup fails before a model turn
- GIVEN an invalid or unavailable provider configuration
- WHEN Codex exits nonzero without a final response or event stream
- THEN the report stops as `harness-failed` and does not claim a model correctness failure

#### Scenario: Commit-surface behavior is observable
- GIVEN the isolated commit-surface holdout and an authorized local commit contract
- WHEN baseline or candidate completes the task
- THEN the harness can observe the commit message and evaluate residue without an artificial `.git` or stale-RSP blocker

## Design
- Approach:
  - Add a small metadata classifier before sanitized run projection and reuse the existing harness-failure stop behavior.
  - Add the same initialization and sandbox fields already used by the repository's commit-message holdout.
- Boundaries:
  - Preserve sanitized retained reports; raw startup diagnostics remain local.
  - Do not classify a completed model turn or ordinary task failure as harness startup failure.
- Affected areas:
  - `scripts/release-behavior-acceptance.mjs`
  - `evaluation/managed-controller/holdout/release-commit-surface-hygiene/case.yaml` and focused release tests
- Constraints:
  - The failed reports from 2026-08-23 remain diagnostic only and are never edited into passing evidence.

## Tasks
- [x] Add startup-failure classification and deterministic regression coverage.
- [x] Correct the commit-surface fixture execution authority and preparation coverage.
- [x] Run focused and repository verification before lifecycle delivery.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/release/release-behavior-acceptance.test.ts` — passed 1 file / 14 tests; proves startup classification, fixture preparation, sanitization, and unchanged behavior gates.
  - [x] `mise exec -- pnpm run lint` and `mise exec -- pnpm run test` — passed lint, build, 88 test files, and 872 tests; proves repository compatibility.
  - [x] `node dist/cli.mjs check --focused --json` and `git diff --check` — passed with zero errors or warnings; proves the converged correction is structurally clean.
### Optional
- Manual or environment:
  - [ ] Targeted `commit-release-surface-leakage` provider rerun with the frozen model settings.
- Coverage:
  - One targeted provider rerun proves this execution boundary only; remaining campaign scenarios retain their own evidence requirements.

## Blockers
- none

## Durable Decisions
- Current facts: No additional Spec update is needed; the existing release behavior contract already requires harness failures to stop without becoming model evidence.
- Lasting rationale: No Decision Record is needed; the correction aligns fixture authority and failure classification with existing repository contracts.
