# RSP — Reliable Software Practice

English | [简体中文](./README.zh-CN.md)

**A repository-native engineering workflow for humans and AI agents.**

RSP helps turn unclear intent into shaped, implemented, reviewed, and verified software changes while keeping project knowledge durable and work recoverable. Its eleven composable Skills guide the engineering journey without introducing hidden workflow state or replacing the project's own files, tools, and authority.

The workflow rests on a lightweight artifact foundation of **Rules, Specs, and Plans**.

## What RSP helps you do

- Shape ambiguous work into one executable Change or a small set of independent slices.
- Resolve material design questions from repository evidence before implementation.
- Route unexplained failures to diagnosis, ordinary evidenced edits to implementation, and only explicit or concrete-risk test-first work to TDD.
- Review changes against explicit scope, address accepted findings, and rerun fresh verification.
- Preserve stable facts, scoped instructions, lasting rationale, and completed history in their proper owners.
- Prepare or reconcile release documentation for an explicit confirmed release operation; use a Release Change only when material coordination needs a persistent owner.

## How the workflow fits together

```text
intent
  → shape
  → design when needed
  → diagnose | TDD | implement
  → review → address accepted findings
  → release docs for an explicit confirmed operation
  → durable review → archive
```

RSP derives the next action from the selected Change, repository evidence, verification, and blockers. Each capability returns its result to the existing project or RSP owner. RSP does not infer permission to modify code, continue Git operations, commit, publish, deploy, or approve work.

## Quick start

```bash
npx -y @oevery/rsp@3.1.0-beta.3 init
npx -y @oevery/rsp@3.1.0-beta.3 doctor
```

Recommended bootstrap flow:

```bash
npx -y @oevery/rsp@3.1.0-beta.3 init --with-project-setup
# fill .rsp/changes/project-setup.md
# fill .rsp/specs/design.md
npx -y @oevery/rsp@3.1.0-beta.3 doctor
```

## Artifact foundation

`Reliable Software Practice` is the product promise; `Rules, Specs, Plans` describes the lightweight artifact model that makes the workflow repository-native:

- nearest `AGENTS.md` stores scoped project or module instructions.
- `rsp-rules.md` is the minimal tool-agnostic fallback protocol.
- `specs/` stores project-level source-of-truth docs.
- `changes/` stores open work in a single-file format.
- `focus.d/` mirrors current focused changes with empty marker files.
- `archives/` stores completed work.

```text
.rsp/
├── rsp-rules.md              # minimal fallback protocol
├── specs/
│   ├── 00-index.md           # auto-generated direct-child navigation
│   ├── design.md
│   ├── decisions/            # authoritative Decision Records by default; excluded from Specs indexes
│   └── <domain>/
│       ├── 00-index.md       # auto-generated direct-child navigation
│       └── <spec>.md
├── changes/
│   ├── <name>.md
│   └── <group>/
│       ├── 00-brief.md
│       └── <change>.md
├── focus.d/
│   └── <name>
└── archives/
    └── YYYY-MM-DD_<change>.md
```

## Concepts

