---
topic: rsp-skill-system
status: complete
implementation_status: proposed
decision_status: frozen
frozen_on: 2026-07-20
reconciled_on: 2026-07-21
selected_recommendations:
  - S1
  - S2
  - S3
  - S4
  - S5
  - S6
  - S7
  - S8
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
  - "openspec@46a4d782229ebb104268130a16e85cb7662a2281 -> research/upstreams/openspec/46a4d782229ebb104268130a16e85cb7662a2281.md"
  - "spec-kit@57cc518d63d6f10da3dd93df1ebcadda87c59374 -> research/upstreams/spec-kit/57cc518d63d6f10da3dd93df1ebcadda87c59374.md"
  - "local-skills@4407a54264c2e93b19cd90fca87ab0aeb7f32366+dirty-2026-07-19 -> research/local-skills/2026-07-19.md"
design_inputs:
  - "research/models/rsp-engineering-domain-model.md"
  - "research/models/rsp-capability-coverage.md"
  - "research/models/rsp-shaping-capability.md"
  - "research/models/rsp-implementation-capability.md"
  - "codex://threads/019f40b7-974a-7861-adca-4fc1d17c44ad"
---

# RSP Skill System Model

## Position

RSP should be a progressive system with a removable deterministic core:

1. **Protocol:** `.rsp/` remains readable and operable without any skill.
2. **Core Skill:** one concise portable skill improves use of that protocol.
3. **Discipline Skills:** optional focused capabilities improve shaping, design, implementation, diagnosis, testing, review, and bounded continuation.
4. **Managed orchestration:** an optional host or external layer may compose stable capabilities without becoming RSP product truth.
5. **Distribution:** host projections and an optional plugin package make capabilities installable; they do not redefine behavior or project truth.

This document is intermediate research with a reconciled frozen target design. It does not authorize edits to published `skills/`, `.rsp/`, CLI source, or package metadata. Implementation begins only through a normal RSP Change that selects a bounded slice of this model and its capability-specific recommendations.

## Reconciled Assisted Suite

The minimum four-Skill suite proved manual composition. The tightened 3.0 release gate now demonstrates eight RSP-specific owners for an engineering suite:

1. `rsp` derives one next action from project and RSP evidence without becoming a catalog or controller.
2. `rsp-shape` turns unclear non-trivial intent into one executable Change or a justified shallow Group; five same-case terminal journeys qualify its progressively disclosed deep branch, and material design questions return through the same WorkRef.
3. `rsp-design` resolves one tracked domain-model, module/seam, or reversible-exploration question from project evidence, updating only authorized planned design in the selected Change.
4. `rsp-implement` executes one selected Change and returns truthful state plus fresh verification evidence; it implements `rsp-implementation-capability` recommendations I1-I6.
5. `rsp-review` remains the stable report-only code/document reviewer and receives a fixed comparison scope from implementation or direct invocation.
6. `rsp-address-review` owns evidence-backed Finding disposition, one authorized correction pass, fresh verification, fixed-scope re-review, and an artifact-scoped recovery continuation.
7. `rsp-diagnose` establishes a confirmed cause or truthful unresolved result before correction without production mutation authority.
8. `rsp-tdd` owns one observed RED, minimal GREEN, optional safe REFACTOR, and fresh verification cycle for a clear behavior.

Shaping, design, implementation, diagnosis, and TDD are standalone Discipline Skills, not placeholders owned by orchestration. Core owns evidence classification and selects at most one available discipline; Shape and Design return to the same WorkRef, while Implement detects route changes and returns the matching seam instead of reproducing another discipline. Core owns the artifact-routing matrix and compact continuation contract. Generic managed orchestration, autonomous coordination, and delivery remain optional host/external concerns.

The assisted suite composes through existing project files, Change Tasks/Verify/Blockers, FocusSet, Specs/Decisions, and deterministic CLI projections. It adds no suite state, recursive invocation contract, automatic retry loop, or implicit Git/publication authority.

## Shared Findings

### Small canonical capabilities outperform runtime overlays

