---
kind: "research"
---

# Change: calibration-human-review-materials

## Proposal

- Outcome: human review material covers all eleven existing calibration samples, linking contracts, actual sample artifacts, candidate expectations and original judge reasons.
- Scope: one dated review packet, calibration navigation and this record. No new model/judge calls, label/scoring changes, historical rewrites or remote delivery.

## Spec

Each sample must expose its authoritative task, actual retained artifacts and transformation, expected component scores and candidate rationale, and original per-criterion judge reasons. Distinguish initial calibration from regrade, expected component differences from label disagreement, and historical evidence from current input identity. Mark missing human confirmation and remaining evidence gaps. All labels remain candidate; preparation is not human approval.

### Acceptance
#### Scenario: Human review of each sample
- GIVEN eleven current candidate manifests and retained calibration jobs
- WHEN the packet is assembled without executing samples or judges
- THEN all eleven samples have locatable contract/artifact/expectation/reason evidence and explicit disagreement or gap dispositions.
#### Scenario: Preserve history and authority
- GIVEN original trial results, reports, labels and scoring rules
- WHEN material is prepared
- THEN originals remain byte-identical and no label is promoted or score recomputed.

## Design

Read captured inputs and actual artifacts rather than executing transformations. Include both the original nine-sample calibration and its verifier-only regrade, plus the two-sample follow-up. Compare relevant captured inputs with current files and distinguish semantic contract agreement from checker/configuration drift. Keep the detailed packet in a dated research report and link it from existing calibration guidance.

Calibration guidance owns navigation; the packet owns historical review material.
No product contract or architectural choice changed, so no Spec or Decision Record
update is needed. Material review cannot confirm candidate labels.

## Tasks

- [x] Assemble all eleven review entries and original judge reasons.
- [x] Document disagreements, input drift and evidence gaps.
- [x] Check navigation, extraction accuracy and preservation.
- [x] Completed independent review of the materials and records before closeout.

## Verify

### Required
- [x] Independent material review is clean; human label decisions remain pending.
- [x] Eleven candidate entries and all located original/regrade observations are represented with exact reasons and artifact links.
- [x] Expected/observed components, sample identity, input differences and unavailable evidence are accurately distinguished.
- [x] Document/Change checks and source-link/extraction checks pass.
- [x] Original evidence, candidate manifests, samples and scoring sources remain unchanged; no model/judge runs.

The [human review packet](../../research/reports/2026-10-17T07-56-47Z.md) covers
all eleven candidate samples with parallel contract/content/label/reason summaries,
full retained artifact text, transformations and thirty verbatim criterion reasons.
Twenty observations comprise nine initial calibrations, their nine verifier-only
regrades, and two later calibrations. No component-versus-candidate mismatch was
found; intentional checks/judge differences remain distinct from disagreement.

The packet explicitly records older task/support input drift, absent human
confirmation and limited repeat observations. No human verdict is invented.
All 132 local Markdown links resolve; extraction checks matched 354 source hashes.
Preservation checks confirmed 41,135 historical evidence files and 860 protected
files unchanged; the calibration README navigation is the only authorized change
among baseline protected paths. No model/judge, sample execution or regrade ran.

[Validation](../../tests/skills/reports/calibration-human-review-20261017/verification-summary.json)
records document/Change checks, extraction and preservation evidence. Runtime and
scoring files are unchanged; prior code coverage remains applicable. This material
is ready for human reading, not label promotion or human label confirmation.

Independent reviewer `01a148ee-5648-7b10-9a23-4f7bc24728b8` returned `clean`
after reading the complete fixed packet and verifying eleven samples, twenty
observations, thirty criterion reasons, twenty-five artifact/index excerpts, eleven
scripts and 354 source hashes. The [review record](../../tests/skills/reports/calibration-human-review-20261017/independent-review.json)
retains scope and limits. This accepts material accuracy only: all candidate labels
and Pending human dispositions remain unchanged.

## Blockers

- none
