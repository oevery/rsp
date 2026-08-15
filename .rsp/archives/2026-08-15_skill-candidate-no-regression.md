---
kind: "feature"
---

# Change: skill-candidate-no-regression

## Proposal
- Outcome: Maintainers can compare one current Skill composition with one candidate on a small unseen holdout and receive a deterministic no-regression result backed by attributable evaluation receipts.
- Why:
  - Recent `rsp-manage` content changes invalidated retained beta composition identity and required a new evaluation generation, but the repository has no shared gate that decides whether the candidate preserves current behavior on unseen tasks.
  - Q1 added a common observability projection, while real beta reports still cannot observe first-fix result, worker dispatch count, corrections, or triggering unless a harness supplies explicit structured evidence.
  - `research/models/skill-quality-and-governance.md` Q3 selects current-versus-candidate holdouts and no-regression receipts for real Skill wording changes.
- Scope:
  - Add a maintainer-only deterministic candidate comparison module and manifest contract for one to three unseen holdout cases.
  - Compare independent Trigger, Compliance, Boundary, and task-result dimensions and retain measurement deltas as diagnostics.
  - Extend the shared evaluation projection and managed beta summary to consume explicit structured receipt observations without inferring unavailable values.
- Non-goals:
  - Catalog routing or description-collision fixtures (Q2), automatic Skill rewriting, broad provider/model matrices, numeric promotion thresholds, Skill security scanning (Q4), release, push, or publication.
  - Parsing natural-language agent output or treating aggregate tool calls as worker dispatches.

## Spec
### ADDED
- Requirement: Candidate comparison is identity-bound and holdout-based.
  - A manifest names distinct immutable current and candidate composition identities and contains one to three cases explicitly marked unseen.
  - Every case supplies current and candidate Q1 observability results from the same acceptance contract, with each observation bound to its composition, contract, immutable receipt-content hash, and observability-content hash.
  - Missing or malformed identity, unseen provenance, required dimensions, or observations fails closed as incomplete evidence.
- Requirement: Hard behavior regressions preserve the current candidate.
  - Trigger, Compliance, Boundary, and task result are compared independently.
  - A current passing dimension that becomes failed or not observed is a regression; any candidate failed required dimension is also ineligible.
  - A candidate is eligible only when every required dimension is observed and passed for every case and no hard regression exists.
  - Corrections, worker dispatches, tool calls, elapsed time, first-fix result, and token counts remain diagnostic unless a future Change defines a pre-registered threshold.
- Requirement: Evaluation receipts are truthful.
  - First-fix result, correction count, worker dispatch count, and trigger evidence are accepted only from explicit structured harness observations.
  - The managed evaluation producer requests one transient structured receipt, validates its exact run identity and schema, hashes normalized receipt and projected observability content, removes the transient file before Git observation, and passes the bound metadata to beta summarization.
  - Missing observations remain `null` or `not-observed`; aggregate tool calls and successful task completion never imply them.
  - Candidate evaluation does not edit Skills, choose publication, or mutate retained historical evidence.

### Acceptance
#### Scenario: Accept a behavior-preserving candidate
- GIVEN distinct current and candidate identities and two unseen cases whose required dimensions all pass
- WHEN the candidate comparison runs
- THEN it returns `candidate-eligible`, no hard regressions, and diagnostic measurement deltas without inventing a cost threshold

#### Scenario: Retain current behavior after a regression
- GIVEN a current passing Boundary or task-result dimension that fails in the candidate
- WHEN the candidate comparison runs
- THEN it returns `retain-current`, identifies the exact case and dimension, and grants no promotion or publication authority

#### Scenario: Refuse incomplete or misattributed evidence
- GIVEN a reused identity, a case not marked unseen, a required dimension that is not observed, absent explicit receipt observations, or a composition/contract/content hash mismatch
- WHEN the gate evaluates eligibility
- THEN it returns `incomplete` or rejects the malformed manifest and never converts missing evidence to success or zero

#### Scenario: Project explicit receipt observations
- GIVEN a harness supplies structured trigger, first-fix, correction, and worker-dispatch observations
- WHEN a run is projected into the shared schema
- THEN those observations are retained independently; when omitted, their values remain explicitly unavailable

## Design
- Approach:
  - Add a pure `skill-candidate-evaluation` module that validates a small YAML/JSON-compatible manifest, verifies receipt and observability provenance, and compares existing Q1 observability objects.
  - Return a stable result with `candidate-eligible | retain-current | incomplete`, exact regressions and missing evidence, identity hashes, per-case results, and diagnostic measurement deltas.
  - Extend the existing pure observability projection with optional explicit receipt observations; the managed evaluator produces a validated transient receipt and managed beta consumes only the complete bound producer metadata.
  - Keep a small command entry for deterministic maintainer/CI use; provider execution remains owned by existing specialized harnesses.
- Boundaries:
  - The new gate evaluates retained results; it does not run models, generate candidates, edit Skills, or update historical evidence.
  - Existing evaluation scripts remain specialized producers and may adopt the shared manifest incrementally.
  - Cost measurements are reported as deltas, not interpreted as promotion verdicts.
- Affected areas:
  - `scripts/skill-candidate-evaluation.mjs` and its declaration/CLI contract
  - `scripts/skill-evaluation-observability.mjs` and `scripts/managed-controller-beta.mjs`
  - focused evaluation and beta contract tests
  - `.rsp/specs/distribution.md`
- Constraints:
  - Independent RSP-owned implementation informed by Q1/Q3 and their accepted source reports; do not copy Skill-Use-Bench assets.
  - No new runtime/package dependency, provider call, remote access, or change to published CLI behavior.
  - Preserve retained evaluation artifacts as immutable.

## Tasks
- [x] Implement transient structured receipt production, provenance validation, and truthful managed-beta projection.
- [x] Implement the identity-bound unseen-holdout candidate comparison gate and deterministic command.
- [x] Add focused contract coverage for eligibility, hard regression, incomplete evidence, diagnostics, and historical immutability boundaries.
- [x] Run repository-required verification and record the durable evaluation contract.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skill-behavior.test.ts test/skill-candidate-evaluation.test.ts test/managed-controller-contract.test.ts test/managed-controller-beta-contract.test.ts test/skill-evaluation-observability.test.ts` — passed 5 files / 103 tests; proves: receipt-to-observability semantic binding at both candidate and beta public entries, provenance-bound current/candidate receipts, producer-to-summary projection, unavailable capability classification, transient receipt cleanup, independent hard dimensions, result-aware CI exit codes, truthful nullable observations, and diagnostic-only measurement comparison.
  - [x] `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run build`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run test` — passed after the final correction; full suite passed 73 files / 796 tests, proving package output, declaration compatibility, static checks, and repository regression compatibility.
  - [x] `git diff --check` and `node dist/cli.mjs check --focused --json` — passed with zero errors and zero warnings; proves bounded artifact validity and whitespace hygiene.
### Optional
- Manual or environment:
  - [ ] Run one fresh provider-backed current/candidate holdout — optional because this Change establishes the deterministic gate and receipt contract rather than selecting a release candidate.
- Coverage:
  - Required coverage is deterministic and local; repeated provider matrices, host generality, and numeric calibration remain release-candidate evidence.

## Blockers
- none
