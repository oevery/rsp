## Review Scope

- Comparison: `HEAD` → current working tree
- Intent: `.rsp/changes/run-result.md` — failures return `{ ok: false, error }`; user documentation must describe that result.
- Code: clean
- Document: issues_found
- Excluded: `.agents/skills/rsp-review/**` untracked review-skill files, not part of the `HEAD` diff.

## Findings

### [P1] User documentation describes a different failure result

- Artifact kind: cross-artifact
- Axis: Change and Spec fidelity / coherence
- Location: `docs/usage.md:3`
- Authority: `.rsp/changes/run-result.md:5`
- Evidence: `src/run.ts:2` returns `{ ok: false, error: 'failed' }`, but the documentation says “Returns zero on failure,” rather than describing the result object.
- Impact: Consumers may implement failure handling as a numeric return-value check and miss the `ok`/`error` contract.
- Suggested action: Document that failures return an object with `ok: false` and an `error` value.
- Confidence: high

## Coverage

- Code: reviewed the changed failure path against the focused Change; implementation matches the required result shape.
- Document: reviewed the changed user-facing claim against the Change and implementation; found one contract contradiction.
- No test suite or project test command is present in the reviewed `HEAD` tree; no runtime validation was performed.

## Verdict

findings — correct `docs/usage.md` to state the failure result object.
