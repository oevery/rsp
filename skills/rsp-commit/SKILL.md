---
name: rsp-commit
description: Inspect or create one authorized exact-scope local commit for direct, Change, integration, Group or release delivery. Preserve unrelated work; do not infer lifecycle, remote delivery or history-rewrite authority.
license: MIT
metadata:
  author: oevery
  version: "2026.10.11.3"
---

# RSP Commit

For tracked work, read the [shared work model](../rsp/references/work-model.md) when its identity and ownership definitions are missing from the current context. Use logical WorkRefs in commands and reports; cite file locations separately. Direct invocation needs no prior Core execution.

Own precise local Git delivery, whether invoked directly or routed by Core. This is a default core capability, not an optional extension. Availability grants no authority. A readiness-only request remains read-only; create a commit only with current local authority, one exact owned boundary and applicable passing verification.

Responses follow explicit instruction, personal instructions, then conversation language; existing artifacts retain theirs. Commit prose follows explicit commit-language instruction, effective configuration, nearest repository authority, then clear recent non-merge style, not response language. Resolve needed RSP defaults/inheritance through the selected CLI's successful `rsp config --json`; refresh on drift or recovery. Raw YAML is diagnostic only. Failed projection leaves dependent language unresolved before staging, not replaced by history; independent authorized inspection may continue. Preserve commands, identifiers, Conventional types/scopes and trailers. Resolve material conflicts with the owner; Core execution is not required.

## Establish the delivery boundary

Resolve the smallest request: kind, purpose, owner or summary, real included WorkRefs when relevant, exact paths, current local authority, applicable verification pointers and lifecycle evidence only when applicable. Derive these facts from direct user intent or Core's bounded handoff; do not require a transport schema or create a second source of truth.

| Kind | Identity and applicable evidence | RSP trailers |
| --- | --- | --- |
| direct | One confirmed direct outcome permitted by project tracking rules | none |
| change | One real WorkRef | RSP-WorkRef |
| integration | At least two real WorkRefs and one evidenced shared delivery boundary | included RSP-WorkRef values |
| group | Group reference, included WorkRefs and one wave or closeout boundary | RSP-Group and included RSP-WorkRef values |
| release | Confirmed release identity and release-boundary evidence | only real included WorkRefs |

A durable owner is a Change WorkRef or Group reference; included children never replace it. Direct, integration and release may have no durable WorkOwner. Integration creates no Group, direct creates no Change, and commit count is independent from Change count.

Purpose is separate from kind:

- A checkpoint delivers a verified current slice without claiming completed acceptance, closing an issue or requiring archive.
- A terminal delivery claims completion only for its selected boundary. Tracked terminal inputs require complete Tasks, decisive Required Verify and no active blocker; legacy unclassified Verify is Required. Optional omissions remain explicit but do not block. Direct work uses its own acceptance, not an invented lifecycle gate.

Lifecycle authority stays upstream. If terminal delivery includes authorized archive or Group closeout, require that action and its inspected diff before staging. Do not archive, update Specs or clean up a Change inside Commit. A valid explicitly authorized local commit without lifecycle authority does not gain it or require an invented archive.

## Audit before staging

Read nearest authority and the selected current owner, relevant Brief/children or archive when needed. Inspect status, the complete staged, unstaged and untracked boundary, cached diff and recent non-merge messages. Reread decisive verification and applicable lifecycle facts instead of trusting copied handoff prose. Reuse traceable passing results when relevant content, dependencies, configuration, tools, inputs and environment remain applicable; entering Commit alone requires no rerun. Run only authorized missing or invalidated checks with settled scope and method, or explicitly required executions. Failed or unavailable required evidence is a stop.

Stop without changing the index on missing or ambiguous authority, stale evidence, an invalid kind/purpose, unrelated staged work, mixed ownership that cannot be separated without guessing, or active merge, cherry-pick, revert, rebase, mail-apply or sequencer state. Preserve pre-existing owned partial staging unless the exact additional content is authorized. Never broaden paths, unstage unrelated work or reset the index to make a boundary fit.

Before reporting eligibility, establish that verification covers the exact proposed delivery content, not merely filenames or a working tree containing excluded changes. For an already-staged slice, compare evidence with the current index. Unstaged code, configuration, fixtures or generated inputs may make a working-tree pass inapplicable; obtain missing exact-boundary evidence within authority or report the gap, without altering unrelated work.

For readiness-only work, report eligibility, gaps and the next owner here; do not stage, prepare files or commit.

## Review the final index and message

