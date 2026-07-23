---
kind: group
---

# Change Group: cli-machine-output

## Goal
- Make RSP CLI machine output self-contained, queryable, and token-efficient for agents and simple scripts while preserving human-readable defaults and the filesystem-owned RSP model.

## Scope
- Clarify dependency-plan direction and retain the prerequisite context needed to understand filtered status output.
- Add a bounded archive-history query surface instead of expanding `status` into an unbounded history dump.
- Add an opt-in compact serialization mode shared by JSON-producing commands.
- Keep the three capabilities independently discussable, implementable, verifiable, and archivable.

## Shared Constraints
- Existing Change, Group Brief, archive, Spec, and Decision Record files remain authoritative; CLI output is always a derived projection.
- Do not persist a graph, history database, cursor state, or another workflow-state store.
- Preserve current pretty JSON as the human-readable default and make compatibility changes explicit.
- Optimize selection and semantic scope before relying on whitespace removal or abbreviated field names.
- Keep output deterministic, platform-agnostic, and consumable without environment-specific output wrappers.

## Slices
- `cli-machine-output/clarify-dependency-plan-output`: make dependency direction and filtered prerequisite context explicit without changing dependency ownership or scheduling semantics.
- `cli-machine-output/add-bounded-history-query`: expose bounded archive summaries and opt-in single-record detail without returning the complete archive by default.
- `cli-machine-output/add-compact-json-output`: provide an opt-in compact form of the same JSON contract across machine-readable CLI commands.

## Completion Conditions
- [ ] Filtered dependency output is understandable without reopening unrelated Change files or inferring omitted prerequisite nodes.
- [ ] Agents and scripts can discover archived Changes and request one relevant detailed record through bounded CLI queries.
- [ ] Every JSON-producing inspection command can emit a compact form without changing the meaning of its pretty form.
- [ ] Compatibility behavior, public documentation, focused integration coverage, build, lint, and the full test suite pass for all three slices.

## Durable Outcomes
- Update `.rsp/specs/design.md` with the settled machine-output contract and archive-query boundary if implementation establishes stable product behavior not already recorded there.
- Update `README.md` with final command syntax and examples after each independently delivered slice.
- Record a Decision Record only if the selected compatibility/versioning policy is hard to reverse and not adequately explained by the Spec.

## Blockers
- none
