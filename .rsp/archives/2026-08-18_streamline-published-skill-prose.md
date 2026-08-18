---
kind: "refactor"
---

# Change: streamline-published-skill-prose

## Proposal
- Outcome: Reduce and clarify Skill context with closed flows, lists, shorter sentences, and only sparse closed-mapping tables while preserving every trigger, authority, action, stop, output, verification, conditional-loading, and acceptance boundary.
- Why:
  - Fixed mappings in `rsp-manage` and `rsp-release-docs` are expressed as dense prose or repeated bullets even though their values and transitions are already canonical.
  - `rsp-manage` repeats low-frequency Assignment, WorkerInvocation, lifecycle, and receipt details already owned by directly linked references, increasing default context and duplicate-owner drift risk.
  - Response and artifact language precedence is deterministic but currently embedded in paragraphs that are harder to scan than explicit precedence chains.
- Scope:
  - Use a table only for a short stable closed mapping with real repeated-column savings; prefer concise lists for frontier, lanes, branching judgment, exceptions, and multi-step action.
  - Keep only always-needed worker-exchange and lifecycle guardrails in the Manage entrypoint; leave conditional detail in the existing canonical references.
  - Convert release-document branch selection and language precedence to compact lists or defined flows without changing their order or exceptions.
  - Align the direct maintainer `author-rsp-skills` package with the same table restraint; it is not a published projection.
  - Keep mode descriptions separate from one centralized mode-to-reference loading map.
  - Shorten selected conditional-reference prose only where sentence splitting or leading-word lists preserve identical behavior.
  - Preserve the completed `decouple-managed-release-identity` hunk as prior owned work and verify the combined candidate without rewriting that Change.
- Non-goals:
  - No change to Core route priority, Manage qualification, lane results, dispatch or correction policy, acceptance, closeout, Commit procedure, release identity, publication, Git, or human-acceptance authority.
  - No private DSL, shortened public fields, new references, schema, state, receipt, configuration, or abstraction.
  - No mechanical rewrite of every long paragraph and no requirement to meet a word-count threshold.

## Spec
### MODIFIED
- Requirement: fixed Skill mappings and flows use the smallest clear representation.
  - Tables are exceptional: use them only for short stable closed value-to-condition/action mappings with unambiguous rows and real repeated-column savings. Arrows express only defined one-meaning transitions; lists and short sentences retain every exception and stop.
  - Canonical enum values, owners, output fields, authority boundaries, and conditional reference triggers remain unchanged.
- Requirement: the Manage entrypoint loads only always-needed execution control.
  - Low-frequency exchange, lifecycle, interruption, review convergence, and closeout procedures remain reachable through their existing direct references.
  - The entrypoint retains enough guardrails to fail closed before a conditional reference is loaded.

### Acceptance
#### Scenario: select and execute managed work
- GIVEN the same ready owner, authority, evidence, and host capabilities
- WHEN current and condensed Skill compositions derive dispatch, frontier, lane, receipt, acceptance, and closeout behavior
- THEN they select the same values, preserve the same stops, and reach the same conditional references

#### Scenario: select a release-document branch
- GIVEN the same release scope, identity state, evidence, and mutation authority
- WHEN the condensed branch mapping is read
- THEN exactly the same Audit, Draft, Finalize, or Reconcile branch and boundary applies

#### Scenario: resolve prose language
- GIVEN the same explicit instructions, configuration, artifact history, and conversation language
- WHEN response, artifact, or commit prose is selected
- THEN the precedence order and existing-artifact preservation rule are unchanged

## Design
- Approach:
  - Replace prose only where the mapping is closed and already defined; keep prose for judgment, priority, exceptions, and failure semantics.
  - Retain one short entrypoint invariant before each conditional reference and remove nearby restatements owned by that reference.
  - Compare exact pre-concision and candidate compositions on the same managed holdout; use deterministic contract tests for structure-only release and language formatting.
- Boundaries:
  - This Change is the integration owner for its new formatting hunks only. `decouple-managed-release-identity` retains ownership of its existing Manage identity correction.
  - Existing references remain canonical owners; this Change changes presentation and loading shape, not the underlying control model or release model.
- Affected areas:
  - `skills/rsp-manage/SKILL.md` and selected existing Manage references.
  - `skills/rsp-release-docs/SKILL.md`.
  - `skills/rsp/references/response-language.md`.
  - `.agents/skills/author-rsp-skills/SKILL.md` and its concision reference as the direct maintainer owner, not a generated published projection.
  - Existing semantic contract/runtime-context tests and exact composition locks when identities change.
- Constraints:
  - Edit authored `skills/**`, never `.agents/skills/**` projections.
  - Preserve all canonical values and directly linked resource reachability.
  - Do not accept a smaller candidate with any Trigger, Compliance, Boundary, or task-result regression.

