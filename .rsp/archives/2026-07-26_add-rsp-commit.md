---
kind: "feature"
---

# Change: add-rsp-commit

## Proposal
- Outcome: Add `rsp-commit` as the default RSP capability for creating one authorized, reviewable local commit with a repository-consistent structured message.
- Why:
  - RSP currently decides lifecycle and local-commit eligibility but does not own commit-message language, body, or trailer quality.
  - Repeated self-hosted runs selected Chinese summaries in an English-history repository and required local history rewrites.
  - Non-trivial RSP Changes currently land as subject-only commits, leaving their observable outcome and important boundaries out of Git history.
- Scope:
  - Publish and default-install an `rsp-commit` Skill for RSP-owned Change, Group/wave, and confirmed release commit boundaries.
  - Derive a repository-consistent Conventional Commit subject, a proportionate body, and truthful trailers from current authority, RSP owners, Git history, and the staged diff.
  - Route an authorized local commit from Core/Manage to `rsp-commit`, with a manual fallback when the Skill is unavailable.
  - Observe and evaluate the complete commit message rather than only its subject.
- Non-goals:
  - Do not create a generic commit workflow for repositories without an RSP-owned commit boundary.
  - Do not change lifecycle, commit, push, tag, release, publication, or history-rewrite authority.
  - Do not perform push, tag, release publication, amend, rebase, or force-push operations.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: `rsp-commit` creates one exact-scope local commit only after RSP has derived a commit owner and existing authority permits the action.
  - The Skill accepts an explicit RSP-owned Change, Group/integration wave, or confirmed release commit boundary, its allowed paths, decisive evidence, and current lifecycle state.
  - It re-reads nearest project authority, the relevant RSP owner or archive, `git status`, staged and unstaged paths, untracked paths, the cached diff, and recent non-merge commit messages before committing.
  - It stops without staging when the owner, allowed paths, authority, verification, or clean logical boundary is missing, ambiguous, stale, or conflicting with unrelated work.
  - It never infers lifecycle closeout, commit authority, push, tag, publication, approval, or history-rewrite authority from Skill availability.
- Requirement: commit messages follow the current repository rather than the response language or unrelated remembered preferences.
  - Subject language precedence is explicit current instruction, nearest repository authority, then the clear style of recent non-merge commits; unresolved mixed style stops for one owner decision.
  - The subject uses the repository's Conventional Commit form when established, including an evidenced type and scope rather than a conversation-derived default.
  - Response language, Change prose language, and memory from another repository do not determine commit-message language.
- Requirement: message detail is proportionate to the RSP-owned change.
  - A tiny or mechanical commit may remain subject-only when the subject fully explains the change.
  - A non-trivial Change, integration wave, Group closeout, or release commit includes a concise body with two to four bullets covering the observable outcome, material behavioral or compatibility boundaries, and any important omission or risk.
  - The body does not copy file lists, command transcripts, routine verification output, execution chronology, or the full Change/archive.
  - The footer records only truthful structured relationships: one `RSP-WorkRef:` per included WorkRef, `RSP-Group:` when a Group is the commit owner, authoritative external references when present, and `BREAKING CHANGE:` only for an actual breaking change.
  - The Skill does not invent issues, co-authors, sign-offs, breaking changes, or AI attribution.
- Requirement: RSP routes Git delivery without duplicating ownership.
  - Core/Manage retains lifecycle, qualification, commit-eligibility, and external-action authority; `rsp-commit` owns exact staging, structured message construction, local commit execution, and post-commit observation.
  - When `rsp-commit` is unavailable, Core provides the equivalent bounded manual commit action against the same owner; availability never changes readiness or authority.
  - The published default lifecycle inventory, project Skill manager, documentation, package validation, and self-hosted projections include `rsp-commit`.
- Requirement: retained behavior evidence evaluates the actual committed message.
  - Managed-controller Git observation records the complete `%B` message and parsed subject/body/trailers for commits after the saved base.
  - A real holdout covers a Chinese interaction in an English-history repository and requires an English Conventional subject, proportionate body, and truthful RSP trailer without remote mutation.
  - Retained evidence remains immutable; changed Skill or evaluator inputs use a new run identity.

### Acceptance
#### Scenario: a non-trivial RSP Change is committed from a Chinese interaction
- GIVEN an English-history repository, one completed non-trivial RSP Change, an exact clean logical boundary, and local commit authority
- WHEN Core routes the terminal Git action to `rsp-commit`
- THEN one local commit is created with an English Conventional subject
- AND its body contains two to four concise outcome or boundary bullets
- AND its footer contains the truthful `RSP-WorkRef`
- AND no push, tag, publication, amend, or rebase occurs

#### Scenario: a tiny RSP-owned commit needs no body
- GIVEN an authorized tiny or mechanical RSP-owned boundary whose subject fully explains the change
- WHEN `rsp-commit` prepares and creates the commit
- THEN the repository-consistent subject may be used without a synthetic body
- AND any trailer is included only when a real relationship exists

