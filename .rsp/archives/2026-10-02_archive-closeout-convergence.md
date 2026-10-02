---
kind: fix
---

# Change: archive-closeout-convergence

## Proposal
- Outcome: Verify outcome facts, distill Focus and update knowledge as needed, then converge the whole Change before final consistency checks and authorized archive.
- Scope: Core closeout guidance, standalone Doc/Review checks, current Specs and fallback; editorial repair of the single archive 2026-10-02_archive-evidence-boundary; end-to-end archive evaluation and removal of artificial model-duration/output/snapshot limits in its runner.
- Non-goals: Focus v2, new product lifecycle states, automatic prose filtering, broad archive rewrites, Git delivery or publication.

## Spec
### MODIFIED
- [Core](../specs/core-model.md#evidence-and-closeout): both writeback decisions may legitimately produce no edit when unnecessary; required knowledge corrections precede final whole-Change convergence and archive.
- [Writing quality](../specs/writing-quality.md#artifact-differences): final artifacts retain outcomes, material failure dispositions, evidence references and limits, not session chronology or response-only handoff templates.

### Acceptance
#### Scenario: Final artifact convergence
- GIVEN completed implementation with mixed recovery notes and process narration across the Change
- WHEN authorized closeout proceeds
- THEN useful verified Focus facts are selectively integrated, justified stable knowledge is updated or left unchanged, and the entire Change is reconciled against those results before final checks; the archived document contains only outcome-relevant material.
#### Scenario: Required evidence failure
- GIVEN a failed Required check
- WHEN archive is requested
- THEN the failure remains explicit and archive is withheld; historical reports and unrelated files remain unchanged.

## Design
Core owns the ordered procedure, Doc the bounded whole-document editing and Review the final-artifact judgment. CLI archive remains a deterministic move, not an editor. Product Skill triggers, permissions, Focus format and independent-review boundaries stay unchanged. Candidate baseline: 30a64ef.

Fact verification establishes truth without requiring a preliminary full rewrite. Knowledge writeback uses approved, verified results and existing authoritative contracts, not unchecked recovery notes. Final Change convergence follows all necessary writeback, preserving its historical delta and evidence while linking stable knowledge owners. These are dependency constraints, not new persisted stages or mandatory separate tool calls. Material contradictions return to the relevant decision, implementation or verification owner; prose cleanup cannot resolve a failed contract.

The runner needs a narrowly declared archive WorkRef to allow its date-stamped output without allowing arbitrary archive edits. Mechanical checks cover lifecycle and preserved files; the independent judge evaluates final text semantically, never by exact Skill wording. Model coverage uses one successful archive and one Required-failure restraint case.

Model execution and review have no total deadline or token budget. Retain provider stream-idle policy, root-session budgets, local probe deadlines and native worker topology limits. Remove aggregate output, input-size and snapshot quotas; stream evidence to files and consume it incrementally while preserving legacy reports, cancellation, redaction, path containment and detection of ignored-file mutations. Actual I/O failures remain incomplete evidence, never passing acceptance.

## Tasks
- [x] Clarify fact verification, needs-based writeback before whole-Change convergence, and final checks in authored Skills, Specs and fallback.
- [x] Repair the selected archive's narration without changing its identity, acceptance, results or source reports.
- [x] Add final-archive and Required-failure cases with bounded archive permissions and regression controls.
- [x] Remove model total deadlines and volume quotas; validate file-backed evidence, legacy review, cancellation and safety boundaries.
- [x] Validate packages, code and isolated model outcomes; converge this Change to final evidence.

## Verify
### Required
- [x] Package/resources, build, lint, code tests, fallback synchronization and RSP/diff checks pass.
- [x] Mechanical controls establish allowed archive output and reject unrelated archive writes while preserving Git boundaries.
- [x] Model execution and independent judging inspect the final archive, with failure restraint verified separately.
- Model evidence: a fresh success execution and independent judgment pass with retained checker output before knowledge editing, followed by whole-Change convergence, consistency checks and CLI archive. Independent reassessment of the preserved Required-failure execution passes: failed evidence remains explicit and archive is withheld. Both apply to the current Skill composition. Evidence: tests/skills/reports/archive-closeout-convergence/independent-acceptance-2026-10-02.md.
- Failure disposition: the earlier success execution fails independent reassessment because pre-writeback checker evidence is missing despite a claimed pass. It is excluded from success-path acceptance; the fresh execution supplies that evidence without rewriting original reports or verdicts. Historical timeout/cancelled matrices remain inconclusive.
- [x] Final author check covers the whole candidate and confirms original archived acceptance and report contents are preserved.
- Validation: `pnpm run test` passed 125 tests across 18 files; build, lint, typecheck, package/security checks, docs check and all 65 catalog offline readiness cases passed. Runner regressions cover large output/workspaces/native logs, legacy records, cancellation and unsafe evidence. Details and limits: tests/skills/reports/archive-closeout-convergence/runner-controls-validation.md. Fallback matches its authored source. The selected archive retains unchanged Spec, Tasks, Required Verify and Blockers; original source reports were not edited.
### Optional
- The host Skill quick validator could not run because local Python lacks PyYAML; repository package/resource validation passed.
- Repeated model reliability and cross-model generality are outside this correction's evidence boundary.
- The historical pre-writeback gap remains unexplained as capture loss versus execution omission; a fresh passing execution establishes the required path, not the cause of that earlier gap.

## Blockers
- none
