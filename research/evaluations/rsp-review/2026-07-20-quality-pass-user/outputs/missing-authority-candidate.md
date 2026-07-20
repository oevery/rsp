## Review Scope

- Comparison: `HEAD` (`13877da`) against current working-tree diff
- Intent: No Change, Spec, or project instruction in the reviewed scope defines a behavior change.
- Code: issues_found
- Document: skipped
- Excluded: untracked `.agents/` skill files; they are review tooling, not part of `git diff HEAD`.

## Findings

### [P1] `null` input now throws instead of returning the documented sentinel

- Artifact kind: code
- Axis: regression evidence / failure contract
- Location: `src/name.ts:2`
- Authority: `displayName` accepts `string | null`; at `HEAD`, `null` returned `''`.
- Evidence: `value!.trim()` dereferences `null`, causing a runtime `TypeError`.
- Impact: Any normal caller passing `null` now fails rather than receiving an empty display name.
- Suggested action: Preserve the established `null` behavior, or add explicit authority and focused verification for the new failure contract.
- Confidence: high

## Coverage

- Checked the complete tracked diff from `HEAD`: `src/name.ts`.
- Compared the public behavior at `HEAD` and the changed implementation.
- No tests, Change, Spec, or other project authority were present to establish an intended trimming requirement or verify the changed null behavior.

## Verdict

findings — restore or explicitly authorize and test the changed `null` contract before delivery.