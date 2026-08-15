---
kind: "fix"
---

# Change: fix-tui-work-source-canonical-path

## Proposal
- Outcome: Allow the TUI Work document reader to accept an ordinary file reached through an operating-system ancestor path alias while preserving its no-symlink and replacement defenses.
- Why:
  - On macOS, `os.tmpdir()` returns a path under `/var` while `realpath` canonicalizes it to `/private/var`. The reader compares the canonical source path to the lexical input path and rejects a safe regular Change before bounded reading begins.
- Scope:
  - Compare a source's canonical path with the path expected beneath the canonical Changes root.
  - Preserve containment, regular-file, no-follow, identity, snapshot, size, and replacement checks.
  - Add portable regression coverage for an ancestor alias and retained rejection of a symlink inside the managed tree.
- Non-goals:
  - Do not permit a symlinked Changes root, a symlinked Work document, traversal, or path replacement during reading.
  - Do not modify managed execution, Focus Capsule, or unrelated TUI behavior.

## Spec
### MODIFIED
- Requirement: canonical containment distinguishes trusted ancestor aliases from managed-tree symlinks
  - The lexical Work path must first resolve through the bounded WorkRef model.
  - The canonical source must equal the same relative Work path beneath the canonical Changes root and remain contained by that root.
  - Post-read checks require the canonical root and source, file identity, and snapshot to remain unchanged.

### Acceptance
#### Scenario: a safe file is reached through an ancestor alias
- GIVEN the Changes root and source are regular paths whose ancestor has a lexical alias to the same canonical directory
- WHEN the TUI reads an exact Change or Group Brief
- THEN the bounded document is returned without weakening managed-tree symlink checks

#### Scenario: a managed-tree symlink remains unsafe
- GIVEN a Work path or managed subtree entry resolves through a symlink inside the canonical Changes root
- WHEN the TUI attempts to read it
- THEN the reader returns `work_document_unsafe` before exposing content

## Design
- Approach:
  - Derive `expectedRealSource = resolve(realRoot, relative(changesDir, sourcePath))` after lexical WorkRef validation, and compare `realSource` to that canonical expected path rather than to `sourcePath`.
  - Retain the pre-read canonical source and require the post-read canonical source to match it.
- Boundaries:
  - `resolveWorkRefPath` owns lexical identity validation; `readWorkDocument` owns canonical containment and time-of-check/time-of-use protection.
- Affected areas:
  - `src/tui/work-source.ts`
  - `test/tui/work-source.test.ts`
- Constraints:
  - Do not replace `lstat`, `O_NOFOLLOW`, inode/snapshot checks, or canonical containment with string normalization alone.

## Tasks
- [x] Correct canonical source comparison without widening the managed Work path boundary.
- [x] Add regression coverage for ancestor aliases and rerun focused plus aggregate verification.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/tui/work-source.test.ts` — 3 / 3 tests passed; proves: ancestor aliases, safe bounded reads, size limits, managed-tree symlink rejection, and replacement detection.
  - [x] `mise exec -- pnpm run typecheck` and `mise exec -- pnpm run lint` — passed; proves: type and style compatibility.
  - [x] `mise exec -- pnpm run test` — 71 files / 780 tests passed; proves: the prior aggregate blocker is removed without regression.
### Optional
- Manual or environment:
  - [ ] Run on a platform whose temporary directory has no ancestor alias.
- Coverage:
  - Covers lexical/canonical path aliases and managed-tree symlink safety; it does not change filesystem guarantees outside the existing bounded reader.

## Blockers
- none
