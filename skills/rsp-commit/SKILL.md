---
name: rsp-commit
description: Create one authorized, exact-scope local commit for an RSP-owned Change, Group wave, or confirmed release boundary with a repository-consistent structured message.
license: MIT
metadata:
  author: oevery
  version: "2026.08.07.1"
---

# RSP Commit

Create one reviewable local commit after Core or qualified Manage has already derived the owner, allowed paths, decisive verification, lifecycle state, and commit authority. Skill availability grants none of those facts. Accept only one Change, one integration-coupled Group wave, one Group closeout, or one confirmed release commit boundary.

Follow Core's response-versus-artifact language boundary for all user-visible control narration; when the response language differs, keep exact canonical values only as secondary parenthesized or code-formatted tokens.

## Audit the envelope

Read nearest project authority, the relevant open Change, Group Brief and children, archive, or confirmed release owner, then inspect `git status`, staged, unstaged, and untracked paths, the cached diff, and recent non-merge commit messages. Recheck the supplied verification and lifecycle facts against current repository state. For a terminal Change or Group child, inspect its open or archived Verify section and stop before staging when a Task or Required Verify item remains incomplete or a blocker remains active. Legacy unclassified Verify items are Required. Optional coverage warnings do not block a terminal commit, but include a material omission in the commit body when it affects review. A checkpoint commit remains explicitly non-terminal and does not claim completed acceptance.

Stop without staging when the owner, allowed paths, commit authority, verification, lifecycle state, or logical boundary is missing, ambiguous, stale, or conflicts with unrelated work. Refuse an active merge, cherry-pick, revert, rebase, mail-apply, or sequencer operation before commit execution. Stop when an allowed path contains mixed owned and unrelated changes that cannot be staged without guessing. Never infer archive, Group closeout, commit, cross-branch integration, push, tag, publication, approval, amend, rebase, force-push, or history-rewrite authority.

## Derive the message

Choose subject and body prose language from explicit current commit-language instruction, then the configured effective commit language, nearest repository commit authority, and finally the clear style of recent non-merge commits. Response language and preferences remembered from another repository do not select it. Preserve Conventional Commit types/scopes and trailers as technical values. When recent history is materially mixed and no nearer rule resolves it, return the single language decision to its owner.

Use the repository's established Conventional Commit form when present. Derive type and scope from the owned outcome and repository history, not from the conversation. Keep the subject concise and imperative or otherwise repository-consistent.

A tiny or mechanical boundary may be subject-only when that subject fully explains it. For a non-trivial Change, integration wave, Group closeout, or release commit, add two to four concise bullets covering:

- the observable outcome;
- material behavior or compatibility boundaries; and
- an important omission or risk when one affects review.

Do not copy file lists, command transcripts, routine verification output, execution chronology, or the full Change/archive. Add only truthful trailers: one `RSP-WorkRef:` per included WorkRef, `RSP-Group:` when the Group is the commit owner, authoritative external references already owned by the work, and `BREAKING CHANGE:` only for an actual breaking change. Never invent an issue, co-author, sign-off, breaking change, or AI attribution.

Project every owned issue relationship as a non-closing `Issue: <canonical-url>` reference when proportionate. Only a terminal commit whose selected Change acceptance is complete may additionally use a provider-supported closing keyword for an explicit `relation: closes`. Checkpoints, `relation: relates`, ambiguous Change or Group ownership, and unresolved provider or repository identity emit no closing keyword. When safe shorthand cannot be resolved, keep only the canonical URL; never infer an issue from changed files or mutate the external tracker.

## Commit the exact boundary

Stage only the explicit allowed paths. Re-read `git status --short`, inspect the complete cached path list and cached diff, and confirm they represent exactly one owner boundary with no sensitive material. If the cached boundary is wrong, stop and leave unrelated work untouched; do not repair it by broad staging, destructive reset, or history rewrite.

Transport a structured multiline message with actual line breaks or a safely prepared message file. Do not rely on ordinary quoted `\n` escape sequences as portable newlines; a host shell may pass those characters through literally.

When the packaged CLI is available, use `rsp commit --message-file <path> [--json]` for the exact local execution step. The command reads the prepared message file, rejects unintended literal `\n` sequences, and invokes `git commit --cleanup=verbatim -F -` through Node's direct child-process API. It operates only on the existing staged boundary; it never stages paths itself.

Create one local commit with the prepared subject, optional body, and trailers. Do not cherry-pick, clean another checkout, push, tag, publish, amend, rebase, or force-push. Afterward observe exact before and after `HEAD`, the raw complete committed message, committed paths, remaining worktree paths, and remote refs when required. Confirm that committed paths equal the reviewed staged boundary. Compare the observed stored message with the prepared message exactly, allowing only one terminal LF difference in either direction for Git's message-file boundary. A successful commit is still a post-commit mismatch when either paths or message differ; report the complete observed receipt and stop without inferring amend or second-commit authority. If the command is unavailable, use a safely prepared message file with a direct non-shell Git invocation and retain the same preflight and post-commit checks.

## Return the receipt

Return before and after `HEAD`, the commit SHA, owner and included WorkRefs, the complete stored message with parsed subject/body/trailers, committed paths, remaining worktree paths, and explicit omissions. Report a stop before staging, commit failure, receipt-observation failure, or post-commit path/message mismatch truthfully; never silently amend or create a second commit to repair the first.
