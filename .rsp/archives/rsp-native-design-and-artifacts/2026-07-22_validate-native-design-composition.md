---
kind: "ops"
---

# Change: rsp-native-design-and-artifacts/validate-native-design-composition

## Proposal
- Summary: Qualify the eight-Skill assisted suite and gate RSP 3.0 on native design and durable artifact ownership.
- Why:
  - Individual Skill success does not prove that the clean installed package can complete the daily Shape-to-design-to-delivery path without external suites.
- Scope:
  - Integrate the two capability slices, update product truth and package inventory, and run the terminal composition and release checks.
  - Add this terminal Change as a prerequisite of `release-3-0-0`.
- Non-goals:
  - Expanding into managed orchestration, Git delivery, browser/platform QA, or automatic publication.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: the exact installed RSP package exposes eight canonical Skills and can complete the native design/artifact journey without external Skill dependencies.
  - Product documentation, Specs, models, package contents, validation manifests, and clean-install discovery agree on the same capability surface.
  - Composition evidence covers normal design resolution, missing authority, reversible exploration, implementation continuation, durable writeback, conflict restraint, and human-facing output language.
  - `release-3-0-0` remains blocked until this Change is archived.

### Acceptance
#### Scenario: clean installed assisted journey
- GIVEN only the packed RSP artifact, a host model, and a representative RSP project
- WHEN the host shapes a material domain/module question, resolves it through `rsp-design`, implements the accepted result, reviews it, and prepares archive
- THEN every stage returns to the same WorkRef, stable knowledge routes once to the correct owner, and no Matt, Superpowers, Compound, hidden controller, or implicit Git capability is required

## Design
- Approach:
  - Extend the existing same-case terminal/evaluation harness with the smallest discriminating cases and run it against the packed install.
  - Reconcile README, design philosophy, Specs, Skill System/capability model, package file list, and release dependency before terminal validation.
- Affected areas:
  - package metadata, validation/evaluation harness, fixtures, and clean-install smoke tests
  - `README.md`, `docs/design-philosophy.md`, `.rsp/specs/design.md`, and `research/models/`
  - `.rsp/changes/release-3-0-0.md`
- Constraints:
  - Do not weaken prior authority, restraint, language, cost, or release gates to make the expanded suite pass.
  - Do not claim cross-host or managed-controller qualification from one installed-package holdout.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Reconcile product/package truth and add focused terminal composition evidence
- [x] Run full project and exact-package release gates
- [x] Update the 3.0 release dependency and record fresh results

## Verify
- Automated:
  - [x] `mise exec -- pnpm run build`
  - [x] `mise exec -- pnpm run lint`
  - [x] `mise exec -- pnpm run test`
  - [x] `mise exec -- pnpm run release:check`
    - Observed 2026-07-22: 28 test files and 327 tests passed; build, typecheck, lint, and package check passed.
  - [x] exact tarball clean-install and Skill discovery smoke test
    - Observed 2026-07-22: package SHA-256 `6b07aaedfa04539013b564eb6640968b3e9b6783dd8259feddcb099155bae4b7` exposed exactly the eight canonical Skills and excluded research/self-hosting state.
- Manual:
  - [x] Review the terminal journey evidence, omitted host coverage, package file list, and release dependency plan.
    - The one-host holdout passed all external gates; cross-host, real hardware, managed orchestration, Git delivery, and platform acceptance remain explicit non-claims.
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or stable instructions that belong in the nearest project-owned `AGENTS.md`
  - [x] Stable product/package facts were reconciled in `.rsp/specs/design.md`, README documentation, design philosophy, and the Skill System/capability models; no project-owned instruction update was required.

## Blockers
- requires `rsp-native-design-and-artifacts/promote-rsp-design`: needs the native design discipline and focused qualification
- requires `rsp-native-design-and-artifacts/strengthen-artifact-continuation`: needs canonical artifact routing, continuation, and Git fallback behavior
