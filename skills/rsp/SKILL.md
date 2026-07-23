---
name: rsp
description: Use this skill when initializing RSP, operating an existing .rsp project, auditing or repairing .rsp state, or deciding whether a change needs durable updates before archive.
license: MIT
metadata:
  author: oevery
  version: "2026.07.23.2"
---

# RSP Skill

Load this skill when you need to initialize RSP, operate `.rsp/`, audit or repair RSP state, or make a durable-update decision before archive.

This skill is the preferred operational guide. `.rsp/rsp-rules.md` is the only runtime fallback protocol when this skill is unavailable; old projects migrate to it with `rsp update`.

Prefer exact file paths, exact commands, and exact durable facts over vague summaries.

Choose response language and artifact language independently. Render human-facing response headings, field labels, explanations, and conclusions in the language explicitly requested for the response; otherwise follow response-specific project instructions, then the conversation language. Write artifact prose in the language explicitly requested for that artifact; otherwise follow artifact-specific project instructions, then the existing artifact's language, then the conversation language. Preserve canonical RSP artifact headings, keywords, identifiers, paths, commands, and machine-consumed values unchanged. Response-only Continuation and Durable Decision headings and labels are not canonical artifact headings and must be localized.

## When to use

- Use for RSP setup, repair, focused RSP work, and pre-archive durable decisions.
- Use when a user explicitly asks to adopt, inspect, or operate the RSP workflow.

## When not to use

- Do not load for general coding tasks unrelated to `.rsp/`.
- Do not load when the repository does not use RSP and the user did not ask to adopt it.
- Do not create an RSP change for a simple current-session task unless the user explicitly wants RSP tracking.
- Do not treat this skill or the fallback protocol as a replacement for nearest project `AGENTS.md` instructions or relevant module `CONTEXT.md`.

## Derive one next action

Before operating the workflow, derive the current stage from user intent, nearest project authority, `rsp status --json`, the selected Change's readiness, fresh verification evidence, and blockers. Stages are derived guidance, never persisted state.

### Route implementation evidence

When work has reached implementation, classify the decisive evidence before selecting a capability:

- **Diagnosis:** an observed failure is reproducible or materially evidenced, but its cause or owning layer remains unexplained. Conflicting, intermittent, or multi-layer symptoms also take this branch. Select `rsp-diagnose` only when it is available; otherwise use the manual diagnosis fallback: reproduce, locate, test the smallest discriminating hypothesis, and return the evidenced cause without speculative production edits.
- **TDD:** there is no unexplained failure, the required or corrected testable behavior is clear, and a focused failing test can demonstrate the missing behavior for the expected reason before production mutation. Select `rsp-tdd` only when it is available; otherwise use the manual TDD fallback: observe the focused RED, make the minimum GREEN change, optionally REFACTOR while green, then rerun required checks.
- **Ordinary implementation:** the cause and required change are already evidenced, and no new test-first cycle is required by the Change, project instructions, or the changed risk. Continue with ordinary `rsp-implement` when available, or the single manual implementation/verification action when it is not.

Diagnosis takes precedence over TDD: do not encode an unexplained symptom as a guessed regression test. Each branch returns its evidence, Tasks, Verify updates, and unresolved Blockers to the same selected Change. Capability availability changes execution assistance, not the owner or required outcome.

### Route release documentation

Use the release-documentation branch only when the selected Change explicitly owns a confirmed release identity or range and still has unfinished changelog, release-note, or migration work. Lifecycle stage, completed implementation, or archive readiness alone is insufficient; ordinary Changes continue to the Core durable decision.

When both conditions hold, select `rsp-release-docs` when available. Otherwise use the manual release-documentation fallback against the same Change: confirm the release range and audience, build one net-release evidence ledger, and project it into the repository-owned changelog, release notes, and applicable migration guidance. This route prepares or audits documentation only; it does not grant commit, tag, push, release creation, publication, deployment, or approval authority.

Apply these gates in order:

