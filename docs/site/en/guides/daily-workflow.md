# Daily workflow

RSP derives the current action from user intent, repository authority, available ownership, checkout evidence, verification, and blockers. An ordinary session task need not create a Change. The stage is guidance, not persisted state; sufficient authority allows completion in the same request without an artificial continuation prompt.

## Select current work

Use `status` and `show` to inspect work; change focus through the owning CLI only when selection is authorized.

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
release communication writing → doc's release method
fixed release-document review → review's Document pipeline
authorized release checks without a WorkOwner → Core and declared project checks
```

The responsible capability chooses permitted methods while preserving the goal, scope, authority, authoritative baseline and required evidence. Same-boundary method changes and repairable failures stay with that capability; named mandatory checks, provenance operations and required independent workers remain requirements. Pure design or diagnosis needs no invented WorkOwner; tracked work returns results to its existing Change. Return to Core for completed responsibility, a changed boundary, required independent acceptance, or an unresolved blocker. Avoid a second plan, workflow state, or receipt store.

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

Run required checks and additional risk-selected checks after the final relevant edit. Prior runs affected by that edit are stale. A missing tool or environment makes verification unavailable; an exercised defect makes it failed. Do not describe either as passed.

For a tool-only obstacle, diagnose the cause and inspect actual effects before recovery. Continue read-only or proven repeat-safe work within the same boundary; do not blindly replay a one-shot operation or bypass a safety refusal. A permitted replacement method must preserve required evidence, not replace an exact named check with a weaker result. Unknown mutation, missing required evidence or independent workers, and changed authority remain stops. Report the observed effects, missing condition and safe next action.

Review has a fixed comparison scope and stays read-only. Correct accepted findings under explicit mutation authority, rerun affected checks, and request re-review rather than silently declaring convergence.

Within that scope, Code checks behavior and tool semantics; Document checks explanation and usage. API comments and copyable examples can need both, while ordinary comments and illustrative pseudocode receive only applicable checks. Reading implementation as evidence does not turn it into a reviewed target, and a code fence grants no execution permission. Report a text/behavior mismatch once, without automatically treating implementation as correct. See [Skill composition](./skills.md#compose-the-suite-from-evidence) for responsibility boundaries.

## Durable decision and archive

When Tasks and required checks pass with no blocker, decide independently whether to:

- update an existing Spec or scoped instruction, or create a new durable Spec;
- create or update a Decision Record for lasting rationale.

For a tracked Change with separate lifecycle authority, check readiness and archive through the owning CLI when permitted. Ordinary untracked work has no archive step; method choice does not authorize manual focus or archive-file mutations:

```bash
rsp ready <work-ref>
rsp archive <work-ref>
```

`rsp ready` provides the required completion gate, optional coverage warnings, and semantic-review signals, not semantic approval. Check the actual required evidence and durable decisions before closeout. `rsp archive` fails closed when Tasks, Required Verify, or blockers remain; inspect its lifecycle diff after success. Recheck the whole intended delivery scope before delivery. Commit, push, publication, deployment, approval, and human acceptance remain separate authorities.

## Recovery

If later evidence shows original acceptance was not met, reopen the same identity with an explicit reason:

```bash
rsp reopen <work-ref> --reason "<why acceptance remains incomplete>"
```

When multiple archives match, add an exact `--from .rsp/archives/...` path. If the Group is closed, reopen the Group first. Use a new Change for genuinely new scope or an independently delivered correction.
