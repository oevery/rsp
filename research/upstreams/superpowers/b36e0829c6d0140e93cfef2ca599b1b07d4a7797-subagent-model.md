---
source: superpowers
revision: b36e0829c6d0140e93cfef2ca599b1b07d4a7797
base: 44c9b2d6e889982ac18c27d05a19fefe335194e1
strategy: adapt
evidence_hash: sha256:7161fee8a754b81bfe8d87e272075b89371c066a5c8f36a5cf2a79eecfc5f180
status: complete
supplement: subagent-orchestration
---

# Upstream Distillation Supplement: Superpowers Subagent Orchestration

## Source Position

- **Evidence:** Superpowers isolates each implementation task behind a focused brief, keeps accumulated session history out of dispatch prompts, and returns detailed reports through files with only a short status in the controller conversation (`skills/subagent-driven-development/SKILL.md`, `skills/subagent-driven-development/implementer-prompt.md`).
- **Evidence:** Its implementer and reviewer prompts explicitly prohibit nested subagents. The controller owns review dispatch, resumes the original implementer for the first three correction rounds, and moves to a fresh more capable implementer only after repeated non-convergence (`skills/subagent-driven-development/implementer-prompt.md`, `skills/subagent-driven-development/task-reviewer-prompt.md`, `skills/subagent-driven-development/re-review-prompt.md`, `skills/subagent-driven-development/SKILL.md`).
- **Evidence:** Same-shape small edits are batched into one dispatch, independent problem domains may fan out, shared-state implementation does not, and idle waiting uses bounded event waits rather than short polling (`skills/subagent-driven-development/SKILL.md`, `skills/dispatching-parallel-agents/SKILL.md`, `skills/using-superpowers/references/codex-tools.md`).
- **Inference:** These mechanisms are useful as control-boundary evidence, not as a workflow to copy. RSP already has its own WorkRef, Assignment, Receipt, ResourceLease, review, recovery, Git-authority, and durable artifact owners.

## Extracted Mechanisms

- **M1 — Construct minimal task context.** A fresh worker receives one task brief, necessary interfaces and decisions, resolved ambiguity, and a report contract instead of inheriting the complete controller transcript.
- **M2 — Batch small same-shape work.** Several independent edits with the same operation, writer boundary, tests, and review surface form one dispatch rather than one worker per file.
- **M3 — Keep workers leaf-scoped.** Implementers and reviewers do not dispatch helpers or their own reviewers. The controller retains integration and review-seat ownership, preventing duplicate reviews and hidden descendants.
- **M4 — Reuse before replacing.** Correction rounds resume the original implementer while its task context and strategy remain useful. Repeated non-convergence triggers a fresh worker and capability escalation rather than indefinite reuse.
- **M5 — Separate implementation from review context.** A reviewer receives a fixed brief, report, constraints, and diff package. It does not inherit the implementer's conversational context or trust its claims.
- **M6 — Parallelize only independent domains.** Fan-out is justified by independent scope and resources, not by the mere availability of multiple workers. Shared files or state keep implementation sequential.
- **M7 — Wait by events, then reconcile.** Local controller work proceeds while children run. Genuine idle time uses bounded waits and periodic reconciliation; short timeout polling adds cost without improving notification latency.

## RSP Comparison / Gaps

| Upstream mechanism | Current RSP position | Gap assessment |
| --- | --- | --- |
| Minimal constructed worker context | Complete Assignment references exact owners and carries bounded facts; AssignmentDelta inherits only across one compatible observed WorkerSession. | Covered. RSP intentionally avoids upstream brief/report workspaces because Assignment and Receipt already own these boundaries. |
| Same-shape batching | RSP sends one independently executable vertical slice and prefers one primary WorkerSession, but does not say that one bounded slice may contain several same-shape edits. | Material efficiency gap. Without an explicit allowance, controllers may mechanically create one worker per file or task. |
| Leaf workers and controller-owned review | Workers receive no implied lifecycle, Git, publication, or approval authority, but nested delegation itself is not explicitly denied or authorized. | Material authority and cost gap. A worker-created helper or reviewer can duplicate Manager obligations and obscure descendant resources and Receipts. |
| Reuse original implementer for corrections | RSP prefers one compatible primary WorkerSession and permits up to three evidenced same-scope correction passes. | Covered with a stronger authority model. Fresh workers remain required after session loss, boundary invalidation, incompatible strategy, or independence obligations. |
| Fresh reviewer context | Independent Verify requires a different observed identity; fixed-scope Review owns its own report-only comparison. | Covered. RSP should retain role and acceptance ownership rather than import Superpowers' mandatory per-task review seat. |
| Independent fan-out only | RSP derives parallel waves from exact writer seams, verification resources, and ResourceLeases. | Covered and stricter. |
| Event-based bounded waits | RSP separates machine heartbeat from material user progress and keeps elapsed time or poll count non-authoritative. | Mostly covered. Host-specific timeout values and polling APIs do not belong in portable product rules. |
| Durable ledger, reports, review packages, and worker commits | RSP keeps runtime orchestration transient and treats local Git delivery as separately authorized. | Intentionally different. Importing these artifacts would duplicate Change, Verify, Review, Focus Capsule, and Commit ownership. |

