---
name: rsp-doc
description: Write or substantially revise repository documentation such as README, CONTEXT, Specs, and technical guides for a defined reader and task. Preserve evidenced meaning and artifact ownership; read-only review, product design, release notes, and Skill authoring retain their own owners.
license: MIT
metadata:
  author: oevery
  version: "2026.09.29.1"
---

# RSP Doc

Write documentation that its intended reader can understand and use without the author conversation. This capability is included in the default suite and loaded for authorized writing and author self-checks; it is not a mandatory phase or an independent review. Tiny wording fixes need no full writing pass.

## Establish the writing boundary

Resolve the requested files, reading outcome, audience, existing conventions, factual sources, and mutation authority. A bounded direct documentation request needs no Change. For tracked work retain the selected WorkRef and its acceptance; do not create, focus, archive, or commit work on the strength of this Skill. Preserve unrelated content and authored meaning.

Use the requested response language, then personal instructions, then conversation language. Preserve existing artifact language; new artifacts follow explicit language, effective project configuration, scoped instructions, then conversation language. Keep canonical identifiers and headings exact.

Infer the reader's knowledge and purpose from the request and repository before asking questions. Ask only when the answer materially changes content, audience, authority, or acceptance. Planned product behavior and unresolved choices stay with their design owner; writing does not settle them. A read-only request remains read-only and uses Review when available. Release prose and Skill instructions retain their specialized owners. Missing optional capabilities never grant broader authority.

## Ground the document

Read the existing document, nearest instructions and context, and only the code, tests, contracts, or source material needed to substantiate claims. Separate current behavior, intended requirements, observations, and unknowns. Code and tests are evidence, not automatic permission to change a contract. Resolve a material contradiction before choosing which statement to rewrite; report uncertainty instead of inventing a smooth explanation.

For substantial README, CONTEXT, Spec, or guide work, load [artifact lenses](references/artifact-lenses.md) and use the relevant lens only. Preserve meaningful existing organization unless it impedes the reading task. Do not split files, rename concepts, or move authority merely to match a template.

## Write against five quality dimensions

- **Purpose:** make the document's useful outcome clear to its intended reader. Distinguish doing a task, understanding a concept, and looking up a contract.
- **Grounding:** support material claims, conditions, defaults, examples, and limitations. Preserve their meaning through revisions.
- **Usability:** provide prerequisite knowledge before relying on it, explain consequential relationships, and give actionable steps or discriminating examples where needed.
- **Ownership:** keep terms, contracts, operating instructions, decisions, and evidence in their proper owners; summarize and link rather than maintain competing definitions.
- **Maintenance:** use consistent terminology and maintain relevant links, anchors, and source references when content changes.

When revising, fix unsupported claims, missing prerequisites, and misleading behavior before polishing tone. Prefer concrete effects to praise. Use prose for causal explanation, lists for peer items, and tables for genuine comparisons; do not replace connected reasoning with clipped facts to meet a word budget. Retain technical detail when the reader needs it to act or preserve a boundary.

## Check the reading outcome and final meaning

Choose a few realistic questions for this reader: can they perform the documented task, explain the distinction, or identify contract compliance using the document and declared prerequisites? Locate the actual answer or fix the consequential gap. A local reread is a self-check, not a fresh independent reader. Use independent reader evidence only when required or proportionately justified and available under the actual authority; never simulate it or impose repeated reviewer rounds on ordinary writing.

Check relevant commands, examples, paths, links, and changed heading anchors with the project's existing tools. Executing an example needs its own safe scope; documentation work does not authorize deployment, external writes, dependency installation, or destructive commands. Distinguish source inspection from commands actually run.

After readability edits, recheck factual meaning, especially conditions, quantifiers, defaults, failure outcomes, and limitations. Fluency does not compensate for a false promise. Stop when the reading outcome is met and relevant evidence is adequate; an already good passage may remain unchanged.

Return changed documents, decisive checks, and material unknowns or limits. Keep author dialogue, review transcripts, and verification claims out of document bodies unless that document's role requires them. Do not claim independent acceptance, lifecycle completion, Git delivery, or publication.
