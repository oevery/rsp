---
kind: "refactor"
---

# Change: audit-skill-concision-semantics

## Proposal
- Outcome: Replace mechanical Skill word caps with semantic concision checks and audit every published Skill
- Why:
  - Hard word-count assertions have repeatedly forced already-compressed Skill prose toward terse labels and punctuation-heavy shorthand instead of protecting behavior.
  - Portability checks are duplicated across discipline contract tests, and the Shape and Implement tests can silently switch from the published Skill to a research candidate.
- Scope:
  - Audit every repository-authored Skill entrypoint and conditional reference, including the maintainer distillation Skill and retained Manage candidate.
  - Replace body and reference word-count gates with semantic contract coverage while retaining actual host metadata constraints.
  - Repair only evidenced compression damage and consolidate published-Skill portability coverage.
- Non-goals:
  - Rewriting every Skill for style, imposing a replacement body-size threshold, or changing RSP workflow authority and behavior.
  - Editing test-fixture Skills, promoting the retained research candidate, or changing release and external-action authority.

## Spec
<!-- Describe the desired structural outcome. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: semantic concision owns Skill quality
  - Skill bodies and conditional references have no strict repository word-count pass/fail gate.
  - Real host constraints such as frontmatter name and description limits remain enforced.
  - Concision changes remove duplication or unclear prose without losing trigger, authority, action, stop, return, or conditional-loading semantics.
- Requirement: every authored Skill is inspected
  - The audit covers all published Skills and references, `.agents/skills/distill-upstream`, and the retained `research/candidates/skills/rsp-manage` candidate.
  - Test fixture Skills remain fixtures rather than product audit targets.
  - Files without evidenced semantic or readability defects remain unchanged.
- Requirement: tests protect the published semantic contract
  - One shared suite validates every published Skill's portable package contract.
  - Discipline tests target published Skills explicitly and retain behavior, authority, stop, return, and progressive-disclosure assertions without body-length limits.
  - Research-candidate tests stay explicitly separated from product tests.

### Acceptance
#### Scenario: a Skill needs more words to state its contract clearly
- GIVEN a repository-authored Skill preserves one semantic owner and conditional detail boundaries
- WHEN maintainers revise its prose
- THEN no body or reference word-count assertion forces semantic compression
- AND portable frontmatter constraints and behavior contracts still fail when violated

#### Scenario: published Skill contracts are validated
- GIVEN all directories under `skills/` are published package sources
- WHEN the Skill contract suite runs
- THEN every published Skill receives the same portable package validation
- AND Shape and Implement contract tests cannot silently substitute a research candidate

#### Scenario: the full Skill corpus is reviewed proportionately
- GIVEN an entrypoint or reference is concise and semantically complete
- WHEN the audit finds no concrete ambiguity, duplication, or verification mismatch
- THEN it remains unchanged rather than being rewritten merely to reduce words

## Design
- Approach:
  - Remove hard word-count expectations from every related Skill contract test and rename test intent around portability, progressive disclosure, and behavior.
  - Make the general Skill contract discover and validate all published Skill directories, then remove redundant metadata and symlink assertions from discipline-specific tests where they add no distinct confidence.
  - Point Shape and Implement tests directly at their published directories; keep the retained Manage candidate under its dedicated research test block.
  - Rewrite only the compressed Manage qualification and dispatch passages into ordinary sentences and bullets without changing eligibility or authority.
  - Add a maintainer rule that treats host metadata bounds as hard constraints and prose concision as semantic review rather than a body-size quota.
- Boundaries:
  - Published Skill package content and its repository contract tests; no CLI or runtime product behavior changes.
- Affected areas:
  - `skills/**`, `.agents/skills/distill-upstream/**`, and `research/candidates/skills/rsp-manage/**` as the inspected corpus.
  - `test/*skill*.test.ts`, relevant Skill contract tests, and `AGENTS.md` as mutation owners.
- Constraints:
  - Preserve established Skill routing, authority, lifecycle, Git, publication, and stop boundaries.
  - Do not replace one arbitrary word cap with another stylistic metric.
  - Keep tests focused on durable semantic contracts rather than exact incidental wording where alternatives are equivalent.

## Tasks
- [x] Remove every strict Skill body/reference word-count assertion and centralize portable published-Skill coverage.
- [x] Repair evidenced compressed Manage prose and record the semantic-concision maintainer rule.
- [x] Run focused Skill contracts, inspect every authored Skill/reference outcome, and complete full repository verification and review.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-contract.test.ts test/rsp-core-routing-contract.test.ts test/skill-contract.test.ts --maxWorkers=1` — 3 files and 58 tests passed after review correction; proves: portable and semantic Skill contracts remain covered without prose quotas.
  - [x] `mise exec -- pnpm run build`; `mise exec -- pnpm run lint`; `mise exec -- pnpm run test -- --maxWorkers=1` — build and lint passed; 50 files and 569 tests passed; proves: package generation and the complete repository suite remain compatible.
  - [x] `git diff --check`; `node dist/cli.mjs check --focused` — passed; proves: patch hygiene and the focused Change contract.
- Manual or environment:
  - [x] Inspected all 12 published Skills and their references, the maintainer distillation Skill and references, and the retained Manage candidate; fixed-scope review found two Manage semantic regressions, Address Review corrected them, and fresh re-review returned `clean` — proves: files were reviewed by meaning rather than threshold proximity.
- Coverage:
  - No live provider or external-host run is required because this refactor changes repository prose and deterministic contract tests, not host integration behavior.

## Blockers
- none
