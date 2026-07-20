## Review Scope

- Comparison: `HEAD` → current working tree
- Intent: ambiguous — `.rsp/focus.d/first` selects `.rsp/changes/first.md`, while `.rsp/focus.d/second` selects `.rsp/changes/second.md`; their required values conflict.
- Code: blocked
- Document: skipped
- Excluded: `.agents/skills/rsp-review/SKILL.md` is untracked tooling, not part of the `HEAD` diff or named review scope.

## Findings

### [P1] Conflicting focused Changes prevent intent selection

- Artifact kind: cross-artifact
- Axis: Change and Spec fidelity
- Location: `.rsp/focus.d/first`, `.rsp/focus.d/second`; `.rsp/changes/first.md:5`, `.rsp/changes/second.md:5`
- Authority: selected Change is required to define the intended delta.
- Evidence: one active focus requires returning the first value; the other requires returning the second value. The changed code returns `'new'`, which neither authority uniquely validates.
- Impact: correctness and regression review cannot be performed without guessing the required behavior.
- Suggested action: retain exactly one authoritative focus marker, or provide an explicit higher-priority Change/Group Brief.
- Confidence: high

## Coverage

- Inspected `git diff HEAD`: only `src/value.ts` changed (`'old'` → `'new'`).
- Inspected all local focus markers and their corresponding Change documents.
- No changed document artifacts to review.

## Verdict

blocked — resolve the competing RSP focus before reviewing the code.

