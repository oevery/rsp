---
kind: refactor
---

# Change: streamline-workflow-ownership

## Proposal
- Outcome: Preserve task-to-Skill routing, delegation, dependency-aware safe parallelism and automatic correction/review while assigning each workflow decision one owner and selecting depth from applicable evidence.
- Scope: Authored Skills and fallback; workflow, work-model, CLI and writing contracts; explicit configuration migration; bilingual guidance; focused native evaluation fixtures and deterministic calibration.
- Non-goals: A new controller or runtime state store, lite artifacts, package-name changes, model/provider reconfiguration, broad reliability or efficiency claims, and publication.

## Spec
### MODIFIED
- Core owns routing, result acceptance and the bounded correction/re-review loop. Capabilities own their execution methods. Explicit capability calls remain valid without a mandatory Core preflight; ordinary work gains no invented phase, tracking owner, worker or review obligation.
- Direct work needs no durable owner. Change retains one recoverable acceptance/delivery boundary; Group requires independently acceptable children with dependencies or integration, not a file or worker count.
- Independent workflow.delegation (off | auto) and workflow.closeout (ask | auto | manual) replace manage, defaulting to off/ask. Legacy configuration is rejected with migration guidance before mutation; no old implicit Git grant survives.
- RSP retains delegation, ownership, dependency and safe-concurrency decisions. Hosts supply actual workers, attribution, isolation, waiting and cancellation. Worker count is chosen within host constraints, without RSP tiers; required independence remains binding.
- Ordinary completion and checkpoints keep work open. Explicit closure or established final delivery selects closeout policy. Closure never grants Git, remote, publication, deployment or human-acceptance authority.
- Evidence is reusable while its target, relevant inputs and acceptance boundary apply. Independent semantic review can consume implementer checks; explicitly independent execution must actually run. Dependent writes require successful prerequisites, and uncertain effects require inspection before safe replay.
- Routine knowledge writeback updates verified facts and affected records without final whole-Change convergence. Final delivery retains necessary writeback, whole-record convergence, applicable evidence, required review and current readiness. An upgrade notice blocks dependent judgments; Commit separately assesses an authorized checkpoint's exact evidence.
- Review judges the selected target and risks. Supporting references do not enlarge the target. Confirmed findings, missing decisive evidence and deliberately deferred draft choices remain distinct; missing evidence blocks affected judgments without erasing supported findings.
- Doc owns writing and author checks; Review owns separately required judgment. Wording edits preserve meaning and technical literals; structural edits preserve completeness and reading paths. General writing guidance remains outside Core.

### Acceptance
#### Scenario: Direct entry and ordinary work
- GIVEN a bounded authorized request with no required WorkOwner
- WHEN configuration, implementation or worker evidence is needed
- THEN use the applicable capability and actual inputs without inventing a tracked plan, setup requirement, phase or user-continuation gate; required tracking and authority still apply when relevant.

#### Scenario: Workflow policy migration
- GIVEN missing, valid or legacy workflow configuration
- WHEN CLI setup, configuration or inspection resolves policy
- THEN defaults are off/ask, valid delegation/closeout values project consistently, and legacy manage settings fail with explicit guidance without update mutation.

#### Scenario: Completion and final delivery
- GIVEN applicable verification and preserved user work
- WHEN ordinary completion or checkpoint delivery occurs
- THEN keep Change open; at final delivery ask prepares a concrete closure decision, auto closes only eligible work, and manual keeps work open without an explicit close request; every Git action still needs its own authority.

#### Scenario: Evidence reuse and independent review
- GIVEN a corrected target and attributable passing implementer checks
- WHEN a distinct reviewer independently judges that target
- THEN reuse applicable evidence without role-triggered repetition, but execute checks again when independently required or invalidated; neither transport success nor author checks replace review.

#### Scenario: Correction and recovery limits
- GIVEN an accepted finding or a natural repair request with required independent review
- WHEN correction is authorized and decisive evidence remains available
- THEN complete bounded correction and fresh review without premature continuation requests or self-certification; retain separate correction budgets and stop when the same finding survives two completed corrections. Synthetic prior history is never fresh execution evidence.

#### Scenario: Safe coordination
- GIVEN independent ready work or incompatible shared resources
- WHEN workers are selected
- THEN actual host evidence establishes attribution and resource/writer isolation; dependencies and shared-resource conflicts remain serial or stopped, and required workers are awaited.

#### Scenario: Interim writeback and unavailable migration evidence
- GIVEN pending consumer work or an unavailable upgrade-dependent readiness result
- WHEN a bounded stable-fact update or exact checkpoint is requested
- THEN preserve ongoing work and perform only supported authorized actions; an upgrade notice is not a blanket checkpoint prohibition, while unavailable Required verification prevents staging/commit.

