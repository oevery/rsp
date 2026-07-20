---
topic: rsp-skill-system
status: complete
implementation_status: proposed
decision_status: frozen
frozen_on: 2026-07-20
selected_recommendations:
  - S1
  - S2
  - S3
  - S4
  - S5
  - S6
  - S7
sources:
  - "agent-skills-spec@38a2ff82958afee88dadf4831509e6f7e9d8ef4e -> research/upstreams/agent-skills-spec/38a2ff82958afee88dadf4831509e6f7e9d8ef4e.md"
  - "matt-skills@9603c1cc8118d08bc1b3bf34cf714f62178dea3b -> research/upstreams/matt-skills/9603c1cc8118d08bc1b3bf34cf714f62178dea3b.md"
  - "antfu-skills@a74f281a27dadc02397bc1a174b0f2c97531b6ae -> research/upstreams/antfu-skills/a74f281a27dadc02397bc1a174b0f2c97531b6ae.md"
  - "ponytail@16f29800fd2681bdf24f3eb4ccffe38be3baec6b -> research/upstreams/ponytail/16f29800fd2681bdf24f3eb4ccffe38be3baec6b.md"
  - "skills-cli@777599e1159e401b11ce4c8a57c20f09a8f1596e -> research/upstreams/skills-cli/777599e1159e401b11ce4c8a57c20f09a8f1596e.md"
  - "compound-engineering@d1bff966296b687eb8509312098458e5fa2535dc -> research/upstreams/compound-engineering/d1bff966296b687eb8509312098458e5fa2535dc.md"
  - "superpowers@d884ae04edebef577e82ff7c4e143debd0bbec99 -> research/upstreams/superpowers/d884ae04edebef577e82ff7c4e143debd0bbec99.md"
  - "gsd-core@24273e9fdf54f85af23000e7edeaa99d8b74aab9 -> research/upstreams/gsd-core/24273e9fdf54f85af23000e7edeaa99d8b74aab9.md"
  - "openai-plugins@11c74d6ba24d3a6d48f54a194cd00ef3beea18f9 -> research/upstreams/openai-plugins/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9.md"
  - "andrej-karpathy-skills@2c606141936f1eeef17fa3043a72095b4765b9c2 -> research/upstreams/andrej-karpathy-skills/2c606141936f1eeef17fa3043a72095b4765b9c2.md"
  - "planning-with-files@7c6c6cbb76ebee7c7a7e28a38a08d3ad7d1e0427 -> research/upstreams/planning-with-files/7c6c6cbb76ebee7c7a7e28a38a08d3ad7d1e0427.md"
  - "local-skills@worktree-2026-07-19 -> research/local-skills/2026-07-19.md"
design_inputs:
  - "research/models/rsp-engineering-domain-model.md"
  - "codex://threads/019f40b7-974a-7861-adca-4fc1d17c44ad"
---

# RSP Skill System Model

## Position

RSP should be a progressive system with a removable deterministic core:

1. **Protocol:** `.rsp/` remains readable and operable without any skill.
2. **Core Skill:** one concise portable skill improves use of that protocol.
3. **Discipline Skills:** optional focused capabilities improve review, diagnosis, implementation, testing, shaping, and handoff.
4. **Managed Controller:** a later opt-in mode composes stable capabilities for autonomous delivery.
5. **Distribution:** host projections and an optional plugin package make capabilities installable; they do not redefine behavior or project truth.

This document is intermediate research with a frozen target design. It does not authorize edits to published `skills/`, `.rsp/`, CLI source, or package metadata. Implementation begins only through a normal RSP Change that selects a bounded slice of this model.

## Shared Findings

### Small canonical capabilities outperform runtime overlays

Matt, Antfu, the Agent Skills specification, skills-cli, and local experience converge on small, discoverable, on-demand capabilities. Router/overlay stacks repeat policy, create overlapping triggers, and consume context before the actual task is known. RSP should maintain one canonical behavior per capability and generate only thin host projections.

### Canonical behavior is host-neutral

An RSP-native Skill must remain usable through the portable Agent Skills contract, ordinary project files, and the RSP CLI without requiring Codex-, Claude-, or another host-specific tool, directive, thread model, hook, or plugin. A host may execute and validate the Skill, but it does not define the Skill's semantics.

