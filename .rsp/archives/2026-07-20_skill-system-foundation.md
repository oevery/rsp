---
kind: "feature"
---

# Change: skill-system-foundation

## Proposal
- Summary: Establish the host-neutral Skill contract and evaluate the first rsp-review candidate
- Why:
  - RSP currently publishes one operational Skill but has no reusable contract or behavioral promotion gate for adding focused Discipline Skills.
  - Adding Skills directly under `skills/` or `.agents/skills/` would either publish unproven behavior or contaminate the maintainer agent environment.
  - `research/models/rsp-skill-system.md` freezes a host-neutral layered model and selects `rsp-review` as the first candidate through which to validate the smallest sufficient foundation.
- Scope:
  - Define and test only the portable Skill contract needed by the existing `rsp` Skill and the first candidate.
  - Author an unpublished, host-neutral `rsp-review` candidate under `research/candidates/skills/rsp-review/`.
  - Add isolated code-only, document-only, mixed, clean-diff restraint, missing-authority, ambiguous-focus, scope-preservation, and prohibited Git/publication fixtures.
  - Record one reproducible comparison of the candidate against a no-review-skill baseline, including quality results and context/tool cost.
  - End with an evidence-backed promote, revise, or reject recommendation; promotion itself requires a follow-up Change.
- Non-goals:
  - Publishing `rsp-review` under `skills/` or changing the current `rsp` Core Skill.
  - Building a suite manifest, marketplace, general Skill installer, host adapter generator, Plugin, or host-specific workflow.
  - Implementing shaping, implementation, diagnosis, TDD, handoff, or Managed Controller capabilities.
  - Accepting upstream revisions beyond the explicitly selected provenance baselines, automatically synchronizing upstream prose, or changing the RSP project protocol.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: minimal portable Skill contract
  - Stable and candidate RSP Skills are validated for Agent Skills frontmatter, directory/name identity, string metadata, quoted independent CalVer, resolvable package-local resources, and path containment.
  - Canonical Skill behavior depends only on the portable Agent Skills contract, ordinary project files and commands, and the RSP CLI; proprietary host capabilities are optional and cannot change the canonical outcome.
  - `agents/openai.yaml`, when present, is presentation-only and cannot add workflow, authority, state, or behavior.
- Requirement: unpublished RSP review candidate
  - The candidate remains outside normal agent discovery and npm package output until a later promotion Change.
  - Review fixes the comparison target and authoritative intent before inspection, partitions the scope by review object, and progressively loads separate Code and Document pipelines inside one Skill package.
  - The Code Pipeline reviews safety/correctness, Change/Spec fidelity, project standards, regression/test coverage, and implementation simplicity; Simplicity is evaluated only after the preceding gates.
  - The Document Pipeline reviews authority/traceability, coherence, completeness/ambiguity, plan feasibility, scope, and appropriate concision without applying the code rubric.
  - Agent-facing executable documents such as `SKILL.md`, prompts, commands, and workflow definitions receive Code Pipeline contract review first; ordinary requirements, plans, Specs, Decision Records, ADRs, and explanatory/user documentation use the Document Pipeline.
  - A mixed Change runs both applicable pipelines and emits one deduplicated report. Every finding identifies `artifact_kind` and `axis`; `clean` and `skipped` remain distinct outcomes.
  - Missing Spec or document authority is reported without inventing requirements and does not prevent other axes whose inputs remain authoritative.
  - Review is read-only by default and never infers commit, push, PR, publish, delete, or approval authority.
- Requirement: evidence-based promotion decision
  - Candidate evaluation runs in an isolated temporary environment without installing the candidate into `.agents/skills/` or another normal discovery path.
  - Evaluation covers intended action and correct non-action and records deterministic results before any model-based judgment.
  - The comparison records code and document axis coverage, scope-state correctness, false positives, duplicate findings, context/tokens when observable, tool calls, latency when observable, and known limitations.
  - The resulting research report recommends promote, revise, or reject and preserves the candidate revision/content identity and evaluation inputs.

### Acceptance
#### Scenario: code review finds independent defects
- GIVEN a focused Change, project instructions, and a fixed code diff containing a Spec omission, a project-standard violation, missing regression coverage, and avoidable complexity
- WHEN the isolated `rsp-review` candidate reviews the diff
- THEN the Code Pipeline returns separately attributable findings without modifying the worktree or performing Git/publication actions

