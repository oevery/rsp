# RSP: Rules, Specs, Plans

English | [简体中文](./README.zh-CN.md)

RSP = **Rules, Specs, Plans**. A lightweight project protocol for AI-assisted development, durable knowledge, and single-file change tracking.

## Quick start

```bash
npx -y @oevery/rsp init
npx -y @oevery/rsp doctor
```

Recommended bootstrap flow:

```bash
npx -y @oevery/rsp init --with-project-setup
# fill .rsp/changes/project-setup.md
# fill .rsp/specs/design.md
npx -y @oevery/rsp doctor
```

## Core idea

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
│   ├── INDEX.md              # auto-generated
│   ├── design.md
│   └── decisions/            # authoritative Decision Records by default
├── changes/
│   ├── <name>.md
│   └── <group>/
│       ├── 00-brief.md
│       └── <change>.md
├── focus.d/
│   └── <name>
└── archives/
    └── INDEX.md              # auto-generated
```

## Concepts

- `specs/` describes durable project facts and current agreed design.
- Decision Records describe lasting rationale, alternatives, tradeoffs, and consequences for hard-to-reverse choices. They default to `.rsp/specs/decisions/` or use one configured external path.
- `changes/` captures open work, including features, fixes, refactors, docs, ops, and research.
- A change is always a single Markdown file with explicit sections for proposal, spec, design, tasks, verification, and blockers.
- An exact blocker line, `- requires \`<change-work-ref>\`: <reason>`, declares a dependency on another executable Change. Free-form blockers stay external; RSP never guesses edges from prose. Archived prerequisites resolve automatically.
- Change names are either flat (`<change>`) or one direct grouped child (`<group>/<change>`). Recursive work directories are rejected.
- A Change Group is optional and is the only composite work shape. Its non-executable, non-focusable logical identity `<group>/brief`, physically stored as `<group>/00-brief.md`, owns the shared goal, constraints, declared slices, completion conditions, durable outcomes, and blockers for at least two direct child Changes.
- Create a group before its children. Every grouped Change must be declared by the brief, is focused and archived independently, and includes the brief in its context. With no focus, `status` uses Brief declaration order and current blockers to recommend the first executable slice. `status`, `check`, and `doctor` derive group health and completion without persisting another state; `rsp group close` archives only a completed brief. Archived Group identities cannot be reopened.
- A Group Brief blocker is inherited by its direct children as an external blocker in the derived execution plan; it does not create guessed dependency edges.
- A Markdown file and directory cannot claim the same work identity.
- `rsp status`, `rsp check`, and `rsp doctor` inspect the same complete work tree and dependency facts. `status` derives exact edges with their reasons, ready work, blockers, and stable waves without a graph file; `check` and `doctor` reject incomplete archive inspection, malformed or missing targets, self-dependencies, and cycles. The `changes/` root must exist as a real directory, and existing focus/archive roots and group prefixes must also be real directories. Unsupported directories, non-Markdown entries, symlinks, missing or unreadable current work, incomplete reads, and identity collisions are visible errors. `status` exits non-zero instead of hiding invalid work.
- `rsp init`, `rsp update`, `rsp add spec`, and generated index builders apply the same no-follow managed-path checks. Archive discovery accepts only flat archive files or one real group directory; recursively organized Specs accept only real directories and regular files.
- Final managed files—such as the project `AGENTS.md`, focus markers, fallback/config files, generated indexes, and placeholders—must also be regular files; RSP rejects static symlink targets before reading or writing them.
- Completed changes move to `archives/`. Stable current facts belong in Specs; lasting rationale belongs in Decision Records; stable scoped operating instructions belong in nearest project-owned `AGENTS.md`.
- Do not promote task history, debugging notes, or one-off implementation context into Specs, Decision Records, or project instructions.
- Change `Spec` delta markers (`### ADDED`, `### MODIFIED`, `### REMOVED`) are planning aids only. `rsp archive` does not automatically promote them into Specs or Decision Records. Durable writeback remains an explicit semantic decision.
- `rsp check` performs deterministic hygiene checks. It warns about unfinished template placeholders and unresolved clarification markers, but those warnings do not replace the semantic durable-update decision.

## File ownership

- `AGENTS.md`: only the `<!-- rsp:begin --> ... <!-- rsp:end -->` block is managed by RSP.
- `.rsp/specs/INDEX.md`: auto-generated index of additional spec files beyond `design.md`. Rebuild with `rsp update`.
- `.rsp/archives/INDEX.md`: auto-generated. Rebuild with `rsp update`.
- `.rsp/specs/design.md`: created by `rsp init`, then owned by the project.
- `.rsp/specs/decisions/`: the default authoritative Decision Record directory; configure `decisions.path` only when the Host Project already owns one external ADR directory.
- `.rsp/rsp-rules.md`: generated minimal fallback protocol; use the `rsp` skill when available.
- Keep durable architecture, boundaries, and cross-cutting technical constraints in `.rsp/specs/design.md`.
- Treat `.rsp/specs/INDEX.md` as a directory for additional spec files; it does not list `design.md`.
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

