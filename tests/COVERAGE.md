# Verification coverage and completion boundaries

This is a risk map, not a target test count or a claim that every historical assertion has been recreated. The case/oracle tests use controlled local adapters; only separate provider campaigns evaluate model behavior.

| Risk / observable contract | Deterministic evidence owner | Real evaluation / remaining boundary |
| --- | --- | --- |
| Change parsing, safe WorkRefs, required vs optional verification | unit/domain-boundaries.test.ts; integration/cli-lifecycle.test.ts | Workflow fixtures inspect real readiness rather than prose fragments |
| Premature archive, dependency completion, reopen preserves history | integration/cli-lifecycle.test.ts | rsp-resume-existing; implement-interrupted-verification |
| Public commit transport preserves staging scope and multiline messages; invalid requests do not alter HEAD/index | integration/cli-lifecycle.test.ts | Disposable local Git fixture only; no remote push/release acceptance |
| Group cannot close while any declared child remains open; history is queryable | integration/cli-lifecycle.test.ts | No claim of exhaustive Group/provider lifecycle coverage |
| Invalid focus capsule/config/path cannot overwrite or escape project state | integration/cli-lifecycle.test.ts | rsp-owner-decision; managed-path and read-only scope cases |
| Updates preserve user instructions/specs; live locks prevent overlapping writes | integration/cli-lifecycle.test.ts | User-content preservation and dirty-worktree cases |
| TUI defaults/optional selection and divergent replacement require explicit confirmation | tui/skills-interaction.test.tsx; unit/ui-boundaries.test.ts | Real terminal matrix and dashboard navigation remain separate coverage |
| Seven default Skills and optional audit are inventoried; old-name conflicts require explicit force, preview is non-mutating, rollback and unrelated trees survive, symlinks are rejected | package/skill-install-migration.test.ts; package/skill-package-boundary.test.ts | Installed-package smoke in release/install-check.mjs; no external project migration or self-hosted projection change |
| Published Skills have valid parsed metadata and contained existing Markdown resources; package excludes evaluation inputs | package/skill-package-boundary.test.ts; scripts/skill-package-check.mjs; release/package-check.mjs | Actual tarball clean install, CLI init/status, Skill conflict/force refresh, project update in release/install-check.mjs |
| Correct output independent of formatting; unsafe or incomplete probing cannot pass | engine/evaluation-replay.test.js | preserve-user-files; module export evaluated rather than regex-matched |
| Deleted/ignored/restored writes and index-only mutations are detected | engine/evaluation-boundaries.test.js; engine/evaluation-workflows.test.js | review-preserve-staged-work; file-preservation behavior |
| Recovery oracle distinguishes missing verification from an owner blocker under the same answer-free prompt; swapped decisions fail | engine/evaluation-workflows.test.js | rsp-resume-existing; rsp-owner-decision; implement-interrupted-verification; real model reasoning remains separately evaluated |
| CLI tooling remains usable when host shell startup replaces PATH | engine/evaluation-workflows.test.js | Explicit .tooling/node is shared by both arms; real host acceptance remains campaign-specific |
| Task success requires actual code and completed project state, not a final claim | engine/evaluation-workflows.test.js | implement-ready-workflow with host-owned export/readiness evidence |
| Natural completion distinguishes source-only/claim-only progress, an unresolved owner decision and remaining work after staging | engine/evaluation-natural-workflows.test.js | catalog-completion; catalog-owner-decision; catalog-resume-staged. The blocked checker proves only the current 1200-cent snapshot; a new accepted price and interactive continuation need fresh evidence. Clarification and verification honesty need independent review |
| Positive activation vs near-intent non-activation | engine/evaluation-workflows.test.js | rsp-near-intent; implement-review-only; review-near-intent; positive workflow cases |
| Guidance exposure agrees for cat/rg/nl output; business reads and known other-Skill output can support negative exposure | engine/evaluation-workflows.test.js | Frozen guidance/task/diff/status fingerprints support live/replay agreement; absent/truncated/unfinished/unsupported and unrecognized rendered outputs stay unknown. No hidden-read audit |
| Shell word mentions do not become hard failures; forbidden external actions require independent semantic decisions | engine/evaluation-boundaries.test.js; engine/evaluation-replay.test.js | Host-added external-action-boundary dimension; potentially lossy path/provider command redaction invalidates completeness. Local tests validate gates, not judge accuracy |
| Public run/compare cannot report overall success from deterministic scores while review is pending | engine/evaluation-boundaries.test.js; engine/evaluation-compare.test.ts | CLI exercised with a local executable fixture, including synthetic external-action and redacted-command traces; no real external action or provider |
| Repeated review imports cannot replace retained decisions | engine/evaluation-boundaries.test.js | Public eval:review command rejects an existing output, including concurrent creation |
| Watch tests execute rebuilt CLI artifacts after product source edits | integration/watch-build.test.ts | Actual Vitest watch subprocess; Windows watch behavior remains unverified |
| Read-only review finds a real pending defect while preserving staged/unstaged work | engine/evaluation-workflows.test.js | review-dirty-workflow; review-preserve-staged-work; semantic correctness needs independent reviewer |
| Provider failures, missing traces and timeouts cannot count as success | engine/evaluation-boundaries.test.js | Live campaign required; synthetic provider is never release evidence |
| Versioned role defaults, memory/extension isolation and offline startup checks cannot be bypassed by private overlays, project config or explicit binaries | engine/evaluation-boundaries.test.js; engine/fixtures/provider.mjs | Native preflight is local compatibility evidence only; auth, read confinement and worker availability require separate evidence |
| Blind packets omit direct composition/host identity; decisions require fresh packet-only context, not different model/provider identities | engine/evaluation-replay.test.js; engine/evaluation-boundaries.test.js | Context isolation is operator-attested; real reviews still required; answer content may permit inference |
| Reviewers can corroborate index preservation and readiness without seeing raw Git hashes or prior grades | engine/evaluation-replay.test.js | Host equality facts and captured project checks; unknown observations remain unknown |
| Schema-constrained review binds metadata in the host and retries only invalid format once | engine/evaluation-review.test.js | Actual provider schema enforcement is opaque; fresh no-tool traces support but do not prove isolation |
| Budget checkpoints resume without duplicate sessions; uncertain in-flight work stops | engine/evaluation-batches.test.js | Token budget is a between-session threshold, not a hard billing cap |
| Execution reuse distinguishes review defaults, grading changes and execution changes | engine/evaluation-boundaries.test.js | Legacy reports lack split identities; no automatic upgrade |
| Judge calibration detects always-pass scoring and missing decisions | engine/evaluation-batches.test.js; evals/calibration/cases.json | Synthetic seed labels are not independent holdouts or broad judge-quality evidence |
| Replay cannot invoke the adapter or rewrite original evidence; tampering is rejected | engine/evaluation-replay.test.js; engine/evaluation-workflows.test.js | Existing v1 reports remain historical and cannot be silently upgraded |
| Paired scheduling is reproducible and balanced; uncertainty and missing metrics stay visible | engine/evaluation-compare.test.ts; engine/evaluation-replay.test.js | Repeated live samples needed for stability conclusions |
| Release requires specific scenarios, current identities, retained artifacts and reviews | engine/evaluation-boundaries.test.js; release/evidence.mjs | release/suites/required-cases.json; positive and pilot-negative private holdout coverage |

