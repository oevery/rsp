# Artifact lenses

Choose the document's reading outcome, not a mandatory template. Preserve project formats and canonical headings.

## README

- Give a newcomer a first useful result: prerequisites, entry path and success signal.
- State important exclusions before setup. Keep a useful overview and local prerequisites; link specialized detail with its reading purpose.
- Match the audience. A maintainer README need not become an installation tutorial.

## CONTEXT

- Define ambiguous domain terms and the relationships needed to find the right owner.
- Keep names, useful translations and navigation near each definition. Link one authoritative definition across root and local files.
- Explain different meanings at domain boundaries; do not silently rename them.

For example, distinguish Task as a reusable definition from Attempt as one execution, then link the lifecycle contract. This example is not a required model for other projects.

## Spec

- State what a consumer can rely on: capability, scope, handoffs, behavior, failures and necessary constraints.
- Keep normative design references and protocol detail needed to establish compliance.
- Add a scenario only when it resolves ambiguity. Domain headings are valid; no fixed section set is required.
- Leave future promises in the Change and verification results with their work owner.

For example, “retries are safe” is incomplete when deduplication applies only to the same key. State that condition without inventing retention or failure guarantees.

## Guides and references

- Procedures: give prerequisites, execution context, actions and success signals. Explain a likely failure when it helps the task.
- Concepts: explain definitions, causes and relationships needed for understanding or a decision.
- References: provide exact contracts and navigable details, not a forced tutorial.
- Label illustrative snippets; do not present invented output as observed execution. Preserve incoming links after heading changes.

## Operating instructions and work records

- AGENTS: state applicable rules, commands, authority and checks. Changing rules requires explicit scope.
- Change: retain the six canonical sections and selected delta. Proposal gives the outcome; Spec gives acceptance; Design gives the approach; Tasks list work; Verify records final evidence; Blockers name unresolved dependencies.
- Decision Record: explain alternatives and consequences without redefining the contract.
- Audit/run records: retain required observations, actions and evidence. Remove irrelevant session narration, not the record's purpose.
- Skill packages: use Doc's Skill-authoring branch. Release prose retains its specialized owner.