RSP publishes seven host-neutral Skills for on-demand loading:

- `rsp`: setup, workflow, durable review, and archive guidance.
- `rsp-shape`: shape unclear non-trivial work into one ready Change or justified shallow Group without implementing it.
- `rsp-implement`: implement one selected, ready Change within explicit mutation authority and return truthful Tasks, Blockers, and fresh verification evidence.
- `rsp-diagnose`: establish a confirmed cause or truthful unresolved diagnosis before production correction.
- `rsp-tdd`: drive one clear behavior through observed RED, minimal GREEN, optional safe REFACTOR, and fresh verification.
- `rsp-review`: read-only review of code, document, or mixed Changes against fixed scope and project authority.
- `rsp-address-review`: dispose fixed review findings, apply only authorized accepted corrections, require fresh verification and report-only re-review, and return a recoverable artifact-scoped handoff when work remains.

Each Skill is independently invocable and returns results to existing project or RSP artifact owners. The suite adds no hidden workflow state or recursive Skill orchestration, and no Skill infers commit, push, or publication authority.

For a complete tracked change, compose the suite as evidence requires: `rsp-shape` returns an executable Change; Core routes unexplained failures to `rsp-diagnose`, clear test-first behavior to `rsp-tdd`, and evidenced edits to `rsp-implement`; `rsp-review` returns a read-only report; `rsp-address-review` disposes findings and returns accepted corrections through fresh verification and re-review; and `rsp` performs the durable decision before archive. Each discipline returns to the same Change. Ambiguity, failed gates, and missing authority stop at their existing owner; they do not trigger an automatic retry loop.

Reading guidance:

- `README.md`: human-oriented overview and examples
- `.rsp/rsp-rules.md`: minimal fallback protocol when the skill is unavailable
- `skills/rsp/SKILL.md`: preferred operational guide for agents
- `skills/rsp-shape/SKILL.md`: bounded shaping and slicing guidance
- `skills/rsp-implement/SKILL.md`: bounded implementation and fresh verification guidance
- `skills/rsp-diagnose/SKILL.md`: evidence-backed cause isolation before correction
- `skills/rsp-tdd/SKILL.md`: bounded red-green-refactor guidance
- `skills/rsp-review/SKILL.md`: read-only review guidance
- `skills/rsp-address-review/SKILL.md`: review finding disposition, correction, re-review, and recovery guidance

Surface matrix:

| Surface | Primary audience | Role |
|---|---|---|
| `README.md` | Humans | Overview, onboarding, examples |
| `.rsp/rsp-rules.md` | Agents without the skill | Minimal tool-agnostic fallback protocol |
| `skills/rsp/SKILL.md` | Agents | Preferred operational guide |
| `skills/rsp-shape/SKILL.md` | Agents | Shape one executable Change or justified shallow Group |
| `skills/rsp-implement/SKILL.md` | Agents | Implement one ready Change with fresh verification evidence |
| `skills/rsp-diagnose/SKILL.md` | Agents | Confirm a cause before production correction |
| `skills/rsp-tdd/SKILL.md` | Agents | Implement one clear behavior test-first |
| `skills/rsp-review/SKILL.md` | Agents | Read-only Code and Document review |
| `skills/rsp-address-review/SKILL.md` | Agents | Resolve review findings and return a recoverable handoff |
| `AGENTS.md` | Humans and agents | Scoped project instructions and RSP navigation |

Humans should usually start with `README.md`; agents should follow nearest `AGENTS.md`, load the `rsp` skill when available, and use `.rsp/rsp-rules.md` only as fallback.

When this README shows `rsp <command>`, it assumes the command is already available in your environment. Otherwise use `npx -y @oevery/rsp <command>`.

Example optional installation flow for the suite:

```bash
npx skills add oevery/rsp
```

Install only one capability when preferred:

```bash
npx skills add oevery/rsp --skill rsp
npx skills add oevery/rsp --skill rsp-shape
npx skills add oevery/rsp --skill rsp-implement
npx skills add oevery/rsp --skill rsp-diagnose
npx skills add oevery/rsp --skill rsp-tdd
npx skills add oevery/rsp --skill rsp-review
npx skills add oevery/rsp --skill rsp-address-review
```

