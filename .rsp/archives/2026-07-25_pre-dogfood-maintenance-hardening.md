---
kind: "fix"
---

# Change: pre-dogfood-maintenance-hardening

## Proposal
- Outcome: Make the pre-dogfood release, retained-evidence, dependency, and Skill gates fail only for relevant risk while preserving package safety and explicit authority boundaries.
- Why:
  - `release:check` accepts a checkout whose package version already has a tag on another commit, allowing a different tarball to reuse a finalized candidate identity.
  - Native-design compatibility binds five unexecuted Skills, so unrelated Skill edits invalidate expensive retained real-host evidence.
  - The lockfile resolves vulnerable `postcss@8.5.15` even though `8.5.18` fixes the known high-severity advisory.
  - Core and release-docs repeat detailed procedures in eagerly loaded entrypoints, while phrase-level contract tests make safe compression mechanically expensive.
- Scope:
  - Add a Git-aware release-candidate identity and cleanliness guard without making ordinary artifact checks depend on Git.
  - Upgrade the resolved PostCSS development dependency to the fixed release.
  - Limit native-design current compatibility to the five Skills actually executed while retaining full historical provenance and deterministic package inventory checks.
  - Move detailed Core and release-docs procedures into explicitly routed references and replace redundant phrase locks with structural or behavior-oriented assertions.
- Non-goals:
  - Do not publish, tag, commit, push, move or delete tags, delete recovery branches, or change release identity.
  - Do not weaken retained evidence integrity, package behavior-file hashes, real-host scoring, runtime isolation, or historical exact-package attribution.
  - Do not split the bundled CLI or claim capability-level CLI dependency closure.
  - Do not add release/manage real-host scenarios before dogfooding produces a concrete need.

## Spec
<!-- Describe expected correct behavior. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: candidate identity is checked only at candidate/publication boundaries.
  - `release:check` remains usable for content, test, build, and package validation outside a Git checkout.
  - `release:candidate-check` rejects a dirty worktree and rejects `v${version}` when it resolves to a commit other than HEAD.
  - A missing version tag or a tag resolving to HEAD is accepted; Git operational failures fail closed.
  - `prepublishOnly` invokes the candidate check.
- Requirement: native-design compatibility follows executed capability inputs.
  - Current compatibility compares the five executed Skill file and tree hashes plus existing package behavior files.
  - Unexecuted published Skill content changes do not invalidate the native-design run.
  - The complete ten-Skill inventory remains protected by deterministic package tests, and retained metadata remains immutable provenance.
- Requirement: maintainer dependencies avoid the known PostCSS disclosure vulnerability.
  - The resolved PostCSS version is at least 8.5.18 without adding an unnecessary runtime dependency.
- Requirement: published Skill entrypoints are progressively disclosed without losing safety semantics.
  - Core and release-docs keep routing, authority, ownership, and stop boundaries in their entrypoints.
  - Detailed setup, Group, conflict, durable-review, convention, projection, and reconciliation procedures are loaded only on their relevant paths.
  - Contract tests protect structure, prohibited actions, and observable routing instead of duplicating non-semantic prose.

### Acceptance
#### Scenario: a version tag belongs to another commit
- GIVEN a clean Git checkout whose `v${version}` tag resolves to a commit other than HEAD
- WHEN the candidate check runs
- THEN it exits nonzero and identifies the finalized version boundary

#### Scenario: a new or exact candidate is checked
- GIVEN a clean checkout where `v${version}` is absent or resolves to HEAD
- WHEN the candidate check runs
- THEN identity validation passes and the ordinary release checks remain independently callable

#### Scenario: an unrelated published Skill changes
- GIVEN passing retained native-design evidence and unchanged executed Skills and package behavior files
- WHEN only an unexecuted published Skill changes
- THEN current native-design compatibility remains passing
- AND deterministic inventory/package tests still require the complete published suite

#### Scenario: maintainers load a focused workflow
- GIVEN a Core or release-docs invocation that does not need a detailed procedure
- WHEN its entrypoint is loaded
- THEN authority and routing remain available without loading unrelated procedural text

## Design
- Approach:
  - Implement candidate identity as a separate script with fixture Git repositories and make the candidate npm script wrap the existing release gate.
  - Update the lockfile resolution for PostCSS without adding a production dependency.
  - Remove unexecuted Skill hash equality from `validateCurrentNativeDesignArtifact`; preserve the full recorded fingerprint and package inventory tests.
  - Extract path-specific Core procedures into references, reuse and refine release-docs references, and update contract tests in the same slice.
- Boundaries:
  - Candidate identity is local Git state; artifact validity remains package/content state; registry publication remains externally authorized state.
  - Retained run integrity and provenance remain historical; current compatibility is a scenario-specific behavioral gate.
  - Skill entrypoints own routing and safety invariants; references own conditional procedures.
