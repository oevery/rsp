# Core Model

## Purpose
- Define RSP artifact ownership, WorkRef identity, lifecycle, dependencies, Groups, focus, and durable-writeback semantics.

## Stable Facts
- RSP uses `.rsp/` as the project-local workflow root. `specs/` owns durable current facts, `changes/` owns open work, `focus.d/` is the only current-focus truth source, and `archives/` owns completed Change history.
- The nearest project-owned `AGENTS.md` owns stable scoped instructions. Its RSP-managed block is navigation only. `.rsp/rsp-rules.md` is the minimal fallback when the preferred `rsp` Skill cannot be loaded.
- Decision Records own lasting rationale, alternatives, tradeoffs, and consequences without duplicating current Spec facts. `.rsp/specs/decisions/` is the default authoritative directory; `decisions.path` may select exactly one safe project-relative external directory outside `.rsp/`.
- RSP has only `open` and `archived` lifecycle states. A Change is current open work under `.rsp/changes/`; `.rsp/archives/` retains completed snapshots. Explicit reopen restores one archived executable Change under the same WorkRef without deleting its selected archive.
- Each executable Change is one Markdown file with canonical `Proposal`, `Spec`, `Design`, `Tasks`, `Verify`, and `Blockers` sections and one explicit `kind`. Multi-file Change bundles are outside the model.
- A Change owns one semantic outcome and its acceptance, verification, review, archive, and rollback boundary; it does not prescribe Git commit count. Git checkpoints and terminal commits are downstream delivery boundaries.
- WorkRef is the authoritative typed interpretation of work identity. Executable paths are exactly `.rsp/changes/<change>.md` and `.rsp/changes/<group>/<change>.md`; deeper work identities are invalid.
- A Change Group is the only composite shape. It is used only when at least two independently executable direct children share a goal, constraints, or completion contract.
- Logical `<group>/brief`, stored as `.rsp/changes/<group>/00-brief.md`, is non-executable and non-focusable. It owns Goal, Scope, Shared Constraints, declared Slices with boundaries, Completion Conditions, Durable Outcomes, and Group Blockers.
- `rsp group create` creates only an unfocused Brief. A grouped child requires the Brief and a matching Slices declaration; reading that child places its Brief first in context.
- Group membership, blockers, completion, and close readiness are derived from the Brief, open Changes, archive contents, and focus markers. Slices order is navigation order, not a dependency. Children archive independently; `rsp group close` moves only a completed Brief, and a closed Group identity cannot be reopened.
- A work identity cannot be both a Markdown file and directory.
- Exact Change prerequisites appear only in `Blockers` as `- requires \`<change-work-ref>\`: <reason>`. Targets are executable flat or direct grouped Changes. Group Briefs, deeper identities, and free-form prose are not dependency targets.
- Well-formed Markdown comments in `Blockers` are non-semantic; incomplete comments fail closed. A meaningful Group Brief blocker is inherited by all direct children as a derived external blocker, never as an inferred edge.
- Open Change files and archived headings own dependency and completion facts. RSP derives blockers, exact edges with reasons, ready Changes, and stable waves without persisting a graph, schedule, readiness, or delivery state. An open Change takes current-state precedence over same-WorkRef archive snapshots; only archive-only prerequisites resolve automatically. Invalid or incompletely inspected graphs block readiness.
- Within a Group wave, output follows Slices order; unrelated work uses stable lexical order.
- `.rsp/config.yaml` supports only `kinds`, `decisions`, and `manage`. `kinds` is an optional replacement allowlist; omission or an empty list retains built-in kinds. Malformed YAML, unsupported fields, invalid values, and unsafe Decision Record paths fail closed for ordinary commands and doctor.
- Managed automation has two independent project-policy axes. `manage.activation` is `explicit` or `auto`; `auto` allows Core to select qualified Manage for requested completion or continuation but grants no planning, product-mutation, lifecycle, Git, or external authority. `manage.closeout` is `manual`, `lifecycle`, or `local`: `manual` provides no automatic archive or commit, `lifecycle` permits archive after durable review but no commit, and `local` adds separately justified recovery checkpoints plus one deterministic terminal commit invocation for a clean verified non-small boundary after lifecycle closeout.
- Omitted Manage policy resolves to `activation: explicit` and `closeout: local`, preserving explicit-only routing and the prior explicitly requested Manage closeout capability. The resolved values are visible in plain and JSON `rsp status` without becoming controller state.
- A configured policy is a grant ceiling, not a general permission system. Nearest scoped restrictions and host enforcement may narrow it. No preset grants push, tag, publication, deployment, approval, human acceptance, or broader external action, and there is no `full` preset.
- Generated Change templates keep canonical English headings and machine values with language-neutral prose placeholders. Tasks contain executable outcomes. Verify names the cheapest decisive check, justified retained tests or an explicit not-applicable reason, manual/environment coverage, and omissions.
- An open Change is a convergent current-plan and final-evidence snapshot, not an execution diary. Before archive it retains completed outcomes, decisive verification, gaps, and unresolved risks, not superseded plans, temporary probes, command transcripts, test cycles, or correction chronology.
- `rsp create --lite` is for intentionally tracked small Changes. Simple current-session work does not require a synthetic Change.
- Semantic judgment belongs to a human or Skill. Durable review decides current-fact and Decision Record updates independently; archive never promotes Change content automatically.
- Implemented stable facts route to the smallest relevant Spec or explicitly authorized project context/instruction. Planned design remains in its Change, lasting rationale routes to one Decision Record, and temporary continuation remains response-only unless an exact path is authorized.
- Successful readiness inspection provides deterministic guidance, not archive approval. Core or a human owns the archive recommendation after durable review; lifecycle, Git delivery, publication, deployment, approval, and human acceptance remain separate authorities.
- Fresh evidence that the original acceptance was not met may justify explicit reopen under the same WorkRef. Reopen retains history and introduces unfinished Task and Verify evidence; genuinely new scope or an independently delivered correction uses a new Change. Archived dependents and closed Groups never reopen implicitly.
- RSP coordinates one local Workspace. External repository and tracker references are ordinary Markdown with no protocol semantics.

## Boundaries
- In scope:
  - Flat Changes, one shallow Group level, exact local Change dependencies, focus, archive, and durable-writeback ownership.
- Out of scope:
  - Recursive work trees, attachments, automatic scheduling, persisted dependency/readiness state, automatic Spec promotion, automatic Decision Record creation, multi-root rationale synchronization, and cross-workspace coordination semantics.

## Constraints
- Preserve one-file Changes, canonical sections, `.rsp/focus.d/` as sole focus truth, and `open` plus `archived` as the complete state set. Archive and reopen are explicit lifecycle transitions and never add persisted controller state.
- Never promote task history, debugging notes, or one-off implementation context into Specs or project instructions.
- Do not create catch-all durable summaries when a fact has a smaller owner or no durable value.
- Decision Record routing accepts only the default directory or one safe external project-relative path; commands preflight it before managed mutation or routing guidance and never migrate or delete records automatically.
