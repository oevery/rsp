---
kind: "feature"
---

# Change: minimum-skill-suite/build-rsp-implement

## Proposal
- Summary: Build and promote a bounded RSP implementation Discipline Skill.
- Why:
  - The minimum suite cannot execute an accepted Change or produce trustworthy verification evidence without a standalone implementation capability.
- Scope:
  - Create, evaluate, revise, and promote one `rsp-implement` candidate from selected implementation recommendations.
- Non-goals:
  - Managed retries, universal TDD, automatic review resolution, or commit/push/publish authority.

## Spec
### ADDED
- Requirement: `rsp-implement` modifies only the selected Change's authorized implementation/test owners and returns truthful task, blocker, and fresh verification evidence.
  - Project commands and nearest instructions determine verification; failed or unavailable gates remain visible.
  - Git and external publication require separate explicit authority.

### Acceptance
#### Scenario: user authorizes implementation of a ready Change
- GIVEN settled required decisions, a bounded selected Change, and project instructions
- WHEN `rsp-implement` executes the work
- THEN code/tests and Change task/verify state reflect observed results
- AND unrelated dirty work is preserved and no unauthorized Git or publication action occurs

## Design
- Approach:
  - Reuse the proven promotion harness shape while adding mutation-scope, fresh-verification, failure, and stop-condition fixtures appropriate to a write-capable Skill.
  - Select `rsp-skill-system` S5/S8 and `rsp-implementation-capability` I1-I6; preserve I2's MIT notice boundary and independently implement all RSP ownership semantics.
- Affected areas:
  - `research/candidates/skills/rsp-implement/`
  - implementation behavior/evaluation fixtures
  - promoted `skills/rsp-implement/`
- Constraints:
  - Keep diagnosis and TDD optional task disciplines unless the selected research proves they require separate RSP-native packages.

## Tasks
- [x] Freeze the candidate contract and provenance.
- [x] Build the smallest candidate and implementation-specific evaluation matrix.
- [x] Repair and calibrate until all promotion gates pass.
- [x] Promote one canonical Skill and verify the package boundary.
- [x] Update shared package/user documentation during minimum-suite integration.

## Verify
- Automated:
  - [x] Static candidate contract and deterministic mutation/behavior/restraint harness pass, including redacted provider-route identity and drift detection.
  - [x] Full offline project build, typecheck, lint, and test gates pass after promotion (13 test files, 292 tests).
  - [x] Research-only package dry-run excludes candidate and evaluation artifacts.
  - [x] Diagnose candidate `2026.07.20.1` with three fresh paired real-host matrices: two pass, the third fails one contract, and the cost gate fails.
  - [x] Compact candidate `2026.07.20.2` and run deterministic plus four-case representative paired gates; clean/failure improve below `50%`, but dirty behavior and representative cost still fail.
  - [x] Freeze capability-owned resolver safety after focused P0/P1 review; deterministic helper/Skill gates pass (2 files, 22 tests).
  - [x] Candidate `2026.07.20.18` passes one complete nine-case paired qualification matrix before final calibration.
  - [x] Candidate `2026.07.20.18` passes three fresh paired matrices and context-cost calibration: aggregate median overhead `11.20%`, highest per-case median `36.96%`, and no matrix or identity issue.
  - [x] Full project gates and promoted package/install smoke tests pass.
- Manual:
  - [x] Exploratory custom-provider runs complete a normal Change, stop on missing authority, preserve unrelated dirty/staged work, and report failed or unavailable verification without claiming completion.
- Durable updates:
  - [x] Update `.rsp/specs/design.md` after promotion succeeds.
  - [x] Record the blocked promotion evidence in `research/evaluations/rsp-implement/2026-07-20-blocked/report.md`.
  - [x] Record exact v18 promotion identities, safety review closure, behavior/cost calibration, and package evidence in `research/evaluations/rsp-implement/2026-07-20-v18-promotion/report.md`.

## Blockers
- requires `skill-capability-research/synthesize-implementation-capability`: needs the selected implementation contract
- requires `skill-capability-research/reconcile-skill-system`: needs the reconciled minimum-suite decision
