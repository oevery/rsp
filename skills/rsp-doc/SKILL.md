---
name: rsp-doc
description: Create or revise repository documents, Skills and release communication, including changelogs, release notes and migration guides. Use for writing and author self-checks, not formal read-only review or publication.
license: MIT
metadata:
  author: oevery
  version: "2026.10.02.6"
---

# RSP Doc

Write a grounded artifact its reader can use without the author conversation. Tiny wording fixes need no full writing pass.

## Produce the artifact

1. **Fix the outcome.** Identify the reader, task, authorized target files and expected result. For a multi-document request, identify which artifact owns each fact and which artifacts summarize or link it.
2. **Establish the facts.** Read existing content, relevant callers and the smallest authoritative contract, code or source chain. Use available read/search tools and existing checks to establish commands, defaults, links and behavior. Tool output is an observation to interpret, not permission or proof of semantic correctness. Distinguish current behavior, intended requirements and unknowns; resolve material contradictions before rewriting a promise.
3. **Draft for the task.** Apply the expression rules below and load only the relevant method:
   - [Artifact lenses](references/artifact-lenses.md): README, CONTEXT, Spec, Change, guides and scoped operating documents.
   - [Skill authoring](references/skill-authoring.md): Skill creation or revision, including descriptions, package resources and invocation policy.
   - [Release communication](references/release-communication.md): changelogs, release notes, migration guidance or authorized release-document reconciliation; not ordinary document writing.
4. **Verify the result.** Follow the reader's task through the changed artifacts and relevant linked owners. Confirm that prerequisites lead to an actionable next step and a recognizable result, and that revised meaning still matches its sources.

## Check facts and reading paths

Use the checks relevant to the change:

- Check whether readers can find information, understand conditions, act or judge compliance, and recognize unknowns.
- Check affected links, anchors, examples and metadata with existing tools. Execute examples only within safe authorized scope.
- For linked artifacts, compare shared claims, terminology, defaults and handoffs against their authoritative owner. Correct authorized summaries and links without copying full definitions or changing unassigned owners. Report out-of-scope contradictions to their owner.
- Recheck facts, quantifiers, defaults, failures, permissions and terminology after editing. Report actual checks and remaining gaps.
- API comments and embedded guidance: compare claims with their contract and implementation without assuming either side correct. Ordinary inline comments need local checks, not a full writing workflow; compiler/tool annotations retain implementation ownership.
- Examples: label illustrative pseudocode or incomplete snippets; check copyable commands against real prerequisites, outcomes and safe use without inferring execution or installation authority.

For agent-facing instructions, trace the relevant branch and its targets. Distinguish local reading-path reasoning from actual agent execution and required independent evidence; retain background human co-readers need.

After a failed command, inspect actual effects before recovery. A diagnosed tool-only obstacle permits another read/search or repeat-safe checking method under the same goal, scope, authority, baseline and evidence requirement. Named required checks and protected RSP operations retain their declared method and owner. Unavailable required evidence, unknown mutation or unsafe replay remains a stop.

## Resolve language

- Response: explicit request → personal instructions → conversation language.
- Existing files: preserve language unless the user asks to change it.
- New files: explicit artifact language → effective artifact configuration → scoped instructions → conversation language. In RSP projects, when precedence needs configuration, use the same selected CLI's successful `rsp config --json` summary (optional `--compact`); it resolves defaults and inheritance. Refresh on relevant drift or recovery. Raw YAML is diagnostic only; failed or unavailable projection leaves the dependent choice unresolved, not silently replaced by a lower priority. Independently authorized work needing no unknown setting may continue. Other projects retain their own configuration readers.
- Keep canonical identifiers, machine values and required headings exact.

## Write precisely

- Lead with the useful action or result, including needed prerequisites and success signals. Give each paragraph or item one purpose.
- Number sequence required by correctness, safety or the contract; leave other method choices to the reader or Agent. Use parallel bullets for peers and short causal paragraphs when helpful.
- Put prerequisites before use, rules beside actions and exceptions beside conditions. Keep concepts together and link one authoritative owner.
- Keep useful summaries, local safety conditions and minimum context inline. Branch links state when to read and what they provide; avoid reference chains for necessary guidance.
- State correct behavior directly. Use a short example or contrast only when it resolves a real misconception or boundary.
- Remove empty openings, repetitive conclusions, non-informative modifiers and session-attempt narration. Keep general teaching only when the reader's task needs it; preserve useful navigation summaries, purpose-required audit evidence and author voice.
- Prefer words for ordinary conjunctions. Preserve syntax inside paths, code and links. Use these stable symbol roles:
  - `|`: closed canonical alternatives.
  - `/`: established pairs or compact labels.
  - `→`: defined one-meaning transitions.
  - `:`: label/value boundaries.
- In Skills, reserve tables for short fixed mappings whose shared columns remove real repetition. Use lists for branching judgment, exceptions and steps. In other documents, choose tables only when the reader benefits from comparison or lookup.

Shortness removes no-information prose, not substantive qualifiers such as only, default, optional or asynchronous. Preserve meaningful conditions and consistent terms; never invent human experience. A suspected model-default no-op needs behavior evidence before removal is called equivalent.

## Preserve ownership

- Follow nearest project instructions and the authorized file boundary. Keep a selected WorkRef when tracked; bounded direct work needs no automatic Change.
- Doc owns writing and self-checks. Formal fixed-scope review belongs to Review and remains read-only; self-checks do not establish independent acceptance.
- A writing-plus-review request combines those responsibilities. Review grants no repair permission; corrections already authorized by the original request may continue.
- Product decisions stay with their design owner. Release writing grants no version decision, release verification, Git delivery or external publication authority. Missing optional methods do not require installation or block an available bounded method.
- Preserve unrelated work. Ask when a missing choice materially changes the result or authority; stop when required evidence is unavailable. Writing alone grants no installation, deployment, Git delivery or publication.

Return changed artifacts, decisive checks and material limits. Write final conclusions to the owning work record, stable knowledge to its document, and keep detailed evidence with its report owner. Focus maintenance remains Core's responsibility.
