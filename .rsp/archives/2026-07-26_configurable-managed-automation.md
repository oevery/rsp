---
kind: "feature"
---

# Change: configurable-managed-automation

## Proposal
- Outcome: Add project-configured automatic Manage routing and bounded local closeout presets without turning routing into authority.
- Why:
  - `rsp-manage` has qualified bounded continuation, recovery, Group-wave, and review-convergence behavior, but every run still requires a manually explicit managed request.
  - Archive normally precedes a managed checkpoint, yet lifecycle closeout and Git delivery remain distinct authorities; projects need a small way to select their default without a general host-permission framework.
- Scope:
  - Add strict `.rsp/config.yaml` `manage.activation` and `manage.closeout` enums, effective-policy projection in plain and JSON status, and a self-hosting `auto + lifecycle` policy.
  - Route eligible completion/continuation work automatically only when configured, and apply `manual`, `lifecycle`, or `local` closeout semantics after existing durable-review and clean-boundary gates.
  - Align Core, Manage, fallback, stable Specs, README, design philosophy, config templates, and focused behavior/static contracts.
- Non-goals:
  - A general filesystem/network/tool permission system, custom permission profiles, persistent controller state, automatic push/tag/publication/deployment/approval, or changing historical versioned release notes.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: Manage activation is a project policy, not inferred authority
  - `manage.activation` accepts only `explicit` or `auto`; omission preserves explicit-only compatibility.
  - `auto` lets Core select Manage for an eligible requested completion or continuation without the user naming the Skill, but the request and nearer authority still own planning and product mutation.
  - Small, coupled, report-only, release, ambiguous-owner, or unavailable-Skill work stays on its existing route.
- Requirement: managed closeout uses three bounded presets
  - `manage.closeout` accepts only `manual`, `lifecycle`, or `local`; omission preserves the existing explicit-managed local-closeout capability.
  - `manual` grants neither automatic archive nor commit; `lifecycle` grants archive after durable review but not commit; `local` grants lifecycle closeout plus existing exact-path local checkpoint/commit eligibility.
  - Every preset keeps push, publication, deployment, approval, and human acceptance explicit and outside project-configured automatic authority.
- Requirement: effective policy is inspectable and fails closed
  - Plain and JSON `rsp status` expose the resolved activation and closeout values without persisting run state.
  - Unknown keys, wrong shapes, and invalid enum values fail config validation; an invalid config cannot activate Manage or local closeout.

### Acceptance
#### Scenario: configured automatic lifecycle closeout
- GIVEN one eligible ready Change and `.rsp/config.yaml` selects `activation: auto` with `closeout: lifecycle`
- WHEN the user asks to complete the owned work without naming Manage
- THEN Core may select Manage, the existing qualification and stop gates still apply, durable review may archive the Change, and commit still requires separate authority

#### Scenario: configured local closeout
- GIVEN an eligible managed goal selects `closeout: local`
- WHEN a clean exact owned boundary has passed decisive verification and existing commit gates
- THEN Manage may archive and create an applicable local checkpoint or terminal commit without inferring push or publication

#### Scenario: safe compatibility and validation
- GIVEN Manage config is absent, explicit, manual, or invalid
- WHEN Core derives routing and closeout authority
- THEN absence preserves current explicit-managed compatibility, explicit/manual settings do not gain automatic actions, and invalid configuration fails closed visibly

## Design
- Approach:
  - Extend the existing typed config parser with two small enums and one resolver; project status carries the resolved policy through inspect, derive, plain, and stable JSON adapters.
  - Keep automatic routing in Core and closeout enforcement in the conditional managed reference and `rsp-manage`; do not add a runtime controller or permission engine.
  - Treat the profile as a grant ceiling: nearest scoped restrictions and host enforcement can narrow it, while explicit current-turn authority is still required for actions outside the preset.
- Boundaries:
  - CLI config/status owns machine-readable policy and fail-closed validation.
  - Core owns activation and eligibility routing; Manage owns closeout execution; host sandbox and external systems remain outside RSP.
- Affected areas:
  - `src/core/config.ts`, `src/types.ts`, `src/status/`, `src/commands/init.ts`, and config/status tests.
  - `skills/rsp/`, `skills/rsp-manage/`, `rules/rsp-rules.md`, their contract tests, and synchronized `.rsp/rsp-rules.md`.
  - `.rsp/specs/`, `README.md`, `docs/design-philosophy.md`, and self-hosting `.rsp/config.yaml`.
- Constraints:
  - Keep missing-config behavior backward compatible, schemas narrow and fail closed, status projections deterministic, and fallback unable to emulate Manage without the Skill suite.
  - Do not use `full`; the highest preset is local-only and never crosses the remote/publication boundary.

## Tasks
- [x] Add strict config parsing, effective-policy resolution, status projection, config template, self-host policy, and focused CLI tests.
- [x] Update Core/Manage/fallback routing and closeout contracts with automatic activation that grants no mutation or external authority.
- [x] Reconcile stable Specs and user-facing documentation without editing historical versioned release surfaces.
- [x] Run focused and complete verification, resolve fixed-scope review findings, and retain only decisive final evidence.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/config.test.ts test/status/status-boundary.test.ts test/rsp-core-routing-contract.test.ts test/managed-controller-contract.test.ts test/skill-contract.test.ts` — passed; proves: config enums/defaults, effective status policy, automatic routing restraint, closeout profiles, and published Skill contracts.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run typecheck && mise exec -- pnpm run lint && mise exec -- pnpm run test` — passed; proves: complete authored package and regression suite remain valid.
  - [x] `node dist/cli.mjs check --focused && git diff --check` — passed; proves: selected Change structure and changed-text hygiene.
- Manual or environment:
  - [x] Inspected `rsp status --json` in this self-host checkout and one temporary initialized project: both resolved `auto + lifecycle`; invalid `always + full` failed closed to `explicit + manual` with `invalid_config` and exit 1.
  - [x] Real-host `auto-lifecycle` product run passed with the final authored Skill composition: the completion request did not name or directly invoke Manage, status resolved `auto + lifecycle`, three bounded corrections converged cleanly, lifecycle closeout archived, and commit/push/publication remained zero; sanitized evidence retained under `research/evaluations/rsp-manage/2026-07-26-auto-lifecycle/`.
  - [x] Fixed-scope `rsp-review` converged to `clean` after closing the closeout-ceiling, self-host authority, retained native-evidence, and automatic-activation fixture findings.
- Coverage:
  - One `gpt-5.6-terra` medium real-host qualification was retained because executable Skill prompt content changed. Cross-provider qualification and longitudinal real-project cost/value remain beta follow-up gates.

## Blockers
- none
