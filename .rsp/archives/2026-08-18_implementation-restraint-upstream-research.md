---
kind: "research"
---

# Change: implementation-restraint-upstream-research

## Proposal
- Outcome: Produce a current, evidence-backed upstream model for preventing speculative implementation boundaries and low-value test proliferation in real coding projects.
- Why:
  - boats-cloud exposed two recurring implementation failures: hypothetical boundaries become product abstractions, and changed technical layers receive tests without distinct regression value.
  - Existing RSP research covers general restraint, but the accepted DeepSeek Harness and ECC revisions predate their current simplification, review, testing, and evaluation Skills.
- Scope:
  - Refresh and distill the current DeepSeek Harness and ECC revisions against this concrete gap.
  - Sample official Google, Microsoft, and Android Skill suites and register only sources with directly relevant engineering behavior.
  - Synthesize completed reports with existing Ponytail, Karpathy, Superpowers, Addy, Matt, and Compound Engineering evidence.
- Non-goals:
  - Modify published Skills, runtime rules, Specs, CLI behavior, boats-cloud, or project engineering policy.
  - Accept upstream revisions, copy an upstream workflow wholesale, introduce coverage quotas, or require mutation testing.

## Spec
### ADDED
- Requirement: The research distinguishes implementation-restraint mechanisms from generic testing advice and vendor-domain Skill catalogs.
  - Every recommendation names the observed RSP gap, exact source report and recommendation, adoption mode, owning future artifact, and rejected overreach.
- Requirement: The model distinguishes independent failure coverage from tests that mirror files, wrappers, shared constants, or technical hops.
  - It also distinguishes reachable material boundaries from merely imaginable edge cases.

### Acceptance
#### Scenario: Current upstream comparison supports a bounded candidate decision
- GIVEN current immutable-revision reports for the selected sources and the boats-cloud-derived friction cases
- WHEN the cross-source model compares shared mechanisms, disagreements, RSP gaps, and rejected ideas
- THEN it recommends at most one bounded future candidate owner with three to five non-default behaviors, or truthfully concludes that current RSP behavior is sufficient

## Design
- Approach:
  - Use deterministic upstream prepare/status evidence, then distill only the changed or selected relevant Skill and documentation paths.
  - Treat full Skill catalogs as mechanism inventories; use mature engineering guidance only as an adjudication standard.
  - Use independently described boats-cloud cases as contrastive evaluation inputs, not copied product fixtures.
- Boundaries:
  - Research remains under `research/`, `upstreams.yaml`, and candidate upstream lock/cache state.
  - No `accept`, product mutation, Skill promotion, lifecycle closeout, Git delivery, or publication.
- Affected areas:
  - `upstreams.yaml` and prepared upstream evidence.
  - `research/upstreams/deepseek-harness/` and `research/upstreams/everything-claude-code/`.
  - `research/models/agent-implementation-restraint-and-test-value.md`.
- Constraints:
  - Preserve immutable prior reports and create new revision-owned reports.
  - Prefer current official repositories and primary source files; unknown licensing limits use to model-only.
  - Do not register a large official catalog unless an exact relevant Skill path justifies the maintenance cost.

## Tasks
- [x] Refresh and complete the current DeepSeek Harness source report.
- [x] Refresh and complete the current ECC source report.
- [x] Sample current Google, Microsoft, Android, and other official Skill suites for directly relevant implementation behavior.
- [x] Create the cross-source implementation-restraint and test-value model.
- [x] Reconcile recommendations, rejected mechanisms, source status, and unaccepted revision boundaries.

## Verify
### Required
- Automated:
  - [x] `node scripts/upstreams.mjs status deepseek-harness` — passed: candidate `99f6f02f`, `research=complete`, `next=accept`; the accepted revision remains `47f94385`.
  - [x] `node scripts/upstreams.mjs status everything-claude-code` — passed: candidate `06c5e118`, `research=complete`, `next=accept`; the accepted revision remains `c9de8f5b`.
  - [x] `mise exec -- pnpm test -- upstreams` — passed after `mise exec -- pnpm run build`: 73 test files and 819 tests passed. The first run exposed only a stale local `dist` chunk and passed after the project-required build.
  - [x] `git diff --check` — passed: changed research artifacts contain no whitespace errors.
### Optional
- Manual or environment:
  - [ ] Broader provider/model holdout — deferred until a future Skill candidate is selected.
- Coverage:
  - Research validity and candidate boundaries only; no product behavior or host acceptance.

## Blockers
- none
