---
kind: "refactor"
---

# Change: rename-review-resolution-skill

## Proposal
- Outcome: Rename rsp-address-review to rsp-resolve-findings with an explicit installed-suite migration
- Why:
  - `address-review` ambiguously suggests modifying or closing a review, while the capability actually dispositions fixed Findings and resolves only accepted ones.
  - A package rename without an upgrade path would leave the obsolete and replacement Skills discoverable together in existing installations.
- Scope:
  - Rename the published Skill, current routes, default inventory, self-host projection, Specs, user documentation, scripts, fixtures, and contract tests.
  - Add a force-gated, transactional cleanup for an installed obsolete `rsp-address-review` directory when the replacement is selected.
- Non-goals:
  - Changing Finding dispositions, mutation authority, verification, re-review, managed convergence, or Git/lifecycle behavior.
  - Rewriting historical archives, retained evaluations, upstream reports, or research provenance.
  - Shipping a compatibility alias that would make both Skill names discoverable.

## Spec
<!-- Describe the desired structural outcome. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: precise review-resolution identity
  - The canonical published and installed name is `rsp-resolve-findings`; its human-facing capability name is Resolve Findings.
  - `rsp-review` remains the report-only producer; `rsp-resolve-findings` dispositions a fixed report, corrects accepted Findings under authority, verifies, and requests report-only re-review.
  - Current product surfaces use `rsp-address-review` only in the explicit migration mapping, upgrade guidance, and migration tests; it is never an available Skill identity or route. Address Review is no longer a capability name.
- Requirement: safe installed-suite migration
  - Clean and named replacement installs use `rsp-resolve-findings` only.
  - When installing a selection containing the replacement and the obsolete real directory exists, installation stops before mutation unless `--force` is present.
  - A force dry-run reports the obsolete removal without mutation. A force install removes the obsolete directory transactionally with replacement activation and restores it if activation rolls back.
  - Symlinked, special, or otherwise unsupported obsolete targets fail closed. Unrelated project Skills remain untouched.
- Requirement: provenance remains immutable
  - Historical archives, retained evaluation manifests/results, and upstream/model provenance keep the name observed at their recorded revision.

### Acceptance
#### Scenario: a fresh project installs the suite
- GIVEN no installed RSP Skills
- WHEN the default packaged suite is installed
- THEN `rsp-resolve-findings` is installed
- AND `rsp-address-review` is absent

#### Scenario: an existing project still has the obsolete Skill
- GIVEN a real `.agents/skills/rsp-address-review` directory
- WHEN the replacement suite is installed without `--force`
- THEN installation stops before mutation with an actionable rename message
- WHEN the owner repeats the installation with `--force`
- THEN the obsolete directory is removed and `rsp-resolve-findings` is installed atomically

#### Scenario: current and historical names are separated
- GIVEN current product surfaces and immutable historical evidence
- WHEN the rename is complete
- THEN current routing, Specs, docs, and behavior fixtures use only `rsp-resolve-findings` or Resolve Findings, apart from explicit migration compatibility surfaces
- AND historical archives, retained evaluations, and upstream research remain unchanged

## Design
- Approach:
  - Rename the authored directory and self-host symlink, update frontmatter/title/version, and migrate all current semantic references.
  - Extend `installPackagedSkills` with an explicit obsolete-name mapping and a `removed` result. Preflight obsolete real directories, require `--force`, move them into the existing transaction's `previous` area, and reuse rollback restoration.
  - Update installation tests for clean, dry-run, force, rollback, unsupported-target, and unrelated-directory behavior.
- Boundaries:
  - Public Skill identifier and package installation output change; review-resolution behavior does not.
- Affected areas:
  - `skills/rsp-resolve-findings`, `.agents/skills`, `src/commands/skills.ts`, current Specs/docs/routes/scripts.
  - Skill, install, clean-package, assisted-loop, managed-controller, and composition tests/fixtures.
- Constraints:
  - Never delete an obsolete installed directory without explicit `--force`; preserve transaction rollback and path-identity protections.
  - Do not touch historical/provenance owners merely to eliminate old-name search hits.

## Tasks
- [x] Rename the canonical Skill and migrate every current product route, Spec, document, script, projection, fixture, and contract.
- [x] Implement the force-gated transactional obsolete-install cleanup and focused migration tests.
- [x] Run focused and full verification, inspect current-versus-historical name boundaries, and complete fixed-scope review.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skills-install.test.ts test/skill-contract.test.ts test/rsp-resolve-findings-contract.test.ts test/assisted-loop.test.ts test/managed-controller-contract.test.ts --maxWorkers=1` — 5 files and 69 tests passed; proves rename discovery, migration safety, behavior composition, and managed convergence.
  - [x] `mise exec -- pnpm run build`; `mise exec -- pnpm run lint`; `mise exec -- pnpm run typecheck`; `mise exec -- pnpm run test -- --maxWorkers=1` — build, lint, and typecheck passed; 50 files and 572 tests passed.
  - [x] `mise exec -- pnpm run release:package-check`; `git diff --check`; `node dist/cli.mjs check --focused` — exact tarball clean install, patch hygiene, and Change validity passed.
- Manual or environment:
  - [x] Inspected every remaining old-name match: only explicit migration compatibility, the immutable auto-lifecycle fixture, and historical Changelog/archive/research provenance retain it; no current published identity or route does.
- Coverage:
  - No remote, publication, or live-provider behavior is involved.

## Blockers
- none