- `specs/` describes durable project facts and current agreed design.
- Decision Records describe lasting rationale, alternatives, tradeoffs, and consequences for hard-to-reverse choices. They default to `.rsp/specs/decisions/` or use one configured external path.
- `changes/` captures open work, including features, fixes, refactors, docs, ops, and research.
- A change is always a single Markdown file with explicit sections for proposal, spec, design, tasks, verification, and blockers.
- Keep each Change as a current-plan and final-evidence snapshot: choose the smallest decisive verification, retain new tests only when they add lasting value, and keep temporary probes and execution chronology out of persistent artifacts. Persistent prose names the real domain, system, user, or operator; it mentions AI or agents only when they are actual product participants or constraints.
- An exact blocker line, `- requires \`<change-work-ref>\`: <reason>`, declares a dependency on another executable Change. Free-form blockers stay external; RSP never guesses edges from prose. Archived prerequisites resolve automatically.
- Change names are either flat (`<change>`) or one direct grouped child (`<group>/<change>`). Recursive work directories are rejected.
- A Change Group is optional and is the only composite work shape. Its non-executable, non-focusable logical identity `<group>/brief`, physically stored as `<group>/00-brief.md`, owns the shared goal, constraints, declared slices, completion conditions, durable outcomes, and blockers for at least two direct child Changes.
- Create a group before its children. Every grouped Change must be declared by the brief, is focused and archived independently, and includes the brief in its context. With no focus, `status` uses Brief declaration order and current blockers to recommend the first executable slice. `status`, `check`, and `doctor` derive group health and completion without persisting another state; `rsp group close` archives only a completed brief. Archived Group identities cannot be reopened.
- A Group Brief blocker is inherited by its direct children as an external blocker in the derived execution plan; it does not create guessed dependency edges.
- A Markdown file and directory cannot claim the same work identity.
- `rsp status`, `rsp check`, and `rsp doctor` inspect the same complete work tree and dependency facts. `status` derives exact edges with their reasons, ready work, blockers, and stable waves without a graph file; `check` and `doctor` reject incomplete archive inspection, malformed or missing targets, self-dependencies, and cycles. The `changes/` root must exist as a real directory, and existing focus/archive roots and group prefixes must also be real directories. Unsupported directories, non-Markdown entries, symlinks, missing or unreadable current work, incomplete reads, and identity collisions are visible errors. `status` exits non-zero instead of hiding invalid work.
- `rsp init`, `rsp update`, `rsp add spec`, and the generated Specs index builder apply the same no-follow managed-path checks. Archive discovery accepts only flat archive files or one real group directory; recursively organized Specs accept only real directories and regular files.
- Final managed files—such as the project `AGENTS.md`, focus markers, fallback/config files, the generated Specs index, and placeholders—must also be regular files; RSP rejects static symlink targets before reading or writing them.
- Completed changes move to `archives/`. Stable current facts belong in Specs; lasting rationale belongs in Decision Records; stable scoped operating instructions belong in nearest project-owned `AGENTS.md`.
- When later evidence shows that the original acceptance was not actually met, `rsp reopen <work-ref> --reason <text>` restores the same executable WorkRef as focused open work and retains the selected archive as history. Multiple archives require an exact `--from .rsp/archives/...` path. Use a new corrective Change for genuinely new scope or an independently delivered correction; reopening never rewrites Git or published history.
- Do not promote task history, debugging notes, or one-off implementation context into Specs, Decision Records, or project instructions.
- Change `Spec` delta markers (`### ADDED`, `### MODIFIED`, `### REMOVED`) are planning aids only. `rsp archive` does not automatically promote them into Specs or Decision Records. Durable writeback remains an explicit semantic decision.
- `rsp check` performs deterministic hygiene checks. It warns about unfinished template placeholders and unresolved clarification markers, but those warnings do not replace the semantic durable-update decision.

## File ownership

- `AGENTS.md`: only the `<!-- rsp:begin --> ... <!-- rsp:end -->` block is managed by RSP.
- `.rsp/specs/**/00-index.md`: fully generated direct-child navigation for the root and populated Spec directories. Reconcile all local indexes with `rsp update`; `rsp add spec` refreshes only the affected directory chain.
- `.rsp/specs/design.md`: created by `rsp init`, then owned by the project.
- `.rsp/specs/decisions/`: the default authoritative Decision Record directory; configure `decisions.path` only when the Host Project already owns one external ADR directory.
- `.rsp/rsp-rules.md`: generated minimal fallback protocol; use the `rsp` skill when available.
- Keep project-wide boundaries in `.rsp/specs/design.md`; use the nearest `00-index.md` to discover cohesive reusable facts in the smallest domain Spec.
- Treat every `00-index.md` as generated navigation, never as an editable current-fact or rationale owner. Each index lists only direct child Specs and populated child Spec directories; Decision Records are excluded.
- Keep stable scoped workflow and validation instructions in the nearest project-owned `AGENTS.md`, outside the managed RSP block.

## Decision Record path

The default authoritative directory is `.rsp/specs/decisions/`. If the Host Project already owns ADRs elsewhere, configure exactly one project-relative external path:

```yaml
decisions:
  path: docs/adr
```

The path cannot be absolute, escape the Host Project, or point at another `.rsp/` core location. `rsp init` and `rsp update` validate routing before managed writes and ensure the directory exists; `rsp show` and `rsp ready` refuse unsafe routing; `rsp doctor` validates directory readability and migration health. These commands never create a Decision Record. Switching to an external path does not migrate existing default records: `rsp doctor` reports inactive `.rsp/specs/decisions/*.md` files until they are moved or deliberately removed.

## AGENTS integration

Managed block example:

