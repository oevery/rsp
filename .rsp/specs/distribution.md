# Distribution and Maintainer Research

## Purpose
- Define package identity, published artifacts, Skill installation, release-candidate checks, repository layering, and upstream-research promotion boundaries.

## Stable Facts
- The npm package is `@oevery/rsp`, exposes the `rsp` binary, and requires Node.js 22 or newer.
- Published distribution contains the built runtime, `rules/`, ten default portable lifecycle Skills, and independently installable optional project Skills. Repository `.agents/` projections, `.codex/` host configuration, self-hosting `.rsp/` state, maintainer research, and host-specific prompts/metadata are not package runtime inputs.
- Published Skills use the portable intersection of Agent Skills and active target-client validation. They carry `license: MIT`, `metadata.author`, and independent quoted content CalVer versions that change for meaningful Skill-content releases rather than every CLI release.
- The source checkout dogfoods the published Skills through relative `.agents/skills/<name>` symlinks to canonical `skills/<name>` directories. Overlapping global workflow Skills are disabled in user configuration because project `.codex/config.toml` does not currently provide that disablement.
- `rsp skills install [--dry-run] [--force]` selects the fixed ten-Skill lifecycle suite; `rsp skills install <name> [--dry-run] [--force]` selects only one exact bundled Skill. Unknown names fail before project-target mutation, and default installation never refreshes, replaces, or removes optional Skills.
- Skill installation validates every bundled source before selecting targets, then preflights every selected package-owned destination before mutation. It rejects symlinked or unsupported entries, reports installed/unchanged/replaced/conflicting names, preserves unrelated Skills, treats identical trees as no-ops, and replaces divergent selected targets only with explicit `--force`.
- Installation creates no manifest, controller state, or second durable workflow truth. If rollback cannot fully restore originals, it reports and retains an exact recovery path.
- `release:check` validates metadata, build, types, lint, tests, and packed/installed artifact without requiring Git. `release:candidate-check` additionally requires a clean tracked and untracked worktree.
- A release candidate accepts `v${version}` only when absent or peeled to `HEAD`; a tag on another commit finalizes that version and requires a new package version. `prepublishOnly` uses the candidate check, while publication remains separately authorized.
- Retained evaluation evidence is immutable. Native-design evidence keeps the exact package, complete published-Skill fingerprint, and package inventory; current-checkout compatibility validates executed Skill/tree and behavior-file hashes, while other published-Skill drift stays diagnostic.
- Native Skill candidates begin with one demonstrated RSP gap and a concise capability delta. Draft validation covers portable structure, hard authority/mutation/truthfulness boundaries, and a small unseen real-task holdout; repeated provider matrices, cost calibration, and additional-host evidence are release-candidate gates. Evaluation considers task success, corrections, total tokens, elapsed time, and tool calls rather than input-token cost alone.
- The repository separates product runtime (`src/`, `bin/`), product distribution (`rules/`, `skills/`), host integration (`.agents/skills/`), maintainer tooling (`scripts/`), maintainer knowledge (`docs/`, `research/`), verification (`test/`), self-hosting protocol (`.rsp/`), and transient/generated artifacts (`.cache/`, `dist/`, dependencies).
- Product runtime does not import research, caches, host projections, self-hosting state, or maintainer-only scripts. Published rules and Skills operate without a source checkout or upstream cache.
- External Skill/workflow sources are declared in `upstreams.yaml` by repository, ref, tier, treatment, and required paths; ignored `.cache/upstreams/` holds prepared checkouts and `upstreams.lock` pins accepted revisions as a flat timestamp-free mapping.
- Preparation records fetched commits in dedicated candidate refs; checkout `HEAD` is not candidate authority. Only explicit maintainer `accept` updates the lock, and acceptance means the matching source distillation is complete.
- Mechanical preparation evidence is regenerable and ignored. Tracked source distillations and cross-source models live under `research/`; their recommendations reach product artifacts only through a normal selected RSP Change.
- Patch evidence is streamed and byte-hashed. Direct adaptation records license/reuse constraints. Status derives research state, required-path coverage, and next action from existing artifacts without another lifecycle state.
- Upstream registry values remain operational: `core` is the default review tier, `reference` is optional comparison material, and `conform`, `model`, `adapt`, and `tooling` route preparation and semantic review. Speculative policy stays in research until tooling consumes it.
- `scripts/upstreams.mjs` owns upstream manifest validation, cache lifecycle, candidate comparison, and atomic lock serialization; it is maintainer tooling, not published CLI behavior.
- `.agents/skills/distill-upstream/` is a maintainer capability, not a published product Skill.

## Boundaries
- In scope:
  - Package/runtime inventory, portable Skill packaging, installation, candidate validation, evaluation provenance, and maintainer upstream research.
- Out of scope:
  - Publication authority, automatic research promotion, executing cached upstream code, host-specific product commitments without a concrete consumer, and runtime dependency on repository-only state.

## Constraints
- Never run code from cached upstream repositories or overwrite a dirty managed cache.
- Every declared upstream path is required; a glob matching nothing fails preparation rather than broadening scope.
- Research and maintainer tooling may inspect product source but cannot mutate or enter product surfaces except through a selected reviewed Change.
- Cross-repository consistency takes priority over per-repository workflow freedom for published artifacts.
