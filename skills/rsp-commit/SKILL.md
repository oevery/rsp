---
name: rsp-commit
description: Create one authorized, exact-scope local commit for an RSP-owned Change, Group wave, or confirmed release boundary with a repository-consistent structured message.
license: MIT
metadata:
  author: oevery
  version: "2026.07.28.2"
---

# RSP Commit

Create one reviewable local commit after Core or qualified Manage has already derived the owner, allowed paths, decisive verification, lifecycle state, and commit authority. Skill availability grants none of those facts. Accept only one Change, one integration-coupled Group wave, one Group closeout, or one confirmed release commit boundary.

## Audit the envelope

Read nearest project authority, the relevant open Change, Group Brief and children, archive, or confirmed release owner, then inspect `git status`, staged, unstaged, and untracked paths, the cached diff, and recent non-merge commit messages. Recheck the supplied verification and lifecycle facts against current repository state.

Stop without staging when the owner, allowed paths, commit authority, verification, lifecycle state, or logical boundary is missing, ambiguous, stale, or conflicts with unrelated work. Stop when an allowed path contains mixed owned and unrelated changes that cannot be staged without guessing. Never infer archive, Group closeout, commit, push, tag, publication, approval, amend, rebase, force-push, or history-rewrite authority.

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

Create one local commit with the prepared subject, optional body, and trailers. Do not push, tag, publish, amend, rebase, or force-push. Afterward observe `HEAD`, the complete committed message, committed paths, remaining worktree state, and remote refs when a remote-safety assertion is required. A commit command succeeding is insufficient if the observed message or paths differ from the prepared boundary.

## Return the receipt

Return the commit SHA, owner and included WorkRefs, committed paths, parsed subject/body/trailers, remaining worktree paths, and explicit omissions. Report a stop before staging, commit failure, or post-commit mismatch truthfully; never silently amend or create a second commit to repair the first.
