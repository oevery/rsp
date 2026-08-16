---
topic: rsp-shaping-capability
status: complete
implementation_status: implemented
decision_status: accepted
reconciled_on: 2026-08-15
sources:
  - "matt-skills@9603c1cc8118d08bc1b3bf34cf714f62178dea3b -> research/upstreams/matt-skills/9603c1cc8118d08bc1b3bf34cf714f62178dea3b.md"
  - "compound-engineering@d1bff966296b687eb8509312098458e5fa2535dc -> research/upstreams/compound-engineering/d1bff966296b687eb8509312098458e5fa2535dc.md"
  - "superpowers@d884ae04edebef577e82ff7c4e143debd0bbec99 -> research/upstreams/superpowers/d884ae04edebef577e82ff7c4e143debd0bbec99.md"
  - "openspec@46a4d782229ebb104268130a16e85cb7662a2281 -> research/upstreams/openspec/46a4d782229ebb104268130a16e85cb7662a2281.md"
  - "spec-kit@57cc518d63d6f10da3dd93df1ebcadda87c59374 -> research/upstreams/spec-kit/57cc518d63d6f10da3dd93df1ebcadda87c59374.md"
  - "ponytail@16f29800fd2681bdf24f3eb4ccffe38be3baec6b -> research/upstreams/ponytail/16f29800fd2681bdf24f3eb4ccffe38be3baec6b.md"
  - "andrej-karpathy-skills@2c606141936f1eeef17fa3043a72095b4765b9c2 -> research/upstreams/andrej-karpathy-skills/2c606141936f1eeef17fa3043a72095b4765b9c2.md"
  - "local-skills@4407a54264c2e93b19cd90fca87ab0aeb7f32366+dirty-2026-07-19 -> research/local-skills/2026-07-19.md"
design_inputs:
  - "research/models/rsp-capability-coverage.md"
  - ".rsp/specs/design.md"
  - "rules/rsp-rules.md"
---

# RSP Shaping Capability

## Purpose and Authority

This model records the historical candidate contract for an RSP-native shaping capability. It closed capability gap G2 from [RSP Capability Coverage](rsp-capability-coverage.md) by turning unclear non-trivial intent into one authorized six-section Change or, only when necessary, one shallow Change Group with directly executable child Changes.

This remains maintainer research rather than product truth, but its selected contract is implemented by `skills/rsp-shape/SKILL.md` and reconciled in [RSP Capability Coverage](rsp-capability-coverage.md). Current project instructions, Specs, published Skill, rules, code, and tests are authoritative. The recommendations below retain the evidence and selection reasoning that preceded implementation; they do not authorize new Skill changes.

The shaping capability clarifies and structures work; it does not implement, verify completion, archive, commit, publish, or settle product choices that the user or project has left unresolved.

## Evidence Selection and Provenance

The coverage ledger selects C10, C20, C36, and C46 as the convergent G2 evidence. Their common mechanism is independently reimplemented against RSP's owners rather than copied as a PRD, ticket, artifact-tree, or local-issue workflow.

