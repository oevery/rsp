---
status: complete
sources:
  - prisma-docs@8fe181bdd6a9405eebaef641e50d769a83636b3d -> research/upstreams/prisma-docs/8fe181bdd6a9405eebaef641e50d769a83636b3d.md
  - gemini-docs@fe6350238c1862dade66a9dea9080c6508475bec -> research/upstreams/gemini-docs/fe6350238c1862dade66a9dea9080c6508475bec.md
  - anthropic-doc-coauthoring@8a1541c4a3ffa5a20a5a91de0dcf3f0bab1d1ef4 -> research/upstreams/anthropic-doc-coauthoring/8a1541c4a3ffa5a20a5a91de0dcf3f0bab1d1ef4.md
  - matt-skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 -> research/upstreams/matt-skills/c55ee46073ed923f86ce59a5eb3b6d895095d1b7.md
  - compound-engineering@b27637b062d168fd877bd6b54a1bdfc959762421 -> research/upstreams/compound-engineering/b27637b062d168fd877bd6b54a1bdfc959762421.md
---

# Document writing and review quality

## Local gap

Artifact ownership and scaffold hints prevent misplaced content but do not establish whether a reader can use the result without the author conversation. General implementation guidance lacks a bounded document-writing method; release writing is specialized and Review must remain read-only. The user selected an optional Doc capability and matching Review criteria, not an additional mandatory phase.

## Shared mechanisms

- [Prisma R1–R3](../upstreams/prisma-docs/8fe181bdd6a9405eebaef641e50d769a83636b3d.md): reader task, priority of substantive obstacles over tone, and factual rechecking after revision.
- [Gemini R1–R2](../upstreams/gemini-docs/fe6350238c1862dade66a9dea9080c6508475bec.md): command/link verification, scoped routing, and distinction between writing and review.
- [Anthropic R1–R2](../upstreams/anthropic-doc-coauthoring/8a1541c4a3ffa5a20a5a91de0dcf3f0bab1d1ef4.md): audience/impact and reader questions without author-only context.
- [Matt R6–R7](../upstreams/matt-skills/c55ee46073ed923f86ce59a5eb3b6d895095d1b7.md): purposeful organization and canonical domain meaning.
- [Compound R8–R9](../upstreams/compound-engineering/b27637b062d168fd877bd6b54a1bdfc959762421.md): consequential findings, artifact-appropriate detail, and clean-document restraint.

## Shared quality contract

| Dimension | Writer action | Reviewer question |
|---|---|---|
| Purpose | Choose a reader and useful reading outcome. | Does missing context or framing obstruct that reader's task? |
| Grounding | Preserve evidence-backed meaning through edits. | Are commands, conditions, defaults, and promises supported? |
| Usability | Explain concepts and causal relationships before relying on them. | Can the reader understand or perform the intended task without guessing? |
| Ownership | Put one contract, term, or decision in its proper owner. | Do repeated definitions, mixed roles, or hidden authority conflict? |
| Maintenance | Preserve terminology, links, anchors, and necessary limits. | Will this change leave a stale or broken reader path? |

These dimensions are semantic criteria, not a document schema, scoring formula, word budget, or required checklist printed in every response. A concise local projection in each standalone Skill avoids a runtime dependency between writer and reviewer. Joint cases check their agreement.

## Disagreements and exclusions

Reader confusion is a diagnostic signal, not authority to change product meaning. User-facing explanation may need more prose than agent instructions. A sound nonstandard structure can remain unchanged. RSP rejects fixed interview counts, blanket splitting, mandatory repeated dispatch, host-specific tools, automatic fixes during review, style-only blockers, and website-discovery infrastructure.

## Candidate and validation boundary

Candidate owners: optional `skills/rsp-doc/` for authorized substantial writing, existing `skills/rsp-review/` for fixed-scope read-only judgment, Core for routing and durable placement. Tiny edits remain direct; product decisions stay Shape; release notes and Skill authoring retain their existing owners.

Use the same small export-tool factual corpus for a writer task and a reviewer task. Cover README prerequisites/success signals, CONTEXT distinctions, Spec conditions, one fluent false promise, and an already adequate unconventional document. Include a near-negative read-only request. Deterministic oracles enforce paths and artifact presence; semantic judgments must come from actual model runs and independent evidence, not wording regexes. No provider comparison has run in this research.

All selected mechanisms are model-only with independently authored product text. Prisma and Anthropic exact-path licensing remains unresolved; their assets must not be copied. Research completion does not advance upstreams.lock or authorize publication.