`rsp update` refreshes project-local RSP files only. If you use published RSP Skills, refresh them separately after upgrading:

```bash
npx skills add oevery/rsp
```

## Migrating from 2.x

Version 3 uses `.rsp/rsp-rules.md` as the only runtime fallback path and removes project rules from the RSP model:

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

`rsp ready` and `rsp show` expose both deterministic readiness and semantic-review signals. Deterministic readiness comes from checkboxes, blockers, and scenarios; semantic review remains required for durable-update decisions.

`rsp ready --json` and `rsp show --json` include `durableReview.factDecisions`, `rationaleDecisions`, `factCandidateTargets`, and the one authoritative `decisionRecordsPath`. This is routing guidance only; RSP does not fabricate filenames or promote Change content automatically.

## Recommended workflow

New project:

1. `npx -y @oevery/rsp init`
2. Prefer `npx -y @oevery/rsp init --with-project-setup`, or run `rsp create project-setup` manually
3. Fill `.rsp/specs/design.md`
4. Use `rsp add spec <name>` only when a new durable project doc is needed
5. Keep lasting rationale in the configured Decision Record directory and stable scoped operating instructions in the nearest project-owned `AGENTS.md`
6. For tracked open work, start with `rsp create <name>`
7. If you want an existing open change to become current work, use `rsp focus <name>`
8. Use `rsp unfocus <name>` when you want to remove a change from the current focus set
9. Edit the change file directly to implement the work and mark tasks complete
10. Use the RSP skill or a human review to decide whether durable updates are needed
11. Finish with `rsp archive <name>`

Existing project with a rich `AGENTS.md`:

1. `npx -y @oevery/rsp init`
2. Keep the managed block thin
3. Move durable design into `.rsp/specs/design.md`
4. Use `rsp add spec <name>` only when another durable current-fact document is needed

AI-assisted setup:

1. `npx -y @oevery/rsp init --agents-mode print --with-project-setup`
2. Keep the managed block as generated and adapt only the surrounding human-owned content if needed
3. Have the AI review and fill `.rsp/changes/project-setup.md`
4. Have the AI fill `.rsp/specs/design.md`
5. Run `rsp doctor`

## CLI

```text
rsp init --agents-mode <mode>   Scaffold .rsp/ and ensure AGENTS.md contains the RSP entry block
rsp init --with-project-setup   Also create .rsp/changes/project-setup.md
rsp update                      Refresh the fallback protocol, repair the AGENTS block, and rebuild indices
rsp add spec <name>             Create .rsp/specs/<name>.md and rebuild specs index
rsp create <name> [summary]     Create .rsp/changes/<name>.md; add --lite for a shorter template
rsp group create <name> [goal] Create an unfocused .rsp/changes/<name>/00-brief.md
rsp group close <name>         Archive a completed Group Brief after every child is archived
rsp focus <name>                Mark an open change as currently focused
rsp unfocus <name>              Remove an open change from the current focus set
rsp archive <name>              Archive to .rsp/archives/ + update archive index
rsp archive --dry-run <name>    Preview archive readiness without moving the change
rsp ready <name> [--json] [--verbose]
                                  Preview archive readiness (same as archive --dry-run)
rsp show <name|--focused> [--json] [--verbose]
                                  Show change context with readiness signals and context paths
rsp status [--focused|--blocked|--stale <days>] [--json] [--verbose]
                                  Show project status plus derived dependency plan with focus-aware filters
rsp check [--focused] [--json] [--verbose]
                                  Validate change files and lightly lint template/scenario structure
rsp doctor [--fix] [--json] [--verbose]
                                  Check setup health and common issues
```

Use `skills/rsp/SKILL.md` for operations. When the skill is unavailable, use `.rsp/rsp-rules.md` as the minimal fallback protocol.

When there is no focused change, `rsp status` and `rsp show --focused --json` print `nextActions` instead of guessing which open change is current.

`rsp status --json` returns the same dependency projection under `plan.ready`, `plan.edges`, `plan.blocked`, and `plan.waves`. These are derived navigation facts, not execution authority or persisted workflow state.

`rsp create --lite` is a shorter template for explicitly tracked small changes; simple current-session tasks should not create RSP changes unless tracking is intentionally needed.

`rsp doctor --fix` runs only safe deterministic repairs. Its `fixed` JSON entries report actual filesystem changes; a healthy project returns `fixed: []` and the human output says no safe fixes are needed.

## Platform-agnostic

`.rsp/` is a plain file convention. It works with Kilo Code, Cursor, Claude Code, Cline, GitHub Copilot, or any assistant that reads project files. Requires Node.js 18+.
