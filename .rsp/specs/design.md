# Project Design: @oevery/rsp

## Purpose
- RSP is a lightweight workflow for AI-assisted software work.
- It separates durable project knowledge from open implementation work.
- It provides a platform-agnostic file convention that humans and different coding agents can read consistently.

## Stable Facts
- The npm package name is `@oevery/rsp`; it publishes a CLI binary named `rsp`.
- RSP stands for Rules, Specs, Plans.
- RSP uses `.rsp/` as the project-local workflow root.
- `.rsp/rsp-rules.md` is the minimal tool-agnostic fallback protocol for agents that cannot load the `rsp` skill.
- The `rsp` skill is the preferred detailed operational guide; the fallback protocol is deliberately not a second full manual.
- The nearest project-owned `AGENTS.md` owns stable scoped agent instructions; the RSP-managed block is navigation only.
- `specs/` stores durable project-level facts, boundaries, and constraints.
- Decision Records store lasting rationale, alternatives, tradeoffs, and consequences for hard-to-reverse choices; they do not duplicate current facts from Specs.
- `.rsp/specs/decisions/` is the default authoritative Decision Record directory. `decisions.path` may select exactly one project-relative external directory outside `.rsp/`.
- `changes/` stores open work.
- `focus.d/` is the only current-focus truth source.
- `archives/` stores completed change history.
- RSP has only two lifecycle states: `open` and `archived`.
- A change is `open` when it exists under `.rsp/changes/` and `archived` after it is moved under `.rsp/archives/`.
- Each open change is a single Markdown file; multi-file change bundles are outside the core model.
- WorkRef is the authoritative typed interpretation of open-work identity and path. It distinguishes a flat Change, a direct grouped Change, and the reserved Group Brief identity.
- Executable Change paths are exactly `.rsp/changes/<change>.md` and `.rsp/changes/<group>/<change>.md`; deeper work paths are rejected deterministically.
- A Change Group is the only composite work shape and is used only when at least two independently executable direct child Changes share one goal, shared constraints, or completion contract.
- Logical `<group>/brief`, physically stored as `.rsp/changes/<group>/00-brief.md`, is the non-executable, non-focusable semantic owner for Goal, Scope, Shared Constraints, Slices, Completion Conditions, Durable Outcomes, and Blockers. The prefixed physical name keeps required parent context first in directory listings without changing WorkRef identity. Every direct child must be declared with an identity and boundary; every declaration resolves to an open child or an archive entry whose Change heading preserves that identity.
- `rsp group create <group> [goal]` creates only the unfocused brief. Grouped child creation requires the sibling brief and a matching Slices declaration. Reading a grouped child places the brief first in its context paths.
- Group status, membership, blockers, completion, and close readiness are derived from the brief, open Changes, archive contents, and focus markers. Brief `Slices` order is navigation order only; with no focus, status recommends the first open unblocked slice from an unblocked Group without persisting dependencies or readiness. Children archive independently; `rsp group close <group>` moves only a completed brief to `.rsp/archives/<group>/YYYY-MM-DD_brief.md`. A closed Group identity cannot be reopened because archived child association would otherwise be ambiguous.
- A work identity cannot be claimed by both a Markdown file and a directory.
- One WorkRef tree inspection owns open-work discovery for `check`, `status`, and `doctor`; it reports unsupported directories, non-Markdown entries, symlinks, collisions, and incomplete reads consistently.
- `.rsp/changes/` must exist as a real directory rather than a file or symlink. Resolution and inspection fail closed before reading or mutating work through an invalid root or grouped path prefix; `rsp update` and `rsp doctor --fix` restore a missing root.
- Focus markers and archive destinations are derived from WorkRef and preflighted before mutation. Existing `focus.d/`, `archives/`, and direct group prefixes must be real directories rather than symlinks or other entry types.
- One managed-path module performs no-follow directory and file inspection, safe parent-chain resolution, and regular-file tree discovery for the RSP root and managed paths used by WorkRef, initialization, repair, Spec creation, and generated indexes. Archive discovery is bounded to flat files or one real group directory and is shared by doctor and archive-index generation; Specs remain recursively organized but symlinked entries are rejected.
- The same module validates final managed files before reads or writes. The project `AGENTS.md`, focus markers, fallback/config files, generated indexes, placeholders, and generated project files must be missing or regular files; static symlink targets fail before mutation. Initialization and update preflight `AGENTS.md` before other managed mutations.
- `rsp status` fails with visible structured diagnostics when the work tree is invalid, a focused Change is missing, or an open Change cannot be read or inspected.
- Every change file uses the fixed sections `Proposal`, `Spec`, `Design`, `Tasks`, `Verify`, and `Blockers`.
- A Change may declare an exact prerequisite only in `Blockers` as `- requires \`<change-work-ref>\`: <reason>`. The target is another executable flat or direct grouped Change; Group Briefs and deeper identities are not dependency targets. Other meaningful blocker prose remains an external blocker and never becomes an inferred edge.
- Open Change files and archived Change headings own dependency facts and completion evidence. The CLI derives active blockers, exact edges with their reasons, ready Changes, and stable topological waves without persisting a graph or delivery state. Archived prerequisites resolve automatically while incomplete archive inspection and malformed, missing, self-referential, or cyclic edges fail closed in status, check, doctor, and dependency-aware readiness; an invalid graph derives every open Change as actively blocked.
- Within one Group wave, CLI output preserves the Group Brief `Slices` declaration order; unrelated work uses stable lexical ordering.
- A meaningful Group Brief blocker is inherited by every direct child as a derived external blocker. It suppresses child readiness without becoming a dependency edge or duplicating blocker text into child files.
- Every change file must declare an explicit `kind` in frontmatter.
- CLI commands handle deterministic filesystem operations, structure checks, generated indexes, and warnings.
- Generated `INDEX.md` files use lightweight YAML frontmatter with `kind: generated-index` and an `index_type` value for machine-readable classification.
- Generated index builders avoid rewriting unchanged `INDEX.md` files.
- `rsp doctor` identifies generated indexes by frontmatter metadata instead of body footer text.
- `rsp doctor --fix` reports only actual filesystem changes in its `fixed` output; an empty `fixed` array means no safe repair changed files.
- `durableReview.factCandidateTargets` lists likely writable current-fact files, while `durableReview.decisionRecordsPath` reports the one authoritative rationale directory; generated indexes and bundled core rules remain excluded from ordinary project writeback targets.
- `rsp create --lite` is a short template for explicitly tracked small changes; simple current-session tasks should not create RSP changes unless tracking is intentionally needed.
- Semantic judgment, including durable writeback decisions, belongs to an RSP skill or a human reviewer.
- Durable review decides current-fact updates and Decision Record updates independently; archive never promotes Change content automatically.
- The published `skills/rsp`, `skills/rsp-shape`, `skills/rsp-implement`, and `skills/rsp-review` artifacts use the portable intersection of Agent Skills and active target-client validation: they omit optional `compatibility`, carry `license: MIT`, `metadata.author`, and independent quoted content CalVer values that change only for meaningful Skill-content releases rather than every CLI release.
- `skills/rsp-shape` is the canonical shaping capability. It inspects evidence before asking, uses an objective Shape Ready Gate, creates or refines only authorized Change artifacts, progressively loads complex multi-round, Group, and terminal-delivery guidance, preserves unresolved owner decisions, and never implements the shaped work.
- `skills/rsp-implement` is the canonical bounded implementation capability. It executes one selected, ready Change, uses normal bounded repository discovery to establish owners, preserves unrelated work, returns truthful Tasks and Blockers, and records fresh verification evidence without converting failed or unavailable checks into completion.
- `skills/rsp-review` is the canonical read-only review capability for Code, Document, and mixed scopes. It preserves separate pipeline verdicts, verifies that a seam-dependent Finding reaches its direct production caller, emits one deduplicated report, and cannot implement, commit, publish, or approve.
- The four Skills remain independently invocable and return results to existing project, Change, Spec, Decision Record, and archive owners. The minimum suite adds no manifest, runtime router overlay, hidden state, recursive Skill orchestration, or implicit Git and publication authority.
- Product distribution includes the fallback protocol and portable RSP Skills; host-specific slash-command prompts and metadata are outside the core package until a concrete host consumer requires a projection.
- The RSP-managed `AGENTS.md` block is a navigation entrypoint and must not become a durable rules or design store; project-owned sections outside it may hold stable scoped instructions.
- `.rsp/rsp-rules.md` is the only runtime fallback path; `rsp update` migrates the obsolete generated path and removes it.
- `.rsp/rules/` is not a durable authority. Any residual contents require explicit semantic migration to the nearest project-owned `AGENTS.md` before removal; empty directory trees may be pruned deterministically.
- External skill and workflow repositories can be declared by repository, ref, tier, treatment strategy, and relevant paths in `upstreams.yaml`, cached under ignored `.cache/upstreams/`, and pinned explicitly in a flat, timestamp-free `source: revision` lock mapping.
- Upstream synchronization records fetched commits in dedicated Git candidate refs; checkout `HEAD` is not candidate authority. Only the maintainer script's explicit `accept` action updates accepted revisions, and distillation into RSP-native skills remains a separate reviewed change.
- Upstream preparation writes regenerable mechanical evidence to ignored cache; tracked single-source distillation and cross-source synthesis live under `research/`, outside published and runtime RSP artifacts.
- Accepting any revision, including an initial baseline, means its matching source distillation is complete. Status derives research state, required-path coverage, and the next action from existing artifacts without adding lifecycle state.
- Mechanical patch evidence is streamed and byte-hashed. Direct adaptation records license and reuse constraints; research recommendations affect final RSP artifacts only through a normal RSP change with report, recommendation, and adoption provenance.
- The repository separates product runtime, product distribution, maintainer tooling, maintainer knowledge, verification, self-hosting protocol state, and transient/generated artifacts by directory ownership.
- Product runtime and published distribution artifacts do not depend on maintainer research, upstream caches, self-hosting `.rsp/` state, or repository-maintainer-only skills.
- RSP models coordination within one local Workspace; its largest work shape is a non-recursive Change Group containing direct child Changes. External repository or tracker references are ordinary Markdown and carry no protocol semantics.