1. If authority, selection, or a material owner decision is ambiguous, return the one decision or evidence needed to proceed. If a declared blocker prevents the next operation, return its owning artifact or person; do not route around it.
2. If the user requests a report-only review against a fixed scope, select `rsp-review` only when it is available; otherwise name the manual read-only review and return its findings to the selected Change's Tasks, Verify, or Blockers.
3. If no Change is selected, use the status plan to name one ready WorkRef and the direct focus action. For tiny settled work, return the direct engineering action without creating RSP state. For unclear non-trivial work, select `rsp-shape` only when it is available and the user authorized its Change mutation; otherwise give the manual fallback of creating or refining one Change.
4. If the user or Shape has isolated one material domain, module/seam, or evidence-seeking design question for the selected Change, select `rsp-design` when available; otherwise return the compact manual design fallback: inspect project authority and the live path, compare credible alternatives, separate evidence from owner choice, and return the result to the same WorkRef without implementation or durable-truth mutation.
5. If the selected Change is not shape-ready and no bounded design question has been isolated, select `rsp-shape` under the same authority rule or give the manual fallback of completing its Proposal, Spec, Design, Tasks, Verify, and Blockers.
6. If a shape-ready Change has incomplete implementation tasks, or its required verification is missing, stale, or failed, apply the implementation-evidence routing above. Select only its resulting available capability when authorized; otherwise name its manual fallback owned by that Change.
7. If implementation Tasks and required verification pass with no blocker, and the selected Change meets both release-documentation conditions above, select `rsp-release-docs` under the same availability rule or use its manual fallback. Return its evidence and artifact dispositions to the same Change.
8. Otherwise, when required Tasks and verification pass with no blocker, perform the Core durable decision. Archive only after required current facts and rationale are written or explicitly judged unnecessary. Recommend explicit archive as the next action before final Git delivery; Core does not execute archive or grant authority to stage, commit, push, or publish.

State the derived stage, one next action, required input, returned owner, and decisive evidence. Name at most one available optional capability. Only name an optional capability when it is the one next action, and treat it as available only when it appears in the host's loaded skill inventory. Missing optional capabilities never invalidate RSP; always provide the manual fallback against the same owner.

Do not preload, enumerate, or recursively invoke optional capabilities. Do not infer implementation, review, Git, publication, or approval authority from routing, readiness, or capability availability.

## Workflows

### Setup or repair

1. Initialize with `npx -y @oevery/rsp init [--agents-mode managed|print] [--with-project-setup]`.
2. `--with-project-setup` creates and focuses `changes/project-setup.md`; otherwise create it with `npx -y @oevery/rsp create project-setup` only when explicit bootstrap tracking is still needed.
3. Fill the bootstrap change if it exists, write durable architecture facts to `.rsp/specs/design.md`, and keep stable scoped operating instructions in the nearest project-owned `AGENTS.md`.
4. For diagnostics, run `npx -y @oevery/rsp doctor`.
5. For safe deterministic repairs, run `npx -y @oevery/rsp doctor --fix` or `npx -y @oevery/rsp update`.
6. When auditing manually, verify `.rsp/`, managed roots, and nested Spec parents are real directories; the project `AGENTS.md`, managed markers, fallback/config files, indexes, and placeholders are regular files; `AGENTS.md` has the managed block; `specs/design.md` and the configured Decision Record directory exist; every group has one valid brief with matching direct children; work and archive trees are flat or one group level; and `focus.d/` markers match executable Changes.
7. Treat `doctor --fix` `fixed` entries as actual filesystem changes. An empty `fixed` array or `No safe fixes needed.` means the repair pass changed nothing.
8. Do not use repair commands for semantic decisions such as stale focus removal, durable updates, or archive readiness.

### Focused work

