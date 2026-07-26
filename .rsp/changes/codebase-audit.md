---
kind: "feature"
---

# Change: codebase-audit

## Proposal
- Outcome: Add a curated optional codebase audit Skill with evidence-driven structural findings
- Why:
  - The packaged suite can shape, design, implement, diagnose, and review already selected work, but it has no owner for discovering the most material structural risks in an existing codebase before a Change or bounded design question exists.
  - Project maintainers otherwise need to locate and reconcile broad audit Skills from unrelated upstream collections, whose authority, mutation, and evidence standards vary.
- Scope:
  - Add one portable, report-only `rsp-codebase-audit` Skill with progressively loaded structural audit lenses.
  - Keep the ten lifecycle Skills as the default `rsp skills install` set and allow one exact packaged Skill name to be installed explicitly.
  - Qualify the optional Skill contract, default/named installation behavior, package inventory, and one evidence/restraint journey.
- Non-goals:
  - A generic production-readiness, security, performance, dependency, framework, or style audit.
  - Automatic Skill selection, remote search/sync, a marketplace, suite manifest, `list`, `--all`, uninstall, agents, hooks, hidden state, or project installation records.
  - Automatically creating Changes, designing or applying fixes, mutating code, writing durable project truth, or treating code reduction as an objective.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: `rsp-codebase-audit` discovers evidence-backed structural risks in an explicitly bounded repository or subtree before implementation work is selected.
  - It reads nearest project authority, entry points, direct callers/consumers, state and data owners, relevant configuration, and focused tests only as needed to establish a reachable structural issue.
  - It audits ownership and sources of truth, module/dependency direction, production-path reachability, change amplification, and mismatches between live paths and verification evidence.
  - It remains report-only and emits at most five ranked findings with exact evidence, realistic impact, confidence, and the smallest next owner; it reports `clean` or scoped uncertainty instead of manufacturing generic best-practice findings.
  - It does not require an RSP Change. When a focused Change is present it may use it as scope or authority, but it never creates or mutates RSP artifacts.
- Requirement: package-owned optional Skills are installed only by exact explicit selection.
  - `rsp skills install` without a name retains the current ten-Skill default behavior.
  - `rsp skills install <name>` preflights and installs only that exact packaged Skill; unknown names fail before filesystem mutation.
  - Existing `--dry-run`, `--force`, conflict, path-containment, atomic activation, and rollback behavior applies only to the selected set, while unrelated and previously installed optional Skills remain untouched.

### Acceptance
#### Scenario: audit finds a reachable structural risk
- GIVEN an explicitly bounded codebase where a nominal adapter or validator is bypassed by the production consumer
- WHEN `rsp-codebase-audit` inspects the relevant entry point, caller chain, seam, and focused tests
- THEN it reports the reachable bypass with exact evidence and impact
- AND returns the smallest design or shaping question without modifying code or RSP artifacts

#### Scenario: audit restrains unsupported findings
- GIVEN a bounded codebase with no evidenced ownership, dependency, reachability, amplification, or verification mismatch
- WHEN `rsp-codebase-audit` completes the smallest sufficient inspection
- THEN it reports no structural finding instead of emitting framework preferences, style advice, or speculative cleanup

#### Scenario: default and optional installation stay separate
- GIVEN the package contains the ten default lifecycle Skills and `rsp-codebase-audit`
- WHEN a user runs `rsp skills install`
- THEN only the ten default Skills are installed or refreshed
- WHEN the user runs `rsp skills install rsp-codebase-audit`
- THEN only the optional Skill is installed or refreshed with the existing safety and idempotency guarantees

## Design
- Approach:
  - Independently implement a concise root Skill plus one progressively loaded structural-lenses reference; keep the audit capability project-grounded and host-neutral.
  - Reuse the existing packaged-directory inspection and atomic installer after selecting either the fixed default set or one exact named Skill before destination preflight.
  - Keep optional selection stateless: packaged directories remain source truth and installed directories remain ordinary project files.
  - Provenance: accepted Matt report `research/upstreams/matt-skills/9603c1cc8118d08bc1b3bf34cf714f62178dea3b.md` and capability row C07; accepted Ponytail report `research/upstreams/ponytail/16f29800fd2681bdf24f3eb4ccffe38be3baec6b.md`, recommendations R2/R4 and capability row C16; adoption mode `independent-reimplementation`. ECC audit Skills are comparison material only until separately prepared and distilled.
- Boundaries:
  - `rsp-codebase-audit` owns only a response report; project code, RSP Changes, Specs, decisions, instructions, Git, and external systems retain their existing owners.
  - The package installer owns selection and safe copying only; it creates no project manifest or workflow state.
- Affected areas:
  - `skills/rsp-codebase-audit/` and the source-checkout `.agents/skills/` projection
  - `src/commands/skills.ts`, `src/cli.ts`, focused installer/Skill/package tests, and clean-install evidence
  - `.rsp/specs/distribution.md`, `.rsp/specs/skill-system.md`, `.rsp/specs/design.md`, and README installation/Skill inventory guidance
- Constraints:
  - Preserve the no-argument default installation contract and all current filesystem safety and rollback guarantees.
  - Do not copy upstream prose or schemas; preserve exact accepted research provenance outside runtime instructions.
  - Findings require direct repository evidence and a realistic trigger/impact; directory names, pattern matching, framework taste, or code-size preference alone are insufficient.
  - Keep the optional Skill independently invocable and do not turn Core, Review, or Design into a catalog/router.

## Tasks
- [x] Add the portable `rsp-codebase-audit` Skill, progressive structural lenses, and source-checkout projection
- [x] Add exact-name optional Skill installation while preserving the ten-Skill default and installer safety boundaries
- [x] Add focused contract, installer, package, and restraint/production-path validation
- [x] Reconcile durable distribution, Skill-system, design, and user-facing inventory facts
- [x] Run project gates and record fresh evidence

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/rsp-codebase-audit-skill-contract.test.ts test/skills-install.test.ts test/skill-contract.test.ts test/project-skill-dogfood.test.ts` — 2026-07-26: focused contract and installer coverage passed; the final installer file contains 14 passing cases, including unknown/extra-name zero-write rejection and exact named `--force` isolation
  - [ ] `mise exec -- pnpm run build && mise exec -- pnpm run typecheck && mise exec -- pnpm run lint && mise exec -- pnpm run test` — 2026-07-26: build, typecheck, and lint passed; 45 non-native-design test files / 515 tests passed, but the full suite correctly holds on the stale native-design `current_release_artifact` gate after CLI and published-inventory drift
  - [x] `mise exec -- pnpm run release:package-check` — 2026-07-26: packed `@oevery/rsp@3.1.0-beta.1` contains all eleven Skills; isolated default installation stayed at ten and exact named installation was idempotent
- Manual or environment:
  - [x] Run the candidate instructions against one isolated production-seam bypass case and one clean restraint case — 2026-07-26: `/tmp/rsp-codebase-audit-fixtures-019f9d7a` found the exact `boot → runWorker` bypass and seam-only test mismatch in fixture A, returned `clean` for fixture B, and made no repository or Git mutation
  - [x] Fresh fixed-scope re-review — 2026-07-26: one accepted response-language contract finding was corrected and verified; Code and Document re-review both returned `clean` with no new findings
- Coverage:
  - Additional providers, hosts, framework-specific audits, and broad cost calibration are release-candidate work and are not required for this first optional project Skill.

## Blockers
- Fresh native-design composition evidence is required before release preparation because the exact CLI artifact and complete published-Skill inventory changed; retained evidence remains immutable and the current evaluator reports only `current_release_artifact` as failed.