## Boundaries
- In scope: initializing and repairing `.rsp/` structure for repositories.
- In scope: creating, focusing, unfocusing, checking, and archiving single-file changes.
- In scope: flat Changes and one shallow Change Group containing one Group Brief plus direct child Changes.
- In scope: maintaining generated spec and archive indexes.
- In scope: validating and routing one authoritative Decision Record directory without owning Decision Record filenames or content creation.
- In scope: distributing reusable RSP rules and skill guidance with the package.
- In scope: keeping RSP readable by humans, agents, CI, and simple scripts.
- Out of scope: replacing git history or project management systems.
- Out of scope: adding OpenSpec-style multi-file change artifacts.
- Out of scope: arbitrary nested work directories, attachments, persisted or general-purpose dependency graphs, dependency targets outside the local executable Change model, automatic scheduling, and persisted group readiness state.
- Out of scope: automatically merging change `Spec` deltas into durable specs during archive.
- Out of scope: automatically creating Decision Records, discovering multiple ADR roots, assigning numbering policy, or synchronizing rationale across paths.
- Out of scope: introducing workflow states that do not map to deterministic filesystem truth.
- Out of scope: becoming a plugin platform or schema-heavy workflow framework.
- Out of scope: binding the workflow to a single IDE, agent, or hosting platform.

