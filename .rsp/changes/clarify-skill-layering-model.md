---
kind: "refactor"
---

# Change: clarify-skill-layering-model

## Proposal
- Outcome: Clarify the RSP Skill model by separating package selection, runtime role, and invocation mode, then align current inventory labels and public guidance with that model.
- Why:
  - The current behavior boundaries are sound, but `default`, `optional`, `lifecycle`, `Discipline`, and `controller` describe different dimensions without an explicit shared classification.
  - Calling every bundled capability a lifecycle Skill obscures the distinct delivery and controller roles of Commit, Release Docs, and Manage.
- Scope:
  - Define the three orthogonal classification axes and the role of each shipped Skill in the authoritative Skill System Spec.
  - Rename current human-facing inventory grouping from default lifecycle Skills to default suite Skills.
  - Clarify that only qualified Manage composes bounded worker lanes; ordinary Discipline Skills do not recursively orchestrate user-facing flows.
  - Align current design navigation, distribution, TUI, and public Skill guides.
- Non-goals:
  - Add Skill role fields to CLI JSON or package metadata.
  - Change Skill installation membership, routing behavior, authority, lifecycle, or Manage activation.
  - Rewrite immutable release notes or retained research.

## Spec
### MODIFIED
- Requirement: Skill classification separates distribution kind, runtime role, and invocation mode.
  - Distribution kind remains the existing flat `default | optional` inventory contract.
  - Runtime roles explain Core, Discipline, Controller, and Discovery ownership without creating another runtime manifest.
  - Invocation mode explains direct, Core-routed, policy-selected, and explicit selection independently from installation.
- Requirement: Current prose and human inventory labels call the bundled default collection the default suite rather than implying every Skill is a lifecycle stage.
- Requirement: Recursive orchestration remains forbidden for ordinary Discipline Skills; only a Core-qualified Manage controller may compose bounded worker lanes.

### Acceptance
#### Scenario: A reader classifies a shipped Skill
- GIVEN the authoritative Skill System Spec and current public Skill guide
- WHEN the reader inspects `rsp-manage`, `rsp-commit`, or `rsp-structural-audit`
- THEN distribution kind, runtime role, and invocation mode are distinguishable without inferring installation or mutation authority

#### Scenario: A user lists packaged Skills
- GIVEN the unchanged flat `skills[].kind` JSON contract
- WHEN human CLI or TUI inventory is rendered
- THEN default Skills appear under `Default suite Skills` and optional Skills remain under `Optional project Skills`

## Design
- Approach:
  - Add one compact classification table to the existing Skill System Spec instead of a manifest or new Spec.
  - Treat repository directory ownership as repository areas, not the runtime Skill dependency stack.
  - Keep current default/optional machine values unchanged and update only human-facing group labels.
- Boundaries:
  - Specs own the canonical model; Skills retain executable trigger, authority, action, output, stop, and verification contracts.
  - Distribution remains orthogonal to runtime role and invocation.
  - Historical release records and research remain immutable context.
- Affected areas:
  - `.rsp/specs/`
  - `src/commands/skills.ts` and `src/skills-tui/messages.ts`
  - current public Skill guides and focused inventory tests
- Constraints:
  - Preserve the flat JSON inventory and the existing eleven-default plus one-optional package membership.
  - Do not weaken authority, fallback, completion, or restraint language.

## Tasks
- [x] Added the orthogonal Skill classification and role map to authoritative Specs.
- [x] Aligned current CLI, TUI, and guide terminology with default suite wording.
- [x] Updated focused contract assertions without changing machine output.
- [x] Ran focused and full repository verification.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skills-inventory.test.ts test/tui/skills-component.test.ts test/skill-runtime-context-contract.test.ts` — passed 3 files and 12 tests; proves inventory presentation and Skill model contracts remain aligned.
  - [x] `mise exec -- pnpm run docs:check` — passed 7 bilingual page pairs and 29 Markdown files; proves current public documentation remains paired and internally valid.
  - [x] `mise exec -- pnpm run build` — passed; proves product runtime builds with the terminology change.
  - [x] `mise exec -- pnpm run lint` — passed; proves edited source and tests satisfy repository standards.
  - [x] `mise exec -- pnpm run test` — passed 55 files and 661 tests; proves the complete observable contract remains compatible.
  - [x] `mise exec -- pnpm run docs:build` — passed; proves the VitePress site renders with both classification tables.
  - [x] `git diff --check` — passed; proves the resulting patch has no whitespace errors.
- Manual or environment:
  - [x] Inspected `node dist/cli.mjs skills list` and `node dist/cli.mjs skills list --json`; human output uses `Default suite Skills`, while JSON retains the flat `kind` field without role or invocation fields.
- Coverage:
  - Authoritative model, human CLI/TUI projection, English and Chinese current guides, and regression contracts.

## Blockers
- none
