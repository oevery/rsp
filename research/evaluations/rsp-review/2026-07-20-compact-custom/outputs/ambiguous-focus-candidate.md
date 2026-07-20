## Review Scope

- Comparison: `HEAD` (`2e1c40a761496ce479b7cd83c4b2c33166e969b4`) vs current working tree
- Intent: ambiguous — `.rsp/focus.d/first` selects Change `first` (“Return the first value”), while `.rsp/focus.d/second` selects Change `second` (“Return the second value”)
- Code: blocked
- Document: skipped
- Excluded: `.agents/` untracked skill installation; no user-named untracked artifact is in review scope

## Findings

None; code judgment is blocked because the two authoritative focus markers select incompatible intents.

## Coverage

- Inspected the complete tracked diff: `src/value.ts` changes `'old'` to `'new'`.
- Did not judge correctness, fidelity, or coverage against either Change because no unique authoritative intent can be selected.

## Verdict

blocked — resolve the conflicting focus markers to one Change, then rerun the review.