---
kind: refactor
summary: Converge expression across the RSP Skill corpus while preserving existing decisions and boundaries.
---

# Change: skill-expression-convergence

## Proposal
Make the seven published and three maintainer Skills easier to follow by consolidating overlapping explanations and keeping conditions, actions and exceptions together. Inspect complete packages and retain already-clear text.

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
The authored corpus contains seven published and three maintainer packages: 58 Markdown files and four UI metadata files in `skills/` and the real `.agents/skills/{author-rsp-skills,distill-upstream,release-acceptance}` directories. Complete-package inspection retained adequate text, standalone safety context, headings, metadata, resource layout, links, technical literals and third-party notices. No mechanical item split or resource move was introduced.

The [writing-quality Spec](../specs/writing-quality.md), [Doc](../../skills/rsp-doc/SKILL.md) and [Document Review](../../skills/rsp-review/references/document-review.md) own the expression delta. Prescriptive contrasts resolve likely ambiguity; explanatory, decision and migration comparisons remain valid. Failure explanations are merged only when their decision effects coincide. Rare permission, serious-consequence and safe-recovery boundaries remain explicit.

Corpus edits apply these rules through existing capability owners. They preserve the accepted [implementation-quality](2026-10-20_implementation-quality-guidance.md) and [reader-judgment](2026-10-20_doc-review-reader-judgment.md) changes. They also clarify that repository-wide Git comparison applies to Git sources and the release script checks offline task schemas. Commands and coverage obligations are unchanged. Dependency ordering does not require separate tool calls; generic expression rules remain with Doc rather than being duplicated in its Skill branch.

The original comparison starts from `37b7ec059b91a0605c5e80106d512cc7b006dd34` plus the retained implementation-quality candidate. Each later comparison used its own captured dirty baseline. Selected OpenAI/Anthropic authoring advice informed independent local wording; exact source notes and per-candidate preservation results remain with the evidence below.

## Tasks
- [x] Inspected all ten complete packages and four UI metadata files, consolidating repeated explanations while preserving ordinary/conditional reading paths and existing capability boundaries.
- [x] Aligned the writing Spec and Doc/Review methods around concrete actions, short complete sentences, necessary comparisons and restrained failure guidance.
- [x] Corrected the three reviewed issues: retained explanatory comparisons, restored optional tool-call grouping and removed repeated generic expression rules from Doc's Skill branch.
- [x] Completed local package, lint, document and reading-path checks with static contrasts; retained original candidates, provenance, failures and evidence applicability.

## Verify
### Required
- [x] The final corpus evidence passed all seven published and three maintainer package checks and full lint. Its 60 Markdown files, 78 local links and nine anchors passed local checks; metadata, headings, technical literals and resources matched its baseline. Verify removed one duplicate bullet. No unreachable Markdown was found; the repeated standalone work-model notice remains intentional.
- [x] The final fixed correction passed all seven published-package checks and affected-file lint. Its 21 Markdown files, 36 local links and six anchors passed local checks; neither affected package had unreachable Markdown. Metadata, headings, list structure, technical literals and resource links matched its baseline.
- [x] Static path comparisons covered ordinary use, direct invocation, recovery, dependency and failure conditions, required independence, evidence reuse, delivery and correct non-action. The final six contrasts covered prescriptive examples, explanatory comparisons, separate commands, safe batches and inherited expression rules. Per-candidate counts and draft corrections remain in their original reports.
- [x] Reused final package/resource, lint and affected-document results after 63 unchanged Skill/Spec input hashes and original logs matched. Site checks and 47 offline task-schema results remain applicable after 37 and 981 respective inputs and original logs matched. Changed records are excluded from this reuse and checked separately.
- [x] Record-convergence checks passed: affected-file lint, Change validation (six records, zero errors/warnings), whitespace, and three Markdown records with 18 local links and four anchors. Frontmatter, six canonical sections and Spec/acceptance bytes are preserved. The other 1,633 tracked inputs, 457 original evidence files, HEAD, index and Focus remain unchanged.

Retained evidence under `tests/skills/reports/`:

| Evidence directory | Scope |
| --- | --- |
| `skill-expression-local-20261020T021659Z/` | Initial complete-corpus comparison and original candidate |
| `skill-authoring-convergence-local-20261020T031441Z/` | Corpus alignment with revised Doc and selected official guidance |
| `skill-direct-expression-local-20261020T034106Z/` | Direct expression and preserved conditional paths |
| `skill-boundary-restraint-local-20261020T041852Z/` | Final corpus example/failure restraint and reused checks |
| `skill-review-fixes-local-20261020T044551Z/` | Final three-finding correction and affected checks |

These reports retain original input bytes, patches, source notes, preservation results, author interpretations, failed patch/tool attempts and check outcomes. The final applicable boundary combines the last two reports; older results retain their original scope.

Record-convergence evidence: `tests/skills/reports/change-record-convergence-local-20261020T060830Z/`. Original reports retain their baselines, candidate patches, observations, failures and verdicts. The new evidence binds record checks and reused results to the final inputs.

Limits: structural checks, context diagnostics and author interpretation do not establish model behavior, behavioral equivalence, efficiency or independent acceptance. Those local checks ran no agent, judge or independent reviewer. Later focused current-suite live results are recorded in [implementation-quality-guidance](2026-10-20_implementation-quality-guidance.md); they do not measure expression equivalence or efficiency. The intentional expression preference is not a claim of measured equivalence.

## Blockers
None
