---
kind: "refactor"
---

# Change: clarify-public-capability-surfaces

## Proposal
- Outcome: Clarify readiness and structural-audit capability surfaces
- Why:
  - `rsp ready` and `rsp archive --dry-run` are documented as equivalent but currently use different readiness projections, while the latter duplicates the canonical read-only command.
  - `rsp-codebase-audit` overstates a deliberately structural capability; its current text-contract tests do not qualify trigger obedience, false-positive restraint, or report-only behavior.
  - `rsp update` and `rsp-manage` descriptions leave avoidable ambiguity about their actual boundaries.
- Scope:
  - Make `rsp ready` the canonical readiness surface and keep `rsp archive --dry-run` as a deprecated compatibility route to the same human result.
  - Rename the optional Skill to `rsp-structural-audit`, add bounded hotspot-selection and shallow-indirection lenses, and add executable behavior fixtures for its main restraint boundaries.
  - Clarify the `rsp update` help boundary and the `rsp-manage` capability description.
- Non-goals:
  - Removing `rsp archive --dry-run` in this Change or changing the `rsp ready --json` schema.
  - Expanding structural audit into security, performance, dependency, framework, style, production-readiness, solution design, mutation, HTML reports, or mandatory subagent orchestration.
  - Importing Matt terminology as project authority, copying upstream prose, or changing RSP lifecycle/Git authority.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: one canonical readiness projection
  - `rsp ready <name>` remains the recommended read-only readiness command and retains its human and JSON contracts.
  - `rsp archive <name> --dry-run` emits a deprecation notice and delegates to the same human readiness projection without moving the Change.
  - Documentation no longer presents two independently implemented readiness checks.
- Requirement: precise structural-audit identity and bounded depth
  - The optional published identity is `rsp-structural-audit`; `rsp-codebase-audit` remains only as an explicit force-gated installed-Skill migration and immutable history/provenance.
  - When a repository boundary is broad, repeated changes or defects may select the smallest candidate chain but never establish a Finding alone.
  - A suspected shallow indirection is tested by whether removal eliminates complexity or disperses caller knowledge; it qualifies only with a reachable trigger and concrete impact.
  - The Skill remains report-only, evidence-gated, capped at five Findings, and returns design questions to `rsp-design` rather than proposing or implementing solutions.
- Requirement: behavior-qualified restraint
  - Deterministic holdout manifests and scoring cover a real structural Finding, a misleading-complexity `clean` case, history-as-selection-only, specialist-scope mismatch, and mutation pressure.
  - Evaluation validates result, bounded Findings, required evidence fields, and forbidden mutation/lifecycle claims without making provider execution part of ordinary package tests.
- Requirement: accurate public descriptions
  - `rsp update` states that it refreshes RSP-managed project files and does not update packaged Skills.
  - `rsp-manage` describes eligible long-running, recovery, or multi-slice coordination without implying expanded authority.

### Acceptance
#### Scenario: compatibility readiness preview
- GIVEN an open Change with deterministic warnings and durable-review guidance
- WHEN `rsp ready <name>` and `rsp archive <name> --dry-run` are run
- THEN both expose the same human readiness result
- AND only the archive compatibility form emits a deprecation notice
- AND neither moves the Change

#### Scenario: an existing optional audit installation is upgraded
- GIVEN a real `.agents/skills/rsp-codebase-audit` directory
- WHEN `rsp skills install rsp-structural-audit` runs without `--force`
- THEN installation stops before mutation with an actionable rename message
- WHEN the owner repeats it with `--force`
- THEN the obsolete directory is removed and the replacement is installed transactionally

#### Scenario: structural evidence is separated from heuristics
- GIVEN a broad boundary with change hot spots or a suspected shallow module
- WHEN structural audit evaluates it
- THEN history and deletion reasoning select or test a concrete behavior chain
- AND no Finding is emitted without a reachable trigger, concrete impact, and owner evidence

## Design
- Approach:
  - Route archive dry-run through `showReady`, retain the flag as a deprecated compatibility entry, and remove its duplicate checklist implementation.
  - Generalize the obsolete packaged-Skill rename mapping, rename authored/current surfaces and self-host projection, and reuse the existing force-gated transactional migration.
  - Add two concise mechanisms to `structural-lenses.md`; keep the main Skill trigger, authority, output, and stop contract stable.
  - Add a small manifest loader/scorer plus five holdouts inspired by Superpowers R1; use Matt `codebase-design` and `improve-codebase-architecture` only as model evidence for independently worded selection and deletion mechanisms.
- Boundaries:
  - CLI compatibility changes only the archive dry-run route; archive mutation and ready JSON remain owned by their current commands.
  - Audit discovers and reports structural risk; Design owns alternatives, seam/interface recommendations, reversible probes, and planned design writes.
- Affected areas:
  - `src/cli.ts`, `src/commands/archive.ts`, `src/commands/ready.ts`, CLI docs and integration tests.
  - `skills/rsp-structural-audit`, packaged Skill inventory/migration, self-host projection, Specs/docs and evaluation tests.
  - `skills/rsp-manage/SKILL.md` and update command help/tests.
- Constraints:
  - Preserve current `rsp ready --json` output and archive mutation semantics.
  - Do not mutate retained evaluations, archives, upstream reports, or model provenance merely to replace historical names.
  - Keep provider execution optional and keep ordinary tests deterministic.

## Tasks
- [x] Unify readiness preview behavior and document the archive dry-run compatibility path.
- [x] Rename and migrate the optional structural-audit Skill across current product surfaces.
- [x] Add the bounded Matt-derived lenses and deterministic structural-audit behavior evaluator/holdouts.
- [x] Clarify update and Manage descriptions, then run focused and full verification plus fixed-scope review.

## Verify
- Automated:
  - [x] Focused readiness, Skill install/contract, structural-audit evaluator, help, and package tests — 2026-07-28: focused suites passed, including 189 readiness/audit cases after the final help-contract addition.
  - [x] `mise exec -- pnpm run build`; `mise exec -- pnpm run typecheck`; `mise exec -- pnpm run lint`; `mise exec -- pnpm run test -- --maxWorkers=1` — 2026-07-28: build, typecheck, and lint passed; 51 files and 579 tests passed.
  - [x] `mise exec -- pnpm run release:package-check`; `git diff --check`; `node dist/cli.mjs check --focused` — 2026-07-28: clean install contains the exact renamed twelve-Skill inventory; patch hygiene and focused Change validation passed.
- Manual or environment:
  - [x] Inspect every remaining old audit-name match and classify it as migration compatibility, immutable history/provenance, or a defect — 2026-07-28: current matches are limited to the force-gated migration, its tests/docs, and this Change; other matches are retained archives, release notes, or evaluation provenance.
- Coverage:
  - No provider matrix is required for ordinary verification; the deterministic evaluator prepares future real-agent runs without claiming them.
  - Fixed-scope `rsp-review` found no actionable findings after checking behavior, docs, migration safety, holdout restraint, and retained-history boundaries.

## Blockers
- none