Host-specific metadata such as `agents/openai.yaml`, installation layouts, and plugin manifests are optional projections. They may describe presentation, packaging, or integration, but cannot add workflow rules, authority, state, or behavior absent from the canonical `SKILL.md`.

### Skills are behavior contracts, not folders of prose

Superpowers, Ponytail, Compound, and Agent Skills evidence shows that metadata validation is necessary but insufficient. A publishable skill needs trigger tests, expected-action fixtures, correct-non-action fixtures, authority checks, fresh verification evidence, and context-cost observations.

### Review behavior follows the reviewed object

Code and documents share scope, authority, read-only behavior, and normalized findings, but they do not share one quality rubric. Code review evaluates executable behavior, regressions, tests, standards, and implementation simplicity. Document review evaluates authority, coherence, traceability, completeness, feasibility, scope, and ambiguity. A mixed Change partitions the reviewed files, runs both pipelines, and synthesizes one report.

GSD's wider review catalog is useful only as a taxonomy: code, plan/document, UI, security, and evaluation coverage are different review objects, and `skipped` is not `clean`. The first RSP candidate implements only code and document pipelines; later categories require demonstrated gaps.

### Capability, orchestration, and distribution are separate domains

- A **Skill** performs one bounded capability.
- A **Skill Suite** is a coherent published collection.
- A **Controller** sequences skills and manages a run.
- A **Host Projection** exposes canonical content to a specific runtime.
- A **Plugin Package** bundles skills with optional tools/apps/hooks and user-facing install metadata.

Conflating these concepts produces monolithic skills, duplicated host instructions, and hidden state.

### Provenance does not belong in routine context

Antfu, RSP's upstream process, and skills-cli all need exact source identity. That evidence belongs in maintainer/release metadata: source report, recommendation ID, source paths, base revision, adoption mode, payload hash, and local content version. Runtime instructions should contain only what changes agent behavior.

### Autonomy needs artifacts, budgets, and stop conditions

GSD, planning-with-files, Superpowers, and Compound agree that autonomous work needs scoped inputs, durable or recoverable handoffs, verification, and bounded delegation. RSP should not adopt their state hierarchies. A future controller consumes one focused Change and returns evidence/results to existing owners.

## Disagreements and Decisions

| Question | Upstream tension | Proposed RSP decision |
| --- | --- | --- |
| Always-on routing | Superpowers/Ponytail inject strong standing behavior; Matt/Antfu favor selected skills | No upstream router overlay. Core skill routes only from explicit RSP/project evidence and loads one optional capability when useful. |
| Full workflow vs composable skills | GSD/Compound offer broad delivery systems; Matt offers small adaptable skills | Keep broad orchestration optional and later. Stabilize capabilities first. |
| Copy vs subscribe | Matt offers editable copies or managed plugin; Antfu vendors/generates; skills-cli installs/updates | RSP owns distilled native behavior. No runtime upstream dependency or automatic overwrite. |
| Minimality | Ponytail/Karpathy emphasize less code; engineering suites emphasize completeness | Safety, correctness, spec, and standards gate first; simplicity is an independent later axis. |
| State | GSD/planning systems persist controller state; Agent Skills define none | RSP artifacts remain authority. Controller run state stays ignored/transient and recoverable. |
| Distribution unit | skills-cli distributes skills; OpenAI plugins bundle richer surfaces | Publish plain skills first. Add a plugin only for a concrete integration bundle. |
| Host coupling | Host ecosystems offer richer tools, hooks, threads, and UI metadata | Canonical Skills remain host-neutral. Host-specific metadata and integrations are optional projections and cannot own or alter behavior. |
| Review granularity | Compound separates code and document review; GSD exposes many review skills; a single rubric is smaller | Publish one bounded `rsp-review` capability with progressively loaded code/document pipelines. Defer UI, security, and evaluation-specific pipelines until needed. |
| Version identity | package releases, CalVer, Git SHA, folder hashes serve different needs | Skill content uses independent quoted CalVer; Git/report revision and payload hash retain exact identity. |

## Domain Model

### Skill Suite

The RSP Skill Suite is the canonical, versioned set of RSP-owned capabilities intended for users. It contains only stable skills. It excludes upstream clones, Distillations, candidate experiments, benchmark outputs, maintainer utilities, and controller run state.

