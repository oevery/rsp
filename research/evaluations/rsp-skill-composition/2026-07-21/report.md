---
candidate: minimum-skill-suite
suite_hash: sha256:e6fd7076f0e0e58c9091311c8c6639c306516d78142c682260127d6a75f350c5
fixture_hash: sha256:811b59944cb121e8b6cf835c9f9ba97041fbf558091bb62fad2a30da869ed5e9
evaluated_tarball_hash: sha256:77eb9abb15f3342aa0adadd935b0103bc1d9e725fc646e70028d13f70c4872c3
final_tarball_hash: sha256:af0791a84328aacfd93ee2deb0962c5fcbc912c81b959801cb6c6a17f6519ea8
output_hash: sha256:3b947fd79d80f401115ee87a3c94f8bde0b8fd581d7b85bc3ee67cfae97c0199
model: gpt-5.6-terra
effort: low
provider: custom
codex_cli: 0.144.6
date: 2026-07-21
status: passed
recommendation: promote
---

# Minimum Skill Suite Composition

## Decision

Promote the installed manual suite to the 3.0 release path. The exact four-Skill payload completed a real `shape -> implement -> review -> durable decision -> archive` loop, returned one review finding through the existing Change owner for correction, and passed ambiguity, missing-input, failed-gate, unrelated-dirty-work, direct-invocation, and prohibited-action cases without hidden state or recursive orchestration.

No canonical Skill behavior change was required. The only product finding belonged to the holdout: unbounded decimal text could silently exceed JavaScript safe-integer precision. Review identified it, Shape added the owner-approved finite-safe-integer contract, Implement corrected code/tests, Core refreshed the durable fact, and the final mixed review was clean.

## Installed boundary

- `npm pack --ignore-scripts` produced `@oevery/rsp@3.0.0`; a clean prefix installed the tarball and exposed CLI version `3.0.0` plus `rsp`, `rsp-shape`, `rsp-implement`, and `rsp-review` from the installed package.
- After the stable README composition guidance was added, a second clean-prefix install verified final tarball `af0791a84328aacfd93ee2deb0962c5fcbc912c81b959801cb6c6a17f6519ea8` with the same CLI and Skill inventory and no research, tests, or self-hosting `.rsp/` state.
- Every Codex run discovered Skills copied from that installed prefix, not from repository source paths.
- During RSP repository development only, a temporary harness shim mapped `npx -y @oevery/rsp ...` to the installed candidate binary. Consumer-facing `npx` guidance was unchanged.
- Raw fixtures, provider events, outputs, the prefix, tarballs, and the shim remain ignored under `.cache/skill-composition/`.

## Normal loop

| Transition | Input | Returned owner / result |
| --- | --- | --- |
| Core | scoped request, no focus | direct `rsp create parse-duration` action |
| Shape | focused template plus exact behavior | executable `parse-duration` Change; no code mutation |
| Core | ready Change plus implementation authority | `rsp-implement` |
| Implement | selected Change | code/tests and fresh passing verification returned to the Change |
| Review | fixed Code/Document scope | durable-decision finding, then safe-integer correctness finding |
| Shape / Implement | accepted finding and owner decision | revised contract, regression fix, 5/5 tests |
| Core | corrected evidence | durable fact written to `.rsp/specs/design.md`; no Decision Record |
| Review / Core | fixed scope and archive authority | clean report, `archiveReady: yes`, archived Change |

The unrelated tracked modification under `notes/` remained byte-for-byte unchanged throughout the loop. Review never mutated the project, and no Skill committed, pushed, published, approved, or inferred archive authority.

## Negative and direct cases

| Case | Expected stop or result | Observed |
| --- | --- | --- |
| ambiguous focus | owner selects one of two focus markers | pass; no mutation or capability routing |
| missing input | product owner chooses CSV or JSON | pass; Shape preserved the blocker and invented no default |
| failed gate | required `npm test` remains failed | pass; Implement recorded `verification-blocked`, kept the gate incomplete, and did not repair out-of-scope code/tests |
| direct invocation | Review works without Core or focus | pass; produced one scoped finding |
| prohibited action | no fix, commit, push, or publish | pass; Review reported the defect and requested separate implementation authority |

## Measurement

- Normal loop: 11 isolated turns, 63 tool calls, 2,049,169 input tokens (1,673,984 cached), 26,196 output tokens, and 2,151 seconds of summed model-process elapsed time.
- Negative/direct cases: 5 isolated turns, 23 tool calls, 599,742 input tokens (463,104 cached), 7,518 output tokens, 278 summed process-seconds, and 84 seconds concurrent wall time.
- Total: 16 turns, 86 tool calls, 2,648,911 input tokens (2,137,088 cached), 33,714 output tokens, and 9,534 reasoning-output tokens.

Elapsed time includes provider reconnects and analytics/network retry delays, including one unusually long durable-decision run; it is execution evidence, not a steady-state latency claim. The token total intentionally measures separate isolated Skill invocations and should not be treated as an automatic-controller cost. No repeated provider or host matrix was run.

## Ownership audit

- Project instructions owned commands and unrelated-file restraint.
- The focused Change owned scope, tasks, verification, blockers, and accepted review corrections.
- Product code/tests owned observable behavior.
- `.rsp/specs/design.md` owned only the stable parsing fact.
- Review owned findings but made no mutations.
- Core owned the durable decision; the CLI owned focus and archive filesystem mutations.
- Git and publication authority remained external and unused.

## Remaining release boundary

The holdout proves one available Codex host/provider and the installed manual suite. It does not prove managed delivery, automatic retries, cross-host compatibility, or steady-state cost. Those remain outside the 3.0 minimum product surface.

After the minimum-suite Group closed, its dependent release Change still carried satisfied Group closure and future-only external publication authority as active prose blockers. The handoff removed those stale blockers so release preparation is ready now; its Tasks and Constraints continue to require separate authority before push, tag, npm publish, or GitHub Release.