#### Scenario: document review uses document semantics
- GIVEN a requirements or implementation-plan document with an authority gap, internal contradiction, unresolved ambiguity, infeasible step, or scope leak
- WHEN the isolated candidate reviews the document
- THEN the Document Pipeline reports findings on the relevant document axes without applying code-style or test-coverage rules and without auto-editing semantic content

#### Scenario: mixed change synthesizes one report
- GIVEN one fixed scope containing executable code and documentation affected by the same behavior change
- WHEN the candidate reviews the scope
- THEN it runs both applicable pipelines, checks documentation against implemented behavior, labels every finding by artifact kind and axis, and deduplicates issues supported by both code and documentation evidence

#### Scenario: review preserves restraint
- GIVEN a clean fixed diff that satisfies the selected Change and project instructions
- WHEN the candidate reviews the diff
- THEN every applicable axis may return no findings and the candidate does not invent cleanup, requirements, or follow-up work

#### Scenario: absent pipeline is skipped rather than clean
- GIVEN a fixed scope containing no reviewable document artifacts
- WHEN the candidate completes Code Pipeline review
- THEN the Document Pipeline reports `skipped`, not `clean`, while the Code Pipeline reports its independently observed result

#### Scenario: authority is missing or ambiguous
- GIVEN no relevant durable Spec, or more than one possible focused Change
- WHEN the candidate attempts review
- THEN it reports the missing or ambiguous authority, does not fabricate intent, and continues only with axes whose inputs remain authoritative

#### Scenario: candidate remains host-neutral and unpublished
- GIVEN the candidate and its evaluation assets
- WHEN contract checks and package inspection run without proprietary host tools
- THEN the canonical behavior remains executable through portable files/commands, the candidate is absent from normal discovery and npm package contents, and any OpenAI metadata is presentation-only

#### Scenario: evidence supports the next decision
- GIVEN completed deterministic fixtures and one isolated Codex execution comparison
- WHEN the evaluation report is produced
- THEN it identifies exact inputs and candidate content, reports quality and cost evidence plus limitations, and selects promote, revise, or reject without publishing automatically

## Design
- Approach:
  - Treat `research/models/rsp-skill-system.md` recommendations S1-S4 and S7 as the selected design basis.
  - Select the following reviewed inputs; all behavior and tooling is independently reimplemented unless explicitly marked model-only:

    | Source report | Recommendation | Adoption mode | Selected contribution |
    | --- | --- | --- | --- |
    | `research/upstreams/agent-skills-spec/38a2ff82958afee88dadf4831509e6f7e9d8ef4e.md` | R1-R4 | independent-reimplementation | portable metadata, CalVer, license, and conformance checks |
    | `research/upstreams/matt-skills/9603c1cc8118d08bc1b3bf34cf714f62178dea3b.md` | R1, R3 | independent-reimplementation | fixed-target independent review axes and compact routing boundary |
    | `research/upstreams/compound-engineering/d1bff966296b687eb8509312098458e5fa2535dc.md` | R1, R2, R5 | independent-reimplementation | candidate promotion, composition contract, and distinct code/document pipelines |
    | `research/upstreams/ponytail/16f29800fd2681bdf24f3eb4ccffe38be3baec6b.md` | R1-R3 | independent-reimplementation | isolated multi-axis evaluation, restraint fixtures, and Simplicity axis |
    | `research/upstreams/skills-cli/777599e1159e401b11ce4c8a57c20f09a8f1596e.md` | R1, R4 | independent-reimplementation | package-local contract validation and separate version/content identity |
    | `research/upstreams/superpowers/d884ae04edebef577e82ff7c4e143debd0bbec99.md` | R1, R5, R6 | independent-reimplementation for R1/R5; model-only for R6 | executable fixtures, fixed review requests, and separation of review from feedback resolution |
    | `research/upstreams/openai-plugins/11c74d6ba24d3a6d48f54a194cd00ef3beea18f9.md` | R1-R3 | model-only | Skill/Plugin separation and presentation-only host projection boundary |
  - Build the smallest contract checks around the existing `skills/rsp/` payload and `research/candidates/skills/rsp-review/`; do not introduce a generalized registry before a second consumer demonstrates the need.
  - Keep one candidate Skill entry with progressive `references/code-review.md` and `references/document-review.md`; this internal artifact dispatch is not a catalog router or recursive Skill composition.
  - Normalize both pipelines into findings containing artifact kind, axis, severity, location, authority/evidence, impact, suggested action, and confidence, then deduplicate cross-artifact issues during synthesis.
  - Keep candidate instructions and fixtures committed under research, copy them into isolated temporary evaluation workspaces, and keep generated runs or host-local state out of product discovery.
  - Separate deterministic fixture assertions from any model-based quality judgment. Use a reproducible scorecard/report rather than treating one successful conversation as promotion evidence.
  - Keep canonical instructions host-neutral. Use Codex only as the first real execution environment; do not encode Codex tools, directives, threads, hooks, or plugin semantics into the candidate contract.
  - Retain GSD report R5 as unselected model context for review-object vocabulary and `skipped` versus `clean`; do not accept or implement its phase-bound review workflows in this slice.