## Structure
- `src/cli.ts` defines the CLI surface and command registration.
- `src/commands/` contains command implementations for RSP operations.
- `src/core/` contains shared filesystem, config, output, helper, and locking logic.
- `src/core/work-ref.ts` owns open-work classification, full-tree inspection, bounded path derivation, executable filtering, regular-file checks, and identity-collision checks.
- `src/core/change-group.ts` owns the Group Brief contract, declared membership, open/archive/focus projections, and derived close readiness; `src/commands/group.ts` owns explicit create and close mutations.
- `scripts/upstreams.mjs` is repository-maintainer tooling for upstream manifest validation, Git cache lifecycle, candidate comparison, and atomic lock serialization; it is not part of the published RSP CLI.
- `.agents/skills/distill-upstream/` is a repository-maintainer skill for semantic upstream research; it is not a published RSP product skill.
- `research/` contains tracked intermediate upstream distillations and models; it is not a product truth or runtime context source.
- Native Skill candidates start from one demonstrated RSP gap and a concise capability delta. Complete path inventories and cross-source models are optional audit evidence rather than candidate prerequisites.
- Draft Skill validation covers portable structure, hard authority/mutation/truthfulness boundaries, and a small unseen real-task holdout. Repeated provider matrices, cost calibration, and additional-host evidence are release-candidate gates; evaluation considers task success, corrections, total tokens, elapsed time, and tool calls rather than input-token overhead alone.
- `bin/rsp.mjs` is the executable entrypoint that loads the built CLI.
- `rules/rsp-rules.md` is the package-authored fallback source copied to consumer `.rsp/rsp-rules.md` during initialization or update.
- `skills/rsp/` contains operational workflow guidance; `skills/rsp-shape/` contains shaping and slicing; `skills/rsp-implement/` contains bounded implementation with fresh verification; and `skills/rsp-review/` contains read-only review. All four are canonical published Agent Skills.
- `docs/design-philosophy.md` records explanatory product and design rationale for maintainers.
- `test/` contains Vitest coverage for command behavior and core helpers.

## Repository Architecture

