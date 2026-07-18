---
kind: "feature"
---

# Change: upstream-source-registry

## Proposal
- Summary: Add reproducible upstream source caching and review workflow
- Why:
  - RSP needs reproducible access to upstream skills and engineering workflows without runtime overlay chains or Git submodules.
  - Maintainers need to compare pinned upstream revisions before distilling accepted behavior into RSP-native skills.
- Scope:
  - Add a tracked upstream manifest and generated lock file.
  - Add a deterministic repository-maintainer script for cloning or fetching caches, preparing research inputs, reporting status, diffing candidates, and accepting reviewed revisions.
  - Seed the registry with the selected standards, distribution, engineering, specification, autonomy, and simplicity sources.
  - Keep source distillation and cross-source models in a tracked maintainer research layer outside published RSP artifacts.
- Non-goals:
  - Automatically rewriting or publishing RSP skills.
  - Loading cached upstream content during normal RSP project work.
  - Adding watch-only or mixed-license sources to the first synchronized set.
  - Promoting research recommendations into final RSP files without a separately selected RSP change.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: Maintainers can synchronize declared upstream repositories into `.cache/upstreams` through the repository script.
  - Synchronization clones missing repositories, fetches existing repositories, and checks out the declared candidate revision without modifying `upstreams.lock`.
- Requirement: Maintainers can inspect pinned and candidate revisions deterministically.
  - Status and diff actions expose human-readable and JSON output.
- Requirement: Accepting candidates is explicit.
  - The accept action writes resolved commits to a flat, timestamp-free `source: revision` mapping in `upstreams.lock`; sync, prepare, and diff never accept automatically.
  - A changed candidate cannot be accepted until a complete, candidate-matched source distillation exists under `research/upstreams/`.
- Requirement: Candidate identity does not depend on mutable checkout state.
  - Synchronization stores each fetched commit in a dedicated Git ref and status, diff, and accept read that ref instead of checkout `HEAD`.
- Requirement: Cached repositories are disposable.
  - The cache is excluded from Git and npm publication and can be rebuilt from the tracked registry and lock.
- Requirement: Upstream treatment is explicit and operational.
  - Each source declares one of `conform`, `model`, `adapt`, or `tooling`; prepare records the strategy and the maintainer skill uses it to route semantic distillation.
- Requirement: Research is separate from final RSP artifacts.
  - Mechanical evidence is written under ignored `.cache/upstream-distillation/`.
  - Single-source distillations are tracked under `research/upstreams/`; optional cross-source synthesis belongs under `research/models/`.
  - Research never changes `src/`, `rules/`, `skills/`, or `.rsp/specs/` automatically.

### Acceptance
#### Scenario: synchronize and review an upstream update
- GIVEN a manifest source whose tracked ref has moved beyond the accepted lock commit
- WHEN a maintainer runs `node scripts/upstreams.mjs sync` and `node scripts/upstreams.mjs diff`
- THEN the cache contains the candidate checkout, the lock remains unchanged, and the diff reports the accepted-to-candidate change

#### Scenario: accept reviewed candidates
- GIVEN a changed synchronized candidate with a complete matching source distillation
- WHEN a maintainer runs `node scripts/upstreams.mjs accept`
- THEN `upstreams.lock` records exact resolved commits and subsequent status reports no pending update

#### Scenario: prepare an upstream for semantic distillation
- GIVEN a synchronized changed candidate
- WHEN a maintainer runs `node scripts/upstreams.mjs prepare <source>`
- THEN deterministic evidence is written to ignored cache, a tracked source-distillation template is created without overwriting existing work, and the lock remains unchanged

#### Scenario: keep research out of final products
- GIVEN completed source distillations or cross-source models
- WHEN a recommendation is selected for implementation
- THEN it is promoted through a normal RSP change, while research artifacts remain excluded from the npm package and normal RSP runtime context

## Design
- Approach:
  - Parse `upstreams.yaml` with the existing YAML dependency and validate a compact versioned schema.
  - Keep Git process and cache behavior behind one repository-maintainer script tested against temporary local repositories.
  - Use a repo-local maintainer skill for semantic distillation and strategy-specific progressive disclosure.
- Affected areas:
  - `scripts/upstreams.mjs`
  - `upstreams.yaml` and `upstreams.lock`
  - `test/upstreams.test.ts`
  - `.agents/skills/distill-upstream/`
  - `research/`
  - `.gitignore`, README files, and `.rsp/specs/design.md`
- Constraints:
  - Preserve Node.js 18 support and avoid new runtime dependencies.
  - Never run code from cached upstream repositories.
  - Never overwrite a dirty cached checkout; report it as an error.
  - Never update the lock file implicitly.
  - Keep upstream cache paths project-local, ignored, and reproducible from tracked files.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Add failing behavior tests for manifest parsing and local Git cache lifecycle
- [x] Implement the upstream maintainer script and lock serialization
- [x] Add `sync/status/diff/accept` actions with consistent JSON output
- [x] Seed the tracked upstream registry and ignore disposable caches
- [x] Document the maintainer workflow and durable design facts
- [x] Run focused and full validation, then self-review the diff
- [x] Harden candidate identity, Git execution, publication boundaries, and deterministic lock output
- [x] Add operational source strategies and deterministic prepare evidence
- [x] Add tracked source-distillation templates without overwriting existing research
- [x] Require complete candidate-matched distillation before accepting changed revisions
- [x] Add the repo-local `distill-upstream` maintainer skill and strategy references
- [x] Document and validate the research-to-final-product promotion boundary

## Verify
- Automated:
  - [x] `pnpm vitest run test/upstreams.test.ts test/integration.test.ts`
  - [x] `pnpm run build`
  - [x] `pnpm run lint`
  - [x] `pnpm run test`
  - [x] `pnpm run release:check`
  - [x] `uv run --with pyyaml python .../skill-creator/scripts/quick_validate.py .agents/skills/distill-upstream`
- Manual:
  - [x] `node scripts/upstreams.mjs status --json`
  - [x] Clean, synchronize, and inspect the real `ponytail` source in `.cache/upstreams`
  - [x] Confirm pending `compound-engineering` accept fails without distillation and leaves `upstreams.lock` unchanged
  - [x] Confirm npm dry-run excludes `.agents/`, `research/`, maintainer scripts, manifests, locks, and caches
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or `.rsp/rules/`
  - [x] Record the stable upstream-maintenance boundary in `.rsp/specs/design.md`

## Blockers
- none
