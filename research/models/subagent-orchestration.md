---
sources:
  - "deepseek-harness@47f943859bef60e4160492346772ded9b24f765a -> research/upstreams/deepseek-harness/47f943859bef60e4160492346772ded9b24f765a-subagent-model.md"
  - "superpowers@b36e0829c6d0140e93cfef2ca599b1b07d4a7797 -> research/upstreams/superpowers/b36e0829c6d0140e93cfef2ca599b1b07d4a7797-subagent-model.md"
status: complete
---

# Cross-source Model: Subagent Orchestration

This model compares two completed upstream supplements. Current RSP Specs and published Skills remain authoritative.

## Shared Mechanisms

- Delegation needs one explicit admission and authority boundary; identity, lineage, provenance, or ambient context cannot grant missing authority.
- A controller should send bounded task context and receive a bounded result contract rather than sharing or replaying its complete conversation.
- Worker reuse is valuable only while role, task boundary, strategy, authority, and continuity remain compatible. Lost identity, invalidated boundaries, independent evidence, or failed strategy requires fresh context.
- Child completion or settlement does not by itself prove accepted work. The controller still owns result validation, evidence integration, resource release, and acceptance.
- Concurrency depends on independent resources and seams. Multiple workers do not imply isolation.
- Runtime coordination should stay transient and should not create a second durable workflow state beside repository-owned work artifacts.

## Disagreements

- DeepSeek uses durable child Sessions and runtime ancestry; Superpowers uses gitignored briefs, reports, ledgers, review packages, and task commits. RSP rejects both persistence models because Change, Spec, Verify, Review, Focus Capsule, and Commit already own durable truth.
- Superpowers defaults to a fresh implementer per task and mandatory review seats. RSP instead prefers one compatible primary WorkerSession and derives review or independent Verify from declared risk and acceptance.
- Superpowers permits controller rulings to keep a plan moving. RSP stops for the DecisionOwner when behavior, interface, acceptance, scope, mutation authority, or external action changes.
- DeepSeek accepts runtime-specific provider capabilities and ancestry contracts. RSP stays host-neutral and fails or downgrades truthfully when the host cannot establish a required boundary.

## RSP Gaps at the Candidate Baseline

1. RSP did not explicitly state whether an assigned worker could create descendants. `strengthen-subagent-control-boundaries` resolves this by making WorkerSessions leaf-scoped by default and keeping explicitly authorized descendants under the parent WorkerSession's authority, resources, evidence integration, and single Receipt.
2. RSP preferred WorkerSession reuse but did not explicitly allow one bounded Assignment to combine several same-shape edits. The current Change resolves this only inside one WorkRef; distinct WorkRefs retain distinct Assignments and Receipts while compatible Group children may reuse one primary WorkerSession longitudinally.
3. Admission, settlement, provenance, and outstanding owned-work boundaries were implicit. The current Change adds explicit host-neutral contracts without adding durable runtime state.

## Rejected Ideas

- Durable Session, Activation, inbox, mailbox, worker, Receipt, review, or dependency registries.
- Runtime data or worker chronology in `.rsp/focus.d/`.
- Mandatory task-per-worker dispatch, mandatory per-task review, or parallel implementation in a shared writer boundary.
- Worker-created reviewers counting toward Manager-owned fixed-scope Review or independent Verify.
- Worker commits, automatic Git closeout, automatic material rulings, provider-specific model tiers, or polling intervals.
- Token savings as an authority, safety, review, or acceptance waiver.

## Candidate Recommendations

- **C1 — Leaf worker boundary.** Adopt Superpowers R1 by independent reimplementation, supported by DeepSeek's owned-descendant settlement model: default each WorkerSession to no nested delegation. Explicitly authorized delegation leaves the parent responsible for all descendants and one Receipt.
- **C2 — Compatible same-shape batching.** Adopt Superpowers R2 by independent reimplementation: inside one WorkRef, one Assignment may batch small edits only across one role, seam, writer boundary, authority envelope, replay-safety class, verification and review surface, and compatible ResourceLeases. Distinct WorkRefs retain distinct Assignments and Receipts; compatible Group children may reuse one primary WorkerSession longitudinally without merging ownership or acceptance.
- **C3 — Retain longitudinal reuse.** Preserve the current RSP rule, supported by Superpowers R3 and DeepSeek policy-boundary evidence: use AssignmentDelta only for one compatible observed WorkerSession, and use a complete Assignment for fresh or invalidated contexts.
- **C4 — Preserve one outer receipt and transient runtime.** Retain DeepSeek R5 and Superpowers R5 as explicit rejections; do not add another status flow or durable orchestration store.
