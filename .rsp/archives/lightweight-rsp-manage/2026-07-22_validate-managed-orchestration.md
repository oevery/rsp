---
kind: "research"
---

# Change: lightweight-rsp-manage/validate-managed-orchestration

## Proposal
- Summary: Decide whether the revised lightweight `rsp-manage` demonstrates enough autonomous continuation and task-orchestration value to justify optional product promotion.
- Why:
  - The prior leading two-case matrix proved restraint but not a behavioral advantage, real delegation, retry exhaustion, or portable explicit invocation.
- Scope:
  - Compare baseline and candidate on ordinary restraint, genuinely independent long work, and interruption recovery with stale evidence and a real stop.
  - Exercise at least one bounded worker return, one evidenced corrective retry, one exhausted budget or authority stop, exact-package discovery, and response-language behavior.
  - Promote only after externally scored evidence demonstrates a meaningful quality or recovery delta at acceptable cost.
- Non-goals:
  - Cross-provider qualification, implicit invocation, Git or PR delivery, persistent controller runtime, or declaring unavailable human or platform acceptance complete.

## Spec
### ADDED
- Requirement: promotion evidence compares the revised candidate with the current eight-Skill baseline on discriminating tasks.
  - Record task success, corrections, unauthorized actions, stale-evidence handling, autonomous progress, user-prompt count, total input and output tokens, elapsed time, and tool calls.
  - Fail closed on evidence identity drift, changed allowlists, fabricated verification, leaked host or global Skills, or missing retained output.
- Requirement: product promotion is conditional rather than assumed.
  - A promote decision requires a demonstrated autonomous-continuation or recovery-quality delta and ordinary-path restraint; otherwise retain or reject the research candidate without changing package or product truth.

### Acceptance
#### Scenario: non-leading long orchestration holdout
- GIVEN an ordinary user request to finish a ready multi-owner Change without step-by-step prompting
- WHEN baseline and candidate runs operate on isolated equivalent workspaces
- THEN external evidence distinguishes slice independence, bounded worker results, verification, correction, and final authority stops
- AND the report recommends promote, revise, or reject with complete cost and limitation disclosure

## Design
- Approach:
  - Extend the retained evaluator with non-leading exact-package holdouts and external mutation and verification scoring.
  - Use fresh isolated forward-test agents for the candidate where host delegation is available, passing raw task artifacts rather than expected conclusions.
  - If qualified, move the candidate into `skills/rsp-manage`, update package discovery and product truth, then rerun the exact installed-suite gate.
- Affected areas:
  - `test/managed-controller/`, `scripts/managed-controller-eval.mjs`, and `research/evaluations/rsp-manage/`
  - conditionally `skills/rsp-manage/`, package inventory, README and Spec and design philosophy, and reconciled models
- Constraints:
  - Preserve all failed or invalid attempts and do not weaken oracles after seeing output without retaining the superseded score and reason.
  - Do not treat one host or unavailable hardware as general qualification.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Add ordinary-restraint, independent-long-work, and recovery and stop holdouts
- [x] Run deterministic and fresh forward-test evaluation with cost evidence
- [x] Record promote, revise, or reject and conditionally reconcile product and package truth

## Verify
- Automated:
  - [x] focused controller and evaluator tests
  - [x] `mise exec -- pnpm run release:check` is not required because recommendation `revise` leaves the package unchanged; the pre-existing checkpoint passed it before this independent Change.
- Manual:
  - [x] Review dispatch independence, actual worker mutations, stale-evidence correction, stop boundaries, retained evidence identity, and cost comparison.
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or stable instructions that belong in the nearest project-owned `AGENTS.md`
  - [x] Keep the decision in retained research evidence; no stable product fact changes until a future promotion run passes.

## Blockers
- none
