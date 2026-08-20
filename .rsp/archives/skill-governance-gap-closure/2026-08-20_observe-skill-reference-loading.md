---
kind: "refactor"
---

# Change: skill-governance-gap-closure/observe-skill-reference-loading

## Proposal
- Outcome: Make sanitized Skill evaluation receipts show whether expected conditional references were actually observed as loaded by the host.
- Why:
  - Current receipts aggregate tool calls but cannot distinguish successful progressive disclosure from unnecessary, missing, or unobservable reference loading.
- Scope:
  - Add evaluation-only expected, observed, unexpected, and missing resource fields to the smallest shared observability contract.
  - Populate observed resources only from reliable host event data and integrate the result into candidate or managed-controller receipts that already retain sanitized observability.
  - Add focused contract tests for observed, missing, unexpected, unavailable, and out-of-package paths.
- Non-goals:
  - No runtime resource registry, RSP state mutation, inferred reads from model prose, or retention of arbitrary tool arguments.
  - No claim that an unavailable host observation means no reference was loaded.

## Spec
### MODIFIED
- Requirement: A scenario that expects conditional reference activation shall declare evaluated-composition-relative expected resources.
- Requirement: A receipt shall distinguish unavailable observation from an observed empty resource set.
  - When reliable host file-read paths are available, normalize and retain only paths contained by the evaluated Skill package, then derive observed, unexpected, and missing resources.
  - When reliable host evidence is unavailable, observed, unexpected, and missing resources remain unavailable rather than inferred.
- Requirement: Sanitized retained reports shall not expose absolute workspace paths or unrelated tool arguments.

### Acceptance
#### Scenario: Expected reference is observed
- GIVEN a candidate scenario declares one conditional reference and the host event stream reports a contained read of that reference
- WHEN observability is normalized
- THEN the receipt records the relative path as observed with no missing or unexpected resources

#### Scenario: Host resource observation is unavailable
- GIVEN the provider or host does not expose reliable file-read paths
- WHEN observability is normalized
- THEN the receipt marks resource observation unavailable and does not treat empty evidence as success

## Design
- Approach:
  - Extend the shared evaluation observability schema and normalizer first, then thread the bounded result through existing receipts.
  - Accept only explicit host event shapes proven by fixtures; fail closed to unavailable for unknown or ambiguous event data.
- Boundaries:
  - Evaluation owns diagnostics only; Skill packages own reference paths and runtime hosts own actual file access.
- Affected areas:
  - `scripts/skill-evaluation-observability.mjs` and its declaration
  - candidate/managed evaluation schema and receipt plumbing as required by the existing owner
  - focused evaluation and release-provider-comparison tests
- Constraints:
  - Keep current/candidate identity explicit, use POSIX paths relative to the evaluated Skill composition, and reject traversal, unknown Skill packages, missing references, or paths outside the composition.

## Tasks
- [x] Inspect provider event fixtures and identify the reliable file-read evidence boundary.
- [x] Add the resource-observation schema and fail-closed normalization.
- [x] Integrate expected and observed resources into the smallest existing receipt owner.
- [x] Add focused tests and run typecheck, lint, and affected release contracts.
- [x] Write the stable observability semantics back to the existing distribution and evaluation Spec owner.

## Verify
### Required
- Automated:
  - [x] Focused observability, candidate evaluation, managed-controller, routing, and provider-comparison tests — 5 files / 102 tests passed; proves: schema compatibility, containment, sanitization, unavailable-versus-empty behavior, and unchanged routing contracts.
  - [x] `mise exec -- pnpm run typecheck` and `mise exec -- pnpm run lint` — passed; proves: declarations and implementation remain consistent.
  - [x] `mise exec -- pnpm run docs:check`, `node dist/cli.mjs check`, and `git diff --check` after durable Spec writeback — passed; proves: the owning Spec and Change remain structurally valid.
### Optional
- Manual or environment:
  - [x] `mise exec -- pnpm run release:provider-compare -- --baseline-ref v3.2.0 --repetitions 3 --model combo/gpt-5.6-terra --effort high --timeout-ms 600000` — passed 3/3 pairs on 2026-08-20 with contract `c6b2cf569166eabe971cec6094f51107e204ac06bffd863ce897dc4fa1ed1662`; candidate repetitions observed 0/6, 4/6, and 4/6 expected resources, with no unexpected resource. Report: `.cache/release-provider-comparison/20260820T003735232Z-3205aba11a-12230/report.md`.
- Coverage:
  - Host events that do not expose reliable read paths remain explicitly unobservable. Observed missing or unexpected references are diagnostic evidence and do not by themselves fail the existing compliance, boundary, or task-result correctness gate.
  - `mise exec -- pnpm run release:acceptance` — passed on 2026-08-20: 9/9 stages, 86/86 test files, 860/860 tests, and packed installed-package workflows. Report: `.cache/release-acceptance/20260820T003524262Z-a8fc9ba4ff-36544/report.md`.
  - Provider efficiency medians were diagnostic-only: total tokens +13.98%, tool calls -55%, and elapsed time -27.29%, with wide baseline/candidate ranges; no overall token-efficiency or provider-general claim is made.
  - [x] Fixed-scope Code and Document review — clean; production reachability, failure behavior, containment, sanitization, permanent-test value, and final retained evidence were checked with no findings.
  - [x] Post-writeback Document review — clean; the Spec records only stable receipt semantics and preserves diagnostic-only, fail-closed, and path-sanitization boundaries.

## Blockers
- none
