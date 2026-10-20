---
kind: fix
summary: Clarify task explanations and evidenced reader usability judgments.
---

# Change: doc-review-reader-judgment

## Proposal
Make Doc's explanations and Review's usability judgments more discriminating under the existing [writing contract](../specs/writing-quality.md). Correct facts alone can leave readers guessing terminology, conditions or the action a statement supports. Refine existing rules rather than add another writing or review procedure.

## Spec
### MODIFIED
- Requirement: Existing Doc task and expression rules explain unfamiliar concepts to the depth needed by the declared reader and task, preserving useful causal and conditional links. Mechanisms remain when needed to reason, troubleshoot or assess guarantees; exact reference entries need no forced tutorial. Skill branches keep each decision's conditions, permitted action and result together.
- Requirement: Existing Document Review usability and Finding rules distinguish factual accuracy from task usability. A usability finding identifies the missing meaning or inference and its demonstrated effect on the task, including unnecessary reconstruction or lookup, grounded in the reader's prior knowledge and actual reading path. Apply existing authority, severity and evidence gates; necessary prerequisite reading, preference, paragraph length or a different adequate expression alone is no defect.

### Acceptance
#### Scenario: Explain only what the task needs
- GIVEN a procedure, concept explanation, reference entry or design rationale
- WHEN Doc applies its existing expression rules
- THEN the reader can understand the relevant meaning and conditions without losing necessary mechanisms, precision or reasoning, and no universal tutorial or action-list format is imposed.
#### Scenario: Keep branch meaning visible
- GIVEN a conditional instruction or an edit that shortens connected reasoning
- WHEN its expression is revised
- THEN the applicable action, result and failure boundary remain clear without mechanical sentence splitting or additional workflow steps.
#### Scenario: Ground usability findings
- GIVEN correct statements that leave a task-relevant term or decision unresolved, or an adequate alternative wording
- WHEN Document Review judges the fixed content
- THEN an actionable issue identifies the exact gap and consequence, including avoidable understanding effort even when the reader eventually chooses correctly, while sufficient definitions, necessary prerequisite reading, legitimate prior knowledge and harmless expression differences remain acceptable.

## Design
The delivered guidance is in [Doc](../../skills/rsp-doc/SKILL.md), its [Skill-authoring method](../../skills/rsp-doc/references/skill-authoring.md) and Review's [Document method](../../skills/rsp-review/references/document-review.md). The corresponding stable clauses were aligned in the [writing-quality Spec](../specs/writing-quality.md). Existing package boundaries, methods, headings, metadata, resource links and authority remain intact.

Doc retains task-relevant mechanisms and connected reasoning. Review recognizes evidenced avoidable reconstruction or lookup while accepting necessary prerequisites, legitimate complexity and adequate alternatives. The examples illustrate rule consolidation and identifiable referents without adding a reader worker, review round, script, report field, length limit or tutorial requirement.

Provenance is `model-only`, with independently written local wording and no imported assets or procedures. Source notes retain Prisma `a0eacc4b7b7ea22bec0e121e75c97e2a06b21d6a`, Anthropic `dbd4588f9e1033efb41dad4bef2f7947c8993d44`, the Google writing/review pages, OpenAI's official Build skills guidance and the bundled skill-creator. Exact source paths, baselines, attribution and reuse limits remain in the two original reports below.

## Tasks
- [x] Refined Doc's task/expression rules and conditional Skill guidance, preserving necessary mechanisms, precision and connected reasoning.
- [x] Grounded Review's usability findings in the reader's prior knowledge, exact inference gap and demonstrated task consequence; retained necessary prerequisite reading and adequate alternatives.
- [x] Aligned the writing-quality Spec and completed local checks, eleven initial and five refinement author contrasts, with provenance and evidence limits retained.

## Verify
### Required
- [x] Original and refinement candidates passed all seven published-package checks, affected document/lint checks and Change validation. Each document scope contained 11 Markdown files, 15 local links and five anchors. Existing metadata, headings, technical literals, resource links and list structure were preserved; both packages had no unreachable Markdown.
- [x] Eleven initial and five refinement static contrasts covered explanation depth, reference precision, connected conditions, referents, avoidable search, prerequisites, adequate expressions and independence. They establish author interpretation, not agent execution or independent Review.
- [x] Reused final package/resource, lint and affected-document results after 63 unchanged Skill/Spec input hashes and original logs matched. Site checks and 47 offline task-schema results remain applicable after 37 and 981 respective inputs and original logs matched. Changed records are excluded from this reuse and checked separately.
- [x] Record-convergence checks passed: affected-file lint, Change validation (six records, zero errors/warnings), whitespace, and three Markdown records with 18 local links and four anchors. Frontmatter, six canonical sections and Spec/acceptance bytes are preserved. The other 1,633 tracked inputs, 457 original evidence files, HEAD, index and Focus remain unchanged.

Original evidence: `tests/skills/reports/doc-review-reader-local-20261020T024314Z/` and `tests/skills/reports/doc-review-refinement-local-20261020T030620Z/`. Their input snapshots, candidate patches, source notes, preservation results and logs remain unchanged. Read/search glob, tool-call quoting and parsing failures, and author-detected draft corrections remain with those reports; failed invocations supply no passing result. Historical ignored reports were not exhaustively fingerprinted during the initial candidate check.

Record-convergence evidence: `tests/skills/reports/change-record-convergence-local-20261020T060830Z/`. Original reports retain their baselines, candidate patches, observations, failures and verdicts. The new evidence binds record checks and reused results to the final inputs.

Limits: checks establish structure and author consistency only. Actual model effectiveness, efficiency and independent acceptance remain unestablished. No model, judge or independent Review ran for the recorded candidates; earlier verdicts remain bound to their original inputs.

## Blockers
None
