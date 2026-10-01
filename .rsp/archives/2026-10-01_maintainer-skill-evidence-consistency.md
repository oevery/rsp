---
kind: "docs"
---

# Change: maintainer-skill-evidence-consistency

## Proposal

- Outcome: Align maintainer Skill ownership and evidence with the two verification lanes, then simplify the shared execution/review path so agents interpret evidence and produce reports.
- Scope: Existing maintainer package, research-navigation and scanner/preparation corrections; three maintainer smoke cases and fixtures; the shared Skill runner, directly affected code/tooling regressions and test guides.
- Review contract: Executor performs the task; an independent read-only judge reads retained evidence and writes the Markdown report. An explicit historical baseline adds comparison in the same review session. Scripts own execution, permissions, records, cancellation, budgets and deterministic facts.
- Non-goals: Product Skill edits, changes to frozen smoke inputs, historical report rewriting, a new evaluation framework, provider/model acceptance in this refactor, credential access, dependency changes, push or publication.

## Spec

### MODIFIED

- Candidate handoff describes the smallest sufficient contract for a demonstrated gap. Evidence follows risk and claims under [Distribution](../specs/distribution.md); comparison, holdout and additional-host experiments remain optional and separately authorized.
- Managed Git research preserves pinned provenance and separate accept authority. Dated web snapshots retain hashed source evidence and reuse limits without claiming Git identity or advancing managed baselines. [Skill ownership](../specs/skill.md) and [writing quality](../specs/writing-quality.md) remain authoritative.
- Internal composition/security checks bind to explicit link-free copies of authored packages. The preparation CLI prechecks inputs, rejects links/special files/name conflicts, preserves sources and returns root, composition, identity and fileCount. Missing cases/fixtures remain uncovered.
- Root scripts own executable maintenance. The scanner preserves existing fields, discovers canonical packages, supports repeated explicit targets and rejects projections/out-of-root inputs. AST reachability excludes valid YAML frontmatter and code, follows actual links/used definitions and terminates cycles. Counts and repeated-prose clues are diagnostics, not quality/model-loading gates.
- Maintainer smoke uses three real isolated tasks, existing observable oracles and semantic rubrics. Offline readiness and explicit invocation do not establish natural triggering or model acceptance.
- First-time and historical review use one independent agent path. The case task/rubric is the acceptance contract; the judge may inspect safe retained traces, command output, diff, checks, task artifacts and initial/final Skill context. No default blind projection, no-tool requirement, dimension schema or automatic format retry remains.
- Failed, partial, cancelled, legacy and differently configured records remain reviewable. Missing metadata, hash mismatches or version differences are visible warnings, not requests to rerun execution. Required unreadable/unsafe input fails locally. A missing optional baseline member limits only that case's comparison.
- New runs preserve task text before workspace cleanup; omitted links, binaries, sensitive files, runtime/dependency state and retention failures remain explicit. Sanitized text is not original-byte evidence. Snapshot `files/baseline` hashes include executable mode and are distinct from raw-content SHA256; this explanation is available to the judge.
- The judge directly writes Markdown findings and, when selected, improvements, regressions, unchanged and non-comparable items. Evidence references map back to original directories/hashes through the saved index and lineage. Original run/matrix/review records are never overwritten; historical review does not prove current-candidate acceptance.
- A small status field serves matrix aggregation. Unparsed status preserves the report and does not become task failure. Deterministic failures remain facts; trace/metadata gaps do not automatically override a supported semantic conclusion. Physical execution completion, mechanical observations and review status remain separate.
- Independent task or review failures do not stop unrelated cases. Cancellation, exhausted budget, concrete authority violations and frozen-input changes stop expansion. No implicit total deadline, hidden retry, execution rerun or extra judge is introduced. Explicit timeouts and content-free progress keep their existing boundaries.
- Native judge `read-only` limits writes; read/search shell tools remain available. Prompt scope is not a filesystem read allowlist or shell prohibition. Web/integration restrictions remain configured; workspace-write network policy is not proof of read-only judge network isolation.

## Design

