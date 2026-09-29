---
kind: "refactor"
---

# Change: artifact-contract-guidance

## Proposal
- Outcome: Provide consistent artifact ownership, contract-oriented scaffolds, and reader-centered document writing and review.
- Why:
  - Fact-oriented scaffolds and underspecified document roles encourage implementation inventories, duplicated authority, and inconsistent artifact placement.
- Scope:
  - Spec and Change scaffolds, project entry, Core/Shape/Review guidance, durable writeback, fallback, and their current contracts and documentation.
  - User-authorized continuation: focused upstream research, default rsp-doc, matching Document Review quality criteria, package selection, and joint evaluation cases.
- Non-goals:
  - No Change schema or lifecycle redesign, automatic context migration, historical rewrite, upstream lock acceptance, live provider campaign, push, or publication. Local archive and exact-scope commit are separately authorized for delivery.

## Spec
### MODIFIED
- Requirement: CONTEXT.md is the single context model for vocabulary, domain relationships, and navigation; legacy maps are owner-reviewed migration inputs only.
- Requirement: Ordinary entry detects legacy context and routes to a separately loaded Core context-migration method. Discovery preserves relevant context without granting edits or blocking unrelated work. CLI update/doctor provide non-blocking root-path guidance, not semantic migration; retirement requires preserved meaning, updated references, and explicit authority.
- Requirement: New domain Specs use Purpose, Boundaries, Contracts, Scenarios, and Constraints as a writing scaffold, not a mandatory schema. Specialized Specs retain meaningful domain headings.
- Requirement: Change retains Proposal, Spec, Design, Tasks, Verify, and Blockers. Short plain-prose HTML hints may remain or be removed without changing deterministic checks or readiness.
- Requirement: Skills distinguish contracts, implementation choices, operating instructions, rationale, and historical evidence by responsibility, not file presentation.
- Requirement: rsp-doc writes authorized substantial technical documentation using Purpose, Grounding, Usability, Ownership, and Maintenance. It belongs to the eight-Skill default suite, with on-demand invocation rather than a mandatory writing phase. Explicit named installation remains selective and divergent user content requires separate force authority.
- Requirement: Document Review uses the same dimensions, remains read-only, ties findings to reader-task consequences, and accepts adequate documents without style-only findings.

### Acceptance
#### Scenario: Generated guidance and existing documents
- GIVEN a new project, a generated Change, and existing owner-authored Specs
- WHEN a user keeps or removes scaffold hints, completes the Change, and updates managed files
- THEN hints do not change diagnostics or readiness, unfinished work remains visible, and existing Specs remain unchanged

#### Scenario: Writer and reviewer share document-quality expectations
- GIVEN one factual export-tool corpus and README, CONTEXT, and Spec documents
- WHEN writing and review are prepared against the same facts
- THEN writer output must preserve factual meaning and help the intended reader, while review distinguishes real obstacles and false promises from harmless style differences without modifying files

#### Scenario: Legacy context remains discoverable before migration
- GIVEN an existing root CONTEXT-MAP.md, with or without a current CONTEXT.md
- WHEN managed update or doctor --fix runs
- THEN context files remain unchanged, entry retains the migration route, and root legacy context is reported without failing healthy setup checks or claiming migration completion

#### Scenario: Default documentation capability with selective installation
- GIVEN the packaged suite and an existing installation that may contain customized Doc guidance
- WHEN installing without a name or with an explicit Skill name
- THEN the default selection contains rsp-doc, an explicit name selects only that Skill, and divergent Doc content is preserved unless force is explicitly requested

## Design
- Approach:
  - Strengthen existing owners in place; change defaults and add concise local guidance without a new shared runtime or document taxonomy.
- Boundaries:
  - Existing mutation/review/lifecycle boundaries remain unchanged. Default Doc distribution supports on-demand routing for substantial authorized writing; Review never calls Doc to fix its findings. Each package keeps a standalone local expression of the same quality dimensions, with a bounded fallback for partial or older installations.
- Affected areas:
  - src/core/artifacts.ts and public CLI lifecycle coverage.
  - skills/rsp, skills/rsp-shape, skills/rsp-review, rules/rsp-rules.md, current Specs, and matching documentation.
  - skills/rsp-doc, upstreams.yaml, research/upstreams and research/models, package-selection tests, and evals/cases/document-quality.
- Constraints:
  - Hints contain plain prose, not sample headings, checkboxes, placeholder syntax, or hidden requirements. Retain explicit body placeholders.
  - Current-vs-candidate model behavior is not established by structural checks; no live comparison is authorized in this request.
  - Context migration is a conditional Core reference, directly reachable from ordinary entry. It separates read-only discovery from authorized reconciliation, Doc-assisted writing, reference checks, and explicit retirement. CLI observes root-path presence only; no context merge or migration state is added.

