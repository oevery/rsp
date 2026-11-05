---
name: rsp-doc
description: Write or revise repository documents, Skills and release communication, including final Change convergence and knowledge writeback. Own writing and author self-checks, not product planning, formal read-only review or publication.
license: MIT
metadata:
  author: oevery
  version: "2026.11.04.2"
---

# RSP Doc

For tracked work, read the [shared work model](../rsp/references/work-model.md) when its identity and ownership definitions are missing from the current context. Use logical WorkRefs in commands and reports; cite file locations separately. Direct invocation needs no prior Core execution.

Write a grounded artifact usable without the author conversation. Use the artifact method for whole-record reconciliation, inspect final consistency and retain already-converged text. Local wording fixes and mechanical status/evidence updates need no full writing pass unless the whole record needs reconciliation. A no-op decision needs no new artifact or routine report field.

## Produce the artifact

1. **Fix the outcome.** Identify the reader, task, authorized files and expected result. For a document set, distinguish authoritative owners from summaries. Keep routine narration in conversation and retained evidence with its existing owner.
2. **Establish the facts.** Read existing content, relevant callers and the smallest authoritative contract, code or source chain. Check commands, defaults, links and behavior with available tools. Distinguish current behavior, intended requirements and unknowns. Resolve material contradictions before rewriting a promise. Interpret tool output as evidence; it grants no permission and does not prove semantic correctness.
3. **Draft for the task.** Use the artifact's role below. For Skill creation or revision, load [Skill authoring](references/skill-authoring.md); for changelogs, release notes, migration guidance or authorized release-document reconciliation, load [release communication](references/release-communication.md).
4. **Verify the result.** Check the edited meaning in context. For structural edits, also follow the affected reading path and references. Use the checks below; reuse traceable unchanged mechanical results. Writing completion does not automatically trigger Review, but separately requested or required judgment remains binding.

## Match the artifact to the reader

- README and procedures supply the starting point, prerequisites, actions and recognizable success. Concepts and decisions explain meanings, reasons, alternatives and consequences; references supply exact, navigable contracts.
- CONTEXT defines vocabulary and relationships and directs readers to authoritative owners. Specs state what consumers may rely on, including conditions, failures and exceptions; add scenarios only to resolve ambiguity. Scoped operating instructions own commands, authority and required checks.
- For architecture models or changes to their bound documents, use [architecture knowledge](../rsp/references/architecture.md) for synchronization and reference checks.
- Before writing a Change, load the [current work record rules](../rsp/references/work-model.md#current-work-records) when absent from context; the same resource owns Verify admission and Blockers syntax. Keep its six sections current during iteration and reconcile the whole record for closeout. Apply those rules to existing text as well as additions.

## Check facts and reading paths

Use the checks relevant to the change:

- Check affected links, anchors, examples and metadata with existing tools. Execute examples only within safe authorized scope.
- Keep repository references portable: use project-root-relative file citations and document-relative Markdown links, following any existing machine-field path contract. Keep execution-root locations separate from durable file references; retain necessary external locations, original evidence and host-required display paths without copying local checkout prefixes into authored repository references.
- For linked artifacts, compare shared claims, terminology, defaults and handoffs against their authoritative owner. Correct authorized summaries and links without copying full definitions or changing unassigned owners. Report out-of-scope contradictions to their owner.
- API comments and embedded guidance: compare claims with their contract and implementation without assuming either side correct. Keep ordinary inline comments locally accurate and useful: retain constraints, rationale or usage that nearby code does not make clear, and remove restatement that adds no information; no full writing workflow is needed. Compiler/tool annotations retain implementation ownership.
- Examples: label illustrative pseudocode or incomplete snippets; check copyable commands against real prerequisites, outcomes and safe use without inferring execution or installation authority.

For agent-facing instructions, trace the relevant branch and its targets. Distinguish local reading-path reasoning from actual agent execution and required independent evidence; retain background human co-readers need.

For a failed command, inspect cause and actual effects before recovery. Change a permitted read/search or repeat-safe check method only within unchanged goal, scope, authority, baseline and required evidence. Named checks and protected RSP operations retain their methods/owners; unavailable Required evidence, unknown mutation or unsafe replay stops affected work.

## Resolve language

- Response: explicit request → personal instructions → conversation language.
- Existing files: preserve language unless the user asks to change it.
- New files: explicit artifact language → effective configuration → scoped instructions → conversation language. Resolve needed RSP defaults/inheritance through the selected CLI's successful `rsp config --json`; refresh on relevant drift or recovery. Raw YAML is diagnostic only. Failed projection leaves dependent choices unresolved, not replaced by lower precedence; independent authorized work may continue. Other projects retain their configuration readers.
- Keep canonical identifiers, machine values and required headings exact.

## Write precisely

- Explain unfamiliar concepts and mechanisms needed for the reader to reason, troubleshoot or assess guarantees. Do not force every artifact into an action list, tutorial or closing next step.
- State the actor, action and object directly. Prefer short, complete sentences when easier to follow. Separate independent actions; preserve causal and conditional links. Give each paragraph one useful purpose. Put prerequisites before use, conditions beside actions and exceptions beside their rules. Keep necessary local context; link branch-only detail with its reading condition and purpose.
- Number steps when their order matters; make each step a bounded action. Use peer bullets for independent items and connected prose for reasoning. Use tables for useful fixed mappings/comparisons, not branching Skill judgments.
- Remove filler, repetition and irrelevant chronology. Keep author voice, decision-relevant reasoning and required audit evidence. Prefer concrete actions; use contrasts or examples when they resolve a real ambiguity. No fixed sentence length, list size or compression ratio defines quality.
- Preserve negation, conditions, exceptions, permissions, quantities, units and certainty. Merge failure explanations with the same decision effect. Retain permission, outcome, stop and safe-recovery conditions, including rare boundaries preventing unauthorized action, serious harm or unsafe replay. Keep incident details with their evidence owner. Do not turn a proposal or unknown into a verified fact. Shorter wording proves no behavioral equivalence.
- Wording edits preserve meaning, ownership, anchors and technical literals. Structural edits may merge, move or reorder content within scope, checking completeness and references. When the request authorizes simplifying instructions, remove an unnecessary obligation rather than merely restating it; verify the remaining behavior and safety. Wording-only authority does not permit that contract change.
- Use ordinary words for conjunctions. Preserve technical syntax; reserve | for closed alternatives, / for established pairs, → for defined transitions and : for label/value boundaries.

## Preserve ownership

- Follow nearest project instructions and the authorized file boundary. Keep a selected WorkRef when tracked; bounded direct work needs no automatic Change.
- Doc owns writing and self-checks; formal fixed-scope Review remains read-only and independent when required. A combined request retains both responsibilities: Review grants no repair authority, but originally authorized corrections may continue.
- Product decisions stay with their design owner. Release writing grants no version decision, release verification, Git delivery or external publication authority. Missing optional methods do not require installation or block an available bounded method.
- Preserve unrelated work. Ask when a missing choice materially changes the result or authority; stop when required evidence is unavailable. Writing alone grants no installation, deployment, Git delivery or publication.

Return changed artifacts, decisive checks and material limits. Tracked work retains necessary conclusions in its existing record; stable knowledge belongs to its document and retained evidence to its existing owner. Focus maintenance remains Core's responsibility.