| Selection | Provenance and recommendation | Exact source paths | Mechanism retained | Candidate adoption mode |
| --- | --- | --- | --- | --- |
| C10 | [Matt Skills R2](../upstreams/matt-skills/9603c1cc8118d08bc1b3bf34cf714f62178dea3b.md) | `skills/engineering/to-spec/SKILL.md`; `skills/engineering/to-tickets/SKILL.md` | Settled intent becomes executable specification; large work is split into tracer-bullet slices with explicit blocker edges. | `independent-reimplementation` |
| C20 | [Compound Engineering R2](../upstreams/compound-engineering/d1bff966296b687eb8509312098458e5fa2535dc.md) | `skills/ce-brainstorm/SKILL.md`; `skills/ce-plan/SKILL.md`; `docs/solutions/skill-design/beta-promotion-orchestration-contract.md` | A capability names its inputs, allowed mutations, output, stop/escalation behavior, and returned owner. | `model-only` for the contract; RSP behavior is independently written |
| C36 | [Superpowers shaping evidence and R1 evaluation](../upstreams/superpowers/d884ae04edebef577e82ff7c4e143debd0bbec99.md) | `skills/brainstorming/SKILL.md`; `skills/writing-plans/SKILL.md`; `tests/explicit-skill-requests/run-test.sh`; `tests/explicit-skill-requests/prompts/skip-formalities.txt`; `tests/explicit-skill-requests/prompts/mid-conversation-execute-plan.txt` | Clarify before creative work when ambiguity is material and test trigger/shortcut behavior, without making planning mandatory. | `independent-reimplementation` |
| C46 | [Local Skills R1 and R2](../local-skills/2026-07-19.md) | `skills/engineering-flow/SKILL.md`; `skills/local-issues/SKILL.md` | Choose depth progressively; fail closed on ambiguous selection; keep one shallow coordination owner and deterministic readiness. | `independent-reimplementation`; dirty snapshot is model evidence only |
| Path lens | [OpenSpec R1 and R6](../upstreams/openspec/46a4d782229ebb104268130a16e85cb7662a2281.md) | `schemas/spec-driven/schema.yaml`; `src/core/artifact-graph/types.ts`; `src/core/artifact-graph/state.ts`; `docs/agent-contract.md` | Make inputs, prerequisites, output owner, readiness, and next action visible, but derive them from RSP's existing file protocol. | `model-only` |
| Slice and restraint lens | [Spec Kit R1 and R5](../upstreams/spec-kit/57cc518d63d6f10da3dd93df1ebcadda87c59374.md) | `templates/commands/specify.md`; `templates/plan-template.md`; `templates/tasks-template.md`; `docs/reference/agentic-sdd.md` | Preserve one focused work identity, name each step's owner/gate, and test one vertical slice before adding entities. | `model-only` |
| Restraint fixtures | [Ponytail R2](../upstreams/ponytail/16f29800fd2681bdf24f3eb4ccffe38be3baec6b.md) | `skills/ponytail/SKILL.md`; `skills/ponytail-review/SKILL.md`; `benchmarks/agentic/run.py`; `benchmarks/agentic/tasks.py` | Test correct non-action and smallest-sufficient structure independently from correctness. | `model-only`; no copied runtime prose |
| Restraint fixtures | [Karpathy Skills R1](../upstreams/andrej-karpathy-skills/2c606141936f1eeef17fa3043a72095b4765b9c2.md) | `skills/karpathy-guidelines/SKILL.md`; `EXAMPLES.md` | Make assumptions visible, preserve scope, stop on ambiguity, and define a verifiable finish line. | `model-only`; direct copying is ineligible |

The Overall Delivery Change profile below is an independent RSP design derived from the current single-file Change and shallow Group model. It is not an adaptation of an upstream recommendation and has no upstream adoption mode or eligible source path.

## Composition Contract

### Trigger

Use shaping when at least one of these conditions is true:

- a user explicitly asks to specify, shape, decompose, or make non-trivial work executable;
- the selected Change has material ambiguity, mixed outcomes, unverifiable tasks, or unclear blockers;
- one outcome appears too broad for a coherent implementation and verification boundary;
- several already-owned outcomes need a terminal delivery contract without being made children of one another.

Do not invoke shaping merely because work exists. Tiny work and already-settled Changes proceed directly when authority, scope, implementation boundary, and verification are already clear.

### Inputs

Required inputs are:

1. the user's stated outcome, constraints, exclusions, and unresolved choices;
2. the nearest project instructions and relevant module context;
3. relevant durable RSP Specs and Decision Records;
4. one explicitly selected open Change, or explicit user/project authority to create or reshape a named Change or Group;
5. current repository evidence needed to avoid speculative paths, commands, owners, or validation.

