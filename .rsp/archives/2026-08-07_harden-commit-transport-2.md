---
kind: "fix"
---

# Change: harden-commit-transport

## Proposal
- Outcome: Make structured local commit message transport preserve real multiline bodies across hosts.
- Why:
  - A quoted shell `git -m` argument can persist `\n` as literal characters instead of line breaks.
  - The current `rsp-commit` guidance detects the defect after the fact but does not provide a single executable transport path.
- Scope:
  - Add an explicit `rsp commit` command that commits the current staged boundary through Git stdin without a shell.
  - Require a message file as the command input, reject unintended literal `\n`, preserve the message with `--cleanup=verbatim`, and compare the complete committed message after success.
  - Add temporary-repository integration coverage for multiline preservation, literal escape rejection, and post-commit mismatch handling.
- Non-goals:
  - Do not stage files, infer WorkRef or commit authority, push, tag, publish, amend, rebase, force-push, or create a second repair commit.
  - Do not change commit subject/body conventions, trailer semantics, or the existing `rsp-commit` Skill ownership boundary.

## Spec
### ADDED
- Requirement: Explicit local commit execution must not depend on shell interpretation.
  - `rsp commit --message-file <path>` reads the prepared message and invokes `git commit --cleanup=verbatim -F -` through a direct child-process API.
  - The command operates only on the already staged boundary and stops when no staged changes exist.
- Requirement: Commit message integrity is checked before and after Git execution.
  - The prepared message must contain actual line breaks and must not contain an unintended literal `\n` sequence.
  - After a successful commit, the command reads the complete message from `HEAD` and compares it with the prepared message after the documented final-newline normalization.
  - Any mismatch returns a non-zero result and does not infer amend, second-commit, or other history-repair authority.

### Acceptance
#### Scenario: A structured body preserves multiple bullets
- GIVEN a repository with a staged change and a message file containing a subject, blank line, and three body bullets
- WHEN `rsp commit --message-file` executes
- THEN one local commit is created through a non-shell Git invocation
- AND the committed `%B` contains the three bullets on separate lines
- AND the committed message contains no literal `\n` sequence

#### Scenario: An escaped newline is rejected before commit
- GIVEN a staged change and a message file containing the literal characters `\n`
- WHEN `rsp commit --message-file` executes
- THEN the command exits non-zero before invoking Git
- AND `HEAD` and the staged boundary remain unchanged

#### Scenario: A post-commit message mismatch fails closed
- GIVEN the commit process succeeds but the observed complete `HEAD` message differs from the prepared message
- WHEN post-commit observation runs
- THEN the command returns a mismatch result
- AND it does not amend, create another commit, or mutate unrelated Git state

## Design
- Approach:
  - Add a narrow CLI command and command module using `execFile`/`spawn` with `git commit --cleanup=verbatim -F -`.
  - Compare the stored message exactly while allowing only one terminal LF difference in either direction at the Git message-file boundary; retain the actual message body unchanged.
  - Use a test-only temporary repository to exercise the public CLI path and inspect raw committed message bytes/lines.
- Boundaries:
  - `src/commands/commit.ts` owns direct Git execution and message-integrity checks.
  - `src/cli.ts` owns public argument routing only.
  - `test/commit.test.ts` owns observable CLI and Git integration coverage.
  - `skills/rsp-commit/SKILL.md` remains the authority and exact-scope staging contract; the new command does not infer its inputs.
- Affected areas:
  - `src/commands/commit.ts`
  - `src/cli.ts`
  - `test/commit.test.ts`
  - `skills/rsp-commit/SKILL.md`
  - `docs/site/en/reference/cli.md`
  - `docs/site/zh-CN/reference/cli.md`
- Constraints:
  - Preserve existing JSON/error output conventions and avoid shell-specific quoting.
  - Keep the command local-only and staged-boundary-only.
  - Do not expose secrets or copy commit-message content into diagnostics beyond necessary mismatch metadata.

## Tasks
- [x] Implement staged-boundary checks, message-file validation, direct stdin transport, and post-commit comparison.
- [x] Route `rsp commit --message-file <path> [--json]` through the CLI.
- [x] Add focused temporary-repository integration tests for success and fail-closed cases.
- [x] Update the `rsp-commit` Skill and bilingual CLI reference with the executable command contract, then run focused/full validation.

- [x] Resolve reopened concern: Fix terminal newline comparison before retrying local commit

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/commit.test.ts` — passed, 1 file / 4 tests; proves: the public command preserves multiline messages and rejects unsafe/mismatched transport.
  - [x] `mise exec -- pnpm run typecheck` — passed; proves: the new CLI and Git process boundary are type-safe.
  - [x] `mise exec -- pnpm run build` — passed; proves: the published CLI contains the command.
  - [x] `mise exec -- pnpm run test` — passed, 60 files / 719 tests; proves: the repository regression suite remains green.
  - [x] `node dist/cli.mjs check --focused --json` — passed with 0 errors / 0 warnings; proves: the Change remains structurally valid.
  - [x] `mise exec -- pnpm run docs:check` — passed, 7 bilingual page pairs / 30 Markdown files; proves: the bilingual CLI reference remains valid.
### Optional
- Manual or environment:
  - [x] `git diff --check` — passed; confirms no whitespace damage in the implementation, docs, or Skill.
- Coverage:
  - Contract tests remain focused on observable Git behavior; shell-specific `$'...'` behavior is not treated as product coverage.

- [x] `mise exec -- pnpm exec vitest run test/commit.test.ts` — passed, 1 file / 5 tests; proves: message files with and without a terminal LF both pass exact post-commit validation.

## Blockers
- none
