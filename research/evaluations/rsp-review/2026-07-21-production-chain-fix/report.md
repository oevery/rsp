---
candidate: rsp-review
candidate_version: "2026.07.21.1"
candidate_hash: sha256:dff00bd09e8bb6244ab73115d3038aad1a14c8aa8bee4598d173ea27322bc916
fixture_hash: sha256:230ec360f5d91f2c4cee67606d0dc8d5528cb7bb836385e6817e6bb8ae9489cd
harness_hash: sha256:0616e6261867a90e7e95523d20708539304ff01fb35bd5dad819877894a8dc9b
model: gpt-5.6-terra
effort: low
provider: user-default
config_source: user
date: 2026-07-21
status: complete
quality_status: passed-with-release-cost-risk
recommendation: ship-correctness-fix-and-recheck-cost-at-composition
---

# RSP Review Production-Chain Fix

## Decision

Ship the bounded correctness revision. A seam-dependent Finding is now incomplete until the reviewer names the direct production caller, compares its actual callee with the seam, and records whether the live path reaches or bypasses it. The same revision makes authority-only Document scope mechanically `skipped` and preserves the simple deterministic-correction exception when missing tests are not independently actionable.

The final candidate fixes the reproducible `real-stateful-media-round-2` miss without a domain checklist, fixed response token, new reference file, or broader repository-discovery strategy.

## Diagnosis

The retained `2026-07-20-real-derived` output diagnosed provider-abort normalization but suggested an adapter-only correction while `MediaWorkflow` called the provider directly. A first general reminder and a later checklist-position change remained stochastic. Failed runs had read both files and searched `generateWithProvider`; the missing operation was synthesis, not discovery.

The final rule therefore makes caller-to-seam comparison part of Finding completion. Repeated evaluation also exposed two existing stochastic failures: authority-only documents reported as `clean`, and a shape-preserving boolean correction reported only for lacking a new test. Both were repaired by strengthening existing classification and restraint gates rather than adding fixture-specific exceptions.

## Final Behavior Evidence

- Final candidate hash: `dff00bd09e8bb6244ab73115d3038aad1a14c8aa8bee4598d173ea27322bc916`.
- Static Skill contract went red before each missing rule and green after the correction.
- The preceding production-reachability identity `48b134dd5fc6a92ae973145a964d5fcae3a0b79dd597220b8db88a2d61cda5ec` reported the R2 bypass in three consecutive targeted runs with stable identity, complete usage, zero timeout, and zero mutation.
- The final identity retained the same reachability rule and passed a fresh R2 run, explicitly tracing `BatchRunner -> MediaWorkflow -> provider.generate` as bypassing `generateWithProvider`.
- The final identity passed two consecutive data-plane runs with `Document: skipped` and two consecutive simple-correction runs with `Code: clean`, `Document: skipped`, and no invented missing-test Finding.
- All final targeted runs used the read-only sandbox, retained stable candidate/fixture/harness identity, reported usage, and left before/after worktree state unchanged.

The final risk-selected paired matrix for the immediately preceding identity completed 12/12 processes with fixed identities, complete usage, zero timeout, and zero mutation. Its semantic review drove the last two classification/restraint corrections; it is diagnostic evidence, not evidence for the final hash.

## Cost and Remaining Release Risk

A three-repetition six-case calibration on the immediately preceding identity completed all three matrices with fixed identities and no process issue. Aggregate median input overhead was `27.53%`, within the `30%` threshold. `real-stateful-media-round-3` had a `51.77%` median, narrowly above the `50%` per-case threshold, with highly variable samples (`27.61%`, `51.77%`, `102.85%`). The calibration is therefore recorded as failed and is not relabeled or rerun until it passes.

The final wording adds classification and restraint clarity after that calibration, so no fresh repeated cost claim is made for the final hash. Composition/release must reassess whether the clean stateful case's additional inspection cost is acceptable; correctness, scope, identity, and mutation gates for this fix are complete.

## Validation Boundary

- Agent Skills schema, focused contract/behavior tests, build, typecheck, lint, focused RSP check, package boundary, and staged-snapshot full tests are release gates for the commit.
- Raw provider events and temporary workspaces remain ignored under `.cache/`; this report retains only normalized facts and hashes.
- Evidence covers one configured Codex provider, one model, and low effort. No cross-host claim is made.

## Durable Decision

- Current facts: Update existing spec
- Current-fact target: `.rsp/specs/design.md`
- Facts to write:
  - Seam-dependent review Findings verify direct production-caller reachability before recommending a seam-only correction.
- Decision Record: No Decision Record needed
- Decision Record target: N/A
- Rationale to write:
  - none; this is a bounded correction to the existing review contract
- Archive ready: yes, with the cost result retained as composition/release risk
