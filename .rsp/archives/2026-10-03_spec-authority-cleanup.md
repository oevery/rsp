---
kind: docs
summary: Consolidate Spec authority and retire parallel maintainer documentation
---

# Change: spec-authority-cleanup

## Proposal

Give each current RSP contract one discoverable owner. Reorganize the seven
current Specs by responsibility and name, remove duplicated procedures and obsolete
candidate narration, and retire the parallel `docs/maintainers/` surface.

Scope includes repository navigation, workflow/installation guidance, current Specs, the two maintainer
documents, and relocation of necessary managed-upstream tool guidance into
the existing maintainer Skill. Rename the work, workflow and CLI contracts,
retain the required `design.md` path under an Architecture title, and preserve
historical lookup through the existing recovery guide. Product code, published Skill behavior, Rules,
configuration, releases and historical records remain unchanged.

## Spec

### MODIFIED

- [Architecture](../specs/design.md) defines architecture and authority relationships;
  [Work model](../specs/work-model.md) defines work/artifact and closeout contracts;
  [Workflow](../specs/workflow.md) defines Core routing and capability collaboration;
  [CLI](../specs/cli.md), [TUI](../specs/tui.md),
  [Distribution](../specs/distribution.md) and
  [Writing quality](../specs/writing-quality.md) retain their own boundaries.
- Explanations and guides reference these owners instead of creating parallel
  product rules. Important existing rationale stays in Decision Records.
- Skill instruction design belongs to Writing quality; standalone package closure
  belongs to Distribution. Current references use the new names. Historical
  records remain unchanged and resolve old names through recovery guidance.
- Necessary upstream command, registry and recovery information moves to a
  package-local reference of `distill-upstream`. Preserve its trigger, authority,
  report outputs, stop conditions and existing mandatory provenance operations;
  load tool details only for the managed-source branch, not web-only research.
- Clarify adopted contracts versus observed implementation and source versus
  released-version scope. Workflow retains delivery invariants while Commit
  owns its existing execution procedure; bounded examples clarify direct fixes,
  removal/rename judgment and completion without lifecycle authority.
- Forced-install guidance conditions recovery on custom content worth retaining.
  Existing Git commits suffice; no blanket backup step or installer gate is added.
  Distribution and both installation guides distinguish temporary rollback
  backups from retained user content.
- Current bilingual guides and references summarize the same Spec contracts:
  Daily workflow owns the closeout procedure, Skills links that procedure and
  explains verification reuse, and CLI reference uses conditional recoverability.

### Acceptance

#### Scenario: One current contract owner
- GIVEN a maintainer investigating work identity, Skill routing, command behavior,
  writing or packaging
- WHEN following the repository entry and a relevant Spec
- THEN the current contract and related owners are discoverable without a
  duplicate maintenance manual or historical research becoming authority.

#### Scenario: Safe documentation retirement
- GIVEN the removed documents' product principles and managed-source procedures
- WHEN reading their surviving owners
- THEN necessary information remains available, active links resolve, published
  Skills remain standalone, and old reports and decisions are not rewritten.

#### Scenario: Boundary guidance without a new process
- GIVEN a settled fix, intentional removal/rename, or completed unarchived Change
- WHEN reading its relevant contract
- THEN routing, evidence and lifecycle authority remain distinct; concrete Git
  checks remain available in Commit without a second procedure in Workflow.
- AND source contracts neither assert released-version behavior nor override
  implementation evidence without resolving a discrepancy.

## Design

The architecture entry retains `design.md` because initialization and archive
checks require it. The work, workflow and CLI contracts use `work-model.md`,
`workflow.md` and `cli.md`. Each Spec owns its contract and links adjacent
responsibilities. Historical path lookup is documented in the existing recovery
guide; no duplicate alias Spec or rewritten historical record is needed.
Repository context supplies navigation, not another rulebook.
Keep current behavioral and safety requirements while retiring duplicated
explanations and implementation chronology.

The reorganization uses local baseline `899e90a`; the maintained upstream
reference relocates repository guidance without adding authority. Boundary
examples reuse model-only mechanisms from [OpenSpec R4–R5](../../research/upstreams/openspec/79b6aa9c98f1e36795b2bc4ef2a8f770c6d3a777.md)
and [Spec Kit R4–R5](../../research/upstreams/spec-kit/c00dc0551583428a10a94443c58c6a41e5e0138c.md).
Procedure/reference separation follows [writing guides R3](../../research/upstreams/writing-guides/2026-09-30.md).
No upstream text or code is copied. Existing delivery and lifecycle rules remain
unchanged; use structural and document checks without claiming model or cost gains.
Installation guidance replaces unconditional backup wording with recoverability
for needed content; the installer itself and its force/rollback behavior are unchanged.
The complete closeout sequence lives in Daily workflow; adjacent guidance links it
instead of maintaining another procedure.

## Tasks

- [x] Reconcile all seven Specs and repository navigation by authoritative owner.
- [x] Apply semantic names, relocate instruction/package contracts and update
  current references while preserving historical path recovery.
- [x] Preserve necessary upstream tooling guidance in the existing maintainer
  package and remove the two parallel maintainer documents.
- [x] Update active reading paths and validate documents, Spec queries and
  maintainer package/resource closure.
- [x] Clarify authority/version scope, retain delivery invariants and add bounded examples.
- [x] Align Distribution and bilingual installation guidance on conditional recoverability.
- [x] Align bilingual closeout, verification reuse and CLI recovery guidance with Specs.
- [x] Review the reorganized contract set and converge this work record.

## Verify

### Required

- [x] `mise exec -- pnpm run docs:check` passed for seven bilingual page pairs
  and 29 Markdown files. Markdown-AST inspection passed for 142 affected links
  and anchors in current documents/callers. The recovery mapping preserves old
  lookup without editing historical reports; all five mapped old file objects
  remain available at the fixed pre-reorganization commit.
- [x] Focused Change validation passed. Current CLI JSON tree/detail checks
  found exactly seven Specs with the new paths/titles; every detail was complete
  and matched its current Markdown. No obsolete alias Spec remains, and the
  required `design.md` path is retained under Architecture. Workflow remains
  fully readable within the existing detail-content limit; no CLI limit changed.
- [x] `checkSkillPackage('.agents/skills/distill-upstream')` passed with no errors.
  The host quick validator passed using `uv run --no-project --with pyyaml python`;
  no repository dependency or global configuration was changed. Selected context
  diagnostics found no unreachable Markdown or exact repeated-prose groups.
  These unchanged package/host results are reused; document/link and CLI Spec
  checks were executed for the current document set.
- [x] Final local fixed-scope review against `899e90a` covers all 27 changed,
  deleted and untracked paths. Code and Document judgments are clean. Current
  contract owners and bilingual guidance agree on routing, final Change
  convergence, verification reuse and conditional recovery. Commit's unchanged
  procedure retains its delivery guards. This is local review, not
  distinct-worker or model acceptance.

Product code, published Skills, dependencies, Rules and code-test inputs are
unchanged. Their code checks were not rerun for this document reorganization;
metadata/resource validity does not establish behavioral or efficiency gains.
No real installation was run.

### Optional

- [ ] Real-model behavior and comparative efficiency are not evaluated by this
  documentation-only change; local checks establish no such acceptance.

## Blockers

none