Matt, Antfu, the Agent Skills specification, skills-cli, and local experience converge on small, discoverable, on-demand capabilities. Router/overlay stacks repeat policy, create overlapping triggers, and consume context before the actual task is known. RSP should maintain one canonical behavior per capability and generate only thin host projections.

### Canonical behavior is host-neutral

An RSP-native Skill must remain usable through the portable Agent Skills contract, ordinary project files, and the RSP CLI without requiring Codex-, Claude-, or another host-specific tool, directive, thread model, hook, or plugin. A host may execute and validate the Skill, but it does not define the Skill's semantics.

Host-specific metadata such as `agents/openai.yaml`, installation layouts, and plugin manifests are optional projections. They may describe presentation, packaging, or integration, but cannot add workflow rules, authority, state, or behavior absent from the canonical `SKILL.md`.

### Skills are behavior contracts, not folders of prose

Superpowers, Ponytail, Compound, and Agent Skills evidence shows that metadata validation is necessary but insufficient. A publishable Skill needs a demonstrated capability delta, hard authority and truthfulness checks, unseen real-task evidence, and total-cost observations. Synthetic fixtures may test deterministic safety boundaries; they must not dictate response wording or repository reasoning.

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

GSD, planning-with-files, Superpowers, and Compound agree that autonomous work needs scoped inputs, durable or recoverable handoffs, verification, and bounded delegation. RSP should not adopt their state hierarchies. Any host or external orchestrator consumes one focused Change and returns evidence/results to existing owners.

## Disagreements and Decisions

| Question | Upstream tension | Proposed RSP decision |
| --- | --- | --- |
| Always-on routing | Superpowers/Ponytail inject strong standing behavior; Matt/Antfu favor selected skills | No upstream router overlay. Core skill routes only from explicit RSP/project evidence and loads one optional capability when useful. |
| Full workflow vs composable skills | GSD/Compound offer broad delivery systems; Matt offers small adaptable skills | Keep broad orchestration optional and later. Stabilize capabilities first. |
| Copy vs subscribe | Matt offers editable copies or managed plugin; Antfu vendors/generates; skills-cli installs/updates | RSP owns distilled native behavior. No runtime upstream dependency or automatic overwrite. |
| Minimality | Ponytail/Karpathy emphasize less code; engineering suites emphasize completeness | Safety, correctness, spec, and standards gate first; simplicity is an independent later axis. |
| State | GSD/planning systems persist controller state; Agent Skills define none | RSP artifacts remain authority. Optional host/external run state stays ignored/transient and recoverable. |
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

A Discipline Skill performs one stage-independent engineering behavior, such as shaping, design, implementation, diagnosis, TDD, review, or review resolution. It may read RSP artifacts but returns results to their existing owners; it never creates a parallel project lifecycle.

### Review Capability, Pipeline, and Finding

The RSP Review Capability is one report-only Discipline Skill with shared scope resolution and output normalization. A Review Pipeline is an artifact-specific procedure loaded only when its scope is present:

- **Code Pipeline:** executable code plus agent-facing executable documents such as `SKILL.md`, prompts, commands, and workflow definitions;
- **Document Pipeline:** requirements, plans, Specs, Decision Records, ADRs, and explanatory/user documentation whose semantic consistency is the review target.

A mixed file set may place one executable document in the Code Pipeline and also request a focused document-consistency check, but one underlying issue is emitted once. A normalized Finding records `artifact_kind`, `axis`, severity, path/range, authority/evidence, impact, suggested action, and confidence. `clean` means reviewed with no findings; `skipped` means no review was performed for that pipeline.

### Bounded continuation and managed orchestration

Bounded response continuation is native RSP behavior: execution Skills return WorkRef, authority pointers, current state, changed artifacts, fresh verification, blockers, and the smallest next action. It is non-authoritative, is persisted only to an explicitly authorized exact path, and must be refreshed against current owners and drift before resume.

Managed orchestration remains optional host or external behavior outside the RSP 3.0 product surface. A host may explicitly select stable Skills, dispatch bounded agents, collect fresh verification, and retry within a finite budget, while RSP Changes, Specs, Decisions, focus, and archives remain the durable owners. Orchestration stops at mutation, Git, publication, environment, and human-decision authority boundaries.

