---
kind: fix
summary: Clarify task explanations and evidenced reader usability judgments.
---

# Change: doc-review-reader-judgment

## Proposal
Make Doc's explanations and Review's usability judgments more discriminating under the existing [writing contract](../specs/writing-quality.md). Correct facts alone can leave readers guessing terminology, conditions or the action a statement supports. Refine existing rules rather than add another writing or review procedure.

The user authorized revisions to rsp-doc and rsp-review, local validation and evidence updates, with no commit. Preserve the prior uncommitted quality and expression candidates. No mandatory reader worker, review round, script, report field, length limit, live evaluation or lifecycle delivery is added.

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
Use maintainer `revise` mode. Replace the existing task/expression clauses in Doc, execution guidance in its Skill-authoring reference, and usability/Finding guidance in Review's Document reference. Align only corresponding clauses in the writing-quality Spec. Keep the runtime packages standalone, with their current headings, metadata, resource links, methods and authority boundaries.

Apply the user-selected official-authoring follow-up within these same clauses: recognize evidenced avoidable understanding effort without treating normal prerequisite reading as a defect, and replace the recovery illustration with an example of consolidating one writing rule. The follow-up uses the preceding read-only comparison of OpenAI's official Build skills guidance, the bundled skill-creator and Anthropic's authoring guidance as model-only provenance; no upstream asset or procedure is imported. Its exact local baseline and source/reuse notes belong under `tests/skills/reports/doc-review-refinement-local-20261020T030620Z/`.

The selected upstream recommendations are the preceding read-only assessment accepted by the user. Use them as `model-only` provenance and write local wording independently: Prisma's reader-review and explain-not-state guidance at `a0eacc4b7b7ea22bec0e121e75c97e2a06b21d6a`, Anthropic's reader-testing guidance at `dbd4588f9e1033efb41dad4bef2f7947c8993d44`, and the Google writing/review pages identified in the local evidence. Source paths, attribution/reuse limits, selected ideas and rejected upstream procedures belong in that evidence; no upstream text, scripts or templates are imported.

Retain the exact dirty baseline under `tests/skills/reports/doc-review-reader-local-20261020T024314Z/`. Prior candidate records and their checks remain bound to their original inputs. Validate affected package metadata/resources, Markdown links/anchors, lint, documentation and offline task schemas using existing tools. Inspect contrasting examples as author reasoning, not executed model behavior or independent acceptance. No Skill-prose assertions are added to code tests.

## Tasks
- [x] Refined Doc's existing task/expression clauses, Skill-authoring branch organization, Review's usability/Finding guidance and corresponding writing-quality Spec clauses. Preserved necessary mechanisms and reference precision; added rule-consolidation and referent examples without new headings, steps, fields or runtime resources.
- [x] Completed package, Markdown, lint, documentation and offline task-schema checks, plus author inspection of eleven contrasting decisions and restraint cases.
- [x] Recorded the exact candidate delta, source provenance, final inputs, preservation results, tool issues and evidence limits separately from earlier candidates.
- [x] Applied the accepted official-authoring follow-up: included evidenced unnecessary understanding effort in usability consequences, retained normal prerequisite reading as a non-defect, and replaced the recovery illustration with a direct writing-rule consolidation example.

## Verify
### Required
The first five observations describe the initial candidate retained under `tests/skills/reports/doc-review-reader-local-20261020T024314Z/`; they do not establish behavioral acceptance of the follow-up.

- [x] All seven published packages passed metadata/resource checks; full lint and site documentation checks passed, including seven bilingual page pairs and 29 site Markdown files. All 47 native Harbor task schemas passed offline. No product code, native task/checker/rubric or shipped helper was changed, so unaffected build/code checks were not repeated.
- [x] The two complete packages, writing Spec and Change parsed as 11 Markdown files, with 15 local links and five heading anchors resolving. Existing headings, metadata, list structure, links and technical literals match the dirty baseline. Both packages have no unreachable Markdown; the repeated standalone work-model notice remains intentional. Structural diagnostics are not writing-quality or behavior gates.
- [x] Author inspection covered eleven contrasts, including needed mechanisms, exact reference entries, connected reasoning, conditional recovery, identifiable referents, reader prerequisites, explicit requirements, unknown facts and independence. Draft corrections retained all-artifact format freedom and required a prerequisite link to identify the referent. These are static interpretations, not executed agent cases or independent Review.
- [x] Preservation matched 1,630 of 1,634 tracked/nonignored baseline files; only the four intended existing files differ. All prior Change records, HEAD, index and original focus markers are unchanged; only this Change's focus marker was added. Ignored historical reports were not exhaustively fingerprinted and no command writes to them; their results remain attached to their original inputs.
- [x] Final work-record validation and focused record lint/whitespace checks passed. Read/search glob and tool-call quoting failures before editing are retained in command-issues.md; neither supplied a check result.
- [x] Follow-up checks: all seven published packages passed metadata/resource validation; affected-file lint, final Change validation and whitespace checks passed. The two packages, Spec and Change parsed as 11 Markdown files, with 15 local links and five anchors resolving. Existing package/Spec headings, metadata, technical literals, resource links and list structure remain unchanged. Five static author contrasts address avoidable search, necessary prerequisites, legitimate complexity, equivalent expressions and rule consolidation; no model, judge or independent Review ran.
- [x] Follow-up evidence reuse: the prior site-documentation result and 47 offline native task-schema results remain applicable after checking 37 site/config/parser and 981 evaluator/config file hashes against their original inputs. These are reused results, not fresh executions. All 33 previous local evidence files and other Change records remain unchanged. Of 1,636 tracked/nonignored baseline files, only the two Skill references, writing Spec and this Change differ; HEAD, index and focus are unchanged.

Evidence: `tests/skills/reports/doc-review-reader-local-20261020T024314Z/`, including `candidate.patch`, `sources.md`, `source-inputs.json`, `semantic-check.md`, `structure.json`, `preservation.json`, check logs and final input fingerprints. Local checks establish structure and author consistency only; no fresh model behavior, efficiency or independent-acceptance claim is made.

Follow-up evidence: `tests/skills/reports/doc-review-refinement-local-20261020T030620Z/`, including the new baseline/delta, source notes, author contrasts, fresh check logs, explicit reused-input fingerprints, preservation results and final input fingerprints. Its tool-call parsing failure and author-detected draft correction are retained separately from passing checks.

## Blockers
None for the authorized local revision. Actual model effectiveness and independent review remain unestablished. The Change stays open.
