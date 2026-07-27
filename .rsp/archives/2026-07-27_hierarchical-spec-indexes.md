---
kind: "feature"
---

# Change: hierarchical-spec-indexes

## Proposal
- Outcome: Replace the recursive global Specs Index with reserved per-directory `00-index.md` navigation so humans and AI can discover relevant Specs without loading or rewriting the entire Spec tree.
- Why:
  - The current root `.rsp/specs/INDEX.md` lists every descendant Spec, so every added Spec rewrites one global generated file and its AI context cost grows with the whole project.
  - Specs already support recursive directories; local indexes can bound reading and generated-file conflicts to the affected domain.
- Scope:
  - Reserve logical `<spec-directory>/index` at physical `<spec-directory>/00-index.md` for generated local navigation.
  - Generate one direct-child index for the root Specs directory and every non-Decision directory containing Specs or child Spec directories.
  - Update init, update, `rsp add spec`, doctor, durable-owner discovery, documentation, templates, migrations, and tests for hierarchical indexes.
- Non-goals:
  - Do not turn generated indexes into durable fact or rationale owners.
  - Do not introduce unrestricted nesting for Changes or Change Groups.
  - Do not add full-text or semantic Spec search, hand-authored sections inside generated indexes, or an external database.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: reserved local Spec Index identity
  - Every managed Specs directory has at most one generated `00-index.md`; the filename is reserved and sorts before ordinary Spec files.
  - Each local index lists only its direct child Spec files and direct child Spec directories, never all recursive descendants.
  - A child directory entry links to that directory's `00-index.md`; a Spec entry uses the child file's title and summary metadata or the existing deterministic fallback.
  - The root index includes `design.md`, so an initialized project has a useful non-empty Specs entrypoint.

- Requirement: localized regeneration
  - `rsp add spec <recursive-name>` creates or updates indexes only in the affected directory chain needed to expose newly created directories; unrelated domain indexes remain byte-identical.
  - `rsp update` deterministically reconciles the complete local-index set, does not rewrite unchanged indexes, and removes only recognized obsolete generated Spec Index files.
  - The configured Decision Record subtree and its descendants remain outside Spec Index generation.

### REMOVED
- Requirement: recursive global Specs Index
  - `.rsp/specs/INDEX.md` is replaced by `.rsp/specs/00-index.md` and is not retained as a second global projection.

### Acceptance
#### Scenario: a new project is initialized
- GIVEN an empty project
- WHEN `rsp init` completes
- THEN `.rsp/specs/00-index.md` exists before ordinary Specs in lexical order
- AND it contains a direct entry for `design.md`
- AND `.rsp/specs/INDEX.md` does not exist

#### Scenario: a Spec is added to an existing domain
- GIVEN root, `cli`, and `skill-system` Spec directories with valid local indexes
- WHEN `rsp add spec cli/history-output` runs
- THEN the new Spec appears in `.rsp/specs/cli/00-index.md`
- AND the root and `skill-system` indexes remain byte-identical

#### Scenario: a new Spec domain is added
- GIVEN no `runtime` Spec directory
- WHEN `rsp add spec runtime/lifecycle` runs
- THEN a generated `.rsp/specs/runtime/00-index.md` lists `lifecycle.md`
- AND the root index gains one direct entry for `runtime/00-index.md`

#### Scenario: Decision Records are configured inside Specs
- GIVEN a configured Decision Record subtree under `.rsp/specs/`
- WHEN local Spec indexes are rebuilt
- THEN no Decision Record file or directory is exposed as a Spec Index entry

## Design
- Approach:
  - Replace the single recursive builder with a tree projection that discovers safe managed directories, excludes Decision Records, and renders one deterministic direct-child index per included directory.
  - Treat `00-index.md` as a reserved generated identity analogous in discoverability, but not ownership semantics, to a Group's `00-brief.md`.
  - Plan all changed and obsolete index paths before mutation, then write or remove only recognized generated files under the existing lock and managed-path protections.
- Boundaries:
  - Specs remain authoritative durable facts; local indexes own navigation only; `design.md` remains the project-wide boundary map; Decision Records remain separately owned rationale.
- Affected areas:
  - `src/commands/specs-index.ts`, `src/commands/spec.ts`, `src/commands/init.ts`, `src/commands/update.ts`, and `src/commands/doctor.ts`
  - managed-path inspection, context/durable target discovery, templates, CLI help, README, rules, Specs, migrations, and integration tests
- Constraints:
  - Preserve no-follow checks and fail closed on symlinks, special files, unrecognized reserved paths, incomplete inspection, and configured Decision Record overlap.
  - Generated local indexes must not be proposed as durable writeback targets or relevant Specs themselves.
  - Avoid partial ownership: every `00-index.md` body and metadata are CLI-generated, with no hand-authored section preserved across rebuilds.

## Tasks
- [x] Define the reserved local Spec Index identity and safe hierarchical discovery/projection model.
- [x] Implement deterministic local-index creation, minimal regeneration, and recognized legacy-index migration under the existing lock and managed-path boundary.
- [x] Update init, update, `rsp add spec`, doctor, context, and durable-owner consumers for hierarchical indexes.
- [x] Update templates, user documentation, runtime rules, Specs, migrations, and focused integration tests.
- [x] Run focused and full project verification and record only final decisive evidence; both independently owned retained-evidence gates passed with new immutable runs for this Change.

## Verify
- Automated:
  - [x] `mise exec -- pnpm run build` — passed; the hierarchical index model and bundled CLI compile.
  - [x] `mise exec -- pnpm run lint` — passed; changed source and tests satisfy repository static rules.
  - [x] `mise exec -- pnpm run test` — passed 560/560 after the final production build and independent retained-evidence updates.
- Manual or environment:
  - [x] In a temporary project, initialized RSP, added Specs to `cli` and `skill-system`, added new `runtime`, observed `doctor --json --compact` healthy, confirmed root and unrelated `skill-system` index hashes stayed identical when extending `cli`, and confirmed the new root-to-runtime and runtime-to-Spec links.
  - [x] Native-design composition real-host run `device-discovery-boundary-hierarchical-spec-indexes-2026-07-27` completed all four phases with exit 0 and no timeout; score and the default evaluator passed with no blockers, runtime-isolation violations, or unauthorized paths.
  - [x] Commit-message-quality product run `commit-message-quality-product-gpt-5-6-sol-high-2026-07-27T11-36-50Z` passed with one exact-scope local commit, 2/2 fixture tests, a clean disposable worktree, unchanged local bare-remote refs, no unauthorized paths, and no push, force-push, or publication action. Sanitized evidence is retained independently under `research/evaluations/rsp-commit/2026-07-27-product-commit-message-quality`.
- Coverage:
  - Very large Spec-tree performance is not benchmarked unless implementation evidence shows the tree projection is materially expensive.

## Blockers
- none
