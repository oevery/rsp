---
kind: "fix"
---

# Change: archive-evidence-boundary

## Proposal
- Outcome: Use Focus for ongoing recovery notes, Change for converged results, and authoritative documents for stable knowledge.
- Scope: Core Focus/writeback guidance, standalone Shape/Doc/Review projections, maintainer evaluation guidance, current Specs, bilingual navigation and generated fallback; reuse existing Capsule commands. Explicit editorial repair also covers the two 2026-10-02 optimization-stage archives and the five child archives plus Brief under archives/rsp-workflow-alignment.
- Non-goals: Raw-log storage in Focus, new schemas or runtime state, changing historical acceptance or evidence verdicts, reopening or renaming archives, remote delivery or publication.

## Spec
### MODIFIED
- [Core](../specs/core-model.md#evidence-and-closeout): maintain permitted Focus snapshots at meaningful checkpoints; before closeout revalidate and distill their relevant conclusions into the selected Change.
- [Skill](../specs/skill.md#capability-ownership) and [writing quality](../specs/writing-quality.md#artifact-differences): Core owns ongoing notes and closeout, Doc writes the selected knowledge owner, and Review checks evidence and placement within fixed scope.

### Acceptance
- Focus contains current progress, evidence status/pointers and next action, not an append-only log or an acceptance/authority source. Existing v1 fields and safety limits remain unchanged.
- A short direct task requires no new Change or Capsule. Existing tracked work needing continuity uses its selected WorkRef; Group work uses a child Capsule and retains the Brief's integration boundary. Nearer allowed-path restrictions win.
- Closeout revalidates observations, writes final results and remaining failures/limits to Change, then updates only justified stable facts or rationale. No stable knowledge means no document update.
- Fresh applicable checks, required review and readiness precede authorized archive and Focus cleanup. Original evidence remains with its owner; failed verdicts are neither hidden nor relabelled.
- Existing commands can write, replace and inspect the working snapshot without new CLI semantics, classifiers or permanent tests.
- The eight selected archives lose process narration while retaining their identities, Spec/acceptance, checklist states, final results, material failure dispositions and evidence pointers. Original reports and verdicts remain unchanged; no historical review is relabelled as a review of the edited text.

## Design
Reuse Current, Evidence, Next and optional Resume check. Core replaces a selected WorkRef's Capsule when accepted progress, evidence validity, a blocker or next action changes, or work pauses/transfers. Focus notes guide recovery but are revalidated before writeback; they never replace current authority or fresh acceptance. Detailed records stay with the existing report/host owner.

Use the same selected Change for this coherent correction. Standalone Doc/Review/Shape keep short ownership guidance; Core owns detailed Focus and closeout methods. The explicit archive repair edits existing bodies only, not command-owned lifecycle or identity; it is not ordinary durable writeback into history. Preserve original reports and Spec/acceptance while summarizing their outcome-relevant evidence.

## Tasks
- [x] Refine authored Skills around the Focus-to-Change-to-knowledge flow.
- [x] Align current Specs, bilingual summaries and authored/generated fallback.
- [x] Maintain and inspect this work's Focus Capsule through the existing CLI.
- [x] Validate the exact candidate and record concise final evidence.
- [x] Converge the eight authorized archive bodies and verify preserved historical meaning and evidence.

## Verify
### Required
- [x] Eight product packages and the affected maintainer package passed metadata/resources; four host validations passed. Complete affected-candidate security scanned 38 files with zero findings.
- [x] Existing CLI wrote, replaced and projected this Capsule; byte comparison confirmed replacement rather than append and JSON recovery remains authoritative false.
- [x] Author self-check covered checkpoint/resume, Group ownership, no stable-fact update, unresolved Required failure and nearer restrictions. These are local reading-path checks, not independent/live acceptance.
- [x] Build, lint and eighteen code files /115 tests passed; docs check covered seven bilingual pairs /31 Markdown files and site build passed. RSP/diff checks and fallback equality passed. Final local evidence: tests/skills/reports/archive-evidence-boundary/focus-flow-verification.md.
- [x] Eight archives retain identities, Spec/acceptance and checklist states; author comparison preserves historical results, failure dispositions and limits. All 4133 inspected historical report/matrix hashes are unchanged. Build, lint, typecheck, 18 code files /115 tests, package checks and docs checks/build passed. Preservation evidence: tests/skills/reports/archive-evidence-boundary/archive-cleanup-verification.md.

### Optional
- Static review of e063fb7..0c12f4d reported Code and Document clean across 30 files; this applies to that candidate, not later writeback or live behavior.
- Initial behavioral evidence was invalid for candidate acceptance because the fixture blocked the required Focus CLI and execution was incomplete. The failed/cancelled results remain unchanged. Evidence: tests/skills/reports/archive-evidence-boundary/live-2026-10-02/summary.md.
- Corrected fixtures passed CLI check/ready/Focus preflight. Stale-Focus recovery, outcome/stable-fact writeback and Required-failure handling each passed one astra low execution with astra medium judging. Hard boundaries and task checks passed; historical evidence, source, index and HEAD were preserved. The Required checker remained failed while its handling passed. Evidence: tests/skills/reports/archive-evidence-boundary/live-2026-10-02/repaired-run-summary.md.
- Repeated reliability, candidate comparisons, final-archive text convergence, full live closeout and real supplier acceptance were not established by those cases.

### Knowledge updates
- Core, Skill and writing-quality Specs define Focus as recovery context, Change as converged outcome evidence, and selective stable-knowledge writeback before closeout. No new Decision Record was needed; the correction retained existing artifact ownership.

## Blockers
- none