```md
<!-- rsp:begin -->
## RSP Entry

RSP tracks current work, stable specs, and archives under `.rsp/`.

Read in order:
1. Nearest `AGENTS.md` for project or module instructions.
2. Root `CONTEXT-MAP.md` if present, then the relevant nearest `CONTEXT.md`.
3. The `rsp` skill; if unavailable, read `.rsp/rsp-rules.md` as the fallback protocol.
4. `.rsp/focus.d/`; for grouped work read the sibling Group Brief, then the explicitly selected focused Change.
5. Only the relevant Specs and Decision Records under the configured authoritative path.

If `.rsp/focus.d/` is empty and the user has not provided a concrete task, ask what to work on or suggest `npx -y @oevery/rsp create <name>` for tracked work.
Do not treat `.rsp/specs/` or `.rsp/changes/` as replacements for nearest `AGENTS.md` or `CONTEXT.md`.
<!-- rsp:end -->
```

`rsp init --agents-mode <mode>`:

- `managed`: create `AGENTS.md` when needed and insert/update the managed block.
- `print`: initialize normally and also print the resulting `AGENTS.md` content.

## Skills

RSP publishes eleven default host-neutral lifecycle Skills for on-demand loading, plus one explicitly installed project-level audit Skill:

| Skill | Role |
|---|---|
| `rsp` | Derive the next action; guide setup, durable review, and archive decisions. |
| `rsp-shape` | Shape one executable Change or justified shallow Group without implementation. |
| `rsp-design` | Resolve one bounded domain, module/seam, or reversible-exploration question before or within tracked work. |
| `rsp-implement` | Implement one selected ready Change with fresh verification. |
| `rsp-diagnose` | Confirm a cause, or return a truthful unresolved diagnosis, before correction. |
| `rsp-tdd` | Drive one clear behavior through RED, GREEN, and safe REFACTOR. |
| `rsp-review` | Review a fixed code, document, or mixed comparison without mutation. |
| `rsp-resolve-findings` | Dispose fixed findings, correct accepted ones, verify, and request re-review. |
| `rsp-commit` | Create one authorized exact-scope local commit with a repository-consistent structured message. |
| `rsp-release-docs` | Draft, audit, finalize, or reconcile evidence-based release surfaces. |
| `rsp-manage` | Continue one explicitly requested or project-enabled eligible ready Change or shallow Group. |
| `rsp-structural-audit` (optional) | Audit one bounded repository or subtree for evidence-backed structural risks without mutation. |

Each lifecycle Skill returns to an existing project or RSP owner. Report-only Pre-Change Design and `rsp-structural-audit` may return one bounded result directly to the user without inventing an artifact owner. The suite adds no hidden workflow state or recursive Skill orchestration. No Skill infers commit, push, publication, deployment, approval, or human-acceptance authority.

Response language and artifact language are independent. Human-facing response headings, labels, explanations, and conclusions follow the requested response language, response-specific project instructions, then the conversation language. Authorized artifact prose follows the requested artifact language, artifact-specific project instructions, then the existing artifact language, and only then the conversation language. Canonical RSP artifact headings, WorkRef values, paths, commands, identifiers, and machine-consumed values remain unchanged; response labels may retain technical tokens in parentheses but never use them as untranslated labels.

Compose the suite from evidence: an explicit bounded question may enter report-only Pre-Change Design before Shape; otherwise Shape settles the executable owner and Tracked Design returns one material question to it. Core then chooses Diagnose, TDD, or Implement; Review stays report-only; Resolve Findings corrects accepted findings and requests re-review; Core performs the durable decision before archive. An explicit release operation with a confirmed identity or range may enter Release Docs without a Release Change; create one only for material decisions, coordination, recovery, blockers, or acceptance. Manage is optional: it accepts one selected ready Change or shallow Group that needs independent dispatch, long continuation, or recovery, while small or coupled work stays direct. Projects may keep explicit activation or let Core select eligible managed work automatically.

### Managed automation policy

Configure automatic selection and local closeout independently in `.rsp/config.yaml`:

```yaml
manage:
  activation: auto
  closeout: lifecycle
```

`activation` is `explicit` or `auto`. `auto` authorizes Core to select Manage for an eligible requested completion or continuation; it does not grant planning, product-mutation, lifecycle, Git, or external authority. `closeout` is one of:

- `manual`: neither archive nor commit is automatic.
- `lifecycle`: archive may follow durable review, but commit still needs separate authority.
- `local`: lifecycle closeout plus separately justified recovery checkpoints; after lifecycle closeout, a qualified clean verified terminal non-small boundary routes once to `rsp-commit`, while terminal small work stays uncommitted.

