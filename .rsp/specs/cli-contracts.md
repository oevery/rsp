# CLI Contracts

## Purpose
- Define deterministic command, filesystem-safety, inspection, JSON, history, index, and repair behavior outside the interactive TUI.

## Stable Facts
- One WorkRef-tree inspection owns open-work discovery for `check`, `status`, and `doctor`; unsupported directories, non-Markdown entries, symlinks, file/directory collisions, and incomplete reads are reported consistently.
- `.rsp/changes/` and existing `focus.d/`, `archives/`, and direct Group prefixes must be real directories. Invalid roots and prefixes fail closed before reads or mutations; `rsp update` and `rsp doctor --fix` may restore a missing changes root.
- One managed-path module owns no-follow inspection, safe parent-chain resolution, and regular-file discovery for the RSP root, WorkRefs, initialization, repair, Spec creation, archive discovery, and generated indexes.
- Archive discovery accepts only flat files or one real Group directory. Specs may recurse through real directories and regular files; symlinked or special entries are invalid.
- Final managed files—including project `AGENTS.md`, focus markers, fallback/config, indexes, placeholders, and generated project files—must be missing or regular files. Initialization and update preflight `AGENTS.md` before other managed mutations.
- `rsp status` fails visibly when current work is invalid, a focus target is missing, or open work cannot be read. It derives exact dependency edges and reasons, minimal graph nodes, blockers, ready Changes, and stable waves from authoritative artifacts.
- Filtered status retains the selected Changes' transitive prerequisites and distinguishes selected nodes from prerequisite context. Plain output renders the same graph as a deterministic dependency forest; JSON remains the canonical flat projection.
- CLI commands own deterministic filesystem operations, structural checks, generated indexes, and warnings. Semantic durable-writeback decisions remain outside the CLI.
- `status`, `show`, `ready`, `check`, `doctor`, and `history` preserve pretty `--json` output and accept `--json --compact` for the same value on one LF-terminated line. `--compact` without `--json`, or on another command, fails before command behavior.
- `rsp history` is a bounded archive query independent from the current-work status snapshot. It reads the complete authoritative archive tree, validates identity and metadata fail closed, recognizes but omits Group Brief records, and orders Change records by archive date descending, WorkRef, then project-relative archive path.
- History requires a real archive root and rejects archived executable headings claiming reserved `brief` or `00-brief` identities. At most one positional history WorkRef is accepted, before archive inspection in every output mode.
- History lists default to 20 results and accept 1–100 after inclusive date, exact historical kind, and exact Group filters. Results expose matched/returned counts and `hasMore`; the first release has no cursor or offset.
- Exact history detail accepts a WorkRef or internal stable archive path. It returns bounded summary, scenario/checkbox counts, and bounded Tasks/Verify/Blockers evidence without raw Markdown. Duplicate generations of one WorkRef are ambiguous and return candidate paths.
- History diagnostics and ambiguous candidates are each capped at 20 with total, returned, and `hasMore`. Human errors use the same bound and omitted count; archive read failures remain diagnostics rather than duplicate runtime output.
- Generated `INDEX.md` files use YAML frontmatter with `kind: generated-index` and `index_type`. Builders do not rewrite unchanged indexes; doctor identifies them from metadata rather than body text.
- The generated Specs index excludes `design.md` and the authoritative Decision Record subtree.
- `rsp doctor --fix` reports only real filesystem mutations in `fixed`; an empty array means no safe repair changed files.
- `durableReview.factCandidateTargets` reports likely writable fact owners and `durableReview.decisionRecordsPath` reports the authoritative rationale directory. Generated indexes and bundled rules are excluded from ordinary writeback targets.
- `ready --json` and `show --json` expose deterministic readiness and semantic durable-review guidance without deriving archive actions.
- `.rsp/rsp-rules.md` is the only runtime fallback path. `rsp update` migrates and removes the obsolete generated `.rsp/rules/rsp-rules.md`; residual `.rsp/rules/` content is not authority and requires explicit semantic migration before removal.

## Boundaries
- In scope:
  - Command registration, deterministic inspection/mutation, filesystem safety, status/check/doctor projections, archive queries, and machine output.
- Out of scope:
  - Semantic completion judgment, hidden scheduling, automatic durable writeback, release authority, and interactive dashboard presentation.

## Constraints
- Plain and JSON projections must describe the same authoritative state and fail closed on incomplete inspection.
- Prefer stable machine-readable diagnostics that reduce guessing without adding workflow state or schema-heavy extension points.
- Managed paths are never followed through symlinks, and write preflight precedes partial mutation.
