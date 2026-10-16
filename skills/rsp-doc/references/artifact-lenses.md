# Artifact lenses

Choose what the reader must understand, do or judge, not a mandatory template. Preserve project formats and canonical headings; action-first wording is useful for procedures, not a requirement for every artifact.

For a document set, start with the reader's entry point and follow only the links needed for the task. Check that each handoff supplies its prerequisites and that summaries agree with the linked owner. An owner outside the authorized write set remains read-only; return its conflicting claim rather than expanding the edit boundary.

## README

- Help a newcomer find the starting point, prerequisites and first useful result with a recognizable success signal.
- State important exclusions before setup. Keep a useful overview and local prerequisites; link specialized detail with its reading purpose.
- Match the audience. A maintainer README need not become an installation tutorial.

## CONTEXT

- Help readers understand domain terms and relationships, then find the authoritative owner; do not duplicate that owner's full contract.
- Keep names, useful translations and navigation near each definition. Link one authoritative definition across root and local files.
- Explain different meanings at domain boundaries; do not silently rename them.

For example, distinguish Task as a reusable definition from Attempt as one execution, then link the lifecycle contract. This example is not a required model for other projects.

## Spec

- Enable a reader to judge compliance: state what a consumer can rely on, under which conditions, with scope, handoffs, failures and exceptions.
- Keep normative design references and protocol detail needed to establish compliance.
- Add a scenario only when it resolves ambiguity. Domain headings are valid; no fixed section set is required.
- Leave future promises in the Change and verification results with their work owner.

For example, “retries are safe” is incomplete when deduplication applies only to the same key. State that condition without inventing retention or failure guarantees.

## Guides and references

- Procedures: give prerequisites, execution context, bounded actions and success signals. Explain a likely failure when it helps the task; keep conditional branches near their triggers.
- Concepts and design explanations: preserve definitions, causal reasoning and tradeoffs needed to understand or decide; do not replace them with a terse action checklist.
- References: provide exact contracts and navigable details, not a forced tutorial.
- Label illustrative snippets; do not present invented output as observed execution. Preserve incoming links after heading changes.
- API/TSDoc comments: explain the consumer's real inputs, returns, failures and use. Compare examples and claims with their authoritative contract and implementation; report unresolved discrepancies rather than silently documenting whatever code does. Writing authority does not permit implementation changes, execution or dependency installation.

## Operating instructions and work records

- AGENTS: state applicable rules, commands, authority and checks. Changing rules requires explicit scope.
- Change: retain the six canonical sections and selected delta. Proposal gives the outcome; Spec gives acceptance; Design gives the approach; Tasks state checkable work and completion, with completed items describing the accomplished result; Verify records methods, candidate-bound conclusions, limits and necessary evidence references; Blockers name unresolved dependencies.
- Work records: keep necessary plan/contract changes, task outcomes, blockers and scoped verification conclusions. Routine narration stays in the conversation; only needed recovery state goes to Focus. Before archive, establish facts and justified knowledge writeback, then check all six sections together for current outcomes, superseded plans and consistency with knowledge owners. Retain only facts affecting the delivered contract, evidence applicability, important failure disposition or remaining limit. Link knowledge and retained evidence owners; keep their detailed records and original verdicts unchanged. A stale authoritative contract requires correction. Return substantive contradictions to the appropriate owner; prose cleanup cannot resolve them.
- Decision Record: let readers understand why a choice was made, its alternatives and consequences, without redefining the contract.
- Audit/run records: retain required observations, actions and evidence. Remove irrelevant session narration, not the record's purpose.
- Skill packages: use Doc's Skill-authoring branch. Release communication uses Doc's conditional release method.
