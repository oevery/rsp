---
name: rsp-doc
description: Create or revise repository documents and Skills, including README, CONTEXT, Specs, Changes and technical guides. Use for writing and author self-checks, not formal read-only review or release notes.
license: MIT
metadata:
  author: oevery
  version: "2026.09.30.1"
---

# RSP Doc

Write a grounded artifact its reader can use without the author conversation. Tiny wording fixes need no full writing pass.

## Produce the artifact

1. **Fix the outcome.** Identify the reader, task, target files and expected result.
2. **Establish the facts.** Read existing content and the smallest relevant contract, code or source chain. Distinguish current behavior, intended requirements and unknowns. Resolve material contradictions before rewriting a promise.
3. **Draft for the task.** Apply the expression rules below and load only the relevant method:
   - [Artifact lenses](references/artifact-lenses.md): README, CONTEXT, Spec, Change, guides and other human-facing documents.
   - [Agent-facing documents](references/agent-facing-documents.md): operating instructions and references an agent follows.
   - [Skill authoring](references/skill-authoring.md): Skill creation or revision, including descriptions, package resources and invocation policy.
4. **Verify the result.** Confirm that the reader can use it and the revised meaning still matches its sources.

Use the checks relevant to the change:

- Check whether readers can find information, understand conditions, act or judge compliance, and recognize unknowns.
- Check affected links, anchors, examples and metadata with existing tools. Execute examples only within safe authorized scope.
- Recheck facts, quantifiers, defaults, failures, permissions and terminology after editing. Report actual checks and remaining gaps.

## Resolve language

- Response: explicit request → personal instructions → conversation language.
- Existing files: preserve language unless the user asks to change it.
- New files: explicit artifact language → effective artifact configuration → scoped instructions → conversation language. Inspect configuration only when present and relevant.
- Keep canonical identifiers, machine values and required headings exact.

## Write precisely

- Lead with the useful action or result, including needed prerequisites and success signals. Give each paragraph or item one purpose.
- Number necessary sequence or precedence; use parallel bullets for peers. Explain helpful causes or reasons in short connected paragraphs.
- Put prerequisites before use, rules beside actions and exceptions beside conditions. Keep concepts together and link one authoritative owner.
- Keep useful summaries, local safety conditions and minimum context inline. Branch links state when to read and what they provide; avoid reference chains for necessary guidance.
- State correct behavior directly. Use a short example or contrast only when it resolves a real misconception or boundary.
- Remove empty openings, repetitive conclusions, non-informative modifiers and session-attempt narration. Preserve useful navigation summaries, purpose-required audit evidence and author voice.
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
- Product decisions stay with their design owner; release prose stays with Release Docs. Missing optional methods do not require installation or block an available bounded method.
- Preserve unrelated work. Ask when a missing choice materially changes the result or authority; stop when required evidence is unavailable. Writing alone grants no installation, deployment, Git delivery or publication.

Return changed artifacts, decisive checks and material limits. Put verification evidence in its work record, not in the document unless that is its purpose.
