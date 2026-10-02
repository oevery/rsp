---
name: rsp-commit
description: Inspect or create one authorized exact-scope local commit for direct, Change, integration, Group or release delivery. Preserve unrelated work; do not infer lifecycle, remote delivery or history-rewrite authority.
license: MIT
metadata:
  author: oevery
  version: "2026.10.01.3"
---

# RSP Commit

Own precise local Git delivery, whether invoked directly or routed by Core. This is a default core capability, not an optional extension. Availability grants no authority. A readiness-only request remains read-only; create a commit only with current local authority, one exact owned boundary and fresh applicable verification.

Use explicit response language, then personal instructions, then conversation language for narration. Existing artifact language stays unchanged. Commit prose follows explicit current commit-language instruction, effective configured commit language, nearest repository authority, then the clear style of recent non-merge commits. In RSP projects, when precedence needs configuration, use the same selected CLI's successful `rsp config --json` summary (optional `--compact`); it resolves defaults and inheritance. Refresh on relevant drift or recovery. Raw YAML is diagnostic only; failed or unavailable projection leaves the dependent language choice unresolved before staging, not replaced by history. Independently authorized read-only inspection needing no unknown setting may continue. Response language does not select commit language. Preserve commands, identifiers, Conventional types, scopes and trailers; return a material unresolved language choice to the owner. These rules work without Core installed.

## Establish the delivery boundary

Resolve the smallest request: kind, purpose, owner or summary, real included WorkRefs when relevant, exact paths, current local authority, fresh verification pointers and lifecycle evidence only when applicable. Derive these facts from direct user intent or Core's bounded handoff; do not require a transport schema or create a second source of truth.

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

Read nearest authority and the selected current owner, relevant Brief/children or archive when needed. Inspect status, the complete staged, unstaged and untracked boundary, cached diff and recent non-merge messages. Reread decisive verification and applicable lifecycle facts instead of trusting copied handoff prose. Run an authorized missing local check only when its scope and method are settled; unavailable or failed evidence is a stop.

Stop without changing the index on missing or ambiguous authority, stale evidence, an invalid kind/purpose, unrelated staged work, mixed ownership that cannot be separated without guessing, or active merge, cherry-pick, revert, rebase, mail-apply or sequencer state. Preserve pre-existing owned partial staging unless the exact additional content is authorized. Never broaden paths, unstage unrelated work or reset the index to make a boundary fit.

For readiness-only work, report eligibility, gaps and the next owner here; do not stage, prepare files or commit.

## Review the final index and message

1. Stage only the authorized content with exact path handling. Reread status, complete cached paths and diff, including sensitive material, and prove one reviewable logical boundary. Stop if it does not match; do not repair unrelated staging.
2. Record the reviewed HEAD (or unborn state) and index tree. These bind content, file modes and deletions, not only names; keep them transient.
3. Derive the message from that final cached diff, not conversation chronology or a copied Change. Use the established Conventional form when present and a concise repository-consistent subject. A small mechanical outcome may be subject-only. For material behavior, compatibility or risk, add only the body needed by a reader without the session.
4. Load [message and references](references/message.md) for tracked, integration, Group, release, issue-related or non-trivial messages. Keep real removals, migration constraints and important omissions; omit session-only attempts, file inventories and routine command output. A supplied prepared message must still match the reviewed boundary; do not edit it when nearer authority forbids editing.
5. Prepare actual multiline text, preferably outside the worktree or at an explicitly allowed path. Never use literal backslash-n as a newline transport or include a temporary message file in delivery. Legitimate escape notation in prose stays literal; do not decode it or reject it merely for containing backslash-n.

## Execute once and observe

Select the execution method inside this capability. Prefer the packaged rsp commit command with --message-file, --expected-head (full OID or unborn), --expected-tree and --json, passing the reviewed snapshot. Inspect help read-only when the installed surface is unknown; do not probe capability by trying a commit. A snapshot check narrows drift; it is not a cross-process lock.

Load [checked Git equivalence](references/git-equivalence.md) for native Git, missing older-CLI protection/observations or a pre-execution tool fault. Before changing methods:

- Independently prove no attempted commit or uncertain effects, then refresh authority, verification, Git operation state and reviewed HEAD/tree. Absence, version or exit status alone is insufficient.
- Stop for unsafe facts, failed verification, snapshot drift or a nearer method restriction; these are not tool faults. Report the diagnosed cause and equivalent checks.

Unavailable Commit capability has no Core substitute.

Attempt one local commit. Observe before/after HEAD, immutable commit SHA, complete stored message, committed paths, staged and committed trees, parents and remaining worktree paths. For a normal commit require one parent equal to reviewed HEAD; an unborn commit has none. Require the final HEAD to identify that commit, content tree and paths to match the reviewed index, and message to match exactly except one terminal LF. Collect missing observations by immutable SHA, not several movable HEAD reads.

A command exit alone is not exact delivery. Distinguish refusal before execution, Git failure with observed unchanged HEAD, a created commit with mismatch, and incomplete observation. If a commit exists or its effects are uncertain, stop without retry, amend, rollback or a second commit. Preserve unrelated work and report what actually happened.

## Return the result

Report kind and purpose, owner or refs when relevant, commit SHA when observed, delivered paths, message, remaining work and material omissions. Retain the complete message and content/history observations as evidence without repeating the owner narrative. For a stop, name the missing condition, observed Git effects and safe next action. No stage grants push, tag, publication, deployment, approval, cross-branch integration or history rewrite.
