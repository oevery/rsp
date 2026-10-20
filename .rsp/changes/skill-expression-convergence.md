---
kind: refactor
summary: Converge expression across the RSP Skill corpus while preserving existing decisions and boundaries.
---

# Change: skill-expression-convergence

## Proposal
Make the seven published and three maintainer Skills easier to follow by consolidating overlapping explanations and keeping conditions, actions and exceptions together. Inspect complete packages and retain already-clear text.

The user authorized corpus-wide semantic/expression convergence, local validation and evidence updates, with no commit. Preserve the existing uncommitted implementation-quality candidate. Do not introduce a workflow, mandatory reporting shape, mechanical item split, file move, installation, live model run or lifecycle delivery.

## Spec
### MODIFIED
- Requirement: Apply the existing [writing contract](../specs/writing-quality.md#instruction-and-resource-design) across all ten authored packages. Consolidate same-decision explanations and make the ordinary reading path clear without imposing word, sentence or item quotas.
- Requirement: Preserve triggers, inputs, authority, action order, outputs, stops, verification and conditional loading, including standalone use. Keep necessary permissions, conditions, exceptions, failures, commands, identifiers and numeric limits exact. Retain the prior implementation-quality refinements; do not treat this as new behavior authority.
- Requirement: Refine the existing writing contract and Doc/Review guidance to favor concrete actions and short, complete sentences. Keep decision-relevant reasons and conditions. Use prescriptive-rule contrasts only for likely ambiguity; retain explanatory comparisons needed for understanding, decisions or migration. Keep failure explanations for distinct decision effects, preserving necessary and rare high-consequence boundaries. An incident alone justifies no new constraint. Apply the guidance across the same ten packages without new workflow or duplicate engineering rules.

### Acceptance
#### Scenario: Ordinary use remains bounded
- GIVEN an authorized ordinary task or a direct capability invocation
- WHEN the revised Skill is read without the author conversation
- THEN it identifies the same action and evidence boundary, loads the same applicable resources and adds no phase, report obligation or unrelated reading.
#### Scenario: Conditions and failures remain distinct
- GIVEN denied mutation, uncertain effects, unavailable evidence, required independence or a branch-specific exception
- WHEN the revised instructions are applied
- THEN the same permissions, stops, failure meanings and exceptions remain visible rather than being lost through shortening.
#### Scenario: Prior work remains attributable
- GIVEN the existing uncommitted implementation-quality candidate and historical checks
- WHEN this expression-only candidate is validated
- THEN its own checks identify the new inputs, while original records and verdicts remain unchanged and supply no fresh behavior claim.

## Design
Use the maintainer `concise` mode and Doc's existing Skill method. The corpus contains 58 Markdown files and four UI metadata files in `skills/` and the real `.agents/skills/{author-rsp-skills,distill-upstream,release-acceptance}` packages. Retain headings, resource layout, link targets, discovery metadata, UI metadata and third-party notices. Edit prose only where it improves a decision or reading path; keep necessary standalone safety context local.

The baseline is HEAD `37b7ec059b91a0605c5e80106d512cc7b006dd34` plus the two existing Skill edits and `implementation-quality-guidance` record. Original package bytes and Git/focus observations are under `tests/skills/reports/skill-expression-local-20261020T021659Z/`. That candidate's original evidence remains attached to its earlier inputs.

Compare changed passages and ordinary/conditional paths against those bytes. Validate package closure and supported metadata with existing tools, then run lint, document and offline task-schema checks. Author interpretation is local evidence, not an independent review or measured model equivalence; no prose-fragment tests or paid calls are added.

Apply the user-authorized corpus follow-up using the revised Doc and writing-quality contract plus the selected OpenAI/Anthropic authoring recommendations: retain useful task knowledge, keep conditions with decisions, explain consequential constraints, and accept sufficient alternatives. Inspect all ten complete packages again, including the newer Doc/Review refinements. Preserve their accepted decisions and all existing metadata, headings, links and technical literals. The new dirty baseline, source notes and candidate-bound evidence are under `tests/skills/reports/skill-authoring-convergence-local-20261020T031441Z/`; earlier results remain bound to their own inputs. This is expression convergence, not authority to change routing, recovery, acceptance or delivery behavior.

Make two existing applicability statements explicit: repository-wide Git comparison belongs to Git sources, and the named release script's Skill check validates offline task schemas. The latter is a factual wording correction grounded in package.json and existing project instructions; commands, coverage requirements and acceptance gates remain unchanged.

The direct-expression follow-up uses a fresh dirty baseline and evidence under `tests/skills/reports/skill-direct-expression-local-20261020T034106Z/`. Its intentional contract delta is the expression preference above; task authority, routing, evidence, stops and delivery behavior stay unchanged. Preserve previous candidates and results. Edit authored sources, retain adequate passages and keep engineering rules with their existing capability owners.

The boundary-restraint follow-up is authorized to merge redundant examples and failure explanations while preserving their decision effects. Its fresh dirty baseline is under `tests/skills/reports/skill-boundary-restraint-local-20261020T041852Z/`. Refine the existing Spec and Doc/Review clauses, then inspect the same ten packages. Keep necessary standalone safety local, retain rare permission/serious-consequence/safe-recovery boundaries, and preserve named commands, technical values and prior evidence. No new workflow, mandatory audit field, model run or Git delivery is introduced.

The fixed-review correction addresses only the three accepted local findings: scope the contrast restriction to prescriptive rules while retaining explanatory comparisons, restore optional tool-call grouping under the Work model, and remove generic expression rules repeated in Doc's Skill branch. Its baseline and evidence are under `tests/skills/reports/skill-review-fixes-local-20261020T044551Z/`. Change only the writing Spec, Doc entry/Skill-authoring reference, Core durable-writeback reference and this record. Other uncommitted work and prior evidence remain unchanged.

## Tasks
The first four outcomes describe the initial corpus pass retained in its original report.

- [x] Inspected all ten complete packages, references and UI metadata; retained the exact dirty baseline.
- [x] Converged thirteen Markdown files across all ten packages; retained the other 45 Markdown files, four UI metadata files and existing resource layout.
- [x] Compared changed passages and sixteen ordinary/conditional contrasts against the baseline, including standalone use and correct non-action.
- [x] Completed the final work-record, lint and whitespace checks, with candidate-bound results and limits recorded.
- [x] Reinspected all ten current packages under the revised Doc and selected official authoring guidance. Refined eleven Markdown files in six packages; retained the other 47 Markdown files, four UI metadata files and existing resource layout. Kept the accepted Doc/Review reader criteria and quality/test guidance.
- [x] Completed current package/metadata, lint, Markdown and reading-path checks plus twelve static author contrasts; recorded fresh versus reused results and preserved earlier candidates and evidence.
- [x] Direct-expression follow-up: converged the writing Spec and existing Doc/Review methods around concrete actions, short complete sentences and contrasts for likely misapplications.
- [x] Inspected all ten packages and four UI metadata files; refined 30 Markdown files and retained the other 28 Markdown files, metadata and resource layout.
- [x] Completed package, lint, Markdown and reading-path checks plus sixteen static author contrasts; recorded fresh and reused evidence separately.
- [x] Boundary-restraint follow-up: integrated the example/failure admission rule and checked all ten packages. Refined seven Skill Markdown files and retained 51 Markdown files, all four metadata files and the full Commit package. Consolidated only redundant explanations and recorded local validation with its actual limits.
- [x] Fixed-review correction: scoped the contrast restriction while preserving explanatory comparisons, restored non-mandatory tool-call grouping and removed generic expression repetition in Doc's Skill branch. Local package, affected-file lint, document and author checks passed within the declared files.

## Verify
### Required
The first five observations remain evidence for the initial candidate; the follow-up results below identify the current input boundary separately.

- [x] All seven published and three maintainer packages passed metadata/resource checks. The 58 package Markdown files and this work record parsed, with 73 local links and four anchors resolving. Headings, metadata, resource links and code/command literals match the baseline. Context diagnostics found no unreachable Markdown; the sole repeated paragraph is the retained standalone work-model notice.
- [x] Final lint and site documentation checks passed, including seven bilingual page pairs and 29 site Markdown files. All 47 native Harbor task schemas passed offline. These results establish local structure, not model behavior.
- [x] Author inspection retained authority, failure, dependency, recovery, language and delivery conditions across sixteen contrasting paths. Draft risks were corrected before final checks; interpretations and the rejected patch-context attempt remain in `semantic-check.md`. No agent, judge or independent review executed.
- [x] Preservation matched 1,619 of 1,632 tracked baseline files; only the thirteen intended Skill files differ. The prior untracked Change, HEAD, index and focus are unchanged. Product/runtime sources, native tasks/checkers/rubrics, research records and candidate definitions remain outside the delta; historical evidence was not rewritten or regraded.
- [x] Final work-record validation passed with zero errors or warnings; focused record lint and whitespace checks passed.
- [x] Follow-up: all seven published and three maintainer packages passed metadata/resource validation; full lint passed. All 58 package Markdown files and this Change parsed, with 73 local links and four heading anchors resolving. Existing package headings, metadata, list structure, resource links and technical literals match the new dirty baseline. No unreachable Markdown was found; the sole repeated prose group remains the intentional standalone work-model notice. Final Change, record-lint and whitespace checks passed.
- [x] Follow-up author inspection covered twelve contrasting paths, including continuation, recovery, final reconciliation, advice/planning, check reuse/integration, finding authority, structural scope, work-record placement, reader effort, Git/web sources, offline release evidence and standalone safety. These are static interpretations, not model executions, independent Review or measured equivalence. Site-documentation and 47 offline native task-schema results were reused only after 37 site/config/parser and 981 evaluator/config input hashes matched the prior passing boundary.
- [x] Follow-up preservation: 1,624 of 1,636 tracked/nonignored baseline files are unchanged; only eleven Skill Markdown files and this Change differ. All 146 protected previous local evidence files, other Change records, the writing-quality Spec, HEAD, index and focus are unchanged. No runtime code, helper, native task/checker/rubric, research record, metadata or candidate definition was modified.

Evidence: `tests/skills/reports/skill-expression-local-20261020T021659Z/`. Structural and author checks cannot establish model behavior, efficiency or independent acceptance.

Current corpus follow-up evidence: `tests/skills/reports/skill-authoring-convergence-local-20261020T031441Z/`, including before/ sources, baseline.json, candidate.patch, source notes, semantic-check.md, fresh logs, reused-checks.json, preservation.json and final input fingerprints. Older results and verdicts remain bound to their original inputs; no model behavior, efficiency or independent acceptance is established.

Direct-expression follow-up evidence: `tests/skills/reports/skill-direct-expression-local-20261020T034106Z/`. All seven published and three maintainer package checks and full lint passed. All 60 Markdown files (58 corpus, writing Spec and this Change), 78 local links and nine anchors passed local checks. Headings, metadata, list structure, technical literals and resource links match this follow-up's baseline; no unreachable Markdown was found. The sole repeated paragraph remains the intentional standalone work-model notice. Sixteen path contrasts are local author reasoning, not executed model cases or independent Review. Site documentation and 47 offline task-schema results were reused after all 37 and 981 respective inputs and original log hashes matched. No behavioral or efficiency improvement is claimed.

Boundary-restraint evidence: `tests/skills/reports/skill-boundary-restraint-local-20261020T041852Z/`. All ten packages and full lint passed; 60 Markdown files, 78 local links and nine anchors passed local checks. Headings, metadata, technical literals and resource links match this follow-up's baseline. Verify intentionally removes one duplicate bullet; no other corpus list structure changes. No unreachable Markdown was found; the sole repeated paragraph remains necessary standalone work-model guidance. Complete-package reading was reused after all 62 corpus files matched the previous final-input hashes, then supplemented by a fresh focused audit and ten static path contrasts. Site checks and 47 offline task-schema results were reused after 37 and 981 respective input hashes and original logs matched. These are author/static checks, not model execution, efficiency evidence or independent Review.

Fixed-review correction evidence: `tests/skills/reports/skill-review-fixes-local-20261020T044551Z/`. All seven published package checks and affected-file lint passed. The two affected packages, writing Spec and this Change passed as 21 Markdown files, 36 local links and six anchors. Package headings, metadata, list structure, technical literals and resource links match the new baseline; neither package has unreachable Markdown. Six static author contrasts cover selective rule examples, explanatory/decision/migration comparisons, separate commands, safe batches and inherited expression rules. Site and 47 offline task-schema results were reused after the respective 37 and 981 inputs and original logs matched. This establishes local structure and author consistency, not a fresh independent Review, model behavior or efficiency result.

## Blockers
None for local expression work. Behavioral equivalence remains unmeasured; the Change stays open.