## Applicable to RSP

- Make every WorkerSession a leaf execution boundary by default. Nested delegation requires explicit Assignment authority and must not let the nested worker satisfy Manager-owned independent Verify or fixed-scope Review obligations.
- If nested delegation is explicitly authorized by a future host-specific use case, keep the parent WorkerSession responsible for descendant work, resources, evidence integration, and one schema-valid Receipt to Manager. Do not create a durable descendant registry.
- Permit one Assignment to batch small same-shape edits only when objective, role, seam, writer boundary, authority, replay safety, verification, review surface, and resource claims remain compatible. Otherwise preserve separate slices or workers.
- Retain the current reuse split: resume the same primary WorkerSession for compatible same-scope corrections and use fresh workers for independent evidence, incompatible strategy, identity loss, or invalidated boundaries.
- Keep wait behavior host-neutral: material user updates and resource reconciliation matter; specific polling intervals do not.

## Rejected

- Mandatory fresh implementer per plan task, mandatory per-task review, or mandatory final whole-branch review regardless of RSP risk and acceptance ownership.
- Worker-authored commits, automatic branch finishing, deletion of orchestration workspaces, or any implied Git authority.
- A gitignored progress ledger, task-brief directory, report directory, review-package store, worker registry, or review registry as required RSP runtime state.
- Controller rulings that silently decide material behavior, interface, acceptance, scope, mutation authority, or external-action questions instead of stopping for the DecisionOwner.
- Explicit provider model names, model tiers, timeout numbers, agent ids, or host-specific spawn and wait APIs in portable RSP Skills.
- Treating lower token or context cost as permission to weaken authority, isolation, independent verification, review, or acceptance gates.

## License and Reuse

- The reviewed Superpowers revision is MIT licensed (`LICENSE`), copyright Jesse Vincent.
- Selected recommendations are `independent-reimplementation`: RSP may reproduce the behavioral invariants in its own domain language without copying prompt templates, scripts, ledgers, or host adapters.
- If future work directly adapts substantial prompt or script text, it must retain the MIT license notice and provenance to this report, recommendation id, source path, and base revision.
- Eligible direct-adaptation paths are limited to `skills/subagent-driven-development/SKILL.md`, `skills/subagent-driven-development/implementer-prompt.md`, `skills/subagent-driven-development/task-reviewer-prompt.md`, `skills/subagent-driven-development/re-review-prompt.md`, `skills/dispatching-parallel-agents/SKILL.md`, and `skills/using-superpowers/references/codex-tools.md`. No direct adaptation is selected by this report.

## Recommendations

- **R1 — Make WorkerSessions leaf-scoped by default (`independent-reimplementation`).** Nested delegation requires explicit Assignment authority. The parent remains responsible for descendants, resources, integration, and one Receipt; nested work cannot self-create a valid independent review or Verify seat.
- **R2 — Batch compatible same-shape edits into one Assignment (`independent-reimplementation`).** Permit batching only inside one role, seam, writer boundary, authority envelope, replay-safety class, verification surface, review surface, and non-conflicting ResourceLease set.
- **R3 — Preserve the current reuse/fresh split (`model-only`).** Reuse one primary WorkerSession for compatible same-scope context and correction; require fresh context for independent evidence, incompatible strategy, invalidated boundaries, or lost identity.
- **R4 — Keep dispatch and return context bounded (`model-only`).** Continue using exact authority references, bounded facts, schema-valid Receipts, and material user checkpoints rather than copied session history or conversational diaries.
- **R5 — Reject Superpowers runtime and Git artifacts (`reject`).** Do not add ledgers, brief/report/review-package stores, worker commits, automatic rulings, provider model routing, or host-specific polling rules to portable RSP.

## Evaluation Guidance

- Compare one same-shape multi-file task with and without batching; require identical authority, verification, review, and acceptance while observing worker dispatches, elapsed time, tool calls, and total input/output tokens.
- Compare a compatible correction resumed in the primary WorkerSession against an unnecessary fresh-worker retry; inspect correctness and repeated-context overhead together.
- Include a restraint negative where edits have different writer boundaries or review surfaces and batching must be rejected.
- Include a nested-delegation negative where a worker attempts to spawn a helper or reviewer without explicit Assignment authority; acceptance must remain incomplete and no extra authority may be inferred.