#### Scenario: the worktree does not provide one safe commit boundary
- GIVEN unrelated, ambiguous, stale, or unverified paths intersect the proposed RSP-owned commit
- WHEN `rsp-commit` audits the owner and cached boundary
- THEN it stops without staging or committing
- AND it returns the exact missing authority, evidence, or boundary owner

## Design
- Approach:
  - Add a compact default `skills/rsp-commit/SKILL.md` that consumes an RSP-derived commit envelope and progressively reads only the owner and Git evidence needed for the selected boundary.
  - Add a Core route and a Manage terminal handoff after lifecycle and commit eligibility are already derived; keep the existing manual fallback and authority separation.
  - Extend managed-controller observation from `%s` to complete `%B`, parse only the stable message sections required by assertions, and add a dedicated unseen commit-quality holdout.
  - Promote the Skill through the existing packaged inventory, exact-name/default installation, TUI, clean-install, native-composition, and self-host dogfood surfaces.
- Boundaries:
  - Core/Manage owns RSP lifecycle, commit eligibility, and the exact allowed owner envelope.
  - `rsp-commit` owns local Git staging, message construction, commit execution, and post-commit receipt only.
  - Change, Group/archive, Specs, Decisions, project authority, Git history, and the cached diff remain source evidence; the commit message is a projection, not another workflow state store.
- Affected areas:
  - `skills/rsp-commit/`, `skills/rsp/`, `skills/rsp-manage/`, `rules/rsp-rules.md`, and the self-hosted `.rsp/rsp-rules.md` projection.
  - `src/commands/skills.ts`, `.agents/skills/`, package/readme inventory, and Skill installation/product-surface tests.
  - `scripts/managed-controller-eval.mjs`, its declarations, managed-controller holdouts, contract tests, and retained evaluation evidence.
  - `.rsp/specs/skill-system.md` and `.rsp/specs/distribution.md` after the behavior is implemented and verified.
- Constraints:
  - Preserve the current local closeout ceiling and the separation of lifecycle, commit, push, and release authority.
  - Preserve unrelated dirty and untracked work; stage only explicit owned paths and inspect the cached diff before commit.
  - Keep the default Skill compact, portable, host-neutral, and usable without hidden state or recursive orchestration.
  - Keep full verification evidence in RSP artifacts; project only durable outcome and boundary information into Git history.
  - Edit authored rules, build the CLI, then use `node dist/cli.mjs update` for the self-hosted fallback.

## Tasks
- [x] Add and contract-test the default `rsp-commit` Skill with RSP owner, authority, boundary, language, body, and trailer rules.
- [x] Integrate Core/Manage terminal commit routing and the equivalent unavailable-Skill manual fallback without changing lifecycle or external-action authority.
- [x] Add `rsp-commit` to packaged/default inventory, project installation, TUI/product documentation, self-host projections, and package validation.
- [x] Extend managed-controller Git observation and fixtures to evaluate complete messages, then retain a fresh real run for the Chinese-interaction/English-repository scenario.
- [x] Reconcile implemented stable facts into the owning Specs, sync generated fallback content, and run focused plus repository release gates.

## Verify
- Automated:
  - [x] `mise exec -- pnpm vitest run test/rsp-commit-skill-contract.test.ts test/rsp-core-routing-contract.test.ts test/managed-controller-contract.test.ts` — passed; proves Skill contract, Core/Manage ownership, full-message observation, retained evidence replay, and authority boundaries.
  - [x] `mise exec -- pnpm vitest run test/skills-install.test.ts test/project-skill-dogfood.test.ts test/daily-workflow-product-surface.test.ts test/clean-install-check.test.ts` — 21 tests passed; proves default inventory, exact package installation, self-host projection, and packed distribution.
  - [x] `mise exec -- pnpm run build && node dist/cli.mjs update && mise exec -- pnpm run lint` plus `mise exec -- pnpm vitest run --maxWorkers=1` — build/sync/lint passed and 50 files / 551 tests passed; serial workers avoided host-load timeouts observed in the unchanged parallel suite.
  - [x] `VITEST_MAX_WORKERS=1 mise exec -- pnpm run release:check` — passed metadata, build, typecheck, lint, 551 tests, and clean packed-install validation; package SHA-256 `876bc2db025b582e1b66d1d948dcbcbad7a29fff84bad563c1714305f8ac0b83` includes `rsp-commit` in the default inventory.
- Manual or environment:
  - [x] Retained run `commit-message-quality-product-gpt-5-6-sol-high-2026-07-26T13-44-44Z` passed in an isolated English-history fixture from a Chinese request: one exact-scope local commit, English Conventional subject, three body bullets, truthful `RSP-WorkRef`, 3/3 tests, clean worktree, and unchanged remote refs.
  - [x] Fresh native-design composition run `device-discovery-boundary-rsp-commit-inventory-2026-07-26` passed all Design/Implement/Review/Durable, exact-package, runtime-isolation, and external-verification gates against the complete twelve-Skill published inventory.
- Coverage:
  - History rewriting and remote delivery are intentionally omitted because they are outside this capability's authority.

## Blockers
- none
