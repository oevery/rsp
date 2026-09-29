---
kind: "refactor"
---

# Change: streamline-skill-workflow

## Proposal

- Outcome: Carry authorized RSP work through implementation, proportionate verification and writeback with fewer procedural handoffs, while preserving ownership, safety and truthful evidence.
- Why: The previous workflow imposed repeated routing and context-loading costs even when goal, owner and authority had not changed. Existing Skill boundaries are not invariants.
- Scope: Consolidate authored Skills and conditional resources; align fallback rules, installer migration, stable Specs, bilingual documentation and existing evaluation support.
- Non-goals: A new evaluation framework, host runtime, hidden state ledger, wholesale upstream imports, exhaustive model/host coverage or automatic delivery authority. Archive, commit, publication and external project migration remain separately authorized.

## Spec

### MODIFIED

- Requirement: Continue ordinary authorized work without artificial phase-boundary stops or repeated requests to continue. Stop for material owner decisions, insufficient authority, unsafe replay or unavailable required evidence.
- Requirement: Preserve work ownership, unrelated edits, staged content, fresh verification and distinct-worker evidence wherever independent acceptance is required.
- Requirement: Select the responsible capability and conditional branch before loading detailed guidance. Same-owner/scope/authority method changes stay inside that capability.
- Requirement: Judge task success, correct stops, preservation and truthful evidence before context cost or speed. Shorter instructions alone do not establish correctness.
- Requirement: Maintainer evaluation uses versioned credential-free role/policy configuration, isolated runtime homes, explicit provider inputs and frozen execution identities. Disable memory use/generation and ambient extensions; reject incompatible configuration or unavailable required capabilities before execution. Model choices are maintainer settings, not RSP product requirements.

### Acceptance

#### Scenario: Complete routine authorized work
- GIVEN a clear task and sufficient authority
- WHEN the selected workflow executes it
- THEN implementation, required checks and writeback finish without unnecessary planning loops or continuation requests.

#### Scenario: Preserve boundaries during recovery
- GIVEN staged or unstaged user work and interrupted progress
- WHEN execution resumes from current project evidence
- THEN it preserves unrelated work and the index, refreshes affected evidence and completes only the remaining authorized work.

#### Scenario: Stop for a real owner decision
- GIVEN an unresolved material choice or an unauthorized external action
- WHEN completion would cross that boundary
- THEN execution asks the relevant question or reports the precise limitation without mutation or fabricated progress.

#### Scenario: Selectively coordinate complex work
- GIVEN coupled work or a required independent-verification obligation
- WHEN the workflow selects its execution path
- THEN necessary coordination and independent evidence remain, without imposing that path on ordinary work.

#### Scenario: Reproducible evaluation startup
- GIVEN versioned maintainer policy and separate private provider configuration
- WHEN offline preflight or live execution resolves a role
- THEN model/effort and runtime identities are recorded without secrets, memory/extensions are disabled, and incompatible inputs or unavailable required capabilities are rejected.

## Design

### Composition and control

- Default entries: rsp, rsp-shape, rsp-implement, rsp-verify, rsp-review, rsp-commit and rsp-release-docs. Keep rsp-structural-audit optional and report-only. Each package remains standalone.
- Merge rsp-manage into Core's conditional coordination; rsp-design into Shape's bounded design path; rsp-diagnose, rsp-tdd and rsp-resolve-findings into Implement's conditional methods. Do not retain compatibility Skills or recreate the removed handoffs as an internal state machine.
- Core resolves goal, owner and authority, then continues within them. Return for completed responsibility, changed owner/scope/authority, necessary cross-capability acceptance or an unresolved blocker, not every method switch or repairable check failure.
- Select coordination for real coupled slices, recovery, independent acceptance, resource conflicts or delivery obligations, not file count or effort. Preserve manage.activation and manage.closeout semantics. Ordinary flow does not activate managed closeout. Host evidence establishes delegation and safe parallelism; missing required independence leaves acceptance incomplete.
- Shape's design-only path remains read-only. Implement's diagnosis-only path remains read-only; a separately authorized fix continues after cause confirmation. Test-first work requires explicit instruction or concrete risk. Fixed findings receive supported dispositions, scoped correction and separate re-review; implementer self-checks cannot certify review-clean.
- Verify and Review retain separate read-only responsibilities; ordinary implementation checks need no forced Verify handoff. Commit and release-documentation boundaries grant no implicit remote or publication authority.
- Keep authority, preservation and stop rules in entrypoints; conditionally load detailed design, diagnosis, test-first, findings, coordination, recovery and delivery resources.

### Migration and rationale