The evaluated `rsp-manage` research candidate remains recommendation `revise`, outside normal discovery and package output. It matched baseline success and corrections on the available journeys but added material token, elapsed-time, and tool-call cost, so it did not pass the promotion gate. A later Change may reconsider the gap only with a less leading long-continuation task, real bounded delegation and failure recovery, portable invocation metadata, and a demonstrated behavioral delta at acceptable cost.

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

test/
└── skill-contract/            # schema/package and hard-boundary constraints

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

Skills do not recursively invoke user-facing flows. The Core Skill or an explicitly selected host/external orchestrator selects them. Discipline skills may refer to a shared contract/reference only when progressive loading makes it cheaper than duplicating policy.

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

### Evidence ladder

Draft candidates require:

- portable static conformance;
- deterministic checks for hard authority, mutation, package, and completion-truth boundaries;
- a small unseen real-task holdout that measures useful completion and human correction.

After a release candidate is selected, add only the repeated matrices, isolation, cost calibration, and supported-host evidence needed for the release decision. Keep holdout tasks separate from candidate-writing fixtures and do not require fixed response tokens.

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

During candidate drafting, compare normal behavior and the candidate on a small unseen real-task holdout. Use deterministic checks only for portable structure and hard authority, mutation, and truthfulness boundaries. Do not tune fixed response wording or repository-discovery strategy to synthetic fixtures.

After selecting a release candidate, compare current behavior, candidate, and no-skill baseline in fresh workspaces with pinned source revision, host configuration, prompt, and judge settings. Repeated matrices and cost calibration belong only at this boundary. Record task success, corrections, total input/output tokens, elapsed time, and tool calls together; input-token overhead alone is insufficient. Record limitations and check for host/plugin contamination.

The initial executable host is Codex because it is the available evaluation environment, not because Codex behavior is normative. Promotion requires Agent Skills conformance, host-neutral instructions, and one real-host behavior run. Additional hosts expand compatibility evidence later without creating separate behavior implementations.

### Promotion

Promotion requires a demonstrated capability delta, selected ownership, complete relevant provenance/license review, passing hard-boundary and unseen-task evidence, acceptable total cost, supported-host evidence, documentation, and a normal RSP Change. Exhaustive source coverage and intermediate model count are not promotion gates. Registry presence or generated files alone never make a candidate stable.

## Proposed Capability Map

| Capability | Initial maturity | Owner/output | Direction |
| --- | --- | --- | --- |
| `rsp` core | Stable | selected Change and derived next action | Keep minimal; classify implementation evidence and select at most one optional discipline or manual fallback |
| RSP review | Stable | one normalized report returned to Tasks/Verify/Blockers | Keep report-only code and document pipelines with fixed scope |
| RSP readiness/status | Candidate behavior in core | derived diagnostic only | Prefer deterministic CLI output; skill explains/remediates |
| RSP shaping/slicing | Stable | one executable Change or justified shallow Group | Preserve one lifecycle and derived dependency navigation |
| RSP design | Stable | one evidenced design result and optional authorized Change `Design` update | Resolve one domain, module/seam, or reversible-exploration question and return the same WorkRef |
| RSP implement | Stable | code/tests plus fresh verification receipt returned to one Change | Reclassify new failures without recursively invoking another Skill; no Controller or Git authority |
| RSP diagnose | Stable | confirmed cause or truthful unresolved evidence returned to one Change | Keep correction outside diagnosis and progressively disclose special branches only after measured need |
| RSP TDD | Stable | observed RED/GREEN/REFACTOR and fresh checks returned to one Change | Keep one clear behavior per cycle; return unexplained failures to diagnosis |
| RSP review resolution | Stable | Finding dispositions, authorized correction, verification, re-review request | `rsp-address-review` owns one bounded pass and returns to the Change/reviewer |
| RSP continuation | Stable execution contract | WorkRef, authoritative pointers, evidence, blockers, and next action | Keep response-based, artifact-scoped, non-authoritative, and refresh on resume |
| Managed orchestration | External/host; research candidate retained with `revise` | run-local coordination returned to existing owners | Keep outside 3.0; reconsider only after a demonstrated behavioral delta at acceptable cost |
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

