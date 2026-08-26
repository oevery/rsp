# Core

## Purpose

Define RSP durable work identity, ownership, lifecycle, dependencies, focus, verification, archive, and durable-writeback boundaries.

## Current facts

- `.rsp/` is the repository-local RSP root. `specs/` stores current facts, `changes/` stores open work, `focus.d/` stores open-work candidates, `archives/` stores completed history, and the configured Decision Record path stores lasting rationale.
- A WorkOwner identifies one selected executable owner: an individual Change or a shallow Group.
- A WorkRef identifies one executable Change. It is either `.rsp/changes/<change>.md` or `.rsp/changes/<group>/<change>.md`; deeper identities are invalid. A Group reference identifies its Brief and direct child Changes; it is not a WorkRef.
- A Change is one Markdown document with `Proposal`, `Spec`, `Design`, `Tasks`, `Verify`, and `Blockers` sections. It owns one outcome, its acceptance, verification, review, archive, and rollback boundary.
- RSP persists only `open` and `archived` lifecycle states. Readiness, blockers, dependencies, focus, routing, and delivery status are derived from current artifacts and checkout evidence.
- A Group is a shallow coordination shape with one Brief and direct executable child Changes. Children remain independently executable, verifiable, archivable, and deliverable. Slice order is navigation order; Manage owns execution strategy.
- Group-level integration obligations belong to the Group Brief's `Completion Conditions`. A named `Integration:` condition is the durable integration boundary; fresh integration evidence is required before that condition is marked complete. A request-only boundary may guide an in-progress pass but must be written back before Group closeout.
- Change and Group do not define execution order. Manage derives sequential or parallel execution from dependencies, mutation boundaries, and verification resources.
- Focus markers form a FocusSet of open Change candidates. Multiple markers are valid. A marker identifies a candidate and optional bounded recovery guidance; it does not identify a session, worker, active run, unique owner, or authority.
- Explicit WorkRef, Group reference, and user intent select a WorkOwner first. Otherwise Core derives a candidate from current status, dependencies, readiness, and evidence. Focus selection never grants product, lifecycle, Git, publication, approval, or human-acceptance authority.
- Exact Change prerequisites are declared in `Blockers`. RSP derives dependency edges, blockers, ready work, and stable waves without persisting a schedule or dependency database.
- Verification owns decisive evidence for an outcome. Durable review separately decides current-fact updates, Decision Records, and archive readiness. Archive never promotes Change content automatically.
- Git commit count is independent from Change count. One reviewed local commit may integrate multiple existing WorkRefs when each has fresh evidence and the set forms one exact reviewed staged delivery boundary. Each WorkRef keeps its own lifecycle; included files need not overlap.
- Host sessions, workers, worktrees, branches, containers, provider handles, cancellation, isolation, and cross-checkout integration remain outside the RSP domain.

## Boundaries

- Core owns artifact identity, lifecycle derivation, dependency interpretation, focus candidates, and durable-writeback routing.
- Change and Group own planned work. Specs own current facts. Decision Records own lasting rationale. Archives own historical snapshots.
- Focus is selection input only. It is not a controller, lock, lease, scheduler, or execution record.
- Runtime observations and temporary continuation belong to the host or response unless an explicit durable artifact owner accepts them.

## Constraints

- Preserve one-file Changes, one shallow Group level, canonical sections, exact managed paths, and explicit lifecycle transitions.
- Keep current facts, planned work, rationale, evidence, and transient execution state in separate owners.
- Do not add sessions, runs, receipts, worker registries, event histories, persisted schedules, or automatic Spec or Decision Record promotion.
