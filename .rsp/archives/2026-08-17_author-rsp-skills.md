---
kind: "feature"
---

# Change: author-rsp-skills

## Proposal
- Outcome: Create an RSP-specific maintainer Skill for authoring and evolving Skills
- Why:
  - The repository has mature Skill conformance, evaluation, security, and candidate-comparison infrastructure, but maintainers must reconstruct the authoring workflow from historical Changes, upstream reports, and generic host guidance.
  - Matt's current `writing-for-agents` guidance adds information hierarchy, co-location, checkable completion criteria, leading words, progressive disclosure, and no-op pruning; these mechanisms complement the existing Anthropic, SkillOpt, Skill-Use-Bench, Agent Skills, and SkillSpector evidence.
  - A repository-local maintainer Skill can make creation, revision, suite audit, semantic concision, upstream adaptation, and evaluation repeatable without adding another published RSP capability.
- Scope:
  - Update the existing Skill quality and governance model with the accepted Matt authoring mechanisms and the local maintainer capability disposition.
  - Add `.agents/skills/author-rsp-skills` with one small entrypoint, progressively loaded authoring, concision, and evaluation references, UI metadata, and one deterministic corpus scanner.
  - Add contract and scanner tests covering discovery, mode routing, no-hard-cap semantics, repository containment, reference reachability, and deterministic diagnostics.
- Non-goals:
  - Do not publish a new Skill under `skills/`, add it to the npm package inventory, or copy Matt's suite or prose wholesale.
  - Do not automatically rewrite, accept, commit, archive, push, tag, publish, or install a target Skill.
  - Do not introduce hard word/token budgets, private notation, a runtime router, a second state store, or provider/model requirements for routine authoring.

## Spec
### ADDED
- Requirement: RSP maintainers have one repository-local Skill authoring capability.
  - It handles `create`, `revise`, `audit`, `concise`, `adapt`, and `evaluate` modes against an explicit target and authority boundary.
  - It remains a project-development tool under `.agents/skills/` and never appears in the published product Skill inventory.
- Requirement: Skill quality is semantic and evidence-driven.
  - Every candidate preserves or explicitly changes trigger, inputs, authority, action, output, stop, verification, and conditional-loading behavior.
  - Information hierarchy, co-location, completion criteria, progressive disclosure, leading words, safe lists/tables/closed-flow notation, and no-op pruning are available authoring lenses.
  - Word, line, byte, and token measurements remain diagnostics rather than pass/fail correctness thresholds.
- Requirement: Candidate evolution remains bounded and attributable.
  - Upstream adaptation cites accepted source reports, recommendation IDs, revisions, and reuse modes.
  - Current-versus-candidate evaluation separates Trigger, Compliance, Boundary, and task result, combines deterministic checks with a small unseen holdout when behavior changes, and retains publication authority outside the Skill.
- Requirement: Corpus scanning is deterministic and non-mutating.
  - The scanner inventories authored published and maintainer Skill packages, Markdown resources, local reference reachability, size diagnostics, and exact repeated prose without modifying targets or inferring semantic equivalence.

### Acceptance
#### Scenario: Author a new RSP Skill
- GIVEN a demonstrated repository capability gap and explicit artifact authority
- WHEN a maintainer uses the Skill in `create` mode
- THEN it derives one bounded Skill contract and resource layout without creating a duplicate product owner or inferring publication authority

#### Scenario: Improve an existing Skill safely
- GIVEN an existing Skill has an evidenced clarity, routing, duplication, or context-cost problem
- WHEN a maintainer uses `revise` or `concise` mode
- THEN proposed edits preserve named semantic obligations and use measurements only as diagnostics rather than a hard size gate

#### Scenario: Audit the complete authored corpus
- GIVEN published Skills and direct maintainer Skills coexist under different discovery and packaging boundaries
- WHEN the scanner runs from the repository root
- THEN it reports each canonical package once, excludes symlink projections, identifies reachable and unreachable Markdown resources, and changes no file

