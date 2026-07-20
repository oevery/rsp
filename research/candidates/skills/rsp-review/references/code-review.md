# Code Review

Apply this pipeline to executable behavior. Use the fixed comparison scope from `SKILL.md`; do not recompute or widen it.

## Axes

Review in this order:

1. **Safety and correctness — hard gate.** Find concrete bugs, data loss, security violations, invalid state transitions, broken contracts, unsafe failure behavior, and regressions reachable in the reviewed scope.
2. **Change and Spec fidelity.** Compare observable behavior with the selected Change, relevant stable Specs, and explicit acceptance scenarios. Report missing authority rather than guessing.
3. **Project standards and regression coverage.** Apply only standards found in nearest project instructions or established local patterns. When the diff changes an externally observable contract, branch, state transition, or failure path, require a focused test or other explicit verification evidence; report the uncovered behavior as a finding unless an authority consciously accepts the gap.
4. **Implementation simplicity.** Only after the preceding axes, identify unnecessary abstraction, duplication, indirection, dependency, or scope expansion with a concrete smaller alternative. Never trade away safety, correctness, validation, accessibility, compatibility, or required behavior.

## Finding discipline

- Anchor every finding to a changed line or the smallest cross-file behavior chain needed to prove it.
- Explain a realistic trigger and impact. A preference without an authority or demonstrated downside is not a finding.
- Keep missing tests as findings only when they expose a meaningful unverified behavior or regression path. A changed public return shape or failure contract is meaningful even when the implementation matches the selected Change.
- Do not flag generated output, formatting, naming, or style unless the project makes it authoritative or it causes a concrete defect.
- Use P0 for critical data/security/breakage, P1 for normal-path contract failure, P2 for meaningful edge or maintenance risk, and P3 only for narrow actionable improvements.

## Pipeline result

- `issues_found`: at least one actionable Code finding.
- `clean`: Code scope was reviewed and no actionable finding remains.
- `skipped`: no Code artifacts were in the fixed scope.
- `blocked`: Code scope or required authority could not be fixed.