### Skill

A Skill is one independently selectable behavior package with:

- identity: directory/name, concise trigger description, author, license, content version;
- contract: required inputs, authority precedence, permitted mutations, output, stop/escalation conditions;
- payload: `SKILL.md` plus only capability-owned references, scripts, and assets;
- evidence: conformance, behavior, restraint, context-budget, and host-compatibility results;
- provenance: maintainer-only source/adoption metadata when derived.

An RSP-native Skill is host-neutral by default. It may be tested on a particular host, but its required behavior cannot depend on that host's proprietary capabilities.

### Core Skill

The Core Skill explains the minimal RSP journey, resolves the selected Change, reads only relevant authorities, derives the next action, and invokes no capability merely because it exists. It must remain useful alone and compact enough for routine activation.

### Discipline Skill

A Discipline Skill performs one stage-independent engineering behavior, such as review, diagnosis, TDD, implementation, shaping, or handoff. It may read RSP artifacts but returns results to their existing owners; it never creates a parallel project lifecycle.

### Review Capability, Pipeline, and Finding

The RSP Review Capability is one report-only Discipline Skill with shared scope resolution and output normalization. A Review Pipeline is an artifact-specific procedure loaded only when its scope is present:

- **Code Pipeline:** executable code plus agent-facing executable documents such as `SKILL.md`, prompts, commands, and workflow definitions;
- **Document Pipeline:** requirements, plans, Specs, Decision Records, ADRs, and explanatory/user documentation whose semantic consistency is the review target.

A mixed file set may place one executable document in the Code Pipeline and also request a focused document-consistency check, but one underlying issue is emitted once. A normalized Finding records `artifact_kind`, `axis`, severity, path/range, authority/evidence, impact, suggested action, and confidence. `clean` means reviewed with no findings; `skipped` means no review was performed for that pipeline.

### Controller

The Managed Controller is optional orchestration outside the core suite. It may select stable skills, dispatch bounded agents, collect verification, retry within a budget, and stop for user authority. It cannot redefine Change state, modify durable Specs automatically, or infer commit/push/publish permission.

### Host Projection and Plugin Package

A Host Projection is a generated install layout or presentation file for one runtime. `agents/openai.yaml` is an allowed example when it contains only presentation metadata such as display name, description, icon, or default prompt. A Plugin Package is an optional distribution bundle containing skills and integrations. Both derive from canonical sources and are validated for drift; neither owns behavior.

A host-specific capability that cannot preserve the canonical Skill contract is a separate optional Adapter or Plugin integration, not part of the Core Skill or a portable Discipline Skill.

### Candidate and Promotion

A Candidate Skill lives outside normal discovery. Promotion to stable requires a normal RSP Change and all gates below. Research reports and evaluation output remain maintainer inputs, not shipped runtime context.

## Ownership and Filesystem Boundary

```text
research/
├── upstreams/                 # pinned semantic Distillations
├── local-skills/              # labeled local snapshots
├── candidates/
│   └── skills/<skill>/        # committed candidates outside agent discovery and package output
└── models/                    # cross-source models

.cache/
├── upstreams/                 # disposable clones
└── upstream-distillation/     # immutable prepared evidence

skills/
└── <stable-skill>/            # authored publishable canonical payloads
    ├── SKILL.md
    ├── references/            # only when progressively loaded
    ├── scripts/               # only capability-owned runtime helpers
    └── assets/                # only capability-owned assets

tests/
├── skill-contract/            # schema/package/static constraints
└── skill-behavior/            # fixtures, harnesses, scorecards

dist/ or package staging       # generated host/plugin projections, if selected
```

Maintainer skills under `.agents/skills/` are project-development tools and must not be presented as RSP product capabilities. Candidate product skills must not be placed there merely to evaluate them, because discoverability changes the active agent environment and contaminates tests/conversation context.

The first candidate was developed under `research/candidates/skills/rsp-review/`, and evaluation copied it into an isolated temporary host environment. Promotion moved the accepted canonical payload to `skills/rsp-review/`; research evidence and scorecards remain under `research/` and are not packaged.