#### Scenario: Adapt and evaluate upstream guidance
- GIVEN an accepted upstream report contains a relevant authoring mechanism
- WHEN a maintainer uses `adapt` or `evaluate` mode
- THEN the result retains provenance, compares current and candidate behavior proportionately, and stops before promotion, Git delivery, or publication

## Design
- Approach:
  - Extend `research/models/skill-quality-and-governance.md` rather than creating another overlapping cross-source model.
  - Keep `SKILL.md` as the mode selector and authority procedure; load `references/authoring.md`, `references/concision.md`, or `references/evaluation.md` only for the matching work.
  - Initialize the Skill with the canonical Skill Creator tooling, then replace generated placeholders with repository-specific instructions and metadata.
  - Implement `scripts/scan-skill-context.mjs` with Node standard-library APIs and deterministic sorted JSON output; human-readable output is a projection of the same facts.
- Boundaries:
  - `author-rsp-skills` owns authoring analysis and candidate preparation; selected RSP Changes remain work owners, `rsp-review` remains the independent review owner, and `rsp-commit` retains Git delivery.
  - Existing `scripts/skill-candidate-evaluation.mjs`, `scripts/skill-security-preflight.mjs`, package checks, and behavior suites remain the evaluation owners; the new Skill links to them instead of duplicating their implementations.
- Affected areas:
  - `.agents/skills/author-rsp-skills/`
  - `research/models/skill-quality-and-governance.md`
  - focused maintainer-Skill contract and scanner tests
- Constraints:
  - Keep references one level from `SKILL.md` and keep all scan paths within the selected repository root.
  - Preserve the accepted Matt revision and use model-only or independent wording unless exact adapted text is deliberately selected with attribution.
  - Do not make context reduction, symbol use, or any numeric metric a correctness substitute.

## Tasks
- [x] Update the Skill quality and governance model with Matt's current authoring mechanisms and maintainer capability boundary.
- [x] Initialize and author `.agents/skills/author-rsp-skills` with mode-specific progressive references and UI metadata.
- [x] Implement the deterministic non-mutating Skill corpus scanner.
- [x] Add focused contract/scanner tests and run repository validation.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/author-rsp-skills.test.ts test/project-skill-dogfood.test.ts test/skill-candidate-evaluation.test.ts test/skill-security-preflight.test.ts` — passed 4 files / 28 tests; proves: maintainer discovery, authoring contract, scanner behavior, and existing evaluation/security seams compose
  - [x] `mise exec -- pnpm run build` — passed; proves: authored package sources and CLI remain buildable without packaging the maintainer Skill
  - [x] `mise exec -- pnpm run lint` — passed after correcting test style; proves: Skill resources, scanner, model, and tests satisfy static checks
  - [x] `VITEST_MAX_WORKERS=1 mise exec -- pnpm run test -- --no-file-parallelism` — passed 73 files / 818 tests; proves: complete repository behavior remains compatible
  - [x] `git diff --check && node dist/cli.mjs check --focused` — passed after final metadata updates; proves: patch hygiene and Change validity
  - [x] `uv run --with pyyaml python /Users/oevery/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/author-rsp-skills` — passed; proves: canonical Skill metadata and package structure are valid without adding a project dependency
### Optional
- Manual or environment:
  - [ ] Forward-test one create/revise request in an isolated task — optional because deterministic contracts cover the initial maintainer-only artifact and no release candidate is selected
- Coverage:
  - Required checks cover authoring mode selection, semantic quality boundaries, progressive references, deterministic corpus inventory, path containment, no-hard-cap rules, and preservation of existing evaluation/security owners.

## Blockers
- none

## Durable Decisions
- `author-rsp-skills` is a direct repository maintainer package, not a published Skill or symlink projection.
- Context counts and exact repetition are deterministic diagnostics only; semantic obligations and behavioral evidence decide candidate quality.
- The Skill composes existing evaluation and security owners and stops before review, Git delivery, archive, installation, or publication.