- Affected areas:
  - `research/candidates/skills/rsp-review/`
  - `research/evaluations/rsp-review/`
  - `test/skill-contract.test.ts`
  - `test/skill-behavior/` and the smallest test/harness entrypoint needed to execute its fixtures
  - `skills/rsp/SKILL.md` as an unchanged conformance subject, not an implementation target
  - npm package-content verification ensuring research candidates remain excluded
- Constraints:
  - No file under `.agents/skills/` or published `skills/` is created or changed by this Change.
  - No runtime dependency, network service, platform-specific API, or general manifest/registry is added solely for evaluation.
  - Tests must assert observable contracts and outcomes rather than exact duplicated Skill prose.
  - Evaluation must fail closed when required authority or fixture isolation cannot be established.
  - Existing dirty version/research work remains intact and outside implementation edits except for this focused Change and explicitly named research candidate/evaluation paths.

## Tasks
- [x] Freeze the host-neutral RSP Skill System boundary and select the first vertical slice
- [x] Define the proposal, requirements, scenarios, design constraints, and verification plan for this Change
- [x] Record recommendation-level adoption provenance and accept only the upstream baselines selected by this slice
- [x] Refine review boundaries using separate Code and Document pipelines and defer GSD-specific review categories
- [x] Add the minimal portable Skill contract checks using the existing `rsp` Skill and candidate as real consumers
- [x] Author the unpublished `rsp-review` candidate with shared scope/output and progressively loaded Code and Document pipelines
- [x] Add isolated code, document, mixed, restraint, skipped, ambiguity, missing-authority, scope, and prohibited-action fixtures
- [x] Add npm/package exclusion verification for research candidates and evaluation assets
- [x] Run one isolated Codex comparison against the no-review-skill baseline and record the reproducible scorecard
- [x] Produce a promote, revise, or reject recommendation without moving the candidate into `skills/`
- [x] Run focused and full project verification
- [x] Decide and write any required durable Spec or Decision Record updates before archive

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skill-contract.test.ts test/skill-behavior.test.ts`
  - [x] `mise exec -- pnpm run build`
  - [x] `mise exec -- pnpm run lint`
  - [x] `mise exec -- pnpm run test`
  - [x] `npm pack --dry-run --ignore-scripts` confirms that no `research/candidates/` or `research/evaluations/` path is packaged
  - [x] `node dist/cli.mjs check --focused` reports no unresolved Change hygiene issues
- Manual:
  - [x] Inspect the candidate and verify that removing Codex-specific capabilities does not change its canonical review outcome
  - [x] Run the isolated Codex comparison on pinned code, document, mixed, and restraint fixtures and record exact inputs, outputs, cost signals, and limitations under `research/evaluations/rsp-review/`
  - [x] Confirm the candidate is absent from normal agent discovery and remains outside `skills/`
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or stable instructions that belong in the nearest project-owned `AGENTS.md`
  - [x] No current-fact or Decision Record update is needed: the candidate remains research-only with recommendation `revise`, so no stable product behavior has been promoted

## Blockers
- none