#### Scenario: Review conclusions and writing
- GIVEN a real defect, a missing vendor contract and an explicitly deferred draft decision
- WHEN Review evaluates the selected content
- THEN report the defect and blocked coverage separately, respect deferred scope, and preserve required evidence; writing changes retain meaning, technical literals and artifact ownership.

## Design
The existing CLI configuration projection and seven-Skill suite implement separate work-shape, delegation and final-delivery decisions. Legacy configuration is rejected explicitly instead of preserving an implicit Git grant. Coordination and correction stay with their existing owners; no controller, transport or persistent runtime protocol was added.

The product/evaluation candidate is 45181b5feb7bb52f28231358f265f91e64392f41, following workflow commit 178eaaae. Acceptance uses frozen task, Skill, configuration and image inputs, applicable local checks, native execution and independent semantic review. The final selected coverage replaces the two paused six-scenario execution entries; broader reliability and efficiency research remains deferred.

Current contract owners are [Architecture](../specs/design.md), [Work model](../specs/work-model.md), [Workflow](../specs/workflow.md), [CLI](../specs/cli.md) and [Writing quality](../specs/writing-quality.md). The [delegation/closeout Decision Record](../specs/decisions/separate-delegation-and-delivery-closeout.md) owns the rationale. These owners already reflect the delivered contract; the reviewed bilingual guide correction aligns their summaries without introducing a new contract or duplicate knowledge artifact.

## Tasks
- [x] Implement workflow-policy migration and consumer projections, preserving refusal-before-mutation and separate Git authority.
- [x] Align capability ownership, work shapes, safe coordination, correction, evidence reuse and closeout across Skills, fallback, Specs and bilingual guidance.
- [x] Converge writing and Review conclusion boundaries; correct the independently identified guide mismatch between routine writeback and final convergence.
- [x] Add and calibrate focused behavior, delivery and outcome fixtures; complete applicable local checks and scoped corrections, delivered as 178eaaae and 45181b5f.
- [x] Freeze the candidate and obtain passing evidence for all eleven selected live scenarios through the initial round and separately authorized supplements, preserving every attempt and failure.
- [x] Complete independent product, guide-correction and acceptance-evidence reviews, and reconcile the final Change and report with their knowledge owners.

## Verify
### Required
- [x] Applicable local coverage: build, typecheck, lint, 69 code tests through original execution and affected reruns, seven Skill package/resource checks, security, documentation and 38 offline schemas. Failed aggregates remain failed; passing affected reruns and their source applicability are linked from the acceptance report.
- [x] Deterministic reference, negative, malformed-report and preservation controls support the frozen fixture composition; calibration is separate from model acceptance.
- [x] The evaluation image contains the frozen CLI/package and support; native preparation verified actual baked inputs before execution.
- [x] All eleven selected live scenarios have passing programmatic and semantic evidence with unchanged frozen inputs/settings. Across three jobs, all fifteen attempts remain recorded: eleven passed, three executor errors and one unscored judge result. Both required coverage gaps are resolved; historical failures are unchanged.
- [x] Independent Code/Document review is clean for the product, corrected guides and final acceptance evidence. Actual worker attribution, relevant check evidence and record preservation were inspected; initial findings and the review interruption remain retained.
- [x] Document, named Change and diff checks passed. All 262 initial captured Skill/task/support files match the source; each supplement preserves its 87 selected files, lock/catalog, effective settings and image identity. Current readiness remains a separate lifecycle observation.

### Optional
- [-] Matched baseline/candidate execution, repeated reliability observations and broader semantic-judge calibration remain deferred. No efficiency or repeatability claim is made.
- [-] Live natural-request/remaining-budget controls and other unselected scenarios are outside final live acceptance; their deterministic and historical evidence remains bound to its original inputs.

### Evidence and retained limits
The [acceptance report](../../research/reports/2026-10-16T09-08-26Z.md) owns candidate identity, the three-job result table, raw evidence links, failure dispositions and review records. Both original live gaps are resolved. This establishes bounded coverage of the selected standalone CLI scenarios, not desktop equivalence, general reliability, efficiency, publication or human acceptance.

The [architecture and follow-up report](../../research/reports/2026-10-15T09-22-32Z.md) and [initial evidence reconciliation](../../research/reports/2026-10-14T02-48-34Z.md) retain earlier experiments, corrections and failures. Unlocated historical claims remain excluded from acceptance. Fresh readiness and explicit user confirmation are required before archive.

## Blockers
- none
