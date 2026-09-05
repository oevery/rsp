---
kind: "feature"
---

# Change: agent-evaluation-suite/agent-evaluation-foundation

## Proposal
- Outcome: Implement the shared foundation for a layered RSP agent-evaluation system.
- Why:
  - Existing Skill, routing, managed-controller, project, and release fixtures need one reusable contract, evidence, scoring, and campaign boundary.
  - Later evaluation slices must report host facts, AI interpretation, omissions, and infrastructure limitations without redefining semantics.
- Scope:
  - Implement the capability registry, sanitized host-evidence catalog, provenance model, artifact-surface schema, layered deterministic scorer, bounded AI-analysis adapter, report projection, and exact resume accounting.
  - Provide local fake traces and fake judges for registry, evidence, scoring, report, contamination, and campaign contract tests.
- Non-goals:
  - Do not implement the per-Skill, Core-routing, worker, project-acceptance, or provider-gate campaigns; those are sibling Changes.
  - Do not run a real provider, change provider configuration, add a model matrix or cost gate, or claim fresh real-project acceptance.
  - Do not change RSP Skill runtime semantics, Git/publication authority, or release approval flow.

## Spec
### ADDED
- Requirement: The registry MUST represent every published Skill plus one RSP Core routing object and one worker routing object.
  - Each object MUST declare owner, kind, fixture references, goals, required events, forbidden events, artifact surfaces, and metrics; validation MUST fail closed on omissions or repository-escaping paths.
- Requirement: The foundation MUST distinguish the capability registry from the campaign registry.
  - The capability registry covers published Skills, RSP Core routing, and worker routing. The campaign registry covers project-fixture and provider-gate campaigns without pretending that they are published Skills or RSP runtime objects. Both registries MUST reference the same evidence, artifact, metric, and provenance schemas.
- Requirement: Each run MUST expose a sanitized evidence catalog independent from agent self-report.
  - Catalog entries MUST contain a unique ID, source kind, sanitized locator, and provenance. IDs MUST be assigned after sanitization for events, failures, warnings, unavailable observations, artifacts, final handoff, and deterministic findings.
  - AI findings MUST reference only catalogued IDs. Unknown, duplicate, removed, or raw IDs MUST be rejected.
- Requirement: The scorer MUST expose Trigger/Routing, Compliance, Boundary, Artifact, Recovery, and Handoff independently.
  - Every artifact surface MUST declare a stable ID, kind, requiredness, host evidence source, deterministic checks, semantic goals, and one primary scoring dimension. Deterministic checks own hard boundaries, missing evidence, artifact presence/format/invariants, and handoff references. AI analysis may interpret semantics only when required evidence exists and MUST retain confidence, disagreement, evidence references, and deterministic overrides.
- Requirement: Campaign accounting MUST distinguish planned, executed, skipped, stopped, unavailable, and unverified coverage.
  - planned means membership in the immutable plan; executed means an attempt started and host execution metadata was retained; skipped means no attempt started; unavailable means a required provider, dependency, or observation capability could not be used; unverified means execution occurred but evidence required for a verdict is incomplete.
  - Every planned run MUST have one coverage disposition: verified, skipped, unavailable, or unverified. stopped is a campaign interruption marker with the exact case, arm, and repetition; it MUST NOT rewrite prior dispositions. unavailable and unverified MUST NOT become product pass or failure. Exact case/arm/repetition resume MUST preserve prior attempts and the original stop marker.

### Acceptance
#### Scenario: The registry covers the published capability inventory
- GIVEN the repository's published Skill directories and the foundation registry
- WHEN the registry validator loads the registry
- THEN every published Skill, the RSP Core route, and the worker route have one valid contract with repository-contained fixtures

#### Scenario: Host evidence and self-report remain separate
- GIVEN a sanitized trajectory with failures, warnings, contamination, worker lifecycle facts, and a conflicting agent receipt
- WHEN the evidence projection consumes the trajectory
- THEN it retains host observations, reports conflicts, and does not infer missing facts from task success

#### Scenario: AI analysis is bounded by evidence
- GIVEN deterministic hard failures and a fake AI finding
- WHEN the adapter validates the finding
- THEN known evidence references are retained, unknown references are rejected, and deterministic failures remain authoritative

#### Scenario: Artifact and campaign status remain explicit
- GIVEN missing, malformed, unavailable, unverified, skipped, and stopped cases
- WHEN the scorer and campaign planner produce a report
- THEN artifact ownership and coverage counts remain distinct and exact resume does not fabricate execution

#### Scenario: Capability and campaign contracts share one evidence boundary
- GIVEN a Skill, project-fixture, and provider-gate contract
- WHEN the foundation registry loads all contract layers
- THEN capability ownership and campaign ownership remain distinct while evidence IDs, artifact surfaces, metrics, and coverage dispositions validate through the same schemas

## Design
- Approach:
  - Add shared evaluator modules above the existing Skill, managed-controller, and release acceptance helpers.
  - Use JSON as the machine source of truth and Markdown as the human projection; reports are evaluator artifacts, not RSP runtime state.
- Boundaries:
  - The foundation consumes fixtures, traces, artifacts, and host metadata without modifying product source, Skills, or release state.
  - The AI adapter receives only sanitized, catalogued evidence and cannot repair deterministic failures or unavailable observations.
- Affected areas:
  - scripts/agent-evaluation-platform.*; verification/evaluations/agent-evaluation/; and verification/tests/evaluation/agent-evaluation-platform.test.ts.
  - Compatibility tests for existing managed-controller and release acceptance reports.
- Constraints:
  - Preserve unrelated dirty-worktree changes and never write credentials, raw private traces, user Memory, or provider configuration into tracked artifacts.
  - Local verification MUST use fake/local mode only.

## Tasks
- [x] Implement capability and campaign registries plus the local fixture index for the published capability inventory.
- [x] Implement sanitization, unique evidence cataloging, artifact-surface ownership, and provenance.
- [x] Implement layered scoring, self-report/host-evidence conflict detection, and deterministic overrides.
- [x] Implement catalog-backed AI analysis validation and fake judge integration without real provider access.
- [x] Implement explicit campaign dispositions, report projection, status transitions, and exact resume planning.
- [x] Add focused foundation, compatibility, contamination, unknown-evidence, unavailable/unverified, and no-provider guard tests.

## Verify
### Required
- Automated:
  - [x] mise exec -- pnpm exec vitest run verification/tests/evaluation/agent-evaluation-platform.test.ts --no-file-parallelism — 9 tests passed; proves capability/campaign registries, evidence catalog fields, artifact-surface ownership, layered scoring, AI evidence validation, coverage status transitions, campaign accounting, and resume semantics.
  - [x] mise exec -- pnpm exec vitest run verification/tests/evaluation/managed-controller-contract.test.ts verification/tests/evaluation/managed-controller-beta-contract.test.ts verification/tests/release/release-behavior-acceptance.test.ts --no-file-parallelism — 4 files and 75 tests passed; proves compatibility with existing evaluation/report contracts.
  - [x] mise exec -- pnpm run typecheck — passed; evaluator types and report schemas remain consistent.
  - [x] mise exec -- pnpm run lint — passed; implementation style and static safety pass.
  - [x] git diff --check — passed; changed artifacts contain no whitespace errors.
### Optional
- Manual or environment:
  - [x] Review a generated local fake-trace report — local Markdown projection reviewed; facts, AI findings, omissions, and verdict remain separate.
- Coverage:
  - Real Skill tasks, Core routing, worker lifecycle, real-project acceptance, real providers, cross-provider compatibility, and model cost belong to sibling Changes.

## Blockers
- none
