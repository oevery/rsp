---
kind: group
---

# Change Group: agent-evaluation-suite

## Goal
- Establish one repository-native verification architecture for deterministic tests, AI evaluations, and disposable-project acceptance across RSP Skills, Core routing, worker routing, project fixtures, and provider-gate contracts.
- Deliver a locally verifiable foundation and migrate the existing scattered test/evaluation/acceptance entry points behind one shared scenario, evidence, oracle, report, and artifact model. Real provider acceptance remains a separately authorized follow-up boundary.

## Scope
- Define and implement the foundation contract registry, sanitized host-evidence catalog, artifact-surface ownership, layered scoring, AI-analysis adapter boundary, and resumable campaign accounting.
- Add focused evaluation slices for published Skills, RSP Core routing, worker dispatch/lifecycle, disposable real-project fixtures, and a fake/local provider-gate contract.
- Rebuild the physical verification layout under one top-level `verification/` root with shared config/contracts/scenarios/fixtures/harness/tests/evaluations/acceptance/artifacts surfaces, while retaining only explicit compatibility aliases for existing commands.
- Integrate child reports without merging their ownership, execution strategy, or acceptance boundaries.

## Shared Constraints
- All child Changes MUST consume the foundation contracts and MUST NOT redefine evidence identity, sanitization, deterministic hard-failure semantics, artifact-surface ownership, or campaign dispositions.
- Local foundation and non-provider suites MUST use fake or local fixtures only. No real provider execution or provider configuration change is authorized by this Group.
- The provider-gate child validates provider behavior with fake/local responses only. Real provider execution requires a later separately authorized acceptance Change; provider capacity is reported as infrastructure `unavailable`, never product success.
- Reports MUST distinguish deterministic host evidence, AI interpretation, unavailable observations, unverified execution, and missing coverage.
- Preserve unrelated dirty-worktree changes, credentials, user Memory, private configuration, and raw traces. No publication, release, approval, or external delivery is implied.

## Slices
- `agent-evaluation-suite/agent-evaluation-foundation`: Implement the shared registry, evidence catalog, sanitization, artifact-surface schema, layered scorer, bounded AI-analysis adapter, campaign accounting, and local contract tests.
- `agent-evaluation-suite/agent-skill-real-evaluation`: Evaluate each published Skill's selected behavior against task-shaped local fixtures and host-observed Trigger, Compliance, Boundary, Artifact, and Handoff contracts; Core owner selection remains in the routing child.
- `agent-evaluation-suite/agent-rsp-routing-evaluation`: Evaluate Core routing, Focus, WorkRef, authority, ambiguity, phase composition, and dispatch disposition; host worker lifecycle remains in the worker child.
- `agent-evaluation-suite/agent-worker-routing-evaluation`: Evaluate host-observed direct, solo, delegated, and coordinated worker dispatch plus lifecycle, recovery, ownership, and serialization.
- `agent-evaluation-suite/agent-project-acceptance-evaluation`: Execute the declared disposable project-fixture matrix across package, worktree, install, artifact, and project handoff boundaries.
- `agent-evaluation-suite/agent-release-provider-gate`: Define and locally validate the fake-provider baseline/candidate gate contract, capacity handling, usage accounting, and release-gate interpretation; real provider acceptance is outside this Group.
- `agent-evaluation-suite/verification-architecture-rebuild`: Rebuild and migrate the verification topology so `test`, `evaluation`, and `acceptance` retain distinct semantics under one shared root, with real execution boundaries and report dispositions that cannot promote synthetic traces to acceptance evidence.
- `agent-evaluation-suite/verification-runtime-evidence-harness`: Replace self-constructed evaluation traces with host-observed execution receipts from real local entry points, disposable workspaces, command results, artifacts, and worker lifecycle adapters.
- `agent-evaluation-suite/verification-scenario-behavior-rewrite`: Rewrite Skill, Core routing, worker, and project scenarios around distinct observable behaviors, independent fixtures, negative cases, recovery, and per-owner acceptance oracles.
- `agent-evaluation-suite/verification-orchestration-report-rebuild`: Rebuild aggregate verification orchestration and report contracts so test, evaluation, acceptance, fake-provider, simulated, unavailable, and unverified outcomes cannot be conflated.

## Completion Conditions
- [ ] Every direct child has its own completed Tasks and Required Verify evidence. The local aggregate records 63/63 executions, but 55 required Skill/Core/worker semantic cases remain explicitly `unverified`; Group completion therefore remains open until an authorized runtime boundary supplies fresh evidence or the owner approves a durable scope update.
- [x] Integration: one fresh aggregate report demonstrates that child outputs compose through the foundation schema, preserve evidence provenance, retain deterministic hard failures, and keep unavailable/unverified/skipped coverage distinct.
- [x] Integration: the aggregate report identifies every published Skill, the RSP Core route, and the worker route, and records verified execution for every required project-fixture category.
- [x] Integration: the aggregate report records that real provider acceptance is not part of this Group and emits a follow-up boundary for a separately authorized provider campaign.
- [x] Integration: the unified verification root exposes separate test/evaluation/acceptance ownership, shared contracts and configuration, explicit local/fake commands, and no implicit real-provider execution.
- [ ] Durable review decides any current-fact or Decision Record updates before Group closeout; Group closeout does not imply commit, publication, approval, or release.

## Durable Outcomes
- Current facts: the Group now has a canonical verification root, host-observed local receipts, 39 owner-specific Skill cases, 10 Core routing cases, 6 worker cases, 6 disposable acceptance categories, and a strict aggregate report. Local acceptance and fake-provider coverage pass, while Skill semantic and worker lifecycle coverage are explicitly unverified and real provider execution remains disabled.
- Lasting rationale: proposed rationale — a shallow Group is required because foundation, behavior evaluation, project acceptance, provider-contract gating, and the shared verification topology are independently executable and independently verifiable outcomes.

## Blockers
- required Skill semantic and host-worker runtime adapters are not available in this local-only execution environment; the report is intentionally `incomplete` until that evidence boundary is supplied.