The qualified candidate was compacted into one `SKILL.md`; promotion moved that file unchanged and removed the research candidate copy. A future capability may use progressively loaded references when measured context savings justify them, but those references remain internal procedures rather than recursively invoked Skills or a runtime router stack.

## Invocation and Composition Contract

Every stable Skill declares:

1. **Trigger:** the user intent and observable RSP/project state that justify activation.
2. **Inputs:** exact artifacts and context it may load.
3. **Authority:** precedence among user request, nearest project instructions, RSP rules, selected Change, Specs/Decisions, and skill guidance.
4. **Action:** bounded behavior and permitted filesystem/external mutations.
5. **Output:** normalized result and the owner to which it returns.
6. **Stop:** ambiguity, missing authority, failed gate, context budget, or external permission boundary.
7. **Verification:** evidence needed before completion claims.

Skills do not recursively invoke user-facing flows. The Core Skill or optional Controller selects them. Discipline skills may refer to a shared contract/reference only when progressive loading makes it cheaper than duplicating policy.

Canonical behavior may depend on the portable Agent Skills contract, ordinary filesystem operations, project-provided commands, and the RSP CLI. It may not require proprietary host tools. Optional adapters can accelerate or enrich execution, but their absence cannot invalidate the Skill's core outcome.

## Evaluation and Promotion Gate

### Static conformance

- Agent Skills frontmatter and directory-name conformance;
- allowed metadata types and quoted independent CalVer;
- references/scripts/assets resolve inside the package;
- no maintainer/research/cache paths leak into the payload;
- canonical instructions contain no required host-specific tools, directives, hooks, thread semantics, or plugin behavior;
- optional host metadata does not add or override canonical behavior;
- canonical source and host projections do not drift.

### Behavioral fixtures

- positive fixture: the skill performs its intended capability;
- restraint negative: clean/no-op or missing-authority case does not invent work;
- ambiguity fixture: asks or stops instead of guessing focus/spec;
- scope fixture: preserves unrelated dirty work and only mutates authorized owners;
- verification fixture: completion language requires fresh observed evidence;
- explicit-invocation and mid-conversation fixture;
- adversarial shortcut fixture for skipped gates or unauthorized Git/publication.

### Quality axes

Shared gates and measurements:

1. authoritative scope and fixed comparison target;
2. read-only behavior and data integrity;
3. correct `clean`, `skipped`, ambiguity, and missing-authority states;
4. context tokens, latency, tool calls, false positives, and duplicate findings.

Code Pipeline axes:

1. safety and correctness (hard gate);
2. selected Change/Spec fidelity;
3. project standards and regression/test coverage;
4. implementation simplicity/restraint after the preceding gates.

Document Pipeline axes:

1. authority and traceability;
2. internal and cross-artifact coherence;
3. completeness and unresolved ambiguity;
4. feasibility for implementation plans;
5. scope discipline and appropriate concision.

### Isolation

Compare current behavior, candidate, and no-skill baseline in fresh workspaces with pinned source revision, host configuration, prompt, and judge settings. Deterministic gates precede LLM judging. Record limitations and check for host/plugin contamination.

The initial executable host is Codex because it is the available evaluation environment, not because Codex behavior is normative. Promotion requires Agent Skills conformance, host-neutral instructions, and one real-host behavior run. Additional hosts expand compatibility evidence later without creating separate behavior implementations.

### Promotion

Promotion requires selected ownership, complete provenance/license review, passing gates, acceptable context budget, supported-host evidence, documentation, and a normal RSP Change. Registry presence or generated files alone never make a candidate stable.

## Proposed Capability Map

| Capability | Initial maturity | Owner/output | Direction |
| --- | --- | --- | --- |
| `rsp` core | Existing; refine | selected Change and derived next action | Keep minimal; progressive routing only |
| RSP review | Candidate | one normalized report returned to Tasks/Verify/Blockers | One host-neutral package with shared scope/output plus progressive code and document pipelines |
| RSP readiness/status | Candidate behavior in core | derived diagnostic only | Prefer deterministic CLI output; skill explains/remediates |
| RSP shaping/slicing | Candidate | proposal/design/tasks in one Change | Add vertical-slice rubric only after behavior tests |
| RSP implement | Later candidate | code/tests plus verification receipt | Compose project rules and selected Change; no Git authority |
| RSP diagnose/TDD | Later discipline skills | diagnosis or tested behavior | Reuse local/Matt concepts through independent native design |
| RSP handoff | Later optional | compact pointers/evidence/next action | Avoid duplicating authoritative artifacts |
| Managed delivery | Later controller, not a skill baseline | run-local state and results returned to Change | Opt-in direct → assisted → managed progression |
| Host adapter | Deferred integration | optional host-specific acceleration | Keep outside canonical behavior; add only for a demonstrated host capability gap |
| RSP plugin | Deferred packaging | install/UI/tool bundle | Add only when plain host-neutral skills cannot meet a concrete integration need |

