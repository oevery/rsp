# Core

## Purpose

Define RSP durable work identity, ownership, lifecycle, dependencies, focus, verification, archive, and durable-writeback boundaries.

## Current facts

### Identity and durable state

- `.rsp/` is the repository-local RSP root. `specs/` stores current facts, `changes/` stores open work, `focus.d/` stores open-work candidates, `archives/` stores completed history, and the configured Decision Record path stores lasting rationale.
- A WorkOwner identifies one selected executable owner: an individual Change or a shallow Group.
- A WorkRef identifies one executable Change. It is either `.rsp/changes/<change>.md` or `.rsp/changes/<group>/<change>.md`; deeper identities are invalid. A Group reference identifies its Brief and direct child Changes; it is not a WorkRef.
- A Change is one Markdown document with `Proposal`, `Spec`, `Design`, `Tasks`, `Verify`, and `Blockers` sections. It owns one outcome, its acceptance, verification, review, archive, and rollback boundary.
- RSP persists only `open` and `archived` lifecycle states. Readiness, blockers, dependencies, focus, routing, and delivery status are derived from current artifacts and checkout evidence.

### Groups, focus and prerequisites
- A Group is a shallow coordination shape with one Brief and direct executable child Changes. Children remain independently executable, verifiable, archivable, and deliverable. Slice order is navigation order; Core's qualified conditional coordination branch owns execution strategy.
- Group-level integration obligations belong to the Group Brief's `Completion Conditions`. A named `Integration:` condition is the durable integration boundary; fresh integration evidence is required before that condition is marked complete. A request-only boundary may guide an in-progress pass but must be written back before Group closeout.
- Change and Group do not define execution order. Core derives sequential or parallel execution within its selected coordination branch from dependencies, mutation boundaries, verification resources, and observed host capability.
- Focus markers form a FocusSet of open Change candidates. Multiple markers are valid. Their paths identify candidates; optional Capsules hold bounded ongoing-work/recovery snapshots, not sessions, workers, an active run, unique ownership or authority.
- Explicit WorkRef, Group reference, and user intent select a WorkOwner first. Otherwise Core derives a candidate from current status, dependencies, readiness, and evidence. Focus selection never grants product, lifecycle, Git, publication, approval, or human-acceptance authority.
- Exact Change prerequisites are declared in `Blockers`. RSP derives dependency edges, blockers, ready work, and stable waves without persisting a schedule or dependency database.

### Evidence and closeout
- Verification owns decisive evidence for an outcome. Durable review separately decides current-fact updates, Decision Records, and archive readiness. Archive never promotes Change content automatically.
- Core retains objective and acceptance across a permitted same-owner method change. A diagnostic recommendation or command result does not change ownership, authority or required evidence; the [Design boundary](design.md#agent-and-tool-boundary) governs effect-aware recovery.
- Core replaces permitted Focus snapshots at meaningful checkpoints, pauses or handoffs. Recovery notes summarize current progress, evidence status/pointers and next action; they are revalidated before use. Short direct tasks need no new Change or Capsule, and Group work uses a selected child WorkRef's Capsule.
- Closeout verifies outcome facts, distills Focus and updates knowledge as needed, then converges the entire Change before final consistency checks and authorized archive. These are dependency constraints, not persisted phases or separate mandatory tool calls. No useful writeback means no edit; an authoritative contract left stale by delivered behavior requires correction. Final whole-Change convergence applies after necessary writeback, even without useful Focus additions. It reconciles all six sections, retaining the delivered delta, knowledge-update references, material failures, limits and evidence rather than duplicated current specifications, operation permissions, session chronology or response-only handoff blocks. Substantive contradictions return to the responsible decision, implementation or verification owner, not prose cleanup. Group integration conclusions remain in its Brief. Detailed evidence and original verdicts remain with their existing owner.
- Fresh applicable verification, required review and readiness precede authorized archive, which preserves Change and clears its Focus. No unresolved Required failure or copied chronology is made acceptable by a Capsule or CLI result. Explicit commit authority alone grants no archive; direct delivery and checkpoints retain their own boundaries.
- Git commit count is independent from Change count. One reviewed local commit may integrate multiple existing WorkRefs when each has fresh evidence and the set forms one exact reviewed staged delivery boundary. Each WorkRef keeps its own lifecycle; included files need not overlap.
- Host sessions, workers, worktrees, branches, containers, provider handles, cancellation, isolation, and cross-checkout integration remain outside the RSP domain.

## Boundaries

- Core owns artifact identity, lifecycle derivation, dependency interpretation, focus candidates, and durable-writeback routing.
- Change and Group own planned work. Specs own current capability and collaboration contracts, responsibility boundaries, and necessary constraints. Decision Records own lasting rationale. Archives own historical snapshots, not current authority.
- Root and local CONTEXT.md files share vocabulary, domain-relationship, and navigation ownership; AGENTS.md owns scoped operating rules and README owns introduction and usage. Legacy context maps require owner-authorized semantic migration, never automatic deletion.
- Before migration, relevant legacy context remains discoverable and usable; conflicts block only dependent work. Retirement requires preserved meaning, updated active references, and explicit authority, not merely a successful managed update.
- Artifact placement follows responsibility, not presentation. Normative design references belong in Specs; short summaries and links may cross owners without duplicating full definitions. Spec/code disagreements require resolution rather than automatic promotion of observed implementation.
- Focus paths are selection input; Capsule content is a replaceable working snapshot, never a controller, lock, lease, scheduler, execution ledger or acceptance source.
- Detailed execution observations remain with their host/evidence owner. Focus carries recovery context, Change carries final conclusions, and knowledge documents carry stable facts; none duplicates a runtime ledger.
- A successful archive followed by failed local delivery remains archived but undelivered. Git failure does not automatically reopen the Change, undo lifecycle actions or grant a retry or history rewrite.

## Constraints

- Preserve one-file Changes, one shallow Group level, canonical sections, exact managed paths, and explicit lifecycle transitions.
- Keep current facts, planned work, rationale, evidence, and transient execution state in separate owners.
- Do not add sessions, runs, receipts, worker registries, event histories, persisted schedules, or automatic Spec or Decision Record promotion.
