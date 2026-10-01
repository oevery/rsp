---
status: complete
sources:
  - writing-guides@snapshot-2026-09-30 -> research/upstreams/writing-guides/2026-09-30.md
  - prisma-docs@8fe181bdd6a9405eebaef641e50d769a83636b3d -> research/upstreams/prisma-docs/8fe181bdd6a9405eebaef641e50d769a83636b3d.md
  - gemini-docs@fe6350238c1862dade66a9dea9080c6508475bec -> research/upstreams/gemini-docs/fe6350238c1862dade66a9dea9080c6508475bec.md
  - anthropic-doc-coauthoring@8a1541c4a3ffa5a20a5a91de0dcf3f0bab1d1ef4 -> research/upstreams/anthropic-doc-coauthoring/8a1541c4a3ffa5a20a5a91de0dcf3f0bab1d1ef4.md
  - matt-skills@c55ee46073ed923f86ce59a5eb3b6d895095d1b7 -> research/upstreams/matt-skills/c55ee46073ed923f86ce59a5eb3b6d895095d1b7.md
  - compound-engineering@b27637b062d168fd877bd6b54a1bdfc959762421 -> research/upstreams/compound-engineering/b27637b062d168fd877bd6b54a1bdfc959762421.md
---

# Document writing and review quality

## Local gap

Artifact ownership alone does not establish usable writing. The selected design gives default rsp-doc one writing entrypoint, with a conditional Skill method and separate read-only Review. The claim that a temporary candidate removed expression rules was an author observation at the time; the exact uncommitted candidate is not identified by retained evidence, so its deletion process cannot be reproduced. The verifiable local baseline and adopted result are pinned below. The local requirement was to preserve useful expression guidance under one writing owner, not to demonstrate a measured quality gain.

## Shared mechanisms

- [Prisma R1–R3](../upstreams/prisma-docs/8fe181bdd6a9405eebaef641e50d769a83636b3d.md): reader task, priority of substantive obstacles over tone, and factual rechecking after revision.
- [Gemini R1–R2](../upstreams/gemini-docs/fe6350238c1862dade66a9dea9080c6508475bec.md): command/link verification, scoped routing, and distinction between writing and review.
- [Anthropic R1–R2](../upstreams/anthropic-doc-coauthoring/8a1541c4a3ffa5a20a5a91de0dcf3f0bab1d1ef4.md): audience/impact and reader questions without author-only context.
- [Matt R6–R7](../upstreams/matt-skills/c55ee46073ed923f86ce59a5eb3b6d895095d1b7.md): purposeful organization and canonical domain meaning.
- Matt R8–R10: conditional navigation, Skill discovery/mechanics and observable completion; the selected product owner is now Doc's internal Skill branch.
- [Writing guides R1–R3](../upstreams/writing-guides/2026-09-30.md): result-oriented steps, sequence versus peers, precise language and reading-task differences.
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

Reader confusion is evidence, not authority to change facts. Human explanation may need causal prose; execution instructions still require concise actions and results. Agreed expression requirements are contracts, while unsupported personal taste is not a defect. Reject fixed interview counts, blanket splitting, mandatory workers, host-specific invocation, review-time fixes and word/format gates.

The local expression contract also draws on `.rsp/archives/2026-08-18_streamline-published-skill-prose.md`, `.rsp/archives/2026-07-29_compact-skill-runtime-context.md`, and `7c6aef6231d3d225cca7c0a4fdd352043bcf2fee:.agents/skills/author-rsp-skills/references/concision.md`. That fixed baseline's `Safe transforms` records necessary sequence, parallel lists, sparse tables, defined symbols, canonical terms, conditional disclosure, co-location, action-leading items, no-op pruning and short examples. Verify it with `git show <commit>:<path>`. It is not the unidentified temporary candidate.

The adopted result is fixed at `0ab61cb063b3af50460e67abb8a5cfbb809da47e:.rsp/specs/writing-quality.md` and the same commit's `skills/rsp-doc/SKILL.md`: one writing owner with explicit expression guidance and a conditional Skill method. These objects establish the baseline and adopted contract, not the intermediate deletion process or fresh model acceptance. Current behavior remains owned by the current Spec and Skill.

## Candidate and validation boundary

Candidate owners: default `skills/rsp-doc/` for repository-document and Skill writing; `skills/rsp-review/` for fixed-scope judgment. Core retains its existing Doc route, not a new Skill-specific branch. Maintainer candidate/provenance requirements remain local; release notes retain their specialized owner.

Use the same small export-tool factual corpus for a writer task and a reviewer task. Cover README prerequisites/success signals, CONTEXT distinctions, Spec conditions, one fluent false promise, and an already adequate unconventional document. Include a near-negative read-only request. Deterministic oracles enforce paths and artifact presence; semantic judgments must come from actual model runs and independent evidence, not wording regexes. No provider comparison has run in this research.

Extend existing creation/revision rubrics to check concise result steps, preserved conditions and useful list/table choices. Natural Chinese creation under English artifact configuration checks the internal Skill branch without authorizing installation. Code review covers executable Skills; Document review covers semantic documents. No live style or routing gain is claimed.

All selected mechanisms are model-only with independently authored product text. Prisma and Anthropic exact-path licensing remains unresolved; their assets must not be copied. Research completion does not advance upstreams.lock or authorize publication.