Change granularity follows one observable outcome and its shared acceptance, verification, review, archive, and rollback boundary; it does not prescribe Git commit count. Each `rsp-commit` invocation still creates exactly one local commit.

New `rsp init` config templates use the shown `auto` plus `lifecycle` policy. If `manage` is absent, RSP instead resolves `activation: explicit` and `closeout: local` for compatibility with the previous explicitly requested Manage behavior. Plain `rsp status` and the top-level `manage` object in `rsp status --json` show the resolved values. Nearest scoped restrictions and host enforcement can narrow the configured ceiling. RSP intentionally has no `full` preset: push, tag, publication, deployment, approval, and human acceptance remain explicit and external.

Humans should start with this README. Agents should follow the nearest `AGENTS.md`, prefer `skills/rsp/SKILL.md`, and use `.rsp/rsp-rules.md` only when the Skill is unavailable.

When this README shows `rsp <command>`, it assumes the command is already available in your environment. For opt-in beta evaluation, pin the exact prerelease identity, such as `npx -y @oevery/rsp@3.1.0-beta.3 <command>`; stable users can keep using the unversioned package entrypoint for npm `latest`.

Install the exact package's default lifecycle suite into the current project:

```bash
rsp skills install --dry-run
rsp skills install
```

On a dual TTY, `rsp skills` opens the interactive manager: the default suite is selected and locked, while optional project Skills can be selected before one confirmed atomic install. For scripts, redirected terminals, and CI, use the deterministic discovery and install commands:

```bash
rsp skills list
rsp skills list --json
```

The command preflights the eleven default package-owned targets, leaves unrelated `.agents/skills` entries (including optional Skills) untouched, and requires explicit `--force` before replacing a divergent selected directory. Install the optional project-level audit Skill by exact name:

When upgrading an installation that still contains `rsp-address-review` or `rsp-codebase-audit`, their replacements are `rsp-resolve-findings` and `rsp-structural-audit`. The installer stops without mutation until `--force` explicitly authorizes transactional removal of the obsolete package-owned directory; `--dry-run --force` previews both removal and installation.

```bash
rsp skills install rsp-structural-audit --dry-run
rsp skills install rsp-structural-audit
```

Both forms install from the package that invoked `rsp`, so prerelease dogfooding can pin one exact npm identity:

```bash
npx -y @oevery/rsp@3.1.0-beta.3 skills install --dry-run
npx -y @oevery/rsp@3.1.0-beta.3 skills install
```

Exact prerelease identities avoid depending on a moving dist-tag. `rsp update` refreshes RSP-managed project files only; run `rsp skills install` separately to refresh the package-owned Skill suite.

## Migrating from 2.x

Version 3 uses `.rsp/rsp-rules.md` as the only runtime fallback path and removes project rules from the RSP model:

