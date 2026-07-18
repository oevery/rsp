# Project Design: @oevery/rsp

## Purpose
- RSP is a lightweight workflow for AI-assisted software work.
- It separates durable project knowledge from open implementation work.
- It provides a platform-agnostic file convention that humans and different coding agents can read consistently.

## Stable Facts
- The npm package name is `@oevery/rsp`; it publishes a CLI binary named `rsp`.
- RSP stands for Rules, Specs, Plans.
- RSP uses `.rsp/` as the project-local workflow root.
- `rules/` stores durable operating rules and is the compact, always-read canonical behavioral source.
- `specs/` stores durable project-level facts, boundaries, and constraints.
- `changes/` stores open work.
- `focus.d/` is the only current-focus truth source.
- `archives/` stores completed change history.
- RSP has only two lifecycle states: `open` and `archived`.
- A change is `open` when it exists under `.rsp/changes/` and `archived` after it is moved under `.rsp/archives/`.
- Each open change is a single Markdown file; multi-file change bundles are outside the core model.
- Every change file uses the fixed sections `Proposal`, `Spec`, `Design`, `Tasks`, `Verify`, and `Blockers`.
- Every change file must declare an explicit `kind` in frontmatter.
- CLI commands handle deterministic filesystem operations, structure checks, generated indexes, and warnings.
- Generated `INDEX.md` files use lightweight YAML frontmatter with `kind: generated-index` and an `index_type` value for machine-readable classification.
- Generated index builders avoid rewriting unchanged `INDEX.md` files.
- `rsp doctor` identifies generated indexes by frontmatter metadata instead of body footer text.
- `rsp doctor --fix` reports only actual filesystem changes in its `fixed` output; an empty `fixed` array means no safe repair changed files.
- `durableReview.candidateTargets` lists likely writable durable files and excludes generated indexes and bundled core rules from ordinary project writeback targets.
- `rsp create --lite` is a short template for explicitly tracked small changes; simple current-session tasks should not create RSP changes unless tracking is intentionally needed.
- Semantic judgment, including durable writeback decisions, belongs to an RSP skill or a human reviewer.
- `AGENTS.md` is a navigation entrypoint and must not become a durable rules or design store.
- External skill and workflow repositories can be declared by repository, ref, tier, treatment strategy, and relevant paths in `upstreams.yaml`, cached under ignored `.cache/upstreams/`, and pinned explicitly in a flat, timestamp-free `source: revision` lock mapping.
- Upstream synchronization records fetched commits in dedicated Git candidate refs; checkout `HEAD` is not candidate authority. Only the maintainer script's explicit `accept` action updates accepted revisions, and distillation into RSP-native skills remains a separate reviewed change.
- Upstream preparation writes regenerable mechanical evidence to ignored cache; tracked single-source distillation and cross-source synthesis live under `research/`, outside published and runtime RSP artifacts.
- Accepting any revision, including an initial baseline, means its matching source distillation is complete. Status derives research state, required-path coverage, and the next action from existing artifacts without adding lifecycle state.
- Mechanical patch evidence is streamed and byte-hashed. Direct adaptation records license and reuse constraints; research recommendations affect final RSP artifacts only through a normal RSP change with report, recommendation, and adoption provenance.

## Boundaries
- In scope: initializing and repairing `.rsp/` structure for repositories.
- In scope: creating, focusing, unfocusing, checking, and archiving single-file changes.
- In scope: maintaining generated spec and archive indexes.
- In scope: distributing reusable RSP rules and skill guidance with the package.
- In scope: keeping RSP readable by humans, agents, CI, and simple scripts.
- Out of scope: replacing git history or project management systems.
- Out of scope: adding OpenSpec-style multi-file change artifacts.
- Out of scope: automatically merging change `Spec` deltas into durable specs during archive.
- Out of scope: introducing workflow states that do not map to deterministic filesystem truth.
- Out of scope: becoming a plugin platform or schema-heavy workflow framework.
- Out of scope: binding the workflow to a single IDE, agent, or hosting platform.

## Structure
- `src/cli.ts` defines the CLI surface and command registration.
- `src/commands/` contains command implementations for RSP operations.
- `src/core/` contains shared filesystem, config, output, helper, and locking logic.
- `scripts/upstreams.mjs` is repository-maintainer tooling for upstream manifest validation, Git cache lifecycle, candidate comparison, and atomic lock serialization; it is not part of the published RSP CLI.
- `.agents/skills/distill-upstream/` is a repository-maintainer skill for semantic upstream research; it is not a published RSP product skill.
- `research/` contains tracked intermediate upstream distillations and models; it is not a product truth or runtime context source.
- `bin/rsp.mjs` is the executable entrypoint that loads the built CLI.
- `commands/` contains optional workflow-oriented slash command prompts for tools that support compatible command files; it is an enhancement surface, not part of the core RSP filesystem protocol.
- `rules/` contains bundled rules copied into project `.rsp/rules/` during initialization or update.
- `skills/rsp/` contains operational skill guidance for agents that support skills.
- `docs/design-philosophy.md` records explanatory product and design rationale for maintainers.
- `test/` contains Vitest coverage for command behavior and core helpers.

## Constraints
- Runtime support requires Node.js 18 or newer.
- Prefer the smallest model that correctly solves the workflow problem.
- Preserve the single-file change model and fixed six-section change structure.
- Preserve `.rsp/focus.d/` as the only current-focus source.
- Preserve `open -> archived` as the complete lifecycle model.
- Do not promote task history, debugging notes, or one-off implementation context into `specs/` or `rules/`.
- Do not create catch-all durable summary files when a fact belongs in `design.md`, a specific spec, a rule file, or nowhere.
- Keep cross-repository consistency higher priority than per-repository workflow freedom.
- Keep agent-distributed normative surfaces in English for cross-agent stability.
- Keep `rules/` as the compact normative layer; keep `skills/` as the more detailed operational layer when detail prevents agent hallucination or mistakes.
- Prefer README, design docs, durable specs, or CLI output for explanatory detail that does not prevent agent misoperation.
- Skill compactness must not remove guidance about change creation, durable writeback, archive readiness, generated/core files, or deterministic-vs-semantic boundaries.
- Prefer machine-readable output and diagnostics that reduce guessing without expanding workflow complexity.
- Never run code from cached upstream repositories during synchronization, and never overwrite a dirty managed cache.
- Treat `.cache/upstreams/` as disposable implementation state and `upstreams.yaml` plus `upstreams.lock` as the reproducible tracked state.
- Keep upstream registry fields operational: `core` is the default review tier, `reference` is optional comparison material, and `conform/model/adapt/tooling` route preparation and semantic review. Speculative adoption or policy metadata belongs in research until tooling consumes it.
- Treat every declared upstream path as required and reject preparation when a glob matches no candidate files; correct the registry instead of silently broadening the review scope.
- Never promote research into final files automatically; final `src/`, `rules/`, `skills/`, docs, or `.rsp/specs/` changes use the normal RSP change and verification path.
