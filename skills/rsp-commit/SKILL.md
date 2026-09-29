---
name: rsp-commit
description: Create one authorized, exact-scope local commit for a Core-derived direct, Change, integration, Group, or release boundary with a repository-consistent structured message.
license: MIT
metadata:
  author: oevery
  version: "2026.09.29.1"
---

# RSP Commit

Create one reviewable local commit after Core derives one compact delivery request, either through ordinary explicit authority or qualified coordinated closeout. Skill availability grants none of its facts. The request contains only the delivery kind, owner reference, real WorkRefs when relevant, exact paths, current local authority, and fresh verification pointers. Rsp-commit rereads owner and Git facts before staging; the request is not a second source of truth.

When a durable owner exists, the owner reference is a WorkOwner reference: a Change uses its WorkRef and a Group uses its Group reference. Included child WorkRefs identify delivery inputs and never replace the durable owner. Direct, integration, and release kinds may have no durable WorkOwner.

Accept exactly one delivery kind:

| Kind | Required identity and evidence | RSP metadata |
| --- | --- | --- |
| direct | a concise owner summary for one confirmed direct Tiny/Small boundary | none |
| change | one real WorkRef and its applicable checkpoint or lifecycle evidence | RSP-WorkRef |
| integration | at least two real WorkRefs, one evidenced shared integration boundary, and exact paths | one RSP-WorkRef per included WorkRef |
| group | one integration-coupled wave or Group closeout, its Group ref, included WorkRefs, and applicable lifecycle evidence | RSP-Group and included RSP-WorkRef values |
| release | one confirmed release identity and release-boundary evidence | only real included WorkRefs, when supplied |

A direct kind is a transient Git delivery boundary, not a durable RSP WorkOwner. Never require it to create a Change, invent a WorkRef, or supply lifecycle evidence. Integration is also a transient delivery kind and never creates a Group.

Follow Core's response-versus-artifact language boundary for all user-visible control narration; when the response language differs, keep exact canonical values only as secondary parenthesized or code-formatted tokens.

## Audit the delivery request

Read nearest project authority and the selected owner evidence: the delivery kind, owner reference, WorkRefs, relevant open Change, Group Brief and children, archive, or confirmed release boundary. Then inspect git status, staged, unstaged, and untracked paths, the cached diff, and recent non-merge commit messages. Reread verification and lifecycle facts from the owner instead of trusting copied request prose. For integration, prove at least two real WorkRefs and one shared exact boundary. For a terminal Change or Group child, inspect its Verify section and stop before staging when a Task or Required Verify item remains incomplete or a blocker is active. Legacy unclassified Verify items are Required. Optional coverage warnings do not block a terminal commit, but include a material omission in the commit body when it affects review. A checkpoint commit remains explicitly non-terminal and does not claim completed acceptance.

Stop without staging when kind, work, refs, paths, auth, verify, applicable life evidence, or the logical boundary is missing, ambiguous, stale, or conflicts with unrelated work. A missing WorkRef or lifecycle state is not a defect for a valid direct kind. An integration kind with fewer than two real WorkRefs or no shared boundary is invalid. Refuse an active merge, cherry-pick, revert, rebase, mail-apply, or sequencer operation before commit execution. Stop when an allowed path contains mixed owned and unrelated changes that cannot be staged without guessing. Never infer archive, Group closeout, commit, cross-branch integration, push, tag, publication, approval, amend, rebase, force-push, or history-rewrite authority.

## Derive the message

Choose subject and body prose language from explicit current commit-language instruction, then configured effective commit language, nearest repository commit authority, and finally the clear style of recent non-merge commits. Response language and preferences remembered from another repository do not select it. Preserve Conventional Commit types, scopes, and trailers as technical values. When recent history is materially mixed and no nearer rule resolves it, return the language decision to its owner.

Use the repository's established Conventional Commit form when present. Derive type and scope from the owned outcome and repository history, not from the conversation. Keep the subject concise and repository-consistent.

Describe the accepted diff as a reader who did not see the working session. Omit rejected session-only alternatives, corrections, and temporary attempts that never entered the authoritative baseline. Name a removal, exclusion, failed external action, compatibility boundary, migration, safety rule, audit fact, or material review fact when it is real and affects review.

A tiny, mechanical, or direct Tiny/Small boundary may be subject-only. For a non-trivial Change, integration, Group closeout, or release commit, add two to four concise bullets covering the observable outcome, material compatibility boundaries, and an important omission or risk when one affects review. Do not copy file lists, command transcripts, routine verification output, execution chronology, or the full Change.

Project trailers from the delivery kind: add one RSP-WorkRef trailer per real included WorkRef and RSP-Group only when a Group is the owner. A direct or release owner with no included WorkRefs emits no RSP trailer. Integration does not emit RSP-Group. Add authoritative external references already owned by the work and BREAKING CHANGE only for an actual breaking change. Never invent a WorkRef, Group, issue, co-author, sign-off, breaking change, or AI attribution.

Project every owned issue relationship as a non-closing Issue reference when proportionate. Only a terminal commit whose selected Change acceptance is complete may additionally use a provider-supported closing keyword for an explicit closes relation. Checkpoints, relates relations, ambiguous ownership, and unresolved provider or repository identity emit no closing keyword. When safe shorthand cannot be resolved, keep only the canonical URL; never infer an issue from changed files or mutate the external tracker.

## Commit the exact boundary

Stage only the explicit allowed paths. Re-read git status, the complete cached path list and cached diff, and confirm they represent exactly one delivery boundary with no sensitive material. If the cached boundary is wrong, stop and leave unrelated work untouched; do not repair it by broad staging, destructive reset, or history rewrite.

Transport a structured multiline message with actual line breaks or a safely prepared message file. Do not rely on ordinary quoted backslash-n escape sequences as portable newlines; a host shell may pass those characters through literally.

When the packaged CLI is available, use rsp commit --message-file path [--json] for the exact local execution step. The command reads the prepared message file, rejects unintended literal backslash-n sequences, and invokes git commit through Node's direct child-process API. It operates only on the existing staged boundary; it never stages paths itself.

Create one local commit with the prepared subject, optional body, and trailers. Do not cherry-pick, clean another checkout, push, tag, publish, amend, rebase, or force-push. Afterward observe exact before and after HEAD, the raw complete committed message, committed paths, remaining worktree paths, and remote refs when required. Confirm that committed paths equal the reviewed staged boundary. Compare the observed stored message with the prepared message exactly, allowing only one terminal LF difference for Git's message-file boundary. A successful commit is still a post-commit mismatch when paths or message differ; stop without inferring amend or a second commit.

## Return the delivery result

Return the compact result: kind, work or refs, commit SHA, paths, message, remaining paths, and omissions when present. Preserve complete stored-message and post-commit path observations as evidence, but do not repeat the full request or owner narrative. Report a stop before staging, commit failure, observation failure, or post-commit mismatch truthfully. Manual fallback is only for capability unavailability.
