# Daily workflow

RSP derives the current action from user intent, repository authority, available ownership, checkout evidence, verification, and blockers. An ordinary session task need not create a Change. The stage is guidance, not persisted state; sufficient authority allows completion in the same request without an artificial continuation prompt.

## Select current work

```bash
rsp status
rsp focus <work-ref>
rsp show --focused
```

Markers in `.rsp/focus.d/` form a lightweight FocusSet of open work. If several Changes are focused, the AI resolves the default WorkRef from explicit user mentions, the current request, status, and dependencies; ask only when the requested mutation or delivery boundary remains materially ambiguous. For grouped work, read the sibling Group Brief before the selected child.

Before mutation, inspect the worktree and preserve unrelated modified, staged, or untracked work. Focus, automatic focus, and readiness do not grant product mutation, Git, lifecycle, publication, or approval authority.

## Route the work

```text
unclear outcome or scope → shape
bounded design question → shape (read-only unless planning is authorized)
unexplained failure → implement's read-only diagnosis; fix only if authorized and cause confirmed
explicit or concrete-risk test-first need → implement's test-first method
evidenced ordinary change → implement and its own proportionate checks
fixed comparison request → review
accepted fixed findings → implement; independent read-only re-review when required
explicit confirmed release operation → release docs
```

Same-scope methods and repairable failures stay with their responsible capability. Pure design or diagnosis needs no invented WorkOwner; tracked work returns results to its existing Change. Return to Core for completed responsibility, changed goal/owner/scope/authority, required independent acceptance, or an unresolved blocker. Avoid a second plan, workflow state, or receipt store.

## Keep the Change current

- Update Proposal, Spec, or Design when implementation invalidates the prior plan.
- Check Tasks only after the outcome exists.
- Record acceptance-critical evidence under Verify `### Required`; record additional environment, compatibility, scale, or confidence coverage under `### Optional`. Optional omissions stay visible without blocking completion.
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

For a tracked Change with separate lifecycle authority, check readiness and archive when permitted. Ordinary untracked work has no archive step:

```bash
rsp ready <work-ref>
rsp archive <work-ref>
```

`rsp ready` provides the required completion gate, optional coverage warnings, and semantic-review signals. `rsp archive` fails closed when Tasks, Required Verify, or blockers remain. After archive, recheck the whole intended delivery scope. Commit, push, publication, deployment, approval, and human acceptance remain separate authorities.

## Recovery

If later evidence shows original acceptance was not met, reopen the same identity with an explicit reason:

```bash
rsp reopen <work-ref> --reason "<why acceptance remains incomplete>"
```

When multiple archives match, add an exact `--from .rsp/archives/...` path. If the Group is closed, reopen the Group first. Use a new Change for genuinely new scope or an independently delivered correction.