1. Stage only the authorized content with exact path handling. Reread status, complete cached paths and diff, including sensitive material, and prove one reviewable logical boundary. Stop if it does not match; do not repair unrelated staging.
2. Confirm the final index matches the content covered by the audited evidence. If staging changed that boundary, reassess applicability and fill only missing or invalidated coverage before proceeding; unchanged applicable results need no rerun. Record the reviewed HEAD (or unborn state) and index tree. These bind content, file modes and deletions, not only names; keep them transient.
3. Derive the message from that final cached diff, not conversation chronology or a copied Change. Follow applicable project message rules and checks, using the established Conventional form when present and a concise repository-consistent subject. When the project permits and the subject is sufficient, omit the body; otherwise add only the rationale, behavior differences, compatibility or risk needed by a reader without the session.
4. Load [message and references](references/message.md) for tracked, integration, Group, release, issue-related or non-trivial messages. Keep real removals, migration constraints and important omissions; omit session-only attempts, file inventories and routine command output. A supplied prepared message must still match the reviewed boundary; do not edit it when nearer authority forbids editing.
5. Prepare actual multiline text, preferably outside the worktree or at an explicitly allowed path. Never use literal backslash-n as a newline transport or include a temporary message file in delivery. Legitimate escape notation in prose stays literal; do not decode it or reject it merely for containing backslash-n.

## Execute once and observe

Use native Git inside this capability; no RSP commit wrapper or generated delivery
script is required. Missing Commit capability has no Core substitute. Respect a
nearer required method or denial; an incompatible requirement needs an owner
decision, not a trial commit or automatic fallback.

1. Inspect operation state through `git rev-parse --git-path` for MERGE_HEAD,
   CHERRY_PICK_HEAD, REVERT_HEAD, rebase-merge, rebase-apply and sequencer. Any
   active operation or incomplete inspection stops ordinary delivery. Resolve
   paths through Git, not a presumed .git directory, so worktrees are covered.
2. Read HEAD with `git --no-replace-objects rev-parse --verify 'HEAD^{commit}'`.
   A failed read is not automatically unborn: require `git symbolic-ref -q HEAD`
   to name refs/heads/... and `git show-ref --verify --quiet <that-ref>` to confirm
   absence (exit 1). Other errors stop. Immediately before execution, recheck this
   HEAD/unborn state and `git write-tree` against the reviewed snapshot. A caller's
   fixed snapshot cannot be replaced on its behalf. Drift stops without index repair.
3. Attempt exactly once: `git commit --cleanup=verbatim -F <message-file>`, replacing
   the placeholder with the safely prepared, quoted path. Preserve normal hooks
   and signing policy; do not disable either to obtain success. Snapshot checks
   are sequential observations, not a cross-process lock.
4. Read resulting HEAD, then inspect that immutable SHA using
   `git --no-replace-objects cat-file commit <sha>` for the raw message, tree and
   parents, and `git --no-replace-objects diff-tree --root --no-commit-id --name-only --no-renames -r -z <sha>`
   for actual paths. Use NUL-delimited path observations before and after delivery;
   do not split unusual filenames on whitespace or treat display quoting as identity.
5. Require the committed tree and paths to match the reviewed index, one parent
   equal to reviewed HEAD (no parents for unborn), and the complete stored message
   to match the prepared text with at most one terminal LF difference. Recheck
   final HEAD still identifies that SHA and inspect remaining staged, unstaged
   and untracked work against the prior boundary. Obtain committed facts from the
   immutable object, not several movable HEAD reads.

Post-commit verification inspects these Git results and hook effects, not routine repetition of product tests. If hooks changed relevant inputs, report which evidence no longer applies; delivery remains stopped on mismatch or uncertain effects.

Exit zero alone is not exact delivery. After any failure, observe HEAD and actual
index/worktree effects before classifying the result. Distinguish refusal before
execution, Git failure with observed unchanged HEAD, created-commit mismatch and
incomplete observation. Even unchanged HEAD cannot rule out hook side effects.
An attempted commit or uncertain effects stops delivery without retry, amend,
reset, rollback or a repair commit. Preserve the observed state and report gaps;
never claim successful delivery when required observations fail or disagree.

## Return the result

Concisely report kind and purpose, owner or refs when relevant, commit SHA when observed, delivered paths and message subject; include remaining work and material omissions when present. Retain the complete message and content/history observations as evidence; expand them when requested or needed to explain a mismatch, not as routine output. For a stop, name the missing condition, observed Git effects and safe next action. No stage grants push, tag, publication, deployment, approval, cross-branch integration or history rewrite.