- Affected areas:
  - `package.json`, `scripts/release-candidate-check.mjs`, and focused release tests.
  - `pnpm-workspace.yaml` and `pnpm-lock.yaml`.
  - `scripts/native-design-composition-eval.mjs` and `test/native-design-composition.test.ts`.
  - `skills/rsp/`, `skills/rsp-release-docs/`, `rules/rsp-rules.md`, and their contract tests.
- Constraints:
  - Support annotated and lightweight tags by comparing peeled commits.
  - Treat untracked files as dirty and distinguish a missing tag from a Git execution failure.
  - Do not mutate retained real-run evidence or weaken package behavior-file compatibility.
  - If fallback semantics change, edit authored `rules/rsp-rules.md`, build, then sync `.rsp/rsp-rules.md` with the built CLI; Skill-only progressive disclosure does not require a fallback rewrite.
  - Preserve user-facing behavior and all Git, lifecycle, publication, credential, and human-acceptance boundaries.

## Tasks
- [x] Add and integrate the release candidate identity/cleanliness guard with focused regression tests.
- [x] Upgrade the resolved PostCSS dependency to 8.5.18 and verify the dependency graph.
- [x] Scope native-design current compatibility to executed Skills while preserving package inventory and historical provenance gates.
- [x] Compress Core and release-docs through conditional references and replace redundant phrase-lock contract assertions.
- [x] Integrate all slices, confirm fallback semantics remain unchanged, refresh exact-package retained evidence, and run repository gates.

## Verify
- Automated:
  - [x] `mise exec -- pnpm vitest run test/release-candidate-check.test.ts test/release-metadata-check.test.ts` (18 tests passed) — proves: candidate identity and portable metadata boundaries.
  - [x] Review resolution: `mise exec -- pnpm vitest run test/release-candidate-check.test.ts test/release-metadata-check.test.ts` (19 tests passed) plus `git diff --check` — proves: `prepublishOnly` still reaches the candidate guard before the ordinary release gate, without phrase-locking the full script value.
  - [x] `mise exec -- pnpm vitest run test/native-design-composition.test.ts test/clean-install-check.test.ts test/skills-install.test.ts` (25 tests passed before the final integrated run) — proves: scoped retained compatibility and complete package inventory.
  - [x] `mise exec -- pnpm vitest run test/rsp-core-routing-contract.test.ts test/rsp-release-docs-skill-contract.test.ts test/managed-controller-contract.test.ts` (26 tests passed) — proves: compressed entrypoints preserve routing and safety contracts.
  - [x] `node scripts/native-design-composition-eval.mjs --run-real` with run `device-discovery-boundary-pre-dogfood-maintenance-hardening-final-metadata` (16 gates passed), followed by the default evaluator (passed) — proves: the final executed Skill tree and exact package compose in the real host while prior runs remain immutable.
  - [x] `mise exec -- pnpm run release:check` (build, typecheck, lint, 45 test files / 485 tests, clean-install package check passed after review resolution; tarball SHA-256 `88a8201d91be1856aeb8d2ff033b6c90845eeda7098eb5b813db5928fc8af678`) — proves: authored sources, static checks, repository behavior, package inventory, and exact installed package integrate.
  - [x] `mise exec -- pnpm why postcss --depth 4` and `mise exec -- pnpm audit --json` — proves: all resolved PostCSS paths use 8.5.18 and the PostCSS advisory is absent.
- Manual or environment:
  - [x] Inspected the final diff, status, tag target, retained output, and secret patterns; no unrelated work, prior-run mutation, release identity change, credential content, or external-action claim was found. Stable release/evidence/progressive-disclosure facts were updated in `.rsp/specs/design.md`; no Decision Record is needed because the changes refine existing boundaries without a new hard-to-reverse tradeoff.
- Coverage:
  - The actual `release:candidate-check` intentionally fails on this uncommitted managed worktree; seven isolated Git fixtures cover clean missing-tag, exact lightweight/annotated tag, finalized-tag drift, dirty tracked/untracked state, and Git failure, while one manifest-structure test protects the publication lifecycle wiring.
  - `pnpm audit` still reports unrelated development-chain findings in Vite, brace-expansion, and esbuild; they are outside this PostCSS-focused dependency slice.
  - Successful intermediate real-host runs remain retained under `device-discovery-boundary-pre-dogfood-maintenance-hardening` and `device-discovery-boundary-pre-dogfood-maintenance-hardening-final`; the default gate points to the later `-final-metadata` identity after the Core fallback and Skill CalVer corrections.

## Blockers
- none
