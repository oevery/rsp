---
kind: "refactor"
---

# Change: rsp-workflow-alignment/release-document-ownership

## Proposal

- Outcome: Fold release writing into Doc and read-only release checks into Review, and retire the standalone package.
- Scope: Authored Doc, Review and Core routing; fallback, current Specs and bilingual guides; packaged inventory, protected old-install migration and existing release cases.
- Non-goals: A release engine, new configuration, unconditional review or release gates, model-cost claims, historical evidence rewrites, archive, Git delivery, global installation or publication.

This follow-up intentionally changes responsibility after the earlier writing and conditional-context work. Preserve their work and original verdicts; their acceptance does not transfer to this candidate.


This Change was explicitly re-homed from `release-document-ownership` to `rsp-workflow-alignment/release-document-ownership` for the authorized grouped local delivery. Original candidate identities, reports and verdicts retain their historical scope.

## Spec

Modify [Skill composition](../../specs/skill.md) and [distribution](../../specs/distribution.md) under the existing [writing-quality contract](../../specs/writing-quality.md).

### Acceptance

- Seven default Skills remain; Structural Audit stays optional. Release Docs is neither packaged nor selectable.
- Doc conditionally handles changelog, release notes, migration and authorized document reconciliation. It retains identity/range confirmation, net outcomes, actionable migration, evidence gaps, stable shipped prose and credential protection. Ordinary writing loads no release method.
- Review conditionally checks fixed release-document scope through its standalone Document pipeline. It never writes, expands scope, publishes or treats author checks as independent acceptance.
- Verification, exact Git delivery and external publication retain their owners. No universal release Change, separate release commit, archive or publication gate is introduced.
- An explicitly authorized release check without a WorkOwner stays with Core and the project's declared checks against an exact candidate/range. Missing prerequisites stop dependent checks; no synthetic Change, undeclared check, replacement for required independent acceptance or external authority follows. WorkOwner-declared verification retains Verify's existing boundary.
- Preserve the confirmed-version writing and fixed-document review cases, and restore a separate Doc preparation case without version, range or delivered evidence. Its result must stay evidence-bounded and leave files and workflow state unchanged.
- Default or named Doc installation reports obsolete Release Docs before mutation; explicit forced migration is previewable, preserves unrelated Skills and rolls back on activation failure. Named unrelated installation does not retire it.
- Current guides and cases use the new owners. Retained releases, research and execution records remain historical evidence.

## Design

Add one package-local release-writing reference to Doc and one release-checking reference to Review. Keep branch triggers in the entry paths; share no runtime references between packages. Existing project release tools provide inventories and deterministic observations; the Agent owns interpretation.

Retire the old installation identity through the existing inspected, explicit-force and rollback mechanism when Doc is selected. Preserve the prior dirty package in a local safety snapshot before deletion; remove only its verified self-host discovery projection. Compare this delta with the pre-edit working tree, not the older HEAD.

The fixed-scope review's untracked-release routing finding is accepted: Verify requires an existing WorkOwner, while direct release checks must not invent one. Core interprets existing project checks within explicit authority; Doc links the ownership split without acquiring execution authority. The coverage recommendation is also accepted: unknown identity/evidence preparation and confirmed-version document review protect different risks. Reuse the shared read-only oracle and add no fixture, test engine or universal live matrix.

## Tasks

- [x] Migrate writing and read-only checks, preserve standalone closure and remove the old authored package/projection.
- [x] Align Core, fallback, current Specs, guides, inventory and protected installation migration.
- [x] Adapt existing release cases and migration/package tests without prose assertions or another runner.
- [x] Run proportionate checks and converge current evidence and durable decisions.
- [x] Clarify the direct release-check route in Core, fallback, current Spec and guides while preserving Verify and publication boundaries.
- [x] Restore Doc's missing-release-evidence case without replacing the confirmed writing or fixed-document review cases.

## Verify

### Required

- [x] Fresh `mise exec -- pnpm run build`, `typecheck`, `lint` and `test` passed: 18 code files /115 tests, including offline packed installation, inventory and protected migration coverage. This correction changes no CLI implementation, test runner or permanent code-test count.
- [x] Fresh `skills:package-check` passed for eight product packages; `skills:security-check` passed for 44 files with zero findings. Core/Doc context diagnostics found no unreachable Markdown or exact cross-file repeated prose. `docs:check` passed for seven bilingual pairs /31 Markdown files and `docs:build` passed. The authored fallback was synced through `rsp update`, matches its projection byte-for-byte, and `git diff --check` passed.
- [x] The three selected release cases and shared-runner `check --suite full` passed: 63 catalog cases, zero provider invocations and `behavioralAcceptance: not-run`. `release-draft-missing-evidence` reuses the read-only oracle without a new fixture; confirmed writing and fixed-document review retain their earlier inputs. Author inspection covered direct release checks with and without sufficient candidate/check/authority inputs, tracked Verify routing, required independent acceptance and absent publication permission.

Product composition identity: `bdc89289263aa6e3c540cfe697a9eaac13de901c7c14e52af5ae342235a44b31`, eight packages, seven defaults and one optional Structural Audit. This identifies current sources, not an accepted or published release.

The correction snapshot comparison covered 35 selected source/document/case paths: 22 stayed identical and 13 changed within the agreed correction scope. Verify's entry contract remains byte-identical to the pre-migration source. Existing release fixtures and cases, earlier Changes, retained historical reports, HEAD and index were not modified by this correction. The original removed package and self-host link remain recoverable from their local safety snapshot.

### Optional

At this stage fresh model execution, natural discovery and independent review were not run. The Group owns final integrated independent review; no current-candidate release task run is claimed. Offline readiness and author inspection establish neither behavioral acceptance nor quality/cost improvement. Earlier campaign verdicts, including the conditional-context critique failure, remain attached to their original candidates.

The accepted routing finding and coverage recommendation are corrected in source and current inputs. Author checks do not establish `review-clean`; fresh fixed-scope re-review and model task evidence remain separate.

### Durable Decisions

- Current facts: Update existing spec or scoped instruction.
- Current-fact targets: `.rsp/specs/skill.md`, `.rsp/specs/distribution.md`, `AGENTS.md`.
- Facts written: Doc owns release writing, Review owns fixed-scope release-document checks, Core owns explicitly authorized direct project release checks without a WorkOwner, and the retired package uses protected explicit-force installation migration.
- Decision Record: Create or update a Decision Record.
- Decision Record target: `.rsp/specs/decisions/release-document-ownership.md`.
- Rationale written: Artifact-specific release methods fit existing writing/review owners without another capability or release controller.
- Archive ready: yes for the declared implementation and deterministic/author-check boundary; optional model gaps remain explicit. The Group additionally requires final independent review, fresh readiness and authorized lifecycle/local delivery. This result grants no publication authority.

## Blockers

- none
