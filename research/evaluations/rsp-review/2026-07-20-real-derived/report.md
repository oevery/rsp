---
candidate: rsp-review
candidate_version: "2026.07.20.5"
candidate_hash: sha256:399619e81e40cd16a29bf64a88bb7ca214410097a7d3d61adb927a28dc47c69c
fixture_hash: sha256:230ec360f5d91f2c4cee67606d0dc8d5528cb7bb836385e6817e6bb8ae9489cd
harness_hash: sha256:1beb340967ac77fa4d26e899d1b99ee608d835df518d661df3da4d7bd710fe0f
model: gpt-5.6-terra
effort: low
provider: user-default
config_source: user
date: 2026-07-20
status: complete
quality_status: revise
recommendation: strengthen-production-seam-tracing
---

# RSP Review Real-Derived Evaluation

## Decision

**Revise one review behavior before claiming broad real-world coverage.** Nine independently reimplemented fixtures exercise capability boundaries, cancellation, state ownership, persisted-data validation, complex Git scope, generated-code restraint, and automated-versus-authenticated acceptance. The current Skill found the intended defects, preserved the worktree, and produced honest Coverage in nearly every run.

One reproducible gap remains: in `real-stateful-media-round-2`, the reviewer identifies the broken provider-abort adapter but does not inspect whether the production `MediaWorkflow` calls that adapter. It recommends fixing only the adapter, while the production workflow continues to call the provider directly. The same miss occurred in the frozen full matrix and a final targeted run. Baseline review followed the production wiring and reported the bypass.

Do not add a domain checklist. The smallest behavior revision is to require a reviewer that finds or recommends an adapter/normalizer fix to verify that the changed production consumer actually reaches that seam.

## Fixture Set

All `real-*` fixtures are marked `source_class: real-world-derived` and `sanitization: independent-reimplementation`. They contain generic names, fake invalid domains, no copied product paths, no provider identity, and no real credentials.

| Family | Cases | Boundary |
| --- | --- | --- |
| Capability | data-plane projection; cancellation propagation; wrapped cancellation | Runtime structural typing, full async chains, public failure contracts |
| Stateful rounds | rounds 1–3 | Identity races, caller cancellation, URL trust, session cleanup, provider/persistence linearization |
| Worktree | mixed generated worktree; persisted resource validation | Staged/unstaged/rename/delete/untracked scope, generated restraint, shared validation boundary |
| Acceptance | automated versus human-ready | Local green evidence versus conditionally executable authenticated E2E |

The stateful clean oracle was hardened before the final decision with regressions for provider late success, abort-wins, persistence resolve-wins, persistence reject-wins, session cleanup, and bounded credentialed E2E behavior.

## Quality Results

- Capability cases: all required observations found; Code/Document states correct; no mutations.
- Stateful round 1: all three intended defects found without repeating unrelated work.
- Stateful round 2: target defects found, but production wiring bypass was missed twice by the candidate.
- Stateful round 3: clean behavior and unavailable authenticated E2E were separated; independent adversarial review found no remaining actionable fixture defect after linearization repairs.
- Mixed worktree: relevant untracked product code included, local Skill/tool files excluded, generated output remained noise-free, and rename/delete/staged/unstaged scope was covered.
- Persisted resources: malformed, non-HTTP(S), credential-bearing, and valid public URL behavior was traced across consumers.
- Automated versus human-ready: final targeted run returned `Code: clean`, `Document: skipped`, local tests passed, and authenticated E2E remained Coverage rather than a Finding or completion claim.
- Every retained run used read-only sandboxing and reported zero workspace mutation.

Normalized copies of the final targeted outputs and a sanitized run/score manifest are retained under `outputs/` and `evidence.json`; the manifest preserves each raw source-output hash separately from the retained-copy hash. Earlier exploratory matrices remain ignored under `.cache/`; they were used to repair fixture oracles and are not promotion evidence. Claims about the full nine-case set are iterative quality observations, not a reproducible promotion matrix on the final fixture hash.

## Cost Signal

Single paired matrices were highly variable. Candidate cumulative-input overhead ranged from negative values to more than 70% by case and run; some frozen three-case groups stayed below the existing single-sample thresholds while others exceeded them. This evaluation therefore makes no new formal cost decision. Candidate `2026.07.20.5` retains its existing three-repetition cost qualification; any Skill behavior edit requires a fresh repeated calibration on the expanded fixture set.

## Smallest Revision and Gate

1. Amend the production-chain legwork rule: when a Finding depends on an adapter, wrapper, validator, or normalizer, inspect the direct production consumer and state whether the changed path actually uses that seam.
2. Add an observation to `real-stateful-media-round-2` that the report must identify the production bypass or otherwise propose a correction that changes the live path.
3. Rerun all original eight fixtures plus the nine real-derived fixtures under one frozen candidate/fixture/harness identity.
4. Require candidate recall to be no worse than baseline, zero mutations, correct pipeline states, and a three-repetition context-cost calibration.

## Limitations

- Real-host evidence covers one configured Codex provider, one model, and low effort.
- The final fixture tree changed while exploratory matrices were used to repair invalid oracles. Only the two final targeted runs in `evidence.json` use the frontmatter fixture and harness hashes.
- Five TypeScript/Vitest review fixtures intentionally have no fixture-local runner. Their tests are review artifacts, and the reviewer must disclose that they are not executable in the isolated workspace; they do not provide fresh runtime verification.
- Authenticated external E2E is intentionally unavailable without explicit opt-in, endpoint, credential, and network access.
- No cross-host compatibility claim is made.

## Durable Decision

- Current facts: No product Spec update needed
- Decision Record: No Decision Record needed
- Rationale: This is maintainer evaluation evidence for a future bounded Skill revision
- Archive ready: yes