- Author in skills/ and rules/; use the owning synchronization mechanism for .agents/skills/ projections and generated fallback. Preserve CLI/data formats outside the selected Skill-name migration.
- Map removed names and their historical aliases to the new owners. Preserve conflict-first installation, --dry-run, explicit --force and rollback. Ordinary installation must not silently remove old or user-edited trees; unrelated Skills remain untouched.
- Research basis: research/models/skill-upstream-refresh-2026-09.md C1/C2/C3 and its source reports. Superpowers and compound-engineering inform decision-focused planning and reduced handoffs; addy-agent-skills and compound-engineering inform natural-task evaluation; planning-with-files informs owner/recovery preservation. No upstream assets are copied.
- Seven focused entries plus conditional resources preserve independent gates while reducing routine handoffs. Retaining the former split leaves routing overhead; a single giant Skill obscures authority and loads unrelated procedures. The tradeoff is migration and cross-artifact alignment, not a claim of universal superiority.
- Stable facts are recorded in .rsp/specs/skill.md, core-model.md and distribution.md, project instructions and current bilingual guides. No additional Decision Record is needed.

### Evaluation configuration

- evals/config/ owns Astra/low defaults for coordinator, verifier and reviewer, and Sol/medium for implementer. Private provider routing and authentication remain separate from repository policy and global user configuration.
- The ordinary single-turn adapter disables multi-agent execution and refuses required-worker mode. The separate native-coordinator overlay enables v1 and disables v2; native acceptance requires observed worker attribution.
- Offline preflight validates local compatibility, not live capability. Policy, role, executable, provider, auth and catalog identity changes cannot inherit earlier execution results. Record actual usage without imposing an invocation ceiling on native acceptance; additional paid evaluation scope requires authorization.

## Tasks

- [x] Consolidate Skill ownership and conditional resources while preserving authority, stop and return contracts.
- [x] Implement explicit old-name migration and align package inventory, fallback, Specs, project instructions and bilingual documentation.
- [x] Reuse existing tests/evaluation cases, cover installer preservation and rollback, and clarify owner-decision fixture semantics without adding a framework.
- [x] Implement repository-local evaluation policy, role defaults, isolated runtime input handling and offline compatibility/identity checks.
- [x] Complete engineering review, corrections and deterministic validation.
- [x] Complete selected behavioral acceptance for ordinary work, staged recovery, owner-decision continuation and native v1 independent coordination.

## Verify

### Required

- [x] Deterministic validation: build, lint, typecheck, 76 tests across 16 files, docs:check, all 25 eval schema/oracle checks, eight Skill package checks and git diff --check pass. Authored/fallback rules match; the built CLI reports seven default Skills and one optional Skill with matching local projections. Astra/low role preflights pass without provider calls.
- [x] Engineering review: fixed-scope Astra review against baseline ae2a7d13212a19f7b8b584e25d907f828107e8ef is clean after corrections. Final local inspection covers installer reachability, role loading, identity binding, migration, documentation and evidence consistency; it is not an additional independent live review.
- [x] Paired behavioral comparison: baseline and candidate pass ordinary completion, owner-decision restraint and staged recovery using the same cases. Results isolate Skill composition, not complete old/new product stacks. Evidence: evals/reports/streamline-acceptance-UqmlvE/campaign-491f0ab1-99c9-475b-b1ce-3509c5abd61f/campaign.json.review-batch-c4a115ed-ed45-4777-bd19-272e0111d195.reviewed.json.
- [x] Interactive continuation: the same Sol session stops for a price decision, then completes after the operator supplies the decision, matching checker and implementation authority. Changes remain scoped and index/HEAD are preserved. Evidence: evals/reports/streamline-acceptance-UqmlvE/interactive/verification.json.
- [x] Native v1 coordination: Astra autonomously dispatches Sol implementation, then a distinct read-only Astra verifier, and writes acceptance only after consuming the result. Host checks confirm allowed changes, unchanged index/HEAD/guidance and no verifier mutation; observed traces show no memory summary injection or out-of-scope agent reads. Evidence: evals/reports/native-v1-live-B6rHZu/report.md and host-verification.json.

### Evidence limits

- Historical reports retain their original runtime identities. Native v1 coordination used Astra/medium; current Astra/low coordinator/verifier defaults have deterministic and offline verification, not a new live coordination run. Paired Astra/low reviews do not establish native-coordination equivalence.
- The interactive check is operator-driven synthetic acceptance, not human business acceptance or a separately blind-reviewed multi-turn comparison. The selected cases do not establish every positive design, diagnosis, TDD or findings-repair branch.
- Trace inspection is not OS-level filesystem isolation. Small-sample results do not establish statistical superiority, optimal conditional loading, cross-host/model equivalence or release approval. Browser appearance and external project migration are outside the verified boundary.

### Optional

- [ ] Additional model/host coverage only for an observed need and separately authorized paid evaluation scope.

## Blockers

- none