A Group operation additionally requires its sibling Group Brief and all declared direct child identities. An Overall Delivery Change additionally requires explicit upstream semantic owners and their completion contracts.

### Authority

Authority precedence is user request, nearest project instructions, current project truth, durable RSP knowledge, then the selected Change or Group as work-in-motion. Research and upstream examples are advisory only.

The user owns unresolved product choices. The Change owns its six-section work record. A Group Brief owns group-wide Goal, Scope, Shared Constraints, Slices, Completion Conditions, Durable Outcomes, and group Blockers. Child Changes own their own executable work, exact dependency declarations, and verification evidence. The CLI owns read-only derived readiness, blocker, dependency, and wave projections.

### Permitted Mutations

With explicit create or edit authority, shaping may:

- create or refine one normal Change using exactly Proposal, Spec, Design, Tasks, Verify, and Blockers;
- create or refine one shallow Group Brief and its direct child Changes when the Group threshold is met;
- add exact `- requires \`<change-work-ref>\`: <reason>` dependencies to child Change Blockers;
- refine boundaries, acceptance scenarios, implementation tasks, verification commands, and external blocker prose;
- create or refine one Overall Delivery Change while keeping its Tasks and Verify limited to terminal delivery operations.

It may not edit implementation code, mark unobserved tasks or verification complete, alter durable Specs or Decision Records, focus/archive/close work, or perform Git/publication mutations unless separately authorized through the owning operation.

### Output and Returned Owner

The output is one of:

- a refined ordinary Change that owns one executable outcome;
- a shallow Group Brief plus at least two independently executable direct child Changes;
- an Overall Delivery Change that references multiple upstream semantic owners and owns only terminal delivery;
- a no-mutation clarification result naming the missing decision, evidence, authority, or owner.

The returned owner is always the artifact that should receive the next action: one executable Change for implementation, one unresolved decision for the user, one missing project evidence source for inspection, or the terminal Overall Delivery Change after all upstream completion contracts pass. A Group Brief is never returned as executable focus.

### Stop Conditions

Stop without inventing or widening scope when:

- focus or create/edit authority is ambiguous;
- a material product choice has multiple plausible answers;
- repository evidence cannot establish a proposed path, boundary, command, or owner;
- a requested decomposition would require recursive Groups, cross-repository protocol semantics, or a second tracker/lifecycle;
- a dependency target is not an executable local Change or an exact blocker edge cannot be stated truthfully;
- the requested output would duplicate live tasks, progress, verification, readiness, or dependency state;
- one Change or one Group already owns the complete outcome and another delivery owner would be redundant.

The stop result names the smallest question or external coordination need that would unblock shaping. It does not create placeholder artifacts to simulate progress.

## Change Content Profiles

Ordinary Change and Overall Delivery Change are content profiles of the same fixed six-section protocol. They are not new `kind` values, templates, entities, focus targets, or lifecycles.

### Ordinary Change

Use the ordinary profile for one executable outcome with one coherent mutation and verification boundary. Proposal, Spec, Design, Tasks, Verify, and Blockers remain local to that outcome. A large task stays ordinary when its steps cannot be independently implemented, verified, and archived without breaking the same consistency boundary.

### Overall Delivery Change

Use the Overall Delivery profile only when several independently closable semantic owners converge on one terminal delivery outcome. Proposal, Spec, and Design may state the overall outcome, upstream owners, aggregate Definition of Done, and a static ownership map. Tasks and Verify contain only terminal work such as versioning, packaging, migration, release authorization, and publication checks.

The profile references upstream Change or Group outcomes in Proposal, Spec, or Design; it may declare an exact `requires` edge only to an executable Change. Group closure remains a separately stated external delivery gate because a Group Brief is not a dependency target. The profile never copies upstream tasks, checklists, live status, progress, or execution waves, creates no child relationship, and gains no authority over upstream owners. If one Change or Group already owns the end-to-end outcome, use that owner and reject the Overall Delivery profile.

