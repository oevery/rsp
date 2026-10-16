# Daily workflow

RSP selects the needed Skill and workflow depth from user intent, repository authority, unresolved material choices, risk and current evidence. A settled direct task needs no invented Change or planning phase. Responsibilities are conditional; sufficient authority allows completion in the same request without an artificial continuation prompt.

## Select current work

First distinguish a bounded direct request from tracked work using the request, project instructions and existing owner evidence. A direct task with no selected or required WorkOwner needs no tracking status/readiness query or initialization. Missing or broken required tracking is a gap, not a reason to bypass it. Obtain a needed `rsp config --json` result independently of status success.

For tracked work, use `status` and `show`; change focus through the owning CLI only when selection is authorized.

```bash
rsp status
rsp focus <work-ref>
rsp show <work-ref>
```

Markers in `.rsp/focus.d/` form a lightweight FocusSet of open work. Inspect the selected WorkRef explicitly; `show --focused` requires exactly one marker. If several Changes are focused, the AI resolves the default WorkRef from explicit user mentions, the current request, status and dependencies; ask only when the requested mutation or delivery boundary remains materially ambiguous. For grouped work, read the sibling Group Brief before the selected child.

Before mutation, inspect the worktree and preserve unrelated modified, staged, or untracked work. Focus, automatic focus, and readiness do not grant product mutation, Git, lifecycle, publication, or approval authority.

## Route the work

```text
unclear outcome or scope → shape
bounded design question → shape (read-only unless planning is authorized)
unexplained failure → implement's read-only diagnosis; fix only if authorized and cause confirmed
explicit or concrete-risk test-first need → implement's test-first method
evidenced ordinary change → implement and its own proportionate checks
fixed comparison request → review
authorized repository-document or Skill writing → doc
accepted fixed findings → Implement correction; Core coordinates any required re-review
release communication writing → doc's release method
fixed release-document review → review's Document pipeline
authorized release checks without a WorkOwner → Core and declared project checks
```

Invoke a capability directly when the responsibility is clear; a full Core entry is not a prerequisite. Each capability chooses permitted methods within its goal, scope, authority, baseline and required evidence. A bounded correction and its checks stay with Implement; Core owns any cross-capability correction/review loop. Named checks, provenance and required independent workers remain binding. Tracked work retains its existing Change; no second plan or workflow state is needed.

Choose depth by the actual obligation, not file count:

- A settled authorized fix uses Implement and its proportionate checks. Shape is needed for a material unresolved decision; Verify for a separately requested or required evidence result.
- Independent ready slices may use separate workers. A dependent consumer waits for its prerequisite; workers sharing a generated artifact or test resource run sequentially unless safe isolation is established.
- A review-only request stays read-only. A combined repair-and-review request uses Core's one bounded loop, preserving any required independent reviewer.

RSP decides whether to delegate and which dependency-ready work can run safely in parallel. The host supplies the actual workers, isolation, waiting and cancellation. For grouped work, inspect `rsp status --json`, use the first ready dependency wave, and recheck before another wave. Worker completion alone does not establish accepted results or independence. Required attribution and distinct-worker evidence must be observed; optional delegation may fall back locally, but required independence cannot.

The parent reads what it needs to route, authorize and assess the work; workers read their execution methods. The parent loads worker-specific detail for its own execution or a concrete boundary/evidence question. This does not remove worker reading, parent result validation or required independent checks.

Automatic delegation defaults off; explicit worker requirements remain binding. When enabled, the user or main agent decides worker count. Workflow closure is independent: ordinary completion and checkpoints stay open; established final delivery uses ask/auto/manual. See [workflow policy](../reference/configuration.md#workflow-policy).

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

After the final relevant edit, reuse traceable passing evidence whose tested scope and relevant content, dependencies, configuration, tools, inputs and environment still apply. Changed inputs or tested boundaries invalidate affected evidence; run missing, failed or invalidated required checks and risk-selected additions. Explicit reruns, current observations and required independent execution remain binding; a phase change alone does not invalidate evidence. A missing tool or environment makes verification unavailable; an exercised defect makes it failed. Neither is a pass.

For a tool-only obstacle, diagnose the cause and inspect actual effects before recovery. Continue read-only or proven repeat-safe work within the same boundary; do not blindly replay a one-shot operation or bypass a safety refusal. A permitted replacement method must preserve required evidence, not replace an exact named check with a weaker result. Unknown mutation, missing required evidence or independent workers, and changed authority remain stops. Report the observed effects, missing condition and safe next action.

Review supplies current semantic judgment of a fixed comparison and stays read-only; reusable passing checks do not replace it. For authorized correction and review, Core validates findings and sends each bounded correction to Implement with affected checks, then obtains fresh Review. Accepted in-scope findings continue automatically within bounded correction limits; Implement cannot self-certify review-clean or run another loop. Stop for a material decision, changed authority, unavailable required evidence or non-convergence, preserving required independence.

Within that scope, Code checks behavior and tool semantics; Document checks explanation and usage. API comments and copyable examples can need both, while ordinary comments and illustrative pseudocode receive only applicable checks. Reading implementation as evidence does not turn it into a reviewed target, and a code fence grants no execution permission. Report a text/behavior mismatch once, without automatically treating implementation as correct. See [Skill composition](./skills.md#compose-the-suite-from-evidence) for responsibility boundaries.

## Durable decision and archive

For a pure update to existing Tasks/Verify, check the owner for contradictions, record actual outcomes and check the edited evidence directly. If accepted scope, contract, design and stable knowledge remain accurate and no lifecycle or terminal delivery is being prepared, passing checks or recovery alone adds no Doc/writeback phase. Required checks, Review and incomplete results still matter. A contradiction or necessary knowledge update leaves this path.

When stable knowledge needs updating or lifecycle/terminal delivery is being prepared, decide independently whether to:

- update an existing Spec or scoped instruction, or create a new durable Spec;
- create or update a Decision Record for lasting rationale.

Verify outcome facts, distill useful Focus results, and write needed stable knowledge
to its owner. After those updates, converge the entire Change: retain the delivered
delta, material failures, limits and evidence pointers; remove stale plans, duplicate
Specs and session chronology. Check the final Change and updated knowledge owners,
complete any required Review, then obtain current readiness. Necessary writeback
and final consistency remain required; already-converged records need no cosmetic
rewrite or routine no-op report.

For a tracked Change with separate lifecycle authority, check readiness and archive through the owning CLI when permitted. Ordinary untracked work has no archive step; method choice does not authorize manual focus or archive-file mutations:

```bash
rsp ready <work-ref> --json
rsp archive <work-ref>
```

`rsp ready` provides the required completion gate, optional coverage warnings, and semantic-review signals, not semantic approval. Require `completionGate: pass` and `archiveReady: yes`, and check the actual required evidence and durable decisions before closeout. `rsp archive` fails closed when Tasks, Required Verify, or blockers remain; inspect its lifecycle diff after success. Recheck the whole intended delivery scope before delivery. Commit, push, publication, deployment, approval, and human acceptance remain separate authorities.

## Recovery

If later evidence shows original acceptance was not met, reopen the same identity with an explicit reason:

```bash
rsp reopen <work-ref> --reason "<why acceptance remains incomplete>"
```

When multiple archives match, add an exact `--from .rsp/archives/...` path. If the Group is closed, reopen the Group first. Use a new Change for genuinely new scope or an independently delivered correction.