| Layer | Directories | Ownership |
| --- | --- | --- |
| Product runtime | `src/`, `bin/` | CLI, deterministic command behavior, domain interpretation, filesystem and diagnostic support |
| Product distribution | `rules/`, `skills/` | Bundled fallback protocol source and published Agent Skill |
| Maintainer tooling | `scripts/`, `.agents/skills/` | Repository-wide deterministic maintenance and maintainer-only judgment workflows |
| Maintainer knowledge | `docs/`, `research/` | Explanatory design material, pinned source distillations, cross-source models, and recommendations |
| Verification | `test/` | Observable behavior checks for product and maintainer tooling |
| Self-hosting protocol | `.rsp/` | Durable facts/rules, open work, focus, and archive history for developing this repository |
| Transient and generated | `.cache/`, `dist/`, dependency directories | Disposable upstream checkouts and evidence, build output, and installed dependencies |

Dependency direction is constrained:

- `bin/` loads the built product runtime; CLI registration delegates to commands, which use domain interpretation and core filesystem/output support.
- Product runtime must not import `research/`, `.cache/`, `.agents/skills/`, `.rsp/`, or repository-maintainer scripts.
- Published `rules/` and `skills/` must operate without a source checkout, research corpus, or upstream cache.
- Maintainer tooling may inspect product source and maintainer knowledge, but it enters product surfaces only through a selected normal RSP change.
- Research may cite product and prepared evidence, but it cannot promote recommendations or mutate product artifacts automatically.
- Self-hosting `.rsp/` files govern development of this repository and are not runtime configuration for consumer projects.
- Future controller plans, ledgers, summaries, and checkpoints must use ignored controller-owned storage outside `.rsp/`.
- New directories are created only for a selected capability with a distinct owner; upstream symmetry or speculative future use is insufficient.

## Constraints
- Runtime support requires Node.js 18 or newer.
- Prefer the smallest model that correctly solves the workflow problem.
- Preserve the single-file change model and fixed six-section change structure.
- Keep open work flat or at one direct group level; never interpret recursive directories as Change identity.
- Keep Group Briefs non-executable and non-focusable; group lifecycle commands operate on the aggregate while normal Change commands operate only on children.
- Do not reserve protocol entities, fields, resolvers, synchronization state, extension points, or lifecycle for recursive coordination, cross-repository dependencies, tracker integration, backlinks, or multi-workspace orchestration.
- Preserve `.rsp/focus.d/` as the only current-focus source.
- Preserve `open -> archived` as the complete lifecycle model.
- Do not promote task history, debugging notes, or one-off implementation context into `specs/` or project-owned `AGENTS.md` instructions.
- Do not create catch-all durable summary files when a fact belongs in `design.md`, a specific spec, a scoped project instruction, or nowhere.
- Keep cross-repository consistency higher priority than per-repository workflow freedom.
- Keep agent-distributed normative surfaces in English for cross-agent stability.
- Decision Record configuration accepts only the default `.rsp/specs/decisions` path or one project-relative path outside `.rsp/`; absolute paths, project traversal, other `.rsp/` core locations, and filesystem resolution outside the Host Project through symlinks are invalid.
- `rsp init` and `rsp update` ensure the authoritative Decision Record directory exists without creating a record; `rsp doctor` validates configuration and directory health.
- Decision Record routing and filesystem targets are preflighted before managed mutations and before `rsp show` or `rsp ready` emits routing guidance. When an external path becomes authoritative, `rsp doctor` reports unreadable or remaining Markdown records under the inactive default directory instead of migrating or deleting them automatically.
- Generated Specs indexes exclude the authoritative Decision Record subtree.
- Keep `.rsp/rsp-rules.md` as a minimal fallback protocol; keep the `rsp` skill as the preferred detailed operational layer when detail prevents agent hallucination or mistakes.
- Prefer README, design docs, durable specs, or CLI output for explanatory detail that does not prevent agent misoperation.
- Skill compactness must not remove guidance about change creation, durable writeback, archive readiness, generated/core files, or deterministic-vs-semantic boundaries.
- Prefer machine-readable output and diagnostics that reduce guessing without expanding workflow complexity.
- Never run code from cached upstream repositories during synchronization, and never overwrite a dirty managed cache.
- Treat `.cache/upstreams/` as disposable implementation state and `upstreams.yaml` plus `upstreams.lock` as the reproducible tracked state.
- Keep upstream registry fields operational: `core` is the default review tier, `reference` is optional comparison material, and `conform/model/adapt/tooling` route preparation and semantic review. Speculative adoption or policy metadata belongs in research until tooling consumes it.
- Treat every declared upstream path as required and reject preparation when a glob matches no candidate files; correct the registry instead of silently broadening the review scope.
- Never promote research into final files automatically; final `src/`, `rules/`, `skills/`, docs, or `.rsp/specs/` changes use the normal RSP change and verification path.