## Shallow Group and Dependency Contract

Create a Change Group only when all of these conditions hold:

1. at least two outcomes are independently executable, verifiable, focusable, and archivable;
2. the outcomes share one goal, material constraints, or end-to-end completion contract that needs a semantic owner;
3. direct child Change boundaries can be stated without recursive grouping;
4. one flat Change would obscure ownership or prevent independent execution, not merely look long;
5. the Group Brief can remain free of duplicated child progress and live execution state.

Otherwise keep one ordinary Change and slice its Tasks. A Group is not a namespace, milestone, phase, initiative, or status rollup.

- `Slices` is the sole membership declaration and lists direct child identities with concise boundaries.
- Exact child `Blockers` are the sole machine-readable dependency authority.
- `Completion Conditions` is the sole Group completion gate.
- Group-level Blockers remain external blockers inherited by direct children; they do not create inferred edges.
- The CLI derives a read-only dependency plan, active blockers, ready Changes, rationale, and stable execution waves. No graph or delivery status is persisted.
- Optional prose decomposition may explain why slices exist, but deleting that prose must not change identity, membership, dependencies, readiness, or completion.

## Tracer-Bullet Vertical Slice Rubric

A candidate direct child is a valid tracer-bullet slice only when it:

1. produces an observable end-to-end increment or a complete enabling contract, rather than one horizontal technical layer;
2. has a single outcome and bounded code/document ownership surface;
3. can be implemented, verified, reviewed, and archived independently;
4. names concrete acceptance evidence and relevant project validation;
5. exposes genuine prerequisite edges through exact Blockers instead of relying on list order;
6. is small enough for one bounded execution context without becoming a trivial file-by-file task;
7. preserves safety, migration, compatibility, and durable-decision obligations needed for that increment.

Prefer a narrow tracer bullet spanning the necessary layers over separate database/API/UI slices. A wide refactor may use an explicit expand-contract sequence only when intermediate compatibility boundaries are independently verifiable; otherwise it remains one Change.

## Progressive Restraint

- **Tiny:** Do not create or reshape RSP work when the concrete request can be safely completed and verified directly under project rules.
- **Settled:** If an existing Change already has clear authority, scope, boundaries, tasks, blockers, and verification, return it unchanged with its next action.
- **Unclear but non-trivial:** Ask or stop only on material ambiguity; do not turn every unknown into an interview or document.
- **Large but cohesive:** Keep one Change with ordered Tasks when there is one consistency and verification boundary.
- **Independently executable:** Create a shallow Group only after the threshold is demonstrated.
- **Terminal delivery:** Add an Overall Delivery profile only when several semantic owners genuinely converge and no existing Group owns the complete result.

Correct non-action is a required behavior. Minimality is evaluated after authority, correctness, safety, and verifiability, never instead of them.

## Evaluation Fixtures

| Fixture | Seed | Expected behavior | Failure signal |
| --- | --- | --- | --- |
| Tiny clean request | One file, exact edit, known validation, no durable planning need | Do not create or inflate a Change; return direct next action. | Mandatory ceremony or Group creation. |
| Settled ordinary Change | Complete six sections, one coherent owner, executable Tasks | Leave shape byte-identical and return implementation owner. | Rewriting for stylistic symmetry or adding a delivery profile. |
| Ambiguous product choice | Two plausible behaviors with no authority choosing between them | Stop with one bounded question and no placeholder decision. | Invented requirement or speculative implementation task. |
| Large cohesive migration | Many steps sharing one atomic compatibility and verification boundary | Keep one Change with ordered Tasks and explicit Verify. | File-count-driven Group creation. |
| Valid tracer-bullet Group | Three demonstrable end-to-end increments with shared completion conditions | Create one Brief and direct children; declare only genuine exact blockers. | Layer slices, nested directories, or list order treated as dependency. |
| Complex shallow Group | Direct children have a cycle-free partial order and explanatory decomposition | Keep membership/completion in Brief; derive the current plan through CLI output. | Persisted graph, copied live status, or hand-maintained waves. |
| Valid Overall Delivery | Closed research and implementation owners feed version/package/release work | Use the six-section delivery profile; Tasks contain terminal operations only. | Upstream tasks copied into delivery or owners treated as children. |
| Redundant Overall Delivery | One Group already owns the complete end-to-end result | Reject the profile and return the existing Group/Change owner. | Second completion contract or lifecycle. |
| Missing local evidence | Proposed paths or commands cannot be confirmed | Stop and identify the exact evidence needed. | Plausible but fabricated paths, commands, or validation. |
| Forbidden hierarchy request | Work appears recursive or cross-repository | Flatten to direct local slices where truthful, otherwise return an external coordination need. | Nested Groups, cross-root WorkRefs, or tracker synchronization. |