## Tasks
- [x] Snapshot exact pre-concision Skill identities and diagnostic context shape.
- [x] Condense Manage fixed mappings and remove reference-owned detail from the entrypoint.
- [x] Condense release branch and language precedence presentation.
- [x] Update only existing semantic contracts needed to prevent boundary loss.
- [x] Run focused checks and exact current/candidate evaluation.
- [x] Record final evidence and run one integrated security plus release gate.
- [x] Calibrate table use in Manage, Release Docs, and the authoring owner.
- [x] Centralize the authoring mode-to-reference loading map without changing conditional loading.
- [x] Refresh focused contracts and deterministic release gates after calibration.
- [x] Refresh the exact model candidate comparison after calibration.

## Verify
### Required
- Automated:
  - [x] `node .agents/skills/author-rsp-skills/scripts/scan-skill-context.mjs --root /Users/oevery/Developer/lab/rsp --json` plus `mise exec -- pnpm exec vitest run test/managed-controller-contract.test.ts test/managed-controller-beta-contract.test.ts test/skill-runtime-context-contract.test.ts test/rsp-release-docs-skill-contract.test.ts test/rsp-core-routing-contract.test.ts test/artifact-continuation-contract.test.ts test/skill-contract.test.ts --reporter=dot` — passed 7 files / 120 tests; all 13 published packages remain reachable and canonical mappings retain their owners and values.
  - [x] Exact `auto-multisurface-routing` comparison using frozen current `2318b39b79d392384d4a0ed501363dbcffbef801a48bcbeb014961ab0dd71676` and final candidate `47825d6ec6743a8a10f2200d06be367a1a6d6568883633185b99898b51f88841` through the existing observability projection and candidate evaluator — `candidate-eligible`; Trigger, Compliance, Boundary, and task result all passed with no missing evidence or regression.
  - [x] `mise exec -- pnpm run skills:security-check` and final `mise exec -- pnpm run release:check` — security preflight passed 40 files with zero findings; release metadata, docs, build, typecheck, lint, all 74 test files / 829 tests, and clean-install package check passed.
  - [x] Table-calibrated deterministic candidate `47ba02bd327bd9bc7614ce79fda7111f3002246cf68fc383a7168715f217e1a9` — focused contracts passed 8 files / 125 tests; security preflight passed 40 files with zero findings; metadata, docs, build, typecheck, and lint passed; the parallel release test command exposed its known shared-`dist` race twice, while the rebuilt serialized full suite passed 74 files / 829 tests and clean-install package validation passed with SHA-256 `915bfb9e73c7c36634e4812642dcedcef09d0817988a935560a4f714decf49dc`.
  - [x] Author mode loading-map follow-up — the maintainer contract test passed in three repeated focused parallel runs, the context scanner reports every authoring reference reachable, and the normal parallel `release:check` passed after the separately owned test-build repair.
  - [x] Exact frozen-current versus table-calibrated candidate model comparison — after `combo/gpt-5.6-terra` capacity failures, current and candidate were rerun as a fresh matched pair with `combo/gpt-5.6-sol`, high effort, the same `auto-multisurface-routing` contract `0303b585bef27638f92f1c7b0f308fd0f63ff5b0ae92354f389d2c9fdb9c4540`, and a 600000 ms timeout. Current `2318b39b79d392384d4a0ed501363dbcffbef801a48bcbeb014961ab0dd71676` and candidate `47ba02bd327bd9bc7614ce79fda7111f3002246cf68fc383a7168715f217e1a9` both passed Trigger, Compliance, Boundary, and task result. The existing evaluator returned `candidate-eligible` with no regressions, candidate failures, or missing evidence.
### Optional
- Manual or environment:
  - [ ] Additional provider/model or downstream real-host evaluation — optional unless the bounded comparison exposes provider-specific uncertainty.
- Coverage:
  - Exact pre/post diagnostics: `rsp-manage` package 5766 → 5178 words and entrypoint 3070 → 2354; `rsp` package 4906 → 4903 and response-language reference 185 → 182; `rsp-release-docs` package 2613 → 2597 and entrypoint 1018 → 1002. The direct maintainer `author-rsp-skills` package is 1411 words after replacing its mode table, tightening the concision policy, and centralizing its conditional loading map. Counts are diagnostics only.
  - Among the calibrated entrypoints, only the short three-row `DispatchDisposition` closed mapping remains a table; Frontier, lane, release branch, and author mode use bullets.
  - The only repeated published prose remains the intentional response-language boundary. Additional provider/model and downstream real-host evaluation remains Optional.

## Blockers
- none

## Durable Decision
- Current facts: No current-fact update needed
- Current-fact target: N/A
- Facts to write: none unless implementation changes a stable contract
- Decision Record: No Decision Record needed
- Decision Record target: N/A
- Rationale to write: none; semantic concision follows existing Skill-system policy
- Archive ready: yes