- Keep current package/research corrections at their owners. Root tools and their real-CLI tests remain separate from Skill guidance.
- Remove default blind packet construction, compatibility fingerprints, semantic aggregation gates and their obsolete projection-only controls. Keep deterministic file/Git/task oracles, source identities and provider isolation.
- Retain safe baseline/final text at the existing run directory. Review receives an index and task/rubric, then searches a disposable sanitized evidence copy. Copy failures produce local gaps; the runtime does not replay retained commands or import historical oracles.
- Share the same review implementation for `run` and `reassess`. Optional `--baseline` points to a historical matrix; comparison does not require another agent or report-generation stage.
- Save Markdown and the reviewer trace separately. Keep only matrix status machine-readable. Small fixture controls exercise real CLI/adapter boundaries, not Skill prose or internal projection details.

## Tasks

- [x] Reconcile maintainer candidate/provenance/evidence guidance and directly related Specs/research navigation.
- [x] Extract preparation, move maintenance tools to root scripts and correct scanner AST, statistics and root-alias behavior.
- [x] Prepare the three maintainer cases and retain their separately authorized bounded historical evidence.
- [x] Preserve explicit-only model deadlines, cancellation cleanup and content-free progress with non-fatal progress-write degradation.
- [x] Replace blind/no-tool review with independent evidence-reading review and direct Markdown reporting.
- [x] Preserve safe baseline/final task and Skill text before cleanup, with omissions and snapshot-hash explanation.
- [x] Share current/historical review, relax history eligibility and support optional baseline subsets without execution replay.
- [x] Continue unrelated cases after ordinary failure; separate factual failures, physical completion and semantic conclusions.
- [x] Remove unused blind/schema/compatibility logic and replace obsolete controls with observable runner regressions.
- [x] Complete final build, typecheck, lint, full code tests, focused RSP check and diff check.
- [x] Align release-acceptance's continuation rule with the runner.

## Verify

### Required

- [x] Build, typecheck and lint passed. `RSP_INSTALL_ALLOW_NETWORK=0 mise exec -- pnpm run test:code` passed 18 files/107 tests, covering evidence retention, historical review, independent-case continuation and cancellation. These are local fixture results, not real-model acceptance.
- [x] Scanner/preparation CLI and provenance checks passed. All three authored maintainer packages passed metadata/resource checks.
- [x] Final release guidance passed package checks; `tests/code/tooling/matrix-selection.test.js` passed 9 targeted regression tests.
- [x] Focused RSP checks reported zero errors/warnings; `git diff --check` passed.
- [x] The retained legacy author execution entered offline review preview with zero model sessions; missing configuration metadata and summary-only artifacts remained explicit warnings. Evidence: `tests/skills/reports/reassessments/6e4ed0cc-0cca-4c5b-a66c-568c085372ea/lineage.json`.

### Historical bounded evidence

The three explicit-invocation results retain their original execution/harness scope; they are not acceptance of this refactor or one uniform-harness campaign. Release's final continuation-rule alignment has no fresh model verdict; its package checks and runner regressions are local evidence only.

- Release: the selected case passed in `tests/skills/reports/maintainer-smoke/be27bae5-1df2-4f84-9b7e-4df936e071ef/matrix.json`; its containing matrix remains incomplete/inconclusive.
- Distill: execution is retained in `tests/skills/reports/maintainer-smoke/7836fc83-3f0b-4dcc-a540-9acd881b0ede/matrix.json`. The separate passing review is `tests/skills/reports/maintainer-reassessment/504980bf-fd72-4866-bba6-1eab0a8b3d8d/reassessment.json`; the original failed verdict is unchanged.
- Author: `tests/skills/reports/maintainer-smoke/140da36d-0bc3-4ace-98c7-dff4584f040a/matrix.json` passed with one executor and one independent judge.

### Optional

- Real-model calibration, token/retry savings, natural triggering, causal Skill improvement and full release acceptance are not verified by local fixture tests.
- Windows real-host cleanup and native judge network enforcement are unverified. Native read-only invocation does not establish a restricted filesystem read scope.

### Durable Decisions

- Current facts: Existing [Distribution](../specs/distribution.md) owns provenance and two-lane evidence; [Design](../specs/design.md) owns maintenance-tool responsibility. [Skill validation](../../tests/skills/README.md) owns the current runner/review operation and limits.
- Decision Record: No Decision Record needed; this refactor stays within the shared runner and existing verification ownership.

## Blockers

- none