1. Follow the managed `AGENTS.md` read order: nearest instructions, relevant context, this skill or fallback protocol, focus, optional sibling Group Brief, selected Change, then relevant Specs and Decision Records.
2. Treat only `focus.d/` markers as current RSP work; do not treat unfocused files in `changes/` as current work unless the user explicitly asks or you run `npx -y @oevery/rsp focus <name>`.
3. Resolve executable Change names as either `<change>` or one direct `<group>/<change>` child. Require a real `changes/` root and real existing `focus.d/`, `archives/`, and group prefixes; reject symlinks, incomplete inspection, deeper paths, and file/directory identity collisions.
4. Use a Change Group only for at least two independently executable Changes sharing one goal or completion contract. Create it with `npx -y @oevery/rsp group create <group> [goal]`, then replace the brief placeholders and declare every direct child identity and boundary under `Slices` before creating children.
5. Treat logical `<group>/brief`, physically stored as `<group>/00-brief.md`, as non-executable and non-focusable. For grouped work, read it before the selected child Change. Its `Slices` declaration order guides navigation; a Brief blocker is inherited as an external blocker by every direct child without creating edges. Archive children independently, then close only the brief with `npx -y @oevery/rsp group close <group>` when all group gates pass.
6. Declare an exact prerequisite only as `- requires \`<change-work-ref>\`: <reason>` under the dependent Change's `Blockers`. Targets must be executable Changes, not Group Briefs. Keep external blockers as ordinary prose and never infer an edge from them.
7. Use `npx -y @oevery/rsp status --json` as the derived dependency view. Read `plan.nodes`, `plan.ready`, `plan.edges`, `plan.blocked`, and `plan.waves`; nodes distinguish selected Changes from prerequisite context, and each edge reads as “`change` requires `requires`” with `reason` and `state`. Filtered plans retain the transitive prerequisite closure needed to explain the selection. Human status renders the same flat graph as a dependency forest; do not infer nested JSON ownership from that presentation. Do not create or maintain a separate graph or copy live delivery state into a Group Brief. Archived prerequisites resolve without rewriting the dependent Change, while incomplete archive inspection produces no ready plan.
8. Read the focused change before editing code.
9. If a focused change is missing an explicit `kind`, repair the frontmatter before continuing.
10. Run `npx -y @oevery/rsp check --focused` before treating focused work as ready; resolve dependency errors, placeholders, or clarification warnings when they represent real unfinished content.
11. Treat `rsp check` warnings as deterministic hygiene signals, not as the durable-update decision.
12. Use `npx -y @oevery/rsp create <name> --lite` only when the user explicitly wants RSP tracking for a small, straightforward change.
13. Convert actionable `## Tasks` checkboxes into your agent-local task tracker when one is available.
14. Keep implementation sequential by default; parallelize only independent read-only discovery or mechanical checks.
15. Update `## Tasks`, `## Verify`, and any invalidated `## Proposal`, `## Spec`, or `## Design` content in the same working session as implementation facts change.
16. Keep temporary debugging notes, task history, and command transcripts out of `specs/` and project-owned `AGENTS.md` instructions.

### Route artifacts by owner

Use one semantic routing matrix throughout shaping, execution, and pre-archive review:

| Content | Owner | Boundary |
| --- | --- | --- |
| Planned future design | selected Change `## Design` | Never write planned state as current truth. |
| Implemented stable current facts | smallest relevant Spec, usually `.rsp/specs/design.md` or an existing domain Spec | Write only observed stable facts under authority. |
| Lasting rationale and tradeoffs | one exact file under `durableReview.decisionRecordsPath` | Judge independently from current facts; do not duplicate them. |
| Stable scoped navigation or current context | project-owned `CONTEXT.md`, when that convention exists | Preserve project ownership and edit only with explicit authority. |
| Stable operating instructions | nearest project-owned `AGENTS.md` outside the managed RSP block | Preserve project ownership and edit only with explicit authority. |
| Temporary execution state | response continuation | Not durable truth; write a file only when explicitly authorized. |

When accepted work remains, return this compact artifact-scoped continuation in the response:

```md
## <localized RSP Continuation heading>
- <localized WorkRef label>: <selected Change>
- <localized Authority label>: <project, Change, Spec, decision, or report pointers>
- <localized Current state label>: <completed, partial, failed, unavailable, or blocked plus decisive state>
- <localized Changed artifacts label>: <paths or none>
- <localized Fresh verification label>: <command and result, or pending reason>
- <localized Blockers label>: <exact blocker and owner, or none>
- <localized Next action label>: <smallest bounded action and owner>
```

Treat this continuation shape as semantic field order rather than fixed English wording. Localize its human-facing title and labels to the response language while preserving WorkRefs, paths, commands, identifiers, and machine-consumed values. A localized label may retain a technical token in parentheses but must not use that English token alone; for example, use `工作引用（WorkRef）` in a Chinese response. Do not use the response language to rewrite referenced project artifact prose.

The continuation points to existing owners; it is not a second state store. On resume, reopen every authority pointer, inspect worktree and artifact drift, and refresh any verification supporting the next action. Never create hidden handoff/controller state or persist the continuation without explicit path authority.

### Handle an active Git conflict

When a merge, rebase, or cherry-pick conflict intersects authorized implementation:

1. Inspect the exact Git operation, conflicted paths, current index/worktree, and pre-existing user changes.
2. Interpret base, ours, and theirs in that operation; trace the relevant behavior and authority instead of choosing a side mechanically.
3. Resolve only evidenced content inside the WorkRef and mutation authority. Preserve unrelated work and do not stage the resolution unless separately authorized.
4. Stop when the conflict includes unrelated user work, an unresolved product decision, incomplete side/base evidence, or out-of-scope content. Return the exact conflict and required owner input in the continuation.
5. After an authorized working-tree resolution, rerun affected checks and return their fresh result.

