---
candidate: rsp-engineering-disciplines
date: 2026-07-21
package_hash: sha256:df0bfdc41e2c8aac5e9c9a67ad9c410c233e662ba4fa6999cbad907049e91b4a
model: gpt-5.6-sol
effort: low
provider: custom
status: passed
recommendation: resume-release-preparation
---

# RSP Engineering Disciplines

## Decision

The installed engineering-discipline gate passes. Resume 3.0 release preparation.

The exact packed suite exposed seven canonical Skills: `rsp`, `rsp-shape`, `rsp-implement`, `rsp-diagnose`, `rsp-tdd`, `rsp-review`, and `rsp-address-review`. Six deterministic composition cases passed, and fresh installed-package holdouts demonstrated both a non-corrective confirmed diagnosis and a complete RED-GREEN-REFACTOR return to one selected Change without Git, review, archive, or publication action.

This result qualifies concise RSP-owned diagnosis and TDD contracts on one available Codex/model/provider path. It does not qualify generic debugging/testing completeness, special flaky/concurrency/performance branches, framework matrices, other hosts/providers, controller retries, parallel agents, or steady-state cost.

## Deterministic composition

- Harness: `scripts/discipline-composition-eval.mjs`
- Fixtures: `test/discipline-composition/fixtures/*.yaml`
- Test: `test/discipline-composition.test.ts`
- Cases: diagnosis routing, TDD routing, diagnosis-before-TDD precedence, ordinary implementation, missing-capability fallback, and authority restraint.
- Fixture-integrity checks independently prove that the diagnosis input starts red and the TDD input starts without the acceptance test or production correction.
- Final focused composition and shared contract run: 4 files and 14 tests passed.

These checks prove the packaged prose retains the intended routing and boundary contracts. The real-host holdouts below, not source fragments, provide the behavioral evidence.

## Exact package and isolation

`npm pack --ignore-scripts` produced `@oevery/rsp@3.0.0`, 16 files, and package hash `df0bfdc41e2c8aac5e9c9a67ad9c410c233e662ba4fa6999cbad907049e91b4a`. A clean local prefix exposed exactly the seven Skills above. Both workspaces installed that same tarball locally and copied only its packaged Skills into `.agents/skills`; no registry package supplied runtime behavior.

The final TDD confirmation began from committed fixture `47055931599b10f12fee4b67f99740f92e105ab1` with no tracked drift. Raw events, workspaces, installed dependencies, and final outputs remain ignored under `.cache/rsp-engineering-disciplines/final/`.

## Fresh installed-package results

| Holdout | Sandbox | Result | Evidence | Cost |
| --- | --- | --- | --- | --- |
| Diagnosis | read-only | pass | Reproduced empty-mode failure; distinguished absent, empty, whitespace, and explicit inputs through the production function; confirmed the nullish-default boundary; returned one correction entrypoint to `fix-empty-mode`; no tracked mutation. | about 45 seconds; 6 commands; 145,020 input tokens, 129,280 cached; 1,698 output; 272 reasoning |
| TDD clean confirmation | workspace-write | pass | Started tracked-clean; added only the focused acceptance test; observed RED for `abcdefgh` versus `abcdefg…`; made the minimum GREEN edit; skipped unjustified REFACTOR; passed fresh 2/2 tests, length check, and diff check; updated the same Change only. | about 96 seconds; 5 commands; 3 authorized file changes; 186,215 input tokens, 158,720 cached; 1,999 output; 239 reasoning |

Successful final turns totalled 11 command calls, 331,235 input tokens (288,000 cached), 3,697 output tokens, and 511 reasoning-output tokens. Final-output hashes are diagnosis `40a1403e807f4b34a0718e4b2ed328f16a2be48d0a407d86a36a7bf4dd889e41` and TDD `94a017b714b219adc28c6c46ed90cc75ea9a2be202ff93e53c264ceaecd3e567`.

## Interrupted and conflict-restraint evidence

The first TDD workspace was not a pure setup-unavailable run. Remote Apps/plugin/MCP retries made host progress opaque, but the raw events show that the model entered the task, added the focused test, observed the expected RED, made the minimum production edit, and reached GREEN. The evaluator interrupted the process after about 124 seconds before Change writeback and final return. It had made four command calls and two authorized file changes; the incomplete turn emitted no trustworthy token total and is excluded from pass metrics.

A corrected invocation disabled the confirmed-unrelated Apps, plugin, browser, memory, and multi-agent host surfaces but mistakenly reused that dirty workspace. The model detected the existing test and production correction, refused to manufacture a historical RED by reverting them, left the TDD Task incomplete, recorded only fresh GREEN evidence, and returned the same Change without delivery action. That restraint turn used four commands, one Change-only evidence update, 126,260 input tokens (109,056 cached), 2,315 output tokens, and 969 reasoning-output tokens. It is retained as positive conflict evidence, not counted as the final TDD success.

The final bounded confirmation therefore used a newly constructed workspace from the same committed immutable fixture, tarball, prompt, model, and effort. No further attempt was needed.

## Concision, overlap, and omissions

- `rsp-diagnose` and `rsp-tdd` are independently selectable. Core names only the one evidenced next action; Implement detects a route change and returns the seam instead of reproducing the discipline or invoking it recursively.
- Core-only operation still has compact manual fallbacks. This preserves removable composition without claiming that fallback equals the standalone capability.
- The final holdouts showed no diagnosis/TDD/Implement ownership conflict: diagnosis stopped before correction, while TDD stayed within its test, production, and Change evidence scope.
- Host analytics warnings remained after optional surfaces were disabled. They did not alter the final tasks, but the interrupted run demonstrates that host startup/network overhead can dominate latency and confuse progress observation independently of Skill length.
- The high input totals are mostly cached host/context traffic and are not a Skill-body cost measurement. This gate supports the concise contracts over a Superpowers-style always-on workflow, but it is not steady-state cost qualification.

## Repository gates

- `mise exec -- pnpm run build`: passed.
- `mise exec -- pnpm run lint`: passed.
- `mise exec -- pnpm run test`: 18 files and 287 tests passed.
- `node dist/cli.mjs check --focused`: all focused Changes valid.
- `git diff --check`: passed.

## Release recommendation

Resume `release-3-0-0`. The seven-Skill engineering suite now satisfies the declared installed-package discipline gate without importing upstream tutorials, always-on routing, hidden state, recursive orchestration, or implicit delivery authority. Keep specialized diagnosis/testing branches, Managed Controller, cross-host/provider matrices, and repeated cost calibration outside this gate and describe them as retained limitations rather than completed capability.
