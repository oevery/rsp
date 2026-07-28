---
kind: "feature"
---

# Change: project-language-and-unicode-workrefs/unicode-workrefs

## Proposal
- Outcome: Allow safe canonical Unicode names such as Chinese WorkRefs and archive filenames across the complete RSP lifecycle while preserving existing ASCII identities unchanged.
- Why:
  - ASCII-only lowercase kebab-case forces non-English projects to translate machine-visible filenames and WorkRefs before they can use RSP.
  - WorkRef is consumed by more than the filesystem, so partial regex relaxation would create identity drift across focus, dependencies, Groups, archives, history, and reopen.
- Scope:
  - Define one canonical Unicode WorkRef segment validator and reuse it across every open, Group, dependency, archive, history, and reopen consumer.
  - Normalize accepted user input and discovered managed paths consistently, reject unsafe or non-canonical collisions, and retain the flat-or-one-Group model.
  - Preserve Chinese WorkRef segments in filenames, focus markers, dependency lines, archive filenames, history output, and structured results.
- Non-goals:
  - Spaces, arbitrary punctuation, recursive Groups, localized reserved names, automatic translation/transliteration, or renaming existing work/history.
  - Localizing Markdown section headings, CLI diagnostics, machine keys, kind values, or dependency keywords.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: WorkRef segments accept a bounded safe Unicode identifier grammar.
  - A segment may contain Unicode letters, marks, and decimal numbers plus internal hyphens; it cannot be empty, start/end with a hyphen, contain whitespace/path separators/dots/control characters, or use reserved `brief`/`00-brief` identities.
  - Accepted identities use Unicode NFC normalization consistently. Non-canonical input is normalized at command ingress; discovered stored paths that are non-canonical or collide after normalization fail closed.
  - ASCII lowercase kebab-case remains valid with unchanged paths and output.
- Requirement: Every WorkRef consumer observes one exact Unicode identity.
  - Create, Group declaration, focus/unfocus, status/check/doctor, dependencies/waves, archive/group close, history filters/detail, and reopen accept and return the same normalized WorkRef.
  - Archive filenames remain `YYYY-MM-DD_<base>.md`, preserving the normalized Unicode base and existing collision suffix behavior.
  - Grouped Unicode children retain exactly one Group level and archive under the matching Unicode Group directory.
- Requirement: Managed-path safety remains fail-closed.
  - Unicode support does not permit symlinks, special entries, traversal, absolute paths, normalization collisions, unsupported depth, or file/directory identity collisions.
  - Invalid identity diagnostics remain bounded and structured.

### Acceptance
#### Scenario: Chinese Group child completes the lifecycle
- GIVEN Group `听说训练` declares child `听说训练/模拟朗读`
- WHEN the child is created, focused, checked, archived, queried from history, and reopened
- THEN every command uses the same Unicode WorkRef and the archive filename preserves `模拟朗读`

#### Scenario: unsafe or colliding Unicode identity fails closed
- GIVEN a WorkRef contains a separator, whitespace, non-NFC stored path, reserved name, or normalization-equivalent collision
- WHEN RSP resolves or inspects it
- THEN no managed mutation occurs and a stable diagnostic identifies the invalid identity boundary

## Design
- Approach:
  - Move segment normalization/validation into one shared WorkRef identity module and replace duplicated ASCII regexes in history and dependency consumers.
  - Use Unicode property escapes with explicit NFC normalization and deterministic exact comparisons; keep reserved ASCII protocol tokens stable.
  - Validate command input before joining paths and validate discovered entry names before interpreting files or directories.
- Boundaries:
  - WorkRef identity owns normalization and grammar; managed-path inspection continues to own containment, no-follow, and regular-file safety.
  - Archive/history reuse WorkRef identity instead of maintaining separate path grammars.
- Affected areas:
  - `src/core/work-ref.ts`, `src/core/change-group.ts`, `src/core/dependency-plan.ts`
  - `src/history/**`, `src/commands/history.ts`, archive/reopen/focus/status/check/doctor callers
  - `.rsp/specs/core-model.md`, `.rsp/specs/cli-contracts.md`
  - WorkRef, Group, dependency, lifecycle, history, and cross-platform path tests
- Constraints:
  - One canonical validator must replace, not supplement, duplicated consumer regexes.
  - Existing ASCII worktrees and archives remain byte-for-byte stable.
  - Stored non-canonical identities are diagnosed rather than silently renamed by doctor/update.

## Tasks
- [x] Define shared Unicode normalization, segment grammar, reserved-name, and collision behavior with focused unit tests.
- [x] Route open work, Group membership, focus, and dependency parsing through the shared identity contract.
- [x] Route archive inspection/naming, history arguments/query, and reopen through the same identity contract.
- [x] Add lifecycle integration tests for flat and grouped Chinese WorkRefs plus unsafe, non-canonical, and collision cases.
- [x] Update durable Specs and user-facing command guidance for Unicode WorkRefs without rewriting legacy artifacts.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/work-ref.test.ts test/history-query.test.ts test/integration.test.ts` — 208 tests passed; proves: shared grammar, complete flat and grouped Unicode lifecycles, validated archive dependencies, Groups, archive/history, and backward compatibility
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run lint` — passed; all changed identity consumers compile and lint against the shared contract
  - [x] `mise exec -- pnpm run test` — 593 tests passed after review correction; proves: the validated archive-dependency path and final integrated tree preserve the complete repository behavior suite
  - [x] `git diff --check` — passed; changed files contain no whitespace errors
- Manual or environment:
  - [x] In a temporary project, create Group `听说训练`, create/focus/check/status/archive/history/reopen `听说训练/模拟朗读`, then project `requires` for `听说训练/听后选择` — every path, record, edge, archive filename, and reopened focus preserved the exact Unicode identity
- Coverage:
  - Filesystems that rewrite Unicode normalization behind Node's observed directory entries remain diagnosed rather than automatically repaired.
  - Durable current facts were written to `.rsp/specs/core-model.md` and `.rsp/specs/cli-contracts.md`; no Decision Record is needed because the accepted normalization grammar and limits are fully represented as current constraints.

## Blockers
- none