Do not continue or abort the Git operation, commit, push, or infer Git delivery authority from implementation or conflict-resolution authority. RSP does not need a separate merge-conflict Skill for this fallback.

### Pre-archive durable decision

1. Run `npx -y @oevery/rsp check --focused` for focused work, or `npx -y @oevery/rsp check` when reviewing all open changes.
2. Run `npx -y @oevery/rsp show --focused --json` or `npx -y @oevery/rsp ready <name> --json` to collect readiness, warnings, context paths, and `durableReview` guidance.
3. Treat `durableReview.factCandidateTargets` and `durableReview.decisionRecordsPath` as advisory routing context, not as permission to edit generated indexes or invent a Decision Record filename.
4. Treat `Spec` delta markers (`### ADDED`, `### MODIFIED`, `### REMOVED`) as planning aids only; do not merge them automatically.
5. Read only the current Change, relevant Specs and Decision Records, nearest project-owned `AGENTS.md`, and code files needed for the semantic decision.
6. Produce the durable decision output before archiving.

## Durable decision

Choose one current-fact decision and one rationale decision independently.

Current facts:

- `No current-fact update needed`
- `Update existing spec or scoped instruction`
- `Create a new durable spec` only when the knowledge is project-level, reusable, and does not fit `specs/design.md`, an existing spec, or a scoped project instruction

Rationale:

- `No Decision Record needed`
- `Create or update a Decision Record`

Prefer no update on either axis when there is no concrete stable fact or lasting rationale worth rereading.

Write a durable update only when one of these is true:

- the change altered stable system behavior
- the change changed a project boundary, default, or constraint
- future agents or developers would likely make mistakes without the fact
- the fact is worth rereading in later sessions as durable project knowledge

Create or update a Decision Record only when the choice is hard to reverse, would be surprising without context, and reflects a real tradeoff. Decision Records own rationale, alternatives, tradeoffs, and consequences; Specs own what is currently true.

Apply the artifact-routing matrix and choose the smallest correct target:

- project-wide design, boundaries, defaults, and durable context -> `.rsp/specs/design.md`
- stable project or module operating instructions -> nearest project-owned `AGENTS.md`, only with authority to edit its non-managed content
- stable navigation or scoped current context -> project-owned `CONTEXT.md`, only when the project uses it and authority permits the edit
- an additional reusable project-level spec -> `.rsp/specs/<name>.md`
- lasting rationale -> one exact Markdown file under `durableReview.decisionRecordsPath`

Do not choose generated indexes, `.rsp/rsp-rules.md`, or the managed RSP block in `AGENTS.md` as ordinary durable writeback targets.

Prefer `.rsp/specs/design.md` or an existing durable file before creating a new spec file.

Write stable facts or lasting rationale, not narrative history, task-by-task notes, temporary debugging history, or archive-only detail. Do not duplicate current facts into a Decision Record or rationale into a Spec. If you cannot identify concrete durable content, do not invent it.

## Output template

Use these semantic fields in this exact order. Localize the heading and human-facing labels to the response language; preserve the decision values shown in angle brackets as canonical values.

```md
## <localized Durable Decision heading>
- <localized Current facts label>: <No current-fact update needed | Update existing spec or scoped instruction | Create a new durable spec>
- <localized Current-fact target label>: <exact file path or N/A>
- <localized Facts to write label>:
  - <durable fact or none>
- <localized Decision Record label>: <No Decision Record needed | Create or update a Decision Record>
- <localized Decision Record target label>: <exact file path or N/A>
- <localized Rationale to write label>:
  - <lasting rationale or none>
- <localized Archive ready label>: <yes | no>
```

These are response labels, not canonical RSP artifact headings. A localized label may retain its technical field identity in parentheses; for example, a Chinese response may use `## 持久化决策`, `决策记录（Decision Record）`, and `可归档（Archive ready）`, but not their English labels alone.

Rules for the output:

- Each target must be an exact file path when its decision requires an update; `durableReview.decisionRecordsPath` is a directory, not the final target.
- `Facts to write` must contain durable facts, not task history or debugging notes.
- `Rationale to write` must contain lasting rationale, alternatives, tradeoffs, or consequences, not a duplicate of current facts.
- If real blockers remain or a required fact or rationale update is not yet written, `Archive ready` must be `no`.
- If neither axis has a missing update and remaining verify risk is consciously accepted, `Archive ready` may be `yes`.
- Do not use CLI warning text as a substitute for semantic durable-update judgment.
- CLI `archiveReady: judgment` means the skill or a human must decide; it is not automatic approval.