See the [complete 3.0 migration guide](https://github.com/oevery/rsp/blob/v3.0.0/docs/migrations/3.0.md) for compatibility, recovery, and validation details.

1. Upgrade the RSP CLI.
2. Run `rsp update` to create the canonical fallback and remove the obsolete generated `.rsp/rules/rsp-rules.md`.
3. If `.rsp/rules/` remains, move only stable scoped instructions from its residual entries into the nearest project-owned `AGENTS.md`, then remove the obsolete entries.
4. Flatten any work path deeper than `.rsp/changes/<group>/<change>.md`, and resolve any `.rsp/changes/<name>.md` versus `.rsp/changes/<name>/` collision manually.
5. Run `rsp doctor` and resolve every remaining migration issue.

Repository maintainers can track external skill and workflow sources as offline review inputs. This tooling is intentionally excluded from the published package; see the [source-checkout maintainer guide](https://github.com/oevery/rsp/blob/main/docs/upstreams.md).

## Work Model

```text
open → archived
```

Directory roles are intentionally single-purpose:

- `changes/`: open changes
- `focus.d/`: currently focused changes
- `archives/`: completed history

Inside `open`, typical work includes:

- `create`: create and scope a change.
- `focus` / `unfocus`: decide which open change is currently foregrounded.
- Edit the change file directly — fill sections, mark tasks, write design decisions.
- Review whether durable updates are needed before archive.

During implementation, keep the change file and the actual work in sync: complete `## Tasks` checkboxes as code lands, update `## Verify` with the checks actually run, and revise `## Design` if implementation discoveries change the plan.

`archive` moves completed work into history. Archive never blocks — it warns but leaves the final decision to the agent or human.

Agents should treat only entries in `focus.d/` as current work. Unfocused files in `changes/` are still open, but should not be treated as the current target unless the user explicitly asks for them or they are re-focused.

Durable review makes two independent semantic choices: whether current facts or scoped instructions need an update, and whether lasting rationale needs a Decision Record. The RSP skill or a human reviewer owns both judgments.

`rsp ready` and `rsp show` expose deterministic readiness and semantic-review signals without turning deterministic success into an archive action. Deterministic readiness comes from checkboxes, blockers, and scenarios; Core or a human still owns the durable-update decision and the advisory archive recommendation.

`rsp ready --json` and `rsp show --json` include `durableReview.factDecisions`, `rationaleDecisions`, `factCandidateTargets`, and the one authoritative `decisionRecordsPath`. This is routing guidance only; RSP does not fabricate filenames or promote Change content automatically.

## Recommended workflow

New project:

1. `npx -y @oevery/rsp@3.1.0-beta.3 init`
2. Prefer `npx -y @oevery/rsp@3.1.0-beta.3 init --with-project-setup`, or run `rsp create project-setup` manually
3. Fill `.rsp/specs/design.md`
4. Use `rsp add spec <name>` only when a new durable project doc is needed
5. Keep lasting rationale in the configured Decision Record directory and stable scoped operating instructions in the nearest project-owned `AGENTS.md`
6. For tracked open work, start with `rsp create <name>`
7. If you want an existing open change to become current work, use `rsp focus <name>`
8. Use `rsp unfocus <name>` when you want to remove a change from the current focus set
9. Edit the change file directly to implement the work and mark tasks complete
10. Use the RSP skill or a human review to decide whether durable updates are needed
11. After Core recommends archive, run `rsp archive <name>` before final Git delivery; inspect the complete resulting worktree and obtain Git authority separately
12. If later evidence invalidates the original completion, run `rsp reopen <name> --reason <text>` and resolve the restored unfinished Task and Verify evidence under the same WorkRef

Existing project with a rich `AGENTS.md`:

1. `npx -y @oevery/rsp@3.1.0-beta.3 init`
2. Keep the managed block thin
3. Keep project-wide boundaries and navigation in `.rsp/specs/design.md`, and route cohesive durable facts to the smallest domain Spec
4. Use `rsp add spec <name>` only when another durable current-fact document is needed

AI-assisted setup:

1. `npx -y @oevery/rsp@3.1.0-beta.3 init --agents-mode print --with-project-setup`
2. Keep the managed block as generated and adapt only the surrounding human-owned content if needed
3. Have the AI review and fill `.rsp/changes/project-setup.md`
4. Have the AI fill `.rsp/specs/design.md`
5. Run `rsp doctor`

## CLI

```text
rsp init --agents-mode <mode>   Scaffold .rsp/ and ensure AGENTS.md contains the RSP entry block
rsp init --with-project-setup   Also create .rsp/changes/project-setup.md
rsp update                      Refresh managed project files, not packaged Skills
rsp ui [--lang auto|en|zh-CN]   Open the read-only interactive dashboard
rsp skills                      Open the interactive project Skill manager on a dual TTY
rsp skills list [--json]        List bundled Skills and exact project installation status
rsp skills install [name] [--dry-run] [--force]
                                  Install the default eleven Skills or one exact optional Skill into .agents/skills
rsp add spec <name>             Create .rsp/specs/<name>.md and rebuild specs index
rsp create <name> [summary]     Create .rsp/changes/<name>.md; add --lite for a shorter template
rsp group create <name> [goal] Create an unfocused .rsp/changes/<name>/00-brief.md
rsp group close <name>         Archive a completed Group Brief after every child is archived
rsp focus <name>                Mark an open change as currently focused
rsp unfocus <name>              Remove an open change from the current focus set
rsp archive <name>              Archive to .rsp/archives/
rsp archive --dry-run <name>    Deprecated compatibility route to rsp ready; never moves the change
rsp reopen <name> --reason <text> [--from <archive-path>]
                                  Restore the same WorkRef as focused open work and retain archive history
rsp ready <name> [--json [--compact]] [--verbose]
                                  Canonical read-only archive readiness projection
rsp show <name|--focused> [--json [--compact]] [--verbose]
                                  Show change context with readiness signals and context paths
rsp history [--limit <n>] [--since <date>] [--until <date>] [--kind <kind>] [--group <group>] [--search <text>] [--json [--compact]]
                                  List bounded archived Change summaries (default 20, maximum 100)
rsp history <work-ref> [--json [--compact]]
                                  Show bounded evidence detail for one exact archived Change
rsp status [--focused|--blocked|--stale <days>] [--json [--compact]] [--verbose]
                                  Show project status plus derived dependency plan with focus-aware filters
rsp check [--focused] [--json [--compact]] [--verbose]
                                  Validate change files and lightly lint template/scenario structure
rsp doctor [--fix] [--json [--compact]] [--verbose]
                                  Check setup health and common issues
```

Use `skills/rsp/SKILL.md` for operations. When the skill is unavailable, use `.rsp/rsp-rules.md` as the minimal fallback protocol.

On a real interactive terminal, bare `rsp` opens the same read-only dashboard as `rsp ui`. CI, pipes, redirected streams, and `TERM=dumb` stay on static command output; use `rsp status` for a human snapshot or `rsp status --json` for automation. The dashboard never creates, focuses, or archives work.

Dashboard keys: `Tab` cycles Changes/Groups/History, arrows or `j`/`k` move, `/` filters the active scope, `Enter` opens full-width detail, `r` refreshes the active scope, `?` shows help, and `q`, `Ctrl-C`, or top-level `Esc` exits. History is loaded only when first visited, uses the default bounded recent result, and loads one selected record's structured detail by its unique archive path only after `Enter`; use `rsp history` filters for older work. Set `RSP_UI_LANG=en|zh-CN` or pass `rsp ui --lang`; only dashboard-owned labels are localized. Existing CLI help, plain output, JSON, WorkRefs, paths, commands, Skills, and RSP artifacts remain English.

When there is no focused change, `rsp status` and `rsp show --focused --json` print `nextActions` instead of guessing which open change is current.

Human-readable `rsp status` renders its execution guidance as a dependency forest: each parent requires its children, shared prerequisites are referenced instead of expanded repeatedly, and `Next action` names the currently executable Change or Changes.

`rsp status --json` returns the same dependency graph under `plan.nodes`, `plan.ready`, `plan.edges`, `plan.blocked`, and `plan.waves`. Nodes distinguish filter-selected Changes from prerequisite context, while filtered plans retain the transitive prerequisite closure needed to explain the result. JSON stays flat rather than nesting children because prerequisites may be shared by multiple Changes. Each edge reads as “`change` requires `requires`”. These are derived navigation facts, not execution authority or persisted workflow state.

`rsp history` inspects authoritative archive files directly; no generated Archive Index is created or read. List results are ordered by archive date descending, WorkRef, then source path; inclusive date, exact kind, exact Group, and case-insensitive literal WorkRef/summary search filters are applied before the 1–100 record bound. Each record includes its project-relative archive path as a stable identity. `rsp history <work-ref>` returns bounded summary, scenario and checkbox counts, and bounded Tasks/Verify/Blockers evidence. It never returns raw Markdown; duplicate generations of one WorkRef fail with candidate archive paths instead of choosing implicitly. Unreadable, malformed, path-inconsistent, missing-root, or reserved executable Group Brief identities fail the complete query even when filters would exclude them. Archived Group Briefs are validated but are not list records. The command accepts at most one positional WorkRef. Diagnostics and ambiguous candidates are capped at 20 entries with total/returned/`hasMore` metadata, and human errors report how many entries were omitted. `status` archive trends and TUI History use the same validated inspection.

Examples:

```sh
rsp history --since 2026-07-01 --kind fix --limit 10 --json
rsp history --search migration --limit 10 --json
rsp history cli-machine-output/add-bounded-history-query --json --compact
```

The JSON-producing inspection commands `status`, `show`, `ready`, `check`, `doctor`, and `history` accept `--json --compact` for the same parsed value as `--json`, serialized on one LF-terminated line. `--compact` requires `--json`; other commands reject it before running command behavior.

`rsp create --lite` is a shorter template for explicitly tracked small changes; simple current-session tasks should not create RSP changes unless tracking is intentionally needed.

`rsp doctor --fix` runs only safe deterministic repairs. Its `fixed` JSON entries report actual filesystem changes; a healthy project returns `fixed: []` and the human output says no safe fixes are needed.

## Platform-agnostic

`.rsp/` is a plain file convention. It works with Kilo Code, Cursor, Claude Code, Cline, GitHub Copilot, or any assistant that reads project files. RSP 3.1 requires Node.js 22+; users upgrading from 3.0 must update Node before installing.