- **S1 — Adopt this layered domain boundary.** Protocol → Core Skill → Discipline Skills → optional host/external orchestration → optional Distribution. This is the prerequisite decision for later implementation.
- **S2 — Define the canonical skill contract and promotion gate through the first vertical slice.** Extract one concise capability delta, validate portable structure and hard boundaries, then forward-test unseen real work. Add repeated provider and cost evidence only for the selected release candidate; do not build a speculative general platform first.
- **S3 — Refine the existing `rsp` core skill without turning it into a router catalog.** It should derive stage/next action and name at most the selected optional capability.
- **S4 — Make RSP review the first evaluated discipline candidate.** Publish one Skill with shared scope, authority, read-only policy, and finding schema, then progressively load distinct Code and Document pipelines. Run both for mixed Changes, deduplicate cross-artifact evidence, and defer other review objects.
- **S5 — Promote shaping, native design, standalone implementation, bounded review resolution, diagnosis, and TDD as Discipline Skills.** Use separate normal Changes and concise canonical contracts. Keep artifact routing and fallback in Core, return design and implementation results to the same WorkRef, and keep each discipline's authority and completion evidence independent.
- **S6 — Evaluate managed delivery only after Shape, Implement, and Review compose successfully through existing RSP artifacts.** The `rsp-manage` prototype did not clear promotion: retain it under research, keep orchestration external to `.rsp/`, and preserve direct/manual use.
- **S7 — Keep the release host-neutral and treat host integration as optional release work.** The first stable Skill must conform to Agent Skills, avoid required proprietary capabilities, and pass one Codex execution run. Keep metadata authoritative in each `SKILL.md`; permit `agents/openai.yaml` as presentation-only metadata; do not add a suite manifest, general installer, or plugin until a concrete consumer requires one.
- **S8 — Gate 3.0 on the installed assisted suite, not individual Skill success.** Prove the manual composition path plus deterministic shaping, native design, implementation routing, review resolution, artifact continuation, durable writeback, and authority-restraint scenarios. Require a bounded installed-package host holdout without treating it as cross-host or managed-orchestration evidence.

## Frozen Decisions

1. The first implementation slice is a minimal `rsp-review` candidate plus only enough shared contract and evaluation support to compare it.
2. The first `rsp-review` candidate is one capability package with separate `code-review.md` and `document-review.md` pipelines. Code simplicity follows correctness, Spec, Standards, and test gates; documents use coherence, traceability, completeness, feasibility, scope, and ambiguity instead of the code rubric.
3. Canonical Skills are host-neutral. Initial promotion requires Agent Skills conformance and unseen real-task evidence from one available host; repeated matrices and other hosts are release-candidate or later compatibility evidence rather than drafting gates.
4. Canonical metadata lives in each `SKILL.md`. No suite manifest is introduced until multiple real projections demonstrate a duplication or drift problem.
5. The 3.0 engineering suite publishes `rsp`, `rsp-shape`, `rsp-design`, `rsp-implement`, `rsp-diagnose`, `rsp-tdd`, `rsp-review`, and `rsp-address-review`. Shape's qualified progressive depth belongs to `rsp-shape`; tracked domain/module/reversible exploration belongs to `rsp-design`; bounded artifact continuation belongs to Core and execution Skills; the unpromoted `rsp-manage` research candidate, managed orchestration, host adapters, Git delivery, and plugins remain outside the product surface.
6. Capability promotion uses independently executable slices followed by one installed-suite composition gate. The original Shape/Implement/Core sequence established the pattern; native Design and artifact continuation use the same dependency model without turning list position into execution state.
7. `agents/openai.yaml` may remain as presentation-only metadata. Proprietary host behavior belongs in an optional Adapter or Plugin and cannot change canonical outcomes.
8. Candidates live under `research/candidates/skills/`, outside normal agent discovery and package output. Stable promoted Skills live under `skills/`.
9. Mixed Changes run both applicable pipelines and return one deduplicated report. UI, security-specific, and evaluation-coverage reviews remain deferred; `skipped` is never reported as `clean`.
