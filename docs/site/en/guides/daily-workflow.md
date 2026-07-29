# Daily workflow

RSP derives one next action from user intent, repository authority, the selected Change, current evidence, verification, and blockers. The stage is guidance, not persisted state.

## Select current work

```bash
rsp status
rsp focus <work-ref>
rsp show --focused
```

Only markers in `.rsp/focus.d/` select current work. If several focused Changes exist, the user or repository context must identify the one being operated. For grouped work, read the sibling Group Brief before the selected child.

Before mutation, inspect the worktree and preserve unrelated modified, staged, or untracked work. Focus and readiness do not grant product mutation, Git, lifecycle, publication, or approval authority.

## Route the work

```text
unclear outcome or scope → shape
material design question → design
unexplained failure → diagnose
explicit or concrete-risk test-first need → TDD
evidenced ordinary change → implement
fixed comparison request → review
accepted findings → resolve findings
explicit confirmed release operation → release docs
```

Each capability returns to the same Change or existing repository owner. Avoid creating a second plan, workflow state, or receipt store.

## Keep the Change current

- Update Proposal, Spec, or Design when implementation invalidates the prior plan.
- Check Tasks only after the outcome exists.
- Record fresh commands, covered scope, results, and relevant omissions in Verify.
- Keep unresolved external or technical constraints in Blockers.
- Prefer the cheapest decisive verification. Retain a new test only when it protects observable behavior or a real boundary and adds distinct future confidence.

Use an exact dependency blocker only for another executable Change:

```md
- requires `authentication/session-model`: session ownership must land first
```

## Verify and review

Run checks proportionate to the changed risk after the final relevant edit. Prior runs are stale. A missing tool or environment makes verification unavailable; an exercised defect makes it failed. Do not describe either as passed.

Review has a fixed comparison scope and stays read-only. Correct accepted findings under explicit mutation authority, rerun affected checks, and request re-review rather than silently declaring convergence.

## Durable decision and archive

When Tasks and required checks pass with no blocker, decide independently whether to:

- update an existing Spec or scoped instruction, or create a new durable Spec;
- create or update a Decision Record for lasting rationale.

Then archive explicitly:

```bash
rsp ready <work-ref>
rsp archive <work-ref>
```

`rsp ready` provides deterministic readiness and semantic-review signals. It is advisory, not archive approval. After archive, recheck the whole intended delivery scope. Commit, push, publication, deployment, approval, and human acceptance remain separate authorities.

## Recovery

If later evidence shows original acceptance was not met, reopen the same identity with an explicit reason:

```bash
rsp reopen <work-ref> --reason "<why acceptance remains incomplete>"
```

When multiple archives match, add an exact `--from .rsp/archives/...` path. If the Group is closed, reopen the Group first. Use a new Change for genuinely new scope or an independently delivered correction.
