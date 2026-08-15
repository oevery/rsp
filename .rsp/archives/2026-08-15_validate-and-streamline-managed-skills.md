---
kind: "refactor"
---

# Change: validate-and-streamline-managed-skills

## Proposal
- Outcome: Establish fresh behavior evidence for the current managed Skill composition, exercise the candidate no-regression gate on retained real-run receipts, and reduce default managed context only where that evidence supports a behavior-preserving simplification.
- Why:
  - The latest retained provider-backed Manage evaluation is bound to an older `rsp`, `rsp-manage`, and `rsp-implement` composition, so it cannot qualify the current product composition.
  - The deterministic candidate gate exists but has not yet consumed one retained real current/candidate comparison.
  - `rsp-manage` regained substantial always-loaded control prose after the last context-flow evaluation; simplification needs current behavioral and measurement evidence rather than word-count preference.
- Scope:
  - Run one fresh provider-backed baseline/current holdout for the exact current managed composition in an isolated evaluation workspace.
  - Retain attributable Trigger, Compliance, Boundary, task-result, and available measurement evidence, then feed identity-bound receipts through the no-regression gate.
  - If the current run passes, create and evaluate one minimal `rsp-manage` candidate that moves conditional detail out of the default body without weakening authority, recovery, verification, or closeout behavior.
  - Promote only a candidate that passes the same unseen acceptance contract without a hard regression; otherwise retain the current Skill and record the result.
- Non-goals:
  - No catalog-routing suite, Skill security preflight, capability-family lookup layer, broad provider/model matrix, numeric performance threshold, automatic Skill rewriting, release, push, or publication.
  - No Broker, SQLite, Web Observatory, runtime ledger, worker registry, or second RSP state model.

## Spec
### MODIFIED
- Requirement: Current managed behavior evidence is composition-bound and fresh.
  - The retained run names exact current Skill identities and one explicitly unseen holdout.
  - Trigger, Compliance, Boundary, and task result remain independent observations; unavailable measurements remain unavailable.
- Requirement: The no-regression gate consumes real retained receipts before a Skill simplification is accepted.
  - Current and candidate observations use the same acceptance-contract identity and immutable receipt/observability hashes.
  - Any failed or unobserved required candidate dimension retains the current composition.
- Requirement: Managed-context simplification is evidence-driven.
  - Default Skill prose may shrink only by relocating behavior that is conditionally required and remains reachable from its trigger.
  - Authority, mutation, recovery, verification, lifecycle, Git, publication, and human-acceptance boundaries must not weaken.

### Acceptance
#### Scenario: Validate the current managed composition
- GIVEN the retained August 14 evaluation identifies a different product composition
- WHEN the current composition runs the isolated unseen holdout
- THEN the new retained evidence is bound to the current hashes and reports every required behavior dimension truthfully

#### Scenario: Evaluate one streamlined candidate
- GIVEN passing current-composition evidence and one candidate with a distinct immutable identity
- WHEN both observations are compared through the candidate gate
- THEN the result is `candidate-eligible`, `retain-current`, or `incomplete`, and only `candidate-eligible` permits adopting the candidate text

#### Scenario: Preserve conditional control behavior
- GIVEN conditional recovery, concurrency, verification, or closeout detail is removed from the default body
- WHEN its owning condition occurs
- THEN the Skill still directs the agent to the exact bounded reference and preserves the same stop and authority contract

## Design
- Approach:
  - Refresh the locked beta-plan composition identity and prior-evidence pointer, then run the existing isolated provider harness into a new ignored output directory.
  - Retain a sanitized report and summary plus identity-bound candidate manifest/result; never retain authentication, raw provider events, disposable paths, or secrets.
  - Derive one minimal candidate from repeated default-body detail, run the same holdout, and adopt it only after the deterministic comparison passes.
- Boundaries:
  - Provider execution is evidence generation, not product authority; this Change owns only the selected Skill simplification and retained maintainer evidence.
  - Historical evaluation generations remain immutable.
- Affected areas:
  - `test/managed-controller/beta/manage-orchestration-beta.yaml` and managed evaluation scripts only if a missing real-consumption seam is demonstrated.
  - `research/evaluations/rsp-manage/` retained current/candidate evidence.
  - `skills/rsp-manage/` and corresponding semantic contracts, only for an eligible candidate.
  - `.rsp/specs/skill-control-model.md` or `.rsp/specs/skill-system.md` only if current product facts change.
- Constraints:
  - Use the existing configured provider/model path and stop truthfully if credentials, quota, or capability are unavailable.
  - Keep one to three unseen cases; do not turn this into repeated benchmark calibration.
  - Preserve authored `skills/` as the source and let the normal build update package projections.

## Tasks
- [x] Refresh and run one provider-backed evaluation for the exact current managed composition.
- [x] Produce and retain the first real identity-bound no-regression manifest and result.
- [x] Derive, evaluate, and conditionally adopt one minimal managed-context simplification.
- [x] Run focused behavior, package, full regression, fixed-scope review, and readiness checks.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skill-candidate-evaluation.test.ts test/managed-controller-beta-contract.test.ts test/managed-controller-contract.test.ts test/skill-runtime-context-contract.test.ts --no-file-parallelism` — passed 4 files / 90 tests; proves the harness, structured receipt adapter, composition locks, conditional-reference reachability, and candidate gate remain valid.
  - [x] Current composition `d8a9d6bb5b95a470025bf44af1e617cc1b44c641f53ba8d98c0efb915e784e4f` and candidate `f56072c531ad1f9b5b204fe0ae74d40279703630dbdaa2bae555fccb6fb042c1` each passed the same provider-backed `auto-multisurface-routing` holdout; `skill-candidate-evaluation managed-runs` returned `candidate-eligible` with no regressions, candidate failures, or missing required dimensions. Retained evidence: `research/evaluations/rsp-manage/2026-08-15-managed-context-no-regression/`.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `mise exec -- pnpm run docs:check`, and `mise exec -- pnpm run test` — passed; documentation reported 7 bilingual pairs and 30 Markdown files, and the full suite passed 74 files / 802 tests after updating one relocated-guardrail assertion.
  - [x] Fixed-scope Code and Document review of the complete owned diff — clean: the production CLI reaches receipt/hash validation and bounded output, all conditional references remain reachable, stable facts match implementation, and the report makes no unsupported performance claim.
  - [x] `node dist/cli.mjs check --focused --json` and `git diff --check` — passed with zero errors and zero warnings beyond the informational MODIFIED delta marker; proves Change validity and patch hygiene.
### Optional
- Manual or environment:
  - [-] Additional provider/model or downstream real-host run — omitted because the bounded current/candidate holdout produced complete required behavior evidence; provider generality and performance calibration remain outside this Change.
- Coverage:
  - Required evidence covers one real provider path, deterministic candidate comparison, conditional-loading contracts, and repository regression behavior. The candidate reduced the default `rsp-manage` body from 3028 to 2801 words and preserved all required behavior dimensions, but its single run used more tools, time, and tokens; therefore this Change claims structural progressive disclosure only, not provider-general performance improvement.

## Blockers
- none
