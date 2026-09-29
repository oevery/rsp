# Artifact lenses

Use the lens matching the document's role. These are reading outcomes, not mandatory sections or universal length limits. Respect project-specific formats and canonical machine headings.

## README

Help a newcomer decide whether the project fits, obtain a first useful result, and find the next authoritative resource. Include the actual prerequisites, a viable entry path, and a recognizable success signal. Put important exclusions before a reader invests in setup. Link specialized reference and contribution guidance rather than reproducing them. A source-maintainer README can target maintainers; do not force an installation tutorial into every README.

## CONTEXT

Help a contributor distinguish the domain's concepts and find the right owner for a task. Define only terms that carry domain meaning or plausible ambiguity. Keep canonical names, useful translations, relationships, and navigation together; avoid catalogs of every class or ordinary technical word. Root and local CONTEXT share one model and link to one authoritative definition per domain. Domain-specific meanings may differ; explain mappings at their boundary rather than forcibly renaming them.

For example, if Task is a reusable definition and Attempt is one execution, explain that distinction and point to the lifecycle contract. Do not turn this illustrative distinction into a requirement for another project.

## Spec

Help a maintainer or caller determine what must hold despite replaceable implementation choices. State capability, consumer, scope, responsibility handoffs, observable behavior, failure semantics, and necessary constraints at the level the domain needs. Include a key scenario when it resolves a real ambiguity. Preserve normative design references and protocol details when they define compliance.

Purpose, Boundaries, Contracts, Scenarios, and Constraints are a useful default, not a validation schema. Domain headings, reference tables, and omission of unnecessary scenarios are valid. Future promises remain in the selected Change; results of a particular verification belong with that work.

For example, “retries are safe” leaves the caller guessing. If the authority establishes deduplication only for repeated requests with the same key, state that condition and consequence. Do not invent deduplication, retention periods, or failure guarantees that the source does not establish.

## Guides and references

A procedure needs prerequisites, execution context, actions, and a way to recognize success. Explain a likely failure only when it materially helps the task. A concept page needs a definition and relationships that support a decision. A reference needs exact contracts and navigable details, not a forced narrative journey. Label illustrative snippets as such; do not present invented output as observed execution. Preserve incoming links when headings or files change.

## Operating instructions and work records

AGENTS states applicable rules, commands, authority, and checks; changing those rules requires explicit scope, not just permission to improve wording. A Change preserves its canonical six sections and expresses the selected delta, not the whole product. A Decision Record explains an important tradeoff without redefining the contract. Skill authoring and release documentation use their specialized methods when available; do not absorb their scope into general editing.