Evaluation must pin repository revision, input artifacts, host configuration, and expected mutation set; inspect the diff for scope fidelity; validate the resulting RSP tree; and record correct non-action separately from successful mutation. Clean, defect, ambiguity, and host-contamination variants are required before promotion.

## Rejected Mechanisms

- **Multi-file artifact trees:** OpenSpec and Spec Kit clarify ownership, but copying proposal/spec/design/research/tasks into separate files would replace RSP's single-file executable aggregate.
- **Nested Groups or initiative trees:** recursive hierarchy adds identity, focus, archive, cycle, and rollup semantics beyond the shallow local protocol.
- **Persisted dependency graphs or execution waves:** exact child Blockers already provide the facts and the CLI derives current projections read-only.
- **A second lifecycle or tracker:** PRD/ticket statuses, approval stages, and synchronized external issue state would compete with open/archived Changes and FocusSet authority.
- **Manual live status in Briefs or delivery Changes:** copied progress, task completion, readiness, verification, and waves drift from their owning Changes and deterministic projections.
- **Mandatory brainstorming or shaping:** tiny and settled work must remain direct; optional interview Skills may be recommended only for material unresolved choices.
- **Universal router, always-on restraint overlay, or host hooks:** selection follows explicit intent and current RSP evidence without hidden state or repeated context.
- **Automatic implementation, archive, commit, or publication:** shaping authority cannot grant downstream mutation authority.

## Candidate Recommendations

- **S1 — Define one explicit `rsp-shape` composition contract (`independent-reimplementation`).** Implement the trigger, inputs, authority, permitted mutations, output/returned owner, and stop conditions above against current RSP owners. Selected evidence: C10, C20, C36, C46; Matt R2; Compound R2; Local R1/R2.
- **S2 — Adopt tracer-bullet slicing with a strict shallow-Group threshold (`independent-reimplementation`).** Prefer one Change, create direct children only when each is independently executable and verifiable, and express genuine edges only through exact Blockers. Selected evidence: C10, C46; Matt R2; Spec Kit R1/R5.
- **S3 — Keep dependency navigation derived and read-only (`model-only`).** Shape dependency facts into child Blockers, then return CLI projections instead of persisting graphs, status, or waves. Selected evidence: OpenSpec R1/R6 and current RSP product authority.
- **S4 — Support ordinary and Overall Delivery as content profiles of one Change (`not-applicable — independent RSP design`).** Keep the same six sections and lifecycle; allow terminal delivery context only when multiple upstream semantic owners converge. This recommendation has no upstream adoption mode and is not an upstream adaptation.
- **S5 — Gate promotion with restraint fixtures (`independent-reimplementation`).** Test tiny, settled, ambiguous, cohesive-large, shallow-Group, delivery, forbidden-hierarchy, and missing-evidence cases, including correct non-action and host isolation. Selected evidence: Superpowers R1, Ponytail R2, Karpathy Skills R1.

None of these recommendations changes product behavior until a separate implementation Change cites this model, the selected recommendation ID, the exact source report and paths where applicable, and its adoption mode.
