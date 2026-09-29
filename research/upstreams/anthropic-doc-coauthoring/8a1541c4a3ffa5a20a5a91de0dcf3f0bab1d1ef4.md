---
source: anthropic-doc-coauthoring
revision: 8a1541c4a3ffa5a20a5a91de0dcf3f0bab1d1ef4
base: null
strategy: adapt
evidence_hash: sha256:4e2120d64203307cb100e163b5d628d3a3e662529da9d32f5f89cecf4265e634
status: complete
---

# Upstream Distillation: anthropic-doc-coauthoring

## Source Position
Initial focused coverage of `skills/doc-coauthoring/SKILL.md`, README, and THIRD_PARTY_NOTICES. This is a separate topic from the existing anthropic-skill-creator source; creator research is preserved. Prepared evidence inventories three files.

## Extracted Mechanisms
- `skills/doc-coauthoring/SKILL.md` begins with audience, desired impact, and constraints.
- Drafting iterates on content selection and organization rather than only polishing sentences.
- Reader testing with fresh context probes ambiguities and assumptions unavailable outside the author conversation.

## Applicable to RSP
RSP artifact ownership does not by itself tell a writer how much background a reader needs. A bounded reader-question pass can expose missing context, while factual checks and authorization remain independent requirements.

## Rejected
No compulsory multi-stage interview, fixed question/brainstorm counts, per-section approval, universal subagent dependency, unbounded review loops, or conversation appendices in durable documentation.

## License and Reuse
README describes many repository Skills as Apache-2.0, but this path has no local LICENSE or license frontmatter and the repository root has no LICENSE. THIRD_PARTY_NOTICES covers other components, not a clear grant for this Skill. Treat exact-path licensing as unresolved: model-only ideas and independent wording, no prompt or asset copying.


## Recommendations
- **R1 — Explicit reading outcome (model-only).** Target: `skills/rsp-doc/`; infer audience and intended outcome from available evidence, asking only when a material ambiguity remains.
- **R2 — Bounded reader questions (model-only).** Target: `skills/rsp-doc/`; test whether document content and declared prerequisites answer realistic questions. Self-check is not independent reader acceptance; required independent evidence cannot be simulated.

## Validation Boundary

Evidence is source inspection, not observed model performance. Compare writing and read-only review on the same factual corpus, including a clean negative and fluent-but-false prose. No source revision is accepted, no upstream runtime is run, and no product adoption is implied by this report alone.
