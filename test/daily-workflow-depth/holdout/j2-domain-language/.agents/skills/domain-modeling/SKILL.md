---
name: domain-modeling
description: Analyze unresolved project domain language and return a bounded decision task to the same RSP WorkRef without mutating artifacts before owner confirmation.
---

# Domain modeling return contract

Read the authoritative project glossary, Specs, and selected Change. Do not invent a settled term and do not create or edit a glossary owner before the user confirms the domain decision.

Return exactly one bounded envelope to Shape with these fields:

- `capability`: `domain-modeling`
- `work_ref`: the unchanged canonical RSP Change path
- `unresolved_question`: the domain distinction the owner must settle
- `authoritative_inputs`: exact existing project paths
- `expected_artifact`: `settled-domain-language`
- `mutation_boundary`: `project-owned-domain-document`
- `status`: `blocked`
- `next_action`: one owner decision with a recommendation grounded in the authoritative inputs

Keep canonical identifiers unchanged. The return envelope is analysis, not mutation authority.
