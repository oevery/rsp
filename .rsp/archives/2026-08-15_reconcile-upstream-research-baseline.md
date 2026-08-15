---
kind: "research"
---

# Change: reconcile-upstream-research-baseline

## Proposal
- Outcome: Reconcile the accepted upstream research baseline with implemented evaluation and current RSP capability status
- Why:
  - All 20 registered upstreams are accepted with complete research and no pending next action, but the acceptance model still describes a future acceptance wave.
  - The Skill quality model still reports Q1 and Q3 as proposed gaps after their RSP-owned evaluation infrastructure was implemented and archived.
  - Current capability models still describe `rsp-manage` as research-only and use the retired `rsp-address-review` identity, which conflicts with the authoritative published Skill suite.
- Scope:
  - Reconcile the acceptance decision, Skill quality/governance model, capability coverage ledger, frozen Skill-system model boundary, and research index with current verified repository facts.
  - Record Q1 and Q3 as implemented maintainer infrastructure and make Q2, Q4, and Q5 explicitly evidence-triggered deferred candidates.
  - Preserve historical source conclusions while clearly separating superseded product-status statements from the current baseline.
- Non-goals:
  - No edits to published Skills, runtime source, rules, Specs, upstream reports, `upstreams.lock`, `upstreams.yaml`, or provider/host metadata.
  - No implementation of Q2, Q4, Q5, `openai.yaml`, automatic Skill optimization, provider runs, release, archive, Git delivery, or publication.

## Spec
### ADDED
- Requirement: The research baseline reports completed acceptance and implemented recommendations truthfully.
  - The acceptance model records all 20 registered sources as accepted and complete without implying product adoption.
  - Q1 and Q3 link to their exact archived RSP Changes and describe only the implemented maintainer infrastructure.
- Requirement: Deferred recommendations are conditional rather than an implementation queue.
  - Q2 requires an observed routing or description-collision failure, Q4 remains a release-candidate security decision, and Q5 requires repeated capability lookup friction.
  - No deferred recommendation becomes product work merely because the research baseline is closed.
- Requirement: Current capability identities are consistent with authoritative product facts.
  - Current-facing research uses `rsp-resolve-findings` and recognizes published `rsp-manage`; frozen historical claims remain identifiable as historical rather than current authority.

### Acceptance
#### Scenario: Query the closed upstream baseline
- GIVEN all registered upstream revisions are accepted and their reports are complete
- WHEN a maintainer reads the acceptance and quality models
- THEN the documents report a closed research baseline, Q1/Q3 implementation evidence, and no automatic next product candidate

#### Scenario: Distinguish current product facts from frozen research history
- GIVEN the product publishes `rsp-manage` and `rsp-resolve-findings`
- WHEN a maintainer uses the capability and Skill-system models
- THEN current-facing guidance uses those identities and marks superseded 3.0 candidate conclusions as historical

## Design
- Approach:
  - Update the active quality, acceptance, and capability models in place with concise implementation reconciliation sections and exact archive references.
  - Keep the frozen Skill-system model as historical research, adding a prominent current-status boundary and correcting current-facing summaries without rewriting source evidence.
  - Update the research index so future readers select the active governance baseline instead of treating every historical model as current product truth.
- Boundaries:
  - Product Specs and Skills remain authoritative; research records implementation status and candidate conditions but grants no mutation or promotion authority.
- Affected areas:
  - `research/models/skill-quality-and-governance.md`
  - `research/models/upstream-acceptance-decision.md`
  - `research/models/rsp-capability-coverage.md`
  - `research/models/rsp-skill-system.md`
  - `research/models/INDEX.md`
- Constraints:
  - Preserve source revisions, report citations, licensing decisions, and historical evaluation results.
  - Do not convert research frontmatter into a second product lifecycle or claim provider-backed candidate optimization.

## Tasks
- [x] Reconcile accepted-source and Q1/Q3 implementation status with exact evidence.
- [x] Correct current capability identities and mark frozen historical product-status claims explicitly.
- [x] Freeze Q2/Q4/Q5 as evidence-triggered deferred candidates and update research navigation.
- [x] Run focused research, RSP, and repository hygiene verification.

## Verify
### Required
- Automated:
  - [x] `node scripts/upstreams.mjs status all` — passed: all 20 registered sources are accepted with `research=complete` and `next=none`; proves the upstream baseline is closed.
  - [x] `node scripts/check-capability-coverage.mjs` — passed: 58 classifications, 112 exact Skill paths, and 6 decisions; proves source/report/path coverage remains complete after reconciliation.
  - [x] `node dist/cli.mjs check --focused --json` and `git diff --check` — passed with zero errors and zero warnings; proves the selected Change and edited Markdown remain structurally valid.
  - [x] `mise exec -- pnpm run docs:check`, `mise exec -- pnpm run lint`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run build`, and `mise exec -- pnpm run test` — passed; docs reported 7 bilingual pairs and 30 Markdown files, and the full suite passed 73 files / 796 tests. This proves repository documentation, static, package-build, and regression compatibility.
### Optional
- Manual or environment:
  - [ ] Provider-backed candidate comparison — omitted because this Change edits research state only and selects no Skill candidate.
- Coverage:
  - Required evidence covers accepted provenance, capability inventory integrity, RSP artifact validity, and repository lint; no product behavior changes.

## Blockers
- none