## Rejected System Shapes

- Runtime `router -> overlays -> upstream skills` stacks.
- Direct runtime dependency on cloned upstream repositories or submodules.
- One monolithic “complete engineering operating system” skill.
- Research reports, Distillations, evaluations, or candidate skills in normal product discovery.
- A second project state model for the controller, PRD/issues, phases, or milestones.
- Automatic upstream sync into locally modified skills.
- Always-on modes/hooks used only to restate project policy.
- Skill-defined commit, push, PR, publish, delete, or approval authority.
- Plugin packaging before a real integration requirement.
- Codex-, Claude-, or other host-specific capabilities inside the canonical Core or Discipline Skill contract.
- Importing GSD's phase-bound review router, generic regex heuristics, auto-fix/commit flow, or its full code/UI/security/evaluation catalog into the first reviewer.

## Frozen Delivery Sequence

- **S1 — Adopt this layered domain boundary.** Protocol → Core Skill → Discipline Skills → optional Controller → optional Distribution. This is the prerequisite decision for later implementation.
- **S2 — Define the canonical skill contract and promotion gate through the first vertical slice.** Implement only the schema, provenance, behavior fixtures, restraint negatives, isolation, and context-budget support required to evaluate `rsp-review`; do not build a speculative general platform first.
- **S3 — Refine the existing `rsp` core skill without turning it into a router catalog.** It should derive stage/next action and name at most the selected optional capability.
- **S4 — Make RSP review the first evaluated discipline candidate.** Publish one Skill with shared scope, authority, read-only policy, and finding schema, then progressively load distinct Code and Document pipelines. Run both for mixed Changes, deduplicate cross-artifact evidence, and defer other review objects.
- **S5 — Follow with shaping/slicing, implementation, diagnosis/TDD, and handoff only when each has a demonstrated RSP-specific gap.** Adapt mechanisms, not upstream prose or lifecycle.
- **S6 — Design managed delivery only after two or more stable discipline skills compose successfully.** Keep controller state external to `.rsp/`, enforce budgets and authority stops, and preserve direct/manual use.
- **S7 — Keep the release host-neutral and treat host integration as optional release work.** The first stable Skill must conform to Agent Skills, avoid required proprietary capabilities, and pass one Codex execution run. Keep metadata authoritative in each `SKILL.md`; permit `agents/openai.yaml` as presentation-only metadata; do not add a suite manifest, general installer, or plugin until a concrete consumer requires one.

## Frozen Decisions

1. The first implementation slice is a minimal `rsp-review` candidate plus only enough shared contract and evaluation support to compare it.
2. The first `rsp-review` candidate is one capability package with separate `code-review.md` and `document-review.md` pipelines. Code simplicity follows correctness, Spec, Standards, and test gates; documents use coherence, traceability, completeness, feasibility, scope, and ambiguity instead of the code rubric.
3. Canonical Skills are host-neutral. Initial promotion requires Agent Skills conformance and one real Codex behavior run; Claude and other hosts are later compatibility evidence rather than first-release blockers.
4. Canonical metadata lives in each `SKILL.md`. No suite manifest is introduced until multiple real projections demonstrate a duplication or drift problem.
5. `agents/openai.yaml` may remain as presentation-only metadata. Proprietary host behavior belongs in an optional Adapter or Plugin and cannot change canonical outcomes.
6. Candidates live under `research/candidates/skills/`, outside normal agent discovery and package output. Stable promoted Skills live under `skills/`.
7. Mixed Changes run both applicable pipelines and return one deduplicated report. UI, security-specific, and evaluation-coverage reviews remain deferred; `skipped` is never reported as `clean`.