### Selected research

All source revisions and report paths are pinned in [the documentation model](../../research/models/document-quality-2026-09.md). Selected recommendations: Prisma R1–R3, Gemini R1–R2, Anthropic R1–R2, Matt R6–R7, and Compound R8–R9. Adoption is model-only with independent RSP text; no upstream prompt, persona, or script is copied. The user selected this capability extension on 2026-09-29; source lock acceptance is separate.

The user subsequently selected default distribution on 2026-09-29. Earlier research's optional-candidate discussion is retained as research context, not current distribution authority.

### Durable decision
- Current facts: Update existing spec or scoped instruction
- Current-fact target: .rsp/specs/core-model.md; .rsp/specs/cli-contracts.md; .rsp/specs/skill.md; .rsp/specs/distribution.md
- Facts to write: Artifact ownership, CONTEXT entry and conditional migration, Spec defaults, Change hints, default/on-demand Doc routing, and shared reader-centered writing/review quality; written.
- Decision Record: No Decision Record needed
- Decision Record target: N/A
- Rationale to write: none; default availability leaves lifecycle, mutation authority, and on-demand invocation unchanged.
- Archive ready: yes; required checks passed and the fixed-scope read-only re-review found Code and Document clean. Optional model behavior comparison remains unverified. Local archive and exact-scope commit are authorized; push and publication are not.

## Tasks
- [x] Update scaffold and context-entry generation.
- [x] Align authored Skills, fallback, and document ownership guidance.
- [x] Add focused public CLI coverage and verify package/document consistency.
- [x] Refresh self-hosted managed content and write current contracts and final evidence.
- [x] Complete focused research and the shared writer/reviewer quality model.
- [x] Add rsp-doc and align Core, Implement, and Document Review.
- [x] Prepare joint writer/reviewer quality cases.
- [x] Run fresh verification for the complete expanded candidate and update durable contracts.
- [x] Include Doc in eight defaults, preserve selective installation and customization, and verify the updated distribution and guidance.
- [x] Add the separately loaded context-migration branch, preserve ordinary legacy discovery, and verify non-mutating CLI guidance.

## Verify
### Required
- Automated:
  - [x] Fresh build, lint, typecheck, and test including context migration passed on 2026-09-29: 17 test files, 80 tests. Public CLI coverage confirms root legacy guidance is non-blocking, absent without a map, and still present when CONTEXT coexists; update and doctor --fix preserve context content. The installer regression confirms eight defaults including Doc, selective named installation, and refusal to silently overwrite customized Doc content.
  - [x] Public CLI smoke in temporary ordinary projects: unnamed dry-run/install selected eight Skills; named rsp-doc dry-run/install selected only Doc. Self-hosted source-projection symlinks were preserved; installer dry-run refusal on those links is the existing safety boundary.
  - [x] mise exec -- pnpm run skills:package-check and docs:check — nine packages passed; seven bilingual page pairs and 31 Markdown files passed. The host quick_validate.py could not run without PyYAML; the repository validator checked actual YAML metadata and resource closure instead.
  - [x] mise exec -- pnpm run release:package-check — 56-file tarball inventory and offline clean install passed after context-migration changes, including required rsp-doc package presence; this is not release or model acceptance.
  - [x] node dist/cli.mjs check --focused and doctor, git diff --check — passed; managed entry/fallback and local rsp-doc source projection checked. No upstreams.lock changes.
  - [x] Skill context scanner — the new Core migration reference is reachable; counts are diagnostics only. eval:check passed 28 local schema/oracle cases. Earlier documentation plans do not establish acceptance for the changed composition; providerInvocations: 0.
  - [x] Five completed source reports match pinned metadata, recomputed evidence hashes, patch hashes, and file inventories; eight local research links and all model source revisions resolve. Prisma/Gemini caches use shallow sparse checkouts; no upstream scripts were executed.
  - [x] Fixed-scope read-only re-review against fff714b6, including all uncommitted and untracked work: Code and Document clean; prior context-discovery finding resolved. The review reran build and all 80 tests, package checks, document checks, resource scanning, fallback synchronization checks, and diff checks. This was an in-thread review, not independent model acceptance.
### Optional
- Manual or environment:
  - [ ] Live baseline/candidate model comparison; requires separately authorized provider execution.
- Coverage:
  - Deterministic checks and prepared joint cases do not establish improved model writing quality, natural routing, or independent semantic acceptance. Context-migration routing and conflict handling have no live baseline/candidate comparison. No provider campaign, release acceptance, historical rewrite, or automatic project-context migration was run. Prisma and Anthropic exact-path licenses remain unresolved; only model-level ideas and independently authored product text are used.

## Blockers
- none
