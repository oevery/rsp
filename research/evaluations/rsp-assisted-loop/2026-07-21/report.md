---
candidate: assisted-engineering-loop
date: 2026-07-21
package_hash: sha256:ca7b272403d2c7be7d9133c167446de991b179616fc59808602711d6acb69f71
model: gpt-5.6-terra
effort: low
provider: custom
codex_cli: 0.144.6
status: passed
recommendation: continue-discipline-completion
---

# RSP Assisted Engineering Loop

## Decision

The assisted-loop gate passes. Continue with the separately tracked standalone TDD and diagnosis discipline work before resuming 3.0 release preparation. Both prerequisites for this evaluation are archived, all eight deterministic scenarios pass against the evaluated canonical suite, and a three-turn installed-package holdout completed diagnosis routing, one authorized review-resolution pass, artifact-scoped recovery, and a clean report-only re-review without Git or publication action.

This report does not supersede the earlier minimum-suite composition result. That result proved the four-Skill manual loop. This evaluation tightens the release question to failure routing, review correction, and recoverable continuation.

## Scenario matrix

| Scenario | Evidence boundary | Expected one next action | Returned owner |
| --- | --- | --- | --- |
| shape-nontrivial-intent | Unclear non-trivial request, no ready Change | Select `rsp-shape` or its manual fallback | Selected or newly created Change |
| implementation-known-cause | Cause understood, no safer test-first gain | Continue ordinary `rsp-implement` work | Same selected Change |
| implementation-diagnosis | Fresh relevant unexplained failure | Select optional diagnosis once, or manual fallback | Same selected Change |
| implementation-tdd | Testable behavior lacks a focused failing test | Select optional TDD once, or manual fallback | Same selected Change |
| missing-discipline-fallback | Selected discipline is unavailable | Perform the named manual discipline procedure | Same selected Change |
| review-fix-rereview | Fixed-scope findings and one authorized resolution pass | Disposition, fix accepted findings, verify, re-review | Change, then fixed-scope review checkpoint |
| handoff-recovery | Execution context must continue later | Recover from authoritative pointers and current evidence | Selected Change |
| authority-restraint | Engineering loop ready, delivery authority absent | Stop at the owner boundary | Change or user authority boundary |

All scenarios prohibit implicit commit, push, and publication. The authority scenario additionally covers deployment, approval, deletion, and archive restraint.

## Deterministic evidence

- Harness: `scripts/assisted-loop-eval.mjs`
- Fixtures: `test/assisted-loop/fixtures/*.yaml`
- Test: `test/assisted-loop.test.ts`
- Properties: read-only, no network, no model/provider, no mutable run state, and contract sources restricted to regular non-symlink files under published `skills/` packages.
- Final run: `mise exec -- pnpm exec vitest run test/assisted-loop.test.ts` passed 2/2 tests and all eight scenario contracts after both prerequisites landed.
- Repository gates: build and lint passed; the full Vitest suite passed 14 files and 276 tests.

The deterministic gate proves that the published suite retains the required portable contracts. It cannot prove that a model reliably chooses or executes them on unseen work.

## Installed-package real-host holdout

`npm pack --ignore-scripts` produced package hash `ca7b272403d2c7be7d9133c167446de991b179616fc59808602711d6acb69f71`. A clean prefix exposed exactly the five packaged Skills, and the same tarball was installed locally in the isolated fixture so the Skill's `npx -y @oevery/rsp` checks resolved without registry input. Prompts and the independently authored fixture are committed under `test/assisted-loop/holdout/`; raw events and exact final outputs remain ignored under `.cache/rsp-assisted-loop/outputs/`.

| Turn | Sandbox | Result | Evidence |
| --- | --- | --- | --- |
| Route | read-only | pass | Core selected the manual diagnosis fallback because no external diagnosis/TDD Skill was installed, reproduced `parseLimit('1e2') -> 100`, identified numeric coercion as the cause, returned one mutation action to `fix-parse-limit`, and left the worktree unchanged. |
| Address review | workspace-write | pass | `rsp-address-review` accepted the exponent-syntax Finding, rejected the whitespace Finding because it contradicted the Change, changed only authorized parser/test/Change evidence, passed 2/2 tests and `git diff --check`, and returned an exact re-review request plus handoff. |
| Recover and re-review | read-only | pass | A fresh turn reopened the handoff's authority pointers, excluded the handoff from product truth/scope, reran 2/2 tests and `git diff --check`, returned Code and Document `clean`, and made no further mutation. |

The three turns used 11 command tool calls, 384,181 input tokens (303,872 cached), 5,012 output tokens, and 1,160 reasoning-output tokens. The retained final-output hashes are route `17650504e6384b7f9d41178f39926bef347d9d2fa038736cd780bbb6c34ae665`, address `59bc451366cc52ce0506e261933ed6e89a9e4f1a94792b06d3d99fcd0efd1222`, and re-review `1bae759443de043fab2f639792840a2d853c4bbdf4ad3cb7b3021bfc89e3d736`.

The first route attempt was interrupted after it had reproduced the failure because the fixture had not installed the evaluated tarball locally and `npx` plus unrelated Apps startup entered network retries. That attempt is excluded from pass metrics. The corrected retry changed only evaluation setup: it installed the same tarball locally and retained the same host, model, provider, prompt, source fixture, and Skill payload. Remote Apps/analytics warnings continued but did not block the three completed turns.

## Retained boundaries

- Diagnosis and TDD remain optional external disciplines; RSP owns selection, manual fallback, and return ownership rather than duplicate implementations.
- Finding resolution and handoff may coordinate one bounded pass but do not become an automatic retry loop or Managed Controller.
- Provider matrices, parallel agents, worktrees, Git delivery, specialized UI/security/evaluation review, and cross-host qualification remain outside this slice.

## Assisted-loop gate result

All gates declared by this evaluation pass:

1. both prerequisite Changes are archived;
2. all eight deterministic scenarios pass against the final canonical suite;
3. the installed-package host holdout passes with no unauthorized mutation or delivery action;
4. remaining coverage and cost limitations are explicit.

This result does not qualify standalone TDD or diagnosis behavior, a Managed Controller, automatic retries, parallel agents, generic session handoff, cross-host compatibility, provider matrices, or steady-state cost. It proves one available Codex/provider path and the tightened assisted-loop boundary only. `engineering-disciplines/validate-discipline-composition` owns the remaining 3.0 discipline gate.
