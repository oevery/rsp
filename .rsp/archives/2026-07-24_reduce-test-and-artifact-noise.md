---
kind: "fix"
---

# Change: reduce-test-and-artifact-noise

## Proposal
- Outcome: Make ordinary implementation and compact artifact updates the default while retaining tests and durable prose only when they provide distinct long-term value.
- Why:
  - Current routing sends nearly every clear testable behavior toward TDD, and Change evidence can accumulate test cycles and correction transcripts that slow work, consume context, and obscure final truth.
- Scope:
  - Refine Core, Shape, Implement, TDD, fallback, and Change-template guidance; add focused contracts and behavior cases for risk-triggered TDD, retained-test value, compact final evidence, and domain-centered artifact prose.
- Non-goals:
  - Removing verification or TDD, imposing coverage/test/token quotas, adding lifecycle states or evidence files, automatically rewriting semantic artifacts, or weakening project-required checks.

## Spec
### MODIFIED
- Requirement: verification is required but new retained tests are not the default
  - Ordinary implementation is the default when the change and risk do not explicitly require test-first evidence.
  - TDD is selected only by user, Change, project instruction, or a concrete high-risk behavior such as a public contract, persistence, security, concurrency, state transition, or escaped regression.
  - A new test remains in the project only when it protects observable behavior or a real boundary, adds distinct future confidence, avoids implementation-detail coupling and redundant coverage, and has proportionate maintenance cost.
- Requirement: current-work and durable artifacts stay compact and audience-centered
  - Change Tasks and Verify contain current state, final decisive evidence, omissions, and unresolved risk rather than chronological RED/GREEN, tool output, or review-correction transcripts.
  - Temporary probes and execution history remain in the response and may be removed before completion; stable artifacts use user, operator, system, and domain language unless AI or an agent is itself a real product actor, consumer, interface, or constraint.

### Acceptance
#### Scenario: low-risk work uses ordinary implementation
- GIVEN a small refactor or known correction covered by existing checks
- WHEN Core derives the next implementation action
- THEN it selects ordinary implementation and does not require a new test-first cycle or retained test

#### Scenario: high-risk behavior selects focused TDD
- GIVEN a missing public contract, persistence, security, concurrency, state-transition, or escaped-regression behavior whose focused RED is meaningful
- WHEN Core derives the next implementation action
- THEN it may select one bounded TDD cycle and retain only a test that passes the long-term value gate

#### Scenario: exploratory tests do not become permanent by default
- GIVEN a temporary probe helped establish or implement behavior but duplicates stronger evidence or asserts implementation details
- WHEN implementation is completed
- THEN the probe may be removed and final verification uses the smallest sufficient evidence portfolio

#### Scenario: a long execution converges to compact artifacts
- GIVEN implementation, TDD, review, or corrections produced several intermediate observations
- WHEN the selected Change and durable artifacts are updated
- THEN they contain current decisions and final evidence rather than a chronological execution diary

#### Scenario: durable prose names the real domain
- GIVEN AI is not a product actor, consumer, interface, or constraint of the changed behavior
- WHEN a Spec, Decision Record, context, instruction, or user document is updated
- THEN its prose describes the user, operator, system, or domain without narrating agent actions

## Design
- Approach:
  - Replace capability-driven TDD routing with ordinary-by-default, concrete-risk routing; keep diagnosis precedence and explicit TDD requests.
  - Add one retained-test value gate shared semantically by Shape, Implement, and TDD, while treating tests as one verification option in generated templates.
  - Make open Change updates convergent snapshots: replace stale evidence and keep only final decisive commands/results, omissions, material deviations, and unresolved risk.
  - Add an artifact-audience rule and keep detailed process evidence in response continuation rather than project prose.
  - Use the accepted Spec Kit/OpenSpec reports plus Google testing maintainability, ADR, and context-engineering findings as model evidence; independently implement the smaller RSP-native contract.
- Boundaries:
  - RSP selects verification depth; the host project continues to own tests, required checks, durable documents, and acceptance.
  - Skills guide semantic judgment; the CLI does not infer test value, delete artifacts, or add persisted execution state.
- Affected areas:
  - `skills/rsp/SKILL.md`, `skills/rsp-shape/SKILL.md`, `skills/rsp-implement/SKILL.md`, `skills/rsp-tdd/SKILL.md`, `rules/rsp-rules.md`
  - `.rsp/specs/design.md` for the implemented stable workflow facts
  - `README.md` and `README.zh-CN.md` for the current public workflow summary
  - `src/core/helpers.ts` and focused Skill/template/discipline contract fixtures under `test/`
  - `scripts/native-design-composition-eval.mjs` and a new immutable real-host run only if the project-required current-package gate detects published Skill drift
- Constraints:
  - Preserve explicit project/user test-first requirements, diagnosis precedence, truthful verification, current artifact ownership, fixed Change sections, and independent Skill portability.
  - Add only a small positive/negative behavior matrix; do not build another provider evaluation suite or encode numerical test/coverage/token thresholds.

## Tasks
- [x] Make Core and Implement route ordinary work by default and TDD only from explicit authority or concrete changed risk.
- [x] Add retained-test value, temporary-probe cleanup, and smallest-sufficient verification guidance to Shape, Implement, and TDD.
- [x] Make Change/template and durable-artifact guidance converge to final evidence and domain-centered prose without process transcripts.
- [x] Add focused contract and behavior cases covering ordinary, high-risk, temporary-test, compact-evidence, and artifact-audience outcomes.
- [x] Review the fixed scope and run fresh focused plus project-required verification.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/rsp-core-routing-contract.test.ts test/rsp-implement-skill-contract.test.ts test/rsp-tdd-skill-contract.test.ts test/rsp-shape-contract.test.ts test/rsp-shape-skill.test.ts test/helpers.test.ts test/discipline-composition.test.ts test/artifact-continuation-contract.test.ts test/rsp-tdd-behavior.test.ts` — 9 files and 82 tests passed; proves canonical routing, retention, artifact, template, and composition contracts.
  - [x] `mise exec -- pnpm run build && mise exec -- pnpm run typecheck && mise exec -- pnpm run lint && mise exec -- pnpm run test` — all gates passed; full suite: 42 files and 446 tests.
  - [x] `node dist/cli.mjs check --focused && git diff --check` — focused Change valid; diff hygiene passed.
- Manual or environment:
  - [x] Inspect the canonical Skills, generated Change template, and focused behavior matrix against all five Acceptance scenarios — all scenarios represented; fixed-scope Code and Document re-review is clean.
- Coverage:
  - Deterministic contracts and bounded behavior fixtures cover the new routing and artifact rules directly. The project-required immutable real-host run `device-discovery-boundary-test-artifact-noise-review-fix` passed every score gate for the changed published package identity; it does not replace the focused acceptance cases.

## Blockers
- none