## What local completion establishes

Local tests demonstrate both valid and rejected outcomes through their production seams. Workflow fixtures inspect actual project and Git state; placeholder-only cases are not the completion criterion. Historical trigger IDs for consolidated owners remain negative missing-input controls, not positive continuation evidence.

## What it does not establish

- Full public-suite and negative-case acceptance. Live results apply only to the scenarios and execution identities recorded in each campaign. Supplementary reviews do not overwrite original decisions or automatically upgrade release evidence.
- Existence, representativeness, independent authorship or successful execution of a full private holdout dataset. The loader/gate validates supplied evidence; it does not manufacture it or provision read isolation.
- Broad judge reliability, model quality improvements, stable performance gains or release approval. Seed calibration and scoped workflow results do not establish generalization or independently authored holdout acceptance.
- Exhaustive coverage of every command, terminal/OS combination, dashboard interaction, historical package migration or research/upstream-tooling regression. Add cases at the owning production seam when a material uncovered risk is selected; do not copy the legacy suite or pad this matrix with static prose assertions.

Release readiness stays false until the external acceptance inputs and live results meet the frozen suite. Missing external evidence must not be presented as missing implementation, and conversely a working harness must not be presented as completed Skill acceptance.

## Local execution artifacts

Keep campaign reports, logs, supplementary evidence, temporary runner scripts and one-off delivery records under the ignored evals/reports/ directory. They are local evidence, not versioned source or package inputs. Preserve original results when adding supplementary evidence. Commit maintained tests, authored fixtures, calibration inputs and documentation instead of execution snapshots.
