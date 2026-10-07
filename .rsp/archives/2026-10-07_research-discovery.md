---
kind: refactor
summary: Support exploratory upstream research with immutable refresh batches, offline comparisons and study-bound coverage.
---

# Change: research-discovery

## Proposal

Delivered upstream exploration without a predefined question, alongside focused studies. Retained evidence, source coverage and exact local comparison material remain traceable across refreshes. Scope is maintainer research tooling, its Skill and relevant fixtures; the published product CLI is unchanged. Live upstream acquisition and paid model evaluation remain outside this implementation's verification boundary.

## Spec

### MODIFIED
- Requirement: A study starts from a research brief; the old question field and option are replaced without a compatibility reader.
- Requirement: Explicit batch refresh retains source selection, exact revisions, scoped evidence, repository inventory and per-source failures. Partial acquisition remains usable and visibly incomplete.
- Requirement: Evidence comparisons distinguish content changes from capture scope changes. Research coverage belongs to a sealed study, not a global source acceptance cursor.
- Requirement: Studies cite exact refresh records, declared reviewed evidence and retained local baseline material. Coverage is a declaration, not semantic acceptance.
- Requirement: Batch comparisons are available offline; coverage distinguishes repository changes inside and outside the reviewed scope from the exact reviewed revision. Historical subsets preserve their retained version and observed source identity without relying on the current cache.

### Acceptance
#### Scenario: Refresh twice before studying
- GIVEN a study covers snapshot A
- WHEN refreshes capture B and C before follow-up research
- THEN comparing study coverage to C includes changes since A rather than only B.

#### Scenario: Partial refresh and changing scope
- GIVEN several sources and a selected earlier refresh
- WHEN one source fails or capture scope changes
- THEN successful evidence remains accessible, gaps remain visible and scope exclusions are not reported as upstream deletions.

#### Scenario: Exploration and local reassessment
- GIVEN an exploratory brief with no concrete question
- WHEN evidence and local baseline material support a report
- THEN it can seal even with no recommendations, and a successor can change local evidence while upstream stays unchanged.

## Design

Retain Sources, Evidence and Studies. Add only immutable content-addressed refresh records; use exact refresh references and derived coverage output rather than a mutable acceptance ledger. Mechanical tools acquire and compare bytes; the Skill interprets changes and checks local applicability. Git snapshots and imported local excerpts/patches identify the RSP comparison boundary. Independently implement the accepted design; no third-party code or prompts copied. Preserve historical sealed bytes without implicit migration.

Current maintainer behavior and its boundaries are documented in research/README.md and .agents/skills/distill-upstream/ with its operations reference. These existing owners contain the durable updates; no published-product Spec changes are needed. No separate Decision Record is needed for this maintainer-only extension of the retained-evidence model.

## Tasks

- [x] Implement brief-based studies, refresh records, evidence comparison and derived coverage.
- [x] Update research documentation, maintainer Skill and affected cases.
- [x] Verify observable exploration, refresh failure, scope and baseline behavior; run required project checks.
- [x] Correct the accepted review findings: offline repository discovery across skipped refreshes and historical subset coverage; verify both scenarios.

## Verify

### Required
- [x] Local CLI scenario regressions for the declared acceptance.
- [x] Build, lint and complete code suite.
- [x] Maintainer package/resource checks, security preflight and affected offline Skill cases.

Verification: the initial full suite passed 159 tests across 20 files (152.53s). After the accepted review corrections, 29 research/oracle tests passed across 2 files (22.79s); unaffected build, typecheck and product cases reuse the earlier evidence. Current lint, maintainer offline readiness (4 cases), package validation and security (9 files, no findings) passed. Independent bounded Code/Document re-review found both accepted findings resolved and no new actionable issue.

Latest input hashes, check scope and review identity: tests/skills/reports/research-discovery-fixes-20261007-181544/verification.json. Earlier full-suite evidence: tests/skills/reports/research-discovery-20261007-180126/verification.json. No real upstream acquisition was performed.

### Optional
- Real model exploration and repeated outcome stability remain unmeasured; offline readiness and code checks do not establish them.

## Blockers

- none
