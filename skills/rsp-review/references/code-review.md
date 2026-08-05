# Code review

Load this reference only when the fixed reviewed artifacts make the Code pipeline applicable.

Check in this order:

1. Safety and correctness: reachable bugs, data loss, security violations, invalid state transitions, broken contracts, unsafe failures, and regressions.
2. Change and Spec fidelity: observable behavior against explicit intent and stable facts.
3. Project standards: only rules established by nearest instructions or authoritative local conventions.
4. Production reachability — hard gate before completing a seam-dependent Finding: when a Finding or suggested correction depends on an adapter, wrapper, validator, normalizer, or similar seam, name the direct production caller, compare its actual callee with that seam, and verify that the changed production consumer actually reaches that seam. Put the comparison in Evidence or Coverage. If the live path bypasses the seam, report the bypass and do not present an isolated seam fix as sufficient.
5. Regression evidence — hard gate before `clean`: for every changed Code artifact, compare public return and failure behavior at the comparison point with the reviewed diff. Changing failure delivery between throw/rejection, sentinel values, `null`, status codes, or result objects is always a failure-contract change, even when implementation matches the selected Change. Without a focused test or other explicit verification evidence, emit a Finding and return `issues_found`. Absence of a new test is not actionable by itself: apply the simple deterministic-correction exception when the public behavior shape is preserved and no risky branch, state transition, concurrency, persistence, security behavior, or failure delivery changes, even though the corrected value differs. The exception never applies to a failure-contract change.
6. Simplicity: unnecessary abstraction, duplication, indirection, dependency, or scope expansion with a concrete smaller alternative; never trade away required behavior.

Anchor each Finding to changed lines or the smallest behavior chain. State a realistic trigger and impact. Do not report formatting, naming, generated output, taste, or hypothetical cleanup without authority or demonstrated downside.
