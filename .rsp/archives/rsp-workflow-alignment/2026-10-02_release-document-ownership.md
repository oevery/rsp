---
kind: "refactor"
---

# Change: rsp-workflow-alignment/release-document-ownership

## Proposal

- Outcome: Fold release writing into Doc and read-only release checks into Review, and retire the standalone package.
- Scope: Authored Doc, Review and Core routing; fallback, current Specs and bilingual guides; packaged inventory, protected old-install migration and existing release cases.
- Non-goals: A release engine, new configuration, unconditional review or release gates, model-cost claims, historical evidence rewrites, archive, Git delivery, global installation or publication.

This follow-up intentionally changes responsibility after the earlier writing and conditional-context work. Preserve their work and original verdicts; their acceptance does not transfer to this candidate.


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

Doc and Review each own a package-local conditional release method; project tools supply mechanical observations, not acceptance. Explicit direct release checks without a WorkOwner stay with Core; Verify retains declared WorkOwner verification. Unknown-evidence preparation and confirmed writing/review remain separate cases.

Retire the old installation identity only through inspected, explicit-force, rollback-protected migration when Doc is selected. Preserve unrelated Skills and the recoverable source snapshot; remove only the verified self-host projection. Compare against the pre-edit working tree, not older HEAD sources.

## Tasks

- [x] Migrate writing and read-only checks, preserve standalone closure and remove the old authored package/projection.
- [x] Align Core, fallback, current Specs, guides, inventory and protected installation migration.
- [x] Adapt existing release cases and migration/package tests without prose assertions or another runner.
- [x] Run proportionate checks and converge current evidence and durable decisions.
- [x] Clarify the direct release-check route in Core, fallback, current Spec and guides while preserving Verify and publication boundaries.
- [x] Restore Doc's missing-release-evidence case without replacing the confirmed writing or fixed-document review cases.

## Verify

Historical closeout evidence below applies to the original candidate and reviewed text, not this later editorial repair. Original reports and verdicts remain unchanged.

### Required

- [x] Build, typecheck, lint and test passed: 18 code files /115 tests, including packed installation, inventory and protected migration. The correction added no CLI implementation, runner or permanent code-test count.
- [x] Eight product packages passed metadata/resources; security covered 44 files with zero findings. Core/Doc diagnostics found no unreachable Markdown or exact repeated prose. Docs checks passed seven bilingual pairs /31 Markdown files; site build, fallback sync/equality and diff checks passed.
- [x] Three release cases and the 63-case full corpus passed offline readiness, with zero provider calls and behavioralAcceptance not-run. Missing-evidence preparation reused the read-only oracle; confirmed writing and fixed-document review retained their inputs. Author checks covered direct/tracked routing, required independent acceptance and publication restraint.

Product composition: bdc89289263aa6e3c540cfe697a9eaac13de901c7c14e52af5ae342235a44b31, eight packages: seven defaults and optional Structural Audit. This is source identity, not release acceptance or publication. Later integrated local evidence: tests/skills/reports/rsp-workflow-alignment/final-local-verification.md.

Verify's entry contract, historical reports and unrelated work were preserved. Removed sources/projection remain recoverable from the original local safety snapshot.

### Optional

This stage ran no fresh model release-task acceptance, natural discovery or own independent review; the Group supplied later integrated review. Accepted direct-routing and preparation-coverage findings were corrected in source/inputs, but author checks alone did not establish review-clean.

Offline readiness and author inspection establish neither behavior nor quality/cost improvement. Earlier campaign verdicts, including the conditional-context critique failure, retain their original candidate scope.

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
