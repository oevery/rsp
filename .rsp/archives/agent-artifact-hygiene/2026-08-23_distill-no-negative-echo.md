---
kind: "research"
---

# Change: agent-artifact-hygiene/distill-no-negative-echo

## Proposal
- Outcome: Produce a complete pinned source report for `LB623/no-negative-echo` that identifies only the final-output hygiene mechanisms applicable to RSP.
- Why:
  - Agents can preserve rejected session alternatives and correction history in comments, test names, commits, release prose, and handoffs even after the product result is correct.
  - RSP already owns several finalization surfaces, so adoption must be based on an exact remaining gap rather than installing another workflow wholesale.
- Scope:
  - Register the upstream as a reference-tier model source, prepare immutable evidence, inspect its runtime Skill, scanner, evaluation protocol, tests, provenance, and license, and complete one report with stable recommendations.
- Non-goals:
  - Installing the upstream Skill, accepting its revision, changing published RSP Skills, reproducing its full installer or scanner, or claiming model efficacy.

## Spec
### ADDED
- Requirement: The report separates final-output residue control from implementation restraint and test-value selection.
  - It records positive-target reconstruction, protected-surface classification, baseline and audience checks, preflight/freeze/readback/postflight sequencing, activation limitations, and preservation of material negative facts.
- Requirement: Every recommendation names one existing RSP owner, adoption mode, provenance, license consequence, and rejected upstream behavior.
  - Unknown or unsupported efficacy remains an explicit limitation and cannot justify direct adaptation.

### Acceptance
#### Scenario: Distillation identifies a bounded RSP delta
- GIVEN immutable evidence for the current upstream revision and the current RSP finalization contracts
- WHEN the model strategy report is completed
- THEN it contains evidence-backed findings, RSP gaps or explicit no-gap conclusions, stable recommendation IDs, license and reuse mode, rejected mechanisms, and no TODO or TBD placeholders

## Design
- Approach:
  - Add `no-negative-echo` to `upstreams.yaml` with `strategy: model`, prepare its initial revision, then follow `distill-upstream` against only the declared evidence paths.
- Boundaries:
  - Keep raw repository evidence under ignored cache and semantic conclusions under `research/upstreams/`; do not mutate product artifacts or accept the upstream revision.
- Affected areas:
  - `upstreams.yaml`
  - `research/upstreams/no-negative-echo/<revision>.md`
- Constraints:
  - Preserve exact revision and evidence hash; distinguish upstream evidence from local inference; do not copy social-media quotations or sensitive exclusion terms into runtime guidance.

## Tasks
- [x] Register the bounded upstream source and prepare immutable initial evidence.
- [x] Inspect the declared files and complete every model-strategy report section.
- [x] Record stable recommendations and rejected mechanisms against current RSP owners.
- [x] Run upstream tooling and research-model validation.

## Verify
### Required
- Automated:
  - [x] `node scripts/upstreams.mjs status no-negative-echo --json` — passed with candidate `08dfa4ddde5e4ae2baa9ac9620b729dfb995fa6b`, complete research state, full declared path coverage, and no unmatched paths; the upstream remains intentionally unaccepted.
  - [x] `mise exec -- pnpm exec vitest run test/tooling/upstreams.test.ts test/tooling/research-models.test.ts` — passed 2 files / 16 tests; proves source configuration and report structure satisfy repository contracts.
  - [x] `git diff --check` — passed; proves changed research and control artifacts are syntactically clean.
### Optional
- Manual or environment:
  - [ ] Compare later upstream revisions only after this initial report is complete.
- Coverage:
  - No host or provider behavior run was performed because source distillation does not establish runtime efficacy.

## Blockers
- none
