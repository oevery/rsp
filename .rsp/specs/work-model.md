# Work model

## Purpose

Define work identity, durable artifacts, lifecycle, dependencies and the
conditions for knowledge writeback and archive.

## Current facts

### Identity and durable state

A WorkOwner is the selected Change or shallow Group. A WorkRef identifies one
executable Change by its logical name, `<change>` or `<group>/<change>`, resolving
to `.rsp/changes/<change>.md` or `.rsp/changes/<group>/<change>.md`. A Group
reference identifies its Brief and direct children, not an executable WorkRef.
Deeper identities are invalid.

A Change is one Markdown file with six sections:

| Section | Responsibility |
| --- | --- |
| Proposal | Outcome, scope and non-goals |
| Spec | Contract delta and acceptance, referencing existing authority |
| Design | Approach, boundaries and necessary tradeoffs |
| Tasks | Checkable work |
| Verify | Applicable results, evidence pointers and remaining limits |
| Blockers | Unresolved dependencies or decisions, or none |

A Change owns one outcome and its acceptance, verification, review, archive and
rollback boundary. RSP persists only `open` and `archived`, derived from Change
placement. Focus, readiness, blockers, routing and delivery status are not
additional lifecycle states. Git commit count does not select Change granularity.

### Groups, focus and prerequisites

- A Group has one `00-brief.md` and direct executable children. Its logical
  identity is `<group>/brief`. The Brief owns the shared goal, slices and
  completion conditions; it is not executable, focused or a duplicate child log.
  Children remain independently executable, verifiable, archivable and deliverable.
- A named `Integration:` completion condition owns the Group evidence boundary.
  Applicable integration evidence, not merely child passes, is required before
  completion. A request-only boundary must be written back before Group closeout.
- Focus marker paths form the FocusSet of open Change candidates. Optional
  Capsules carry bounded recovery snapshots, not ownership or authority. Multiple
  markers are valid; explicit user intent or WorkRef selects first, otherwise
  current status, dependencies and evidence resolve the next owner.
- Core replaces authorized Capsules at meaningful checkpoints, pauses or
  handoffs and revalidates them on recovery. Group recovery uses a selected
  child's Capsule, not a Brief marker; bounded direct work needs no new Capsule.
- Exact prerequisites use ``- requires `<work-ref>`: <reason>`` entries in a Change's
  Blockers. Other prose is not guessed into dependency edges. Dependency waves
  are derived, not a persisted schedule.
- Artifact order does not prescribe execution order. The
  [Workflow coordination contract](workflow.md#control-boundaries) owns conditional
  sequential or parallel work; Group shape alone does not dispatch workers.

### Evidence and closeout

Verification establishes the declared outcome's evidence; review supplies its
own bounded semantic judgment. Reuse and independent-execution obligations are
owned by [Workflow methods and evidence](workflow.md#methods-and-evidence), not a
separate evidence registry.

Before archive, establish verified outcome facts, distill useful Focus information,
write necessary stable knowledge to its owner, and converge the entire Change.
Then check the final document and knowledge owners, complete any required Review,
and obtain current readiness before authorized archive. These are dependency
constraints, not persisted stages or mandatory separate tool calls.

No useful knowledge delta requires no writeback; a stale authoritative contract
still requires correction. Whole-Change convergence retains the delivered delta,
actual knowledge-update references, important failure dispositions, evidence
boundaries and unresolved limits. It removes superseded plans, duplicate current
Specs, operation permissions, session chronology and response-only handoff blocks.
Detailed records and original verdicts stay with their evidence owner. A material
contradiction returns to its decision, implementation or verification owner rather
than being edited away.

Completed Tasks, applicable passing Required Verify, no active blockers, necessary
writeback and required review are archive preconditions. Optional omissions remain
explicit but do not block. CLI readiness is deterministic evidence, not semantic
acceptance. Archive preserves the final Change and clears its Focus; it never
promotes Spec deltas or Decision Records automatically.

For example, a Change with completed Tasks, passing Required Verify and no blockers
can still lack lifecycle authority. Report the established completion boundary and
leave it open; readiness alone permits neither archive nor clearing its Focus.
Any separately authorized Git delivery retains its own boundary.

## Boundaries

| Artifact | Owner of information |
| --- | --- |
| Specs | Current capabilities, collaboration contracts and necessary constraints |
| Decision Records | Significant choices, alternatives and consequences |
| Root/local CONTEXT | Domain vocabulary, relationships and navigation |
| Nearest project AGENTS | Scoped instructions and operating rules |
| Change/Group Brief | Selected work, its final outcome and evidence summary |
| Focus Capsule | Replaceable ongoing-work and recovery snapshot |
| Archives and reports | Historical outcome snapshots and detailed evidence |

README supplies introduction and usage. Placement follows meaning, not file shape;
short summaries and normative design references may link owners without duplicating
full definitions. The [Decision Record ownership decision](decisions/decision-record-ownership.md)
explains the separate rationale path.

Relevant legacy context remains usable until an authorized migration preserves
meaning, fixes active references and retires the old owner. Discovery or a successful
managed update alone does not authorize migration.

Lifecycle authority and Git authority are separate. Direct delivery and checkpoints
need no invented archive gate. One exact reviewed commit may include several real
WorkRefs without merging their lifecycles. Successful archive followed by failed
Git delivery remains archived but undelivered; failure grants no automatic reopen,
rollback, retry or history rewrite.

## Constraints

- Preserve single-file Changes, one shallow Group level and canonical sections.
- Keep the sole configured Decision Record path; switching it does not migrate
  or delete existing records automatically.
- Focus and artifact selection grant no product, lifecycle, Git or external authority.
- Keep host sessions, workers, worktrees, execution environments and integration
  outside RSP durable state.
- Persist no controller, session, run, receipt, event ledger or automatic promotion.
